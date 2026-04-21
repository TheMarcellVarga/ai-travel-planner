import { NextResponse } from "next/server";

import { isOAuthProvider } from "@/lib/auth-providers";
import { env, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const provider = String(formData.get("provider") ?? "").trim();
  const nextPath = String(formData.get("next") ?? "/planner");

  if (!hasSupabaseEnv) {
    return NextResponse.redirect(new URL("/auth?error=supabase-not-configured", request.url));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/auth?error=supabase-unavailable", request.url));
  }

  if (isOAuthProvider(provider)) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    });

    if (error) {
      return NextResponse.redirect(new URL("/auth?error=oauth-start-failed", request.url));
    }

    return NextResponse.redirect(data.url ?? new URL("/auth", request.url));
  }

  if (!email) {
    return NextResponse.redirect(new URL("/auth?error=missing-email", request.url));
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
    }
  });

  if (error) {
    return NextResponse.redirect(new URL("/auth?error=otp-start-failed", request.url));
  }

  return NextResponse.redirect(new URL(`/auth?sent=1&email=${encodeURIComponent(email)}`, request.url));
}
