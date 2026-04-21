import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Entitlement, TripGeneration, UserProfile } from "@/lib/types";

export const supportedCurrencies = ["USD", "EUR", "GBP", "SGD"] as const;
export const travelStyles = ["balanced", "budget", "luxury", "remote-work"] as const;

type SupportedCurrency = (typeof supportedCurrencies)[number];
type TravelStyle = (typeof travelStyles)[number];

type ProfileRow = {
  user_id: string;
  full_name: string;
  home_airport_code: string | null;
  preferred_currency: SupportedCurrency;
  travel_style: TravelStyle;
  newsletter_opt_in: boolean;
  route_alerts_opt_in: boolean;
  created_at: string;
  updated_at: string;
};

type AccountExportRow<T> = {
  data: T[] | null;
  error: Error | null;
};

export type UserProfileInput = {
  fullName: string;
  homeAirportCode?: string | null;
  preferredCurrency: SupportedCurrency;
  travelStyle: TravelStyle;
  newsletterOptIn: boolean;
  routeAlertsOptIn: boolean;
};

type AccountExportPayload = {
  profile: UserProfile | null;
  entitlement: Entitlement | null;
  routeGenerations: TripGeneration[];
  savedRoutes: unknown[];
  sharedRoutes: unknown[];
  bookingHandoffs: unknown[];
};

function profileSelect() {
  return [
    "user_id",
    "full_name",
    "home_airport_code",
    "preferred_currency",
    "travel_style",
    "newsletter_opt_in",
    "route_alerts_opt_in",
    "created_at",
    "updated_at"
  ].join(", ");
}

export function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeHomeAirportCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized.length ? normalized : null;
}

export function createDefaultUserProfile(
  userId: string,
  seed?: Partial<Pick<UserProfileInput, "fullName">>
): UserProfile {
  return {
    userId,
    fullName: normalizeFullName(seed?.fullName ?? "Traveler"),
    homeAirportCode: null,
    preferredCurrency: "USD",
    travelStyle: "balanced",
    newsletterOptIn: false,
    routeAlertsOptIn: false,
    createdAt: null,
    updatedAt: null
  };
}

export function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    homeAirportCode: row.home_airport_code,
    preferredCurrency: row.preferred_currency,
    travelStyle: row.travel_style,
    newsletterOptIn: row.newsletter_opt_in,
    routeAlertsOptIn: row.route_alerts_opt_in,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function normalizeUserProfileInput(input: UserProfileInput): UserProfileInput {
  return {
    fullName: normalizeFullName(input.fullName),
    homeAirportCode: normalizeHomeAirportCode(input.homeAirportCode),
    preferredCurrency: input.preferredCurrency,
    travelStyle: input.travelStyle,
    newsletterOptIn: input.newsletterOptIn,
    routeAlertsOptIn: input.routeAlertsOptIn
  };
}

export async function getUserProfileForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(profileSelect())
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  return data ? mapProfileRow(data) : null;
}

export async function ensureUserProfileForUser(
  supabase: SupabaseClient,
  userId: string,
  seed?: Partial<Pick<UserProfileInput, "fullName">>
): Promise<UserProfile> {
  const existing = await getUserProfileForUser(supabase, userId);

  if (existing) {
    if (!existing.fullName && seed?.fullName) {
      return updateUserProfileForUser(supabase, userId, {
        fullName: seed.fullName,
        homeAirportCode: existing.homeAirportCode,
        preferredCurrency: existing.preferredCurrency,
        travelStyle: existing.travelStyle,
        newsletterOptIn: existing.newsletterOptIn,
        routeAlertsOptIn: existing.routeAlertsOptIn
      });
    }

    return existing;
  }

  const defaults = createDefaultUserProfile(userId, seed);
  const { data } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: defaults.fullName,
        home_airport_code: defaults.homeAirportCode,
        preferred_currency: defaults.preferredCurrency,
        travel_style: defaults.travelStyle,
        newsletter_opt_in: defaults.newsletterOptIn,
        route_alerts_opt_in: defaults.routeAlertsOptIn
      },
      { onConflict: "user_id" }
    )
    .select(profileSelect())
    .single<ProfileRow>();

  if (!data) {
    return defaults;
  }

  return mapProfileRow(data);
}

export async function updateUserProfileForUser(
  supabase: SupabaseClient,
  userId: string,
  input: UserProfileInput
): Promise<UserProfile> {
  const normalized = normalizeUserProfileInput(input);
  const { data } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: normalized.fullName,
        home_airport_code: normalized.homeAirportCode,
        preferred_currency: normalized.preferredCurrency,
        travel_style: normalized.travelStyle,
        newsletter_opt_in: normalized.newsletterOptIn,
        route_alerts_opt_in: normalized.routeAlertsOptIn
      },
      { onConflict: "user_id" }
    )
    .select(profileSelect())
    .single<ProfileRow>();

  if (!data) {
    return createDefaultUserProfile(userId, {
      fullName: normalized.fullName
    });
  }

  return mapProfileRow(data);
}

async function readRows<T>(
  promise: PromiseLike<AccountExportRow<T>>
): Promise<T[]> {
  const { data } = await promise;
  return data ?? [];
}

export async function getAccountExportForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountExportPayload> {
  const [profile, entitlementRow, routeGenerations, savedRoutes, sharedRoutes, bookingHandoffs] =
    await Promise.all([
      getUserProfileForUser(supabase, userId),
      supabase
        .from("entitlements")
        .select(
          "plan, promoted_stop_limit, route_save_limit, generation_limit, billing_email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end"
        )
        .eq("user_id", userId)
        .maybeSingle<{
          plan: Entitlement["plan"];
          promoted_stop_limit: number;
          route_save_limit: number;
          generation_limit: number;
          billing_email: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
        }>(),
      readRows(
        supabase
          .from("route_generations")
          .select("id, trip_intent, routes, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      ),
      readRows(
        supabase
          .from("saved_routes")
          .select("id, generation_id, route, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      ),
      readRows(
        supabase
          .from("shared_routes")
          .select("id, generation_id, slug, route, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      ),
      readRows(
        supabase
          .from("booking_handoffs")
          .select("id, route_id, links, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      )
    ]);

  const entitlement = entitlementRow.data
    ? {
        plan: entitlementRow.data.plan,
        promotedStopLimit: entitlementRow.data.promoted_stop_limit,
        routeSaveLimit: entitlementRow.data.route_save_limit,
        generationLimit: entitlementRow.data.generation_limit,
        billingEmail: entitlementRow.data.billing_email,
        stripeCustomerId: entitlementRow.data.stripe_customer_id,
        stripeSubscriptionId: entitlementRow.data.stripe_subscription_id,
        subscriptionStatus: entitlementRow.data.subscription_status,
        currentPeriodEnd: entitlementRow.data.current_period_end
      }
    : null;

  return {
    profile,
    entitlement,
    routeGenerations: routeGenerations.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      tripIntent: row.trip_intent,
      routes: row.routes
    })),
    savedRoutes,
    sharedRoutes,
    bookingHandoffs
  };
}

export async function deleteUserAccount(userId: string) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      ok: false as const,
      error: "Supabase admin credentials are not configured."
    };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return {
      ok: false as const,
      error: error.message
    };
  }

  return {
    ok: true as const
  };
}
