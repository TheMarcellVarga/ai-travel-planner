import { NextResponse } from "next/server";

import {
  ensureEntitlementForUser,
  getEntitlementShape
} from "@/lib/account/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  if (process.env.BILLING_UI_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Billing is disabled in this preview." },
      { status: 503 }
    );
  }

  const user = await getCurrentUser();
  if (!user || user.authMode !== "supabase") {
    return NextResponse.json(
      { error: "Sign in with a real account before starting checkout." },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (!stripe || !supabase || !admin) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
      { status: 503 }
    );
  }

  const entitlement = await ensureEntitlementForUser(
    supabase,
    user.id,
    user.email
  );

  let customerId = entitlement.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        app_user_id: user.id
      }
    });

    customerId = customer.id;

    const entitlementShape = getEntitlementShape(entitlement.plan);
    const { error } = await admin.from("entitlements").upsert(
      {
        user_id: user.id,
        plan: entitlement.plan,
        promoted_stop_limit: entitlementShape.promotedStopLimit,
        route_save_limit: entitlementShape.routeSaveLimit,
        generation_limit: entitlementShape.generationLimit,
        billing_email: user.email,
        stripe_customer_id: customerId
      },
      { onConflict: "user_id" }
    );
    if (error) {
      return NextResponse.json({ error: "Could not save billing details." }, { status: 503 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: env.stripeProPriceId!,
        quantity: 1
      }
    ],
    success_url: `${env.appUrl}/account?billing=success`,
    cancel_url: `${env.appUrl}/account?billing=cancelled`,
    metadata: {
      app_user_id: user.id
    },
    subscription_data: {
      metadata: {
        app_user_id: user.id
      }
    }
  });

  return NextResponse.json({ url: session.url });
}
