import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getEntitlementShape } from "@/lib/account/entitlements";
import { getStripe, isActiveSubscription } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
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
    return;
  }

  const userId = session.metadata?.app_user_id;
  const customerId = typeof session.customer === "string" ? session.customer : null;

  if (!userId || !customerId) {
    return;
  }

  const entitlementShape = getEntitlementShape("free");

  await admin.from("entitlements").upsert(
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
}

async function syncEntitlementForSubscription(subscription: Stripe.Subscription) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const customerId = String(subscription.customer);
  let userId = subscription.metadata.app_user_id || null;

  if (!userId) {
    const { data } = await admin
      .from("entitlements")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle<{ user_id: string }>();

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

  await admin.from("entitlements").upsert(
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
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await syncEntitlementForCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncEntitlementForSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
