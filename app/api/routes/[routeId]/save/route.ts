import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getSavedRoutesForUser, saveRouteForUser } from "@/lib/store/demo-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first to save routes." }, { status: 401 });
  }

  const { routeId } = await context.params;
  const existingCount = getSavedRoutesForUser(user.id).length;

  if (existingCount >= user.entitlement.routeSaveLimit) {
    return NextResponse.json({ error: "Your free save limit is reached." }, { status: 403 });
  }

  const savedRoute = saveRouteForUser(user.id, routeId);

  if (!savedRoute) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  return NextResponse.json(savedRoute);
}

