import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { maybeSendRouteNotification } from "@/lib/notifications";
import { publishRouteForUser } from "@/lib/store/demo-store";
import { DATABASE_PERSISTENCE, MEMORY_PERSISTENCE } from "@/lib/store/persistence";
import { publishRouteForUserInDatabase } from "@/lib/store/persistent-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first to publish routes." }, { status: 401 });
  }

  const { routeId } = await context.params;
  const persistedSharedRoute = await publishRouteForUserInDatabase(user.id, routeId);
  const sharedRoute = persistedSharedRoute ?? publishRouteForUser(user.id, routeId);
  const persistence = persistedSharedRoute ? DATABASE_PERSISTENCE : MEMORY_PERSISTENCE;

  if (!sharedRoute) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  void maybeSendRouteNotification({
    user,
    route: sharedRoute.route,
    action: "published",
    shareUrl: `/share/${sharedRoute.slug}`
  }).catch(() => undefined);

  return NextResponse.json({
    slug: sharedRoute.slug,
    shareUrl: `/share/${sharedRoute.slug}`,
    persistence
  });
}
