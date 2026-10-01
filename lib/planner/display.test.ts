import { describe, expect, it } from "vitest";

import {
  formatRouteTagline,
  hasProviderObservedPrice,
  routePriceLabel
} from "@/lib/planner/display";
import type { RouteOption } from "@/lib/types";

const route = {
  estimatedCostUsd: 1270,
  costBreakdown: {
    currency: "USD" as const,
    total: 1270,
    transport: [
      {
        fromCode: "SIN",
        toCode: "DAD",
        amount: 470,
        status: "provider_observed" as const,
        source: "test-provider",
        observedAt: "2026-09-26T00:00:00.000Z"
      }
    ],
    stays: [
      {
        stopId: "da-nang",
        nights: 8,
        amount: 800,
        status: "planning_estimate" as const
      }
    ],
    assumptions: []
  }
} satisfies Pick<RouteOption, "costBreakdown" | "estimatedCostUsd">;

describe("route tagline display", () => {
  it("uses spaced route arrows for generated stop sequences", () => {
    expect(formatRouteTagline("LIS -> DAD -> FNC -> LIS")).toBe(
      "LIS → DAD → FNC → LIS"
    );
  });
});

describe("route price display", () => {
  it("withholds a dollar total when any stay is only an estimate", () => {
    expect(hasProviderObservedPrice(route)).toBe(false);
    expect(routePriceLabel(route)).toBe("Check live price");
  });

  it("labels a total when all fare and stay components are observed", () => {
    const observedRoute = {
      ...route,
      costBreakdown: {
        ...route.costBreakdown,
        stays: route.costBreakdown.stays.map((stay) => ({
          ...stay,
          status: "provider_observed" as const
        }))
      }
    };

    expect(hasProviderObservedPrice(observedRoute)).toBe(true);
    expect(routePriceLabel(observedRoute)).toBe("$1270 observed");
  });
});
