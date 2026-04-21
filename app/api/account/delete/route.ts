import { NextResponse } from "next/server";

import { deleteUserAccount } from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth";
import { isActiveSubscription } from "@/lib/billing/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.authMode !== "supabase") {
    return NextResponse.redirect(new URL("/account?error=sign-in-required", request.url));
  }

  const confirmation = String((await request.formData()).get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    return NextResponse.redirect(new URL("/account?error=delete-confirmation", request.url));
  }

  if (
    user.entitlement.stripeSubscriptionId &&
    isActiveSubscription(user.entitlement.subscriptionStatus)
  ) {
    return NextResponse.redirect(new URL("/account?error=cancel-billing-first", request.url));
  }

  const result = await deleteUserAccount(user.id);
  if (!result.ok) {
    return NextResponse.redirect(new URL("/account?error=delete-failed", request.url));
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/auth?status=account-deleted", request.url));
}
