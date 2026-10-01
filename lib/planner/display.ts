import type { RouteOption } from "@/lib/types";

type PriceDisplayRoute = Pick<RouteOption, "costBreakdown" | "estimatedCostUsd">;

export function formatRouteTagline(tagline: string) {
  return tagline.split("->").map((stop) => stop.trim()).join(" → ");
}

export function hasProviderObservedPrice(route: PriceDisplayRoute) {
  return (
    route.costBreakdown.transport.length > 0 &&
    route.costBreakdown.transport.every(
      (leg) => leg.status === "provider_observed" && Boolean(leg.observedAt)
    ) &&
    route.costBreakdown.stays.every((stay) => stay.status === "provider_observed")
  );
}

export function routePriceLabel(route: PriceDisplayRoute) {
  return hasProviderObservedPrice(route)
    ? `$${route.estimatedCostUsd} observed`
    : "Check live price";
}
