import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, Entitlement } from "@/lib/types";

export const DEMO_USER_COOKIE = "wild_route_demo_user";

const freeEntitlement: Entitlement = {
  plan: "free",
  promotedStopLimit: 1,
  routeSaveLimit: 12,
  generationLimit: 25
};

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
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? formatNameFromEmail(user.email),
        authMode: "supabase",
        entitlement: freeEntitlement
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
    entitlement: freeEntitlement
  };
}

