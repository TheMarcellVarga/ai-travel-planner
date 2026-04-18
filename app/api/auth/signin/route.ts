import { NextResponse } from "next/server";

import { env, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const provider = String(formData.get("provider") ?? "").trim();
  const nextPath = String(formData.get("next") ?? "/planner");

  if (!hasSupabaseEnv) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/auth?error=supabase-unavailable", request.url));
  }

  if (provider === "google") {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    });

    return NextResponse.redirect(data.url ?? new URL("/auth", request.url));
  }

  if (!email) {
    return NextResponse.redirect(new URL("/auth?error=missing-email", request.url));
  }

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
    }
  });

  return NextResponse.redirect(new URL(`/auth?sent=1&email=${encodeURIComponent(email)}`, request.url));
}

