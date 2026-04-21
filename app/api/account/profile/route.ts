import { NextResponse } from "next/server";
import { z } from "zod";

import {
  supportedCurrencies,
  travelStyles,
  updateUserProfileForUser
} from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  homeAirportCode: z.string().trim().max(8).optional(),
  preferredCurrency: z.enum(supportedCurrencies),
  travelStyle: z.enum(travelStyles),
  newsletterOptIn: z.boolean(),
  routeAlertsOptIn: z.boolean()
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.authMode !== "supabase") {
    return NextResponse.redirect(new URL("/account?error=sign-in-required", request.url));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/account?error=supabase-unavailable", request.url));
  }

  const formData = await request.formData();
  const parsed = profileSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    homeAirportCode: String(formData.get("homeAirportCode") ?? ""),
    preferredCurrency: String(formData.get("preferredCurrency") ?? "USD"),
    travelStyle: String(formData.get("travelStyle") ?? "balanced"),
    newsletterOptIn: formData.get("newsletterOptIn") === "on",
    routeAlertsOptIn: formData.get("routeAlertsOptIn") === "on"
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/account?error=invalid-profile", request.url));
  }

  await updateUserProfileForUser(supabase, user.id, parsed.data);

  return NextResponse.redirect(new URL("/account?status=profile-saved", request.url));
}
