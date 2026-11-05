import type { SupabaseClient } from "@supabase/supabase-js";

import type { Entitlement } from "@/lib/types";

export const FREE_ENTITLEMENT: Entitlement = {
  plan: "free",
  promotedStopLimit: 1,
  routeSaveLimit: 12,
  generationLimit: 25,
  billingEmail: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null
};

export const PRO_ENTITLEMENT: Entitlement = {
  plan: "pro",
  promotedStopLimit: 3,
  routeSaveLimit: 500,
  generationLimit: 500,
  billingEmail: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: "active",
  currentPeriodEnd: null
};

type EntitlementRow = {
  user_id: string;
  plan: "free" | "pro";
  promoted_stop_limit: number;
  route_save_limit: number;
  generation_limit: number;
  billing_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
};

export function getEntitlementShape(plan: Entitlement["plan"]) {
  return plan === "pro" ? PRO_ENTITLEMENT : FREE_ENTITLEMENT;
}

export function getGenerationLimitStatus(entitlement: Entitlement, usedCount: number) {
  const remaining = Math.max(entitlement.generationLimit - usedCount, 0);

  return {
    limit: entitlement.generationLimit,
    used: usedCount,
    remaining,
    allowed: usedCount < entitlement.generationLimit
  };
}

export function mapEntitlementRow(row: EntitlementRow | null): Entitlement {
  if (!row) {
    return FREE_ENTITLEMENT;
  }

  return {
    plan: row.plan,
    promotedStopLimit: row.promoted_stop_limit,
    routeSaveLimit: row.route_save_limit,
    generationLimit: row.generation_limit,
    billingEmail: row.billing_email,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    currentPeriodEnd: row.current_period_end
  };
}

export async function getEntitlementForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Entitlement> {
  const { data } = await supabase
    .from("entitlements")
    .select(
      "user_id, plan, promoted_stop_limit, route_save_limit, generation_limit, billing_email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end"
    )
    .eq("user_id", userId)
    .maybeSingle<EntitlementRow>();

  return mapEntitlementRow(data ?? null);
}

export async function ensureEntitlementForUser(
  supabase: SupabaseClient,
  userId: string,
  _billingEmail?: string | null
): Promise<Entitlement> {
  return getEntitlementForUser(supabase, userId);
}
