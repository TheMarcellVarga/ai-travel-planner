import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DEMO_USER_COOKIE } from "@/lib/auth";
import {
  consumeRateLimit,
  createRateLimitResponse,
  RATE_LIMIT_POLICIES
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, RATE_LIMIT_POLICIES.authInitiation);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit, { route: "/api/auth/demo" });
  }

  const formData = await request.formData();
  // A demo identity is session-scoped, never selected by submitted form data.
  const email = `demo@${randomUUID()}.wildroute.local`;
  const requestedPath = String(formData.get("next") ?? "/planner");
  const nextPath = ["/planner", "/saved", "/account"].includes(requestedPath)
    ? requestedPath
    : "/planner";

  const cookieStore = await cookies();
  cookieStore.set(DEMO_USER_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return NextResponse.redirect(new URL(nextPath, request.url));
}
