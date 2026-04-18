import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { publishRouteForUser } from "@/lib/store/demo-store";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first to publish routes." }, { status: 401 });
  }

  const { routeId } = await context.params;
  const sharedRoute = publishRouteForUser(user.id, routeId);

  if (!sharedRoute) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  return NextResponse.json({
    slug: sharedRoute.slug,
    shareUrl: `/share/${sharedRoute.slug}`
  });
}

