import { describe, expect, it } from "vitest";

import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";

describe("createTripGeneration", () => {
  it("returns ranked routes that begin at the requested origin", () => {
    const generation = createTripGeneration(
      interpretTripIntent({
        prompt: "Find a 12 day hiking and crypto-friendly route from Singapore with one stop.",
        origin: "Singapore",
        tripLengthDays: 12,
        maxStops: 1,
        wishTags: ["crypto-friendly", "hiking"],
        budgetMode: "balanced"
      })
    );

    expect(generation.routes.length).toBeGreaterThanOrEqual(3);
    expect(generation.routes.length).toBeLessThanOrEqual(4);

    generation.routes.forEach((route) => {
      expect(route.stops[0]?.code).toBe("SIN");
      expect(route.promotedStopId).toBe(route.stops[1]?.id);
      expect(route.bookingLinks.length).toBeGreaterThan(0);
      expect(route.estimateStatus).toBe("planning_estimate");
      expect(route.availabilityStatus).toBe("external_search_required");
      expect(route.disclaimer).toContain("not confirmed provider price");
      expect(route.dataFreshness).toContain("Local destination fixture");
      expect(route.dataSource).toMatchObject({
        providerId: "wild-route-destination-fixtures",
        fallbackProviderId: null,
        mode: "fixture",
        status: "fixture",
        latencyMs: 0
      });
      expect(route.bookingLinks[0]?.status).toBe("external_search");
      expect(route.bookingLinks[0]?.disclaimer).toContain("Final price and availability");
    });
  });

  it("keeps direct-only requests to a single destination stop", () => {
    const generation = createTripGeneration(
      interpretTripIntent({
        prompt: "Direct only surf escape from Sydney.",
        origin: "Sydney",
        tripLengthDays: 7,
        maxStops: 0,
        wishTags: ["surf"],
        budgetMode: "value"
      })
    );

    generation.routes.forEach((route) => {
      expect(route.stops).toHaveLength(2);
    });
  });

  it("keeps unsupported safety and visa requests visible as route caveats", () => {
    const generation = createTripGeneration(
      interpretTripIntent({
        prompt:
          "Guarantee a safest visa-ready hiking route from Singapore with one stop.",
        origin: "Singapore",
        tripLengthDays: 9,
        maxStops: 1,
        wishTags: ["hiking"],
        budgetMode: "balanced"
      })
    );

    generation.routes.forEach((route) => {
      expect(route.reasons).toEqual(
        expect.arrayContaining([
          "Wild Route cannot guarantee price, availability, safety, or route feasibility.",
          "Visa, immigration, and passport requirements must be checked with official sources.",
          "Route output is not safety, legal, health, weather, or emergency advice."
        ])
      );
    });
  });
});
