import { cookies } from "next/headers";

import {
  ensureEntitlementForUser,
  FREE_ENTITLEMENT,
  getEntitlementForUser
} from "@/lib/account/entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, Entitlement } from "@/lib/types";

export const DEMO_USER_COOKIE = "wild_route_demo_user";

function formatNameFromEmail(email: string) {
  const handle = email.split("@")[0] ?? "traveler";
  return handle
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user?.email) {
      const entitlement = await getEntitlementForUser(supabase, user.id);

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? formatNameFromEmail(user.email),
        authMode: "supabase",
        entitlement
      };
    }
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get(DEMO_USER_COOKIE)?.value;

  if (!demoEmail) {
    return null;
  }

  return {
    id: `demo:${demoEmail}`,
    email: demoEmail,
    name: formatNameFromEmail(demoEmail),
    authMode: "demo",
    entitlement: FREE_ENTITLEMENT
  };
}

export async function ensureCurrentUserEntitlement(): Promise<Entitlement> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return FREE_ENTITLEMENT;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return FREE_ENTITLEMENT;
  }

  return ensureEntitlementForUser(supabase, user.id, user.email ?? null);
}
