import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { maybeSendRouteNotification } from "@/lib/notifications";
import { routeOptionSchema } from "@/lib/planner/schema";
import {
  getSavedRoutesForUser,
  saveGeneration,
  saveRouteForUser
} from "@/lib/store/demo-store";
import { DATABASE_PERSISTENCE, MEMORY_PERSISTENCE } from "@/lib/store/persistence";
import {
  getSavedRoutesForUserFromDatabase,
  saveRouteForUserInDatabase
} from "@/lib/store/persistent-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first to save routes." }, { status: 401 });
  }

  const { routeId } = await context.params;
  let demoRoute = null;

  if (user.authMode === "demo") {
    const parsedBody = routeOptionSchema.safeParse(
      await request.json().catch(() => null).then((body) => body?.route)
    );
    demoRoute = parsedBody.success && parsedBody.data.id === routeId ? parsedBody.data : null;

    if (demoRoute) {
      saveGeneration(
        {
          id: `demo-browser-${routeId}`,
          createdAt: new Date().toISOString(),
          tripIntent: {
            prompt: "Browser-local demo route.",
            origin: demoRoute.stops[0]
              ? {
                  label: demoRoute.stops[0].name,
                  code: demoRoute.stops[0].code,
                  coordinates: demoRoute.stops[0].coordinates,
                  country: demoRoute.stops[0].country
                }
              : user.profile
                ? {
                    label: user.profile.homeAirportCode ?? "Singapore",
                    code: user.profile.homeAirportCode ?? "SIN",
                    coordinates: { lat: 1.3521, lng: 103.8198 },
                    country: "Singapore"
                  }
                : {
                    label: "Singapore",
                    code: "SIN",
                    coordinates: { lat: 1.3521, lng: 103.8198 },
                    country: "Singapore"
                  },
            tripLengthDays: 12,
            maxStops: Math.min(2, Math.max(0, demoRoute.stops.length - 2)),
            routeType: demoRoute.stops.at(-1)?.kind === "return" ? "round_trip" : "one_way",
            wishTags: demoRoute.wishTags,
            budgetMode: "balanced",
            vibe: demoRoute.vibe,
            exclusions: []
          },
          routes: [demoRoute]
        },
        user.id
      );
    }
  }
  const existingCount =
    user.authMode === "supabase"
      ? (await getSavedRoutesForUserFromDatabase(user.id)).length
      : getSavedRoutesForUser(user.id).length;

  if (existingCount >= user.entitlement.routeSaveLimit) {
    return NextResponse.json({ error: "Your free save limit is reached." }, { status: 403 });
  }

  const persistedSavedRoute =
    user.authMode === "supabase"
      ? await saveRouteForUserInDatabase(user.id, routeId)
      : null;
  const savedRoute = persistedSavedRoute ?? saveRouteForUser(user.id, routeId);
  const persistence = persistedSavedRoute ? DATABASE_PERSISTENCE : MEMORY_PERSISTENCE;

  if (!savedRoute) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  void maybeSendRouteNotification({
    user,
    route: savedRoute.route,
    action: "saved"
  }).catch(() => undefined);

  return NextResponse.json({
    ...savedRoute,
    persistence
  });
}
