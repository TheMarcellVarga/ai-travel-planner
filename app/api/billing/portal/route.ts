import { NextResponse } from "next/server";

import { ensureEntitlementForUser } from "@/lib/account/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.authMode !== "supabase") {
    return NextResponse.json(
      { error: "Sign in with a real account before opening billing." },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  const supabase = await createSupabaseServerClient();

  if (!stripe || !supabase) {
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

  if (!entitlement.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer exists yet. Start checkout first." },
      { status: 400 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: entitlement.stripeCustomerId,
    return_url: `${env.appUrl}/account`
  });

  return NextResponse.json({ url: session.url });
}
