import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { maybeSendRouteNotification } from "@/lib/notifications";
import { getRoute, recordHandoff } from "@/lib/store/demo-store";
import {
  findRouteInDatabase,
  recordHandoffInDatabase
} from "@/lib/store/persistent-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { routeId } = await context.params;
  const user = await getCurrentUser();
  const routeMatch =
    (await findRouteInDatabase(routeId, user?.id)) ?? getRoute(routeId);

  if (!routeMatch) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  const handoff =
    (await recordHandoffInDatabase(routeId, user?.id ?? null, routeMatch.route.bookingLinks)) ??
    recordHandoff(routeId, user?.id ?? null, routeMatch.route.bookingLinks);

  if (user) {
    void maybeSendRouteNotification({
      user,
      route: routeMatch.route,
      action: "handoff"
    }).catch(() => undefined);
  }

  return NextResponse.json({
    handoffId: handoff.id,
    links: routeMatch.route.bookingLinks
  });
}
