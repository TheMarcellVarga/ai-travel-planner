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
      expect(route.costBreakdown.total).toBe(route.estimatedCostUsd);
      expect(route.stops.at(-1)?.kind).toBe("return");
      expect(route.stops.at(-1)?.code).toBe(route.stops[0]?.code);
      expect(route.costBreakdown.transport.length).toBe(route.stops.length - 1);
      expect(route.costBreakdown.transport.at(-1)?.toCode).toBe("SIN");
      expect(route.bookingLinks.filter((link) => link.kind === "leg")).toHaveLength(
        route.costBreakdown.transport.length
      );
      expect(route.costBreakdown.stays.length).toBe(
        route.stops.filter((stop) => stop.kind === "destination").length
      );
      expect(route.costBreakdown.assumptions[0]).toContain("planning estimate");
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
      expect(route.stops).toHaveLength(3);
      expect(route.stops.at(-1)?.kind).toBe("return");
      expect(route.costBreakdown.transport).toHaveLength(2);
      expect(route.costBreakdown.stays).toHaveLength(1);
    });
  });

  it("keeps an explicitly requested one-way route from adding a return leg", () => {
    const generation = createTripGeneration(
      interpretTripIntent({
        prompt: "Find a 12 day one-way hiking route from Singapore.",
        origin: "Singapore",
        tripLengthDays: 12,
        maxStops: 1,
        wishTags: ["hiking"],
        budgetMode: "balanced"
      })
    );

    generation.routes.forEach((route) => {
      expect(route.stops.at(-1)?.kind).toBe("destination");
      expect(route.stops.at(-1)?.code).not.toBe(route.stops[0]?.code);
      expect(route.costBreakdown.transport.length).toBe(route.stops.length - 1);
    });
  });

  it("composes up to two destination stops when the request allows them", () => {
    const generation = createTripGeneration(
      interpretTripIntent({
        prompt: "Find a 14 day jungle route from Singapore with max 2 stops.",
        origin: "Singapore",
        tripLengthDays: 14,
        maxStops: 2,
        wishTags: ["hiking", "mtb"],
        budgetMode: "balanced"
      })
    );

    expect(generation.routes.some((route) => route.stops.length === 4)).toBe(true);
    generation.routes.forEach((route) => {
      expect(route.stops.filter((stop) => stop.kind === "destination").length).toBeLessThanOrEqual(2);
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
