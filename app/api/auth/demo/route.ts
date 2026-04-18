import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DEMO_USER_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nextPath = String(formData.get("next") ?? "/planner");

  if (!email) {
    return NextResponse.redirect(new URL("/auth?error=missing-email", request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_USER_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return NextResponse.redirect(new URL(nextPath, request.url));
}

