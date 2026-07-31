import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { maybeSendRouteNotification } from "@/lib/notifications";
import { routeOptionSchema, tripIntentSchema } from "@/lib/planner/schema";
import { createDemoShareSlug } from "@/lib/store/demo-preview";
import { publishRouteForUser } from "@/lib/store/demo-store";
import { DATABASE_PERSISTENCE, MEMORY_PERSISTENCE } from "@/lib/store/persistence";
import { publishRouteForUserInDatabase } from "@/lib/store/persistent-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first to publish routes." }, { status: 401 });
  }

  const { routeId } = await context.params;
  if (user.authMode === "demo") {
    const body = await request.json().catch(() => null);
    const route = routeOptionSchema.safeParse(body?.route);
    const intent = tripIntentSchema.safeParse(body?.tripIntent);

    if (!route.success || route.data.id !== routeId || !intent.success) {
      return NextResponse.json({ error: "Route not found." }, { status: 404 });
    }

    const slug = createDemoShareSlug(intent.data, route.data);
    const shareUrl = `/share/${slug}`;

    void maybeSendRouteNotification({
      user,
      route: route.data,
      action: "published",
      shareUrl
    }).catch(() => undefined);

    return NextResponse.json({
      slug,
      shareUrl,
      persistence: {
        ...MEMORY_PERSISTENCE,
        detail: "Published as a validated stateless demo preview; no account record was stored."
      }
    });
  }

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
