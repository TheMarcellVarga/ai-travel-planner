import type { RouteOption } from "@/lib/types";

export function hasProviderObservedPrice(route: RouteOption) {
  return (
    route.costBreakdown.transport.length > 0 &&
    route.costBreakdown.transport.every(
      (leg) => leg.status === "provider_observed" && Boolean(leg.observedAt)
    )
  );
}

export function routePriceLabel(route: RouteOption) {
  return hasProviderObservedPrice(route)
    ? `$${route.estimatedCostUsd} observed`
    : "Check live price";
}
