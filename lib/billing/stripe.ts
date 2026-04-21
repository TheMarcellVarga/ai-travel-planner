import Stripe from "stripe";

import { env, hasStripeEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!hasStripeEnv) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey!);
  }

  return stripeClient;
}

export function isActiveSubscription(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}
