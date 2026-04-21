import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { maybeSendRouteNotification } from "@/lib/notifications";
import { getSavedRoutesForUser, saveRouteForUser } from "@/lib/store/demo-store";
import {
  getSavedRoutesForUserFromDatabase,
  saveRouteForUserInDatabase
} from "@/lib/store/persistent-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first to save routes." }, { status: 401 });
  }

  const { routeId } = await context.params;
  const existingCount =
    user.authMode === "supabase"
      ? (await getSavedRoutesForUserFromDatabase(user.id)).length
      : getSavedRoutesForUser(user.id).length;

  if (existingCount >= user.entitlement.routeSaveLimit) {
    return NextResponse.json({ error: "Your free save limit is reached." }, { status: 403 });
  }

  const savedRoute =
    (await saveRouteForUserInDatabase(user.id, routeId)) ??
    saveRouteForUser(user.id, routeId);

  if (!savedRoute) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  void maybeSendRouteNotification({
    user,
    route: savedRoute.route,
    action: "saved"
  }).catch(() => undefined);

  return NextResponse.json(savedRoute);
}
