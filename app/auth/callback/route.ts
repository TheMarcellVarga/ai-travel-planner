import { NextResponse } from "next/server";

import { ensureEntitlementForUser } from "@/lib/account/entitlements";
import { ensureUserProfileForUser } from "@/lib/account/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/planner";
  const supabase = await createSupabaseServerClient();

  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user?.id) {
      await Promise.all([
        ensureEntitlementForUser(supabase, user.id, user.email ?? null),
        ensureUserProfileForUser(supabase, user.id, {
          fullName: user.user_metadata?.full_name ?? user.email ?? "Traveler"
        })
      ]);
    }
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
