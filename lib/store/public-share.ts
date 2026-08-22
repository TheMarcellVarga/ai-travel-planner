import type { PublicSharedRoute, RouteOption, SharedRoute } from "@/lib/types";

export function createPublicRouteSnapshot(route: RouteOption): PublicSharedRoute["route"] {
  return {
    id: route.id,
    title: route.title,
    tagline: route.tagline,
    vibe: route.vibe,
    promotedStopId: route.promotedStopId,
    score: route.score,
    confidence: route.confidence,
    estimatedCostUsd: route.estimatedCostUsd,
    costBreakdown: {
      currency: route.costBreakdown.currency,
      total: route.costBreakdown.total,
      transport: route.costBreakdown.transport.map((leg) => ({ ...leg })),
      stays: route.costBreakdown.stays.map((stay) => ({ ...stay })),
      assumptions: [...route.costBreakdown.assumptions]
    },
    estimateStatus: route.estimateStatus,
    availabilityStatus: route.availabilityStatus,
    dataFreshness: route.dataFreshness,
    dataSource: {
      ...route.dataSource,
      freshness: { ...route.dataSource.freshness },
      assumptions: [...route.dataSource.assumptions]
    },
    disclaimer: route.disclaimer,
    reasons: [...route.reasons],
    wishTags: [...route.wishTags],
    stops: route.stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      code: stop.code,
      country: stop.country,
      kind: stop.kind,
      coordinates: {
        lat: stop.coordinates.lat,
        lng: stop.coordinates.lng
      },
      tags: [...stop.tags],
      scene: stop.scene,
      imageHint: stop.imageHint,
      media: stop.media
        ? {
            ...stop.media
          }
        : null
    }))
  };
}

export function createPublicSharedRoute(sharedRoute: SharedRoute): PublicSharedRoute {
  return {
    id: sharedRoute.id,
    slug: sharedRoute.slug,
    route: createPublicRouteSnapshot(sharedRoute.route),
    publishedAt: sharedRoute.publishedAt
  };
}
