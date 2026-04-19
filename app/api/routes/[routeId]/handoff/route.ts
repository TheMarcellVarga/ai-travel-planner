import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { maybeSendRouteNotification } from "@/lib/notifications";
import { getRoute, recordHandoff } from "@/lib/store/demo-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { routeId } = await context.params;
  const routeMatch = getRoute(routeId);

  if (!routeMatch) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  const user = await getCurrentUser();
  const handoff = recordHandoff(routeId, user?.id ?? null, routeMatch.route.bookingLinks);

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
