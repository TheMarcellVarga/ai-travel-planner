import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getEntitlementShape } from "@/lib/account/entitlements";
import { getStripe, isActiveSubscription } from "@/lib/billing/stripe";
import {
  claimWebhookEvent,
  completeWebhookEvent,
  failWebhookEvent
} from "@/lib/billing/webhook-events";
import { env } from "@/lib/env";
import {
  emitOperationalEvent,
  getSafeErrorKind,
  hashOperationalIdentifier
} from "@/lib/observability/operational-events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const hasProPrice = subscription.items.data.some(
    (item) => item.price.id === env.stripeProPriceId
  );

  return hasProPrice && isActiveSubscription(subscription.status) ? "pro" : "free";
}

async function syncEntitlementForCheckoutSession(session: Stripe.Checkout.Session) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Entitlement persistence is unavailable.");
  }

  const userId = session.metadata?.app_user_id;
  const customerId = typeof session.customer === "string" ? session.customer : null;

  if (!userId || !customerId) {
    return;
  }

  const entitlementShape = getEntitlementShape("free");

  const { error } = await admin.from("entitlements").upsert(
    {
      user_id: userId,
      plan: "free",
      promoted_stop_limit: entitlementShape.promotedStopLimit,
      route_save_limit: entitlementShape.routeSaveLimit,
      generation_limit: entitlementShape.generationLimit,
      billing_email: session.customer_details?.email ?? null,
      stripe_customer_id: customerId
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

async function syncEntitlementForSubscription(subscription: Stripe.Subscription) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Entitlement persistence is unavailable.");
  }

  const customerId = String(subscription.customer);
  let userId = subscription.metadata.app_user_id || null;

  if (!userId) {
    const { data, error } = await admin
      .from("entitlements")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle<{ user_id: string }>();

    if (error) {
      throw error;
    }

    userId = data?.user_id ?? null;
  }

  if (!userId) {
    return;
  }

  const plan = getPlanFromSubscription(subscription);
  const entitlementShape = getEntitlementShape(plan);
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };

  const { error } = await admin.from("entitlements").upsert(
    {
      user_id: userId,
      plan,
      promoted_stop_limit: entitlementShape.promotedStopLimit,
      route_save_limit: entitlementShape.routeSaveLimit,
      generation_limit: entitlementShape.generationLimit,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: subscriptionWithPeriod.current_period_end
        ? new Date(subscriptionWithPeriod.current_period_end * 1000).toISOString()
        : null
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !env.stripeWebhookSecret || !signature) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    emitOperationalEvent("warn", "stripe.webhook.invalid_signature", {
      route: "/api/stripe/webhook",
      status: 400,
      code: "INVALID_SIGNATURE"
    });
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  const subjectHash = hashOperationalIdentifier(event.id);
  const claim = await claimWebhookEvent({
    eventId: event.id,
    eventType: event.type
  });

  if (claim.status === "unavailable") {
    emitOperationalEvent("error", "stripe.webhook.failed", {
      route: "/api/stripe/webhook",
      status: 503,
      code: "LEDGER_UNAVAILABLE",
      eventType: event.type,
      subjectHash
    });
    return NextResponse.json(
      { error: "Stripe webhook processing is temporarily unavailable." },
      { status: 503 }
    );
  }

  if (claim.status === "duplicate") {
    emitOperationalEvent("info", "stripe.webhook.duplicate", {
      route: "/api/stripe/webhook",
      status: 200,
      eventType: event.type,
      subjectHash
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncEntitlementForCheckoutSession(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncEntitlementForSubscription(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        break;
    }

    if (!(await completeWebhookEvent(event.id))) {
      throw new Error("Webhook event completion could not be persisted.");
    }

    emitOperationalEvent("info", "stripe.webhook.processed", {
      route: "/api/stripe/webhook",
      status: 200,
      eventType: event.type,
      subjectHash
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorKind = getSafeErrorKind(error);
    await failWebhookEvent(event.id, errorKind);
    emitOperationalEvent("error", "stripe.webhook.failed", {
      route: "/api/stripe/webhook",
      status: 500,
      code: "PROCESSING_FAILED",
      eventType: event.type,
      subjectHash,
      errorKind
    });
    return NextResponse.json(
      { error: "Stripe webhook processing failed." },
      { status: 500 }
    );
  }
}
