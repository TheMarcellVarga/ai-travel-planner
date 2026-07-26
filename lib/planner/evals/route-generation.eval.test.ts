import { describe, expect, it } from "vitest";

import { destinations } from "@/lib/data/destinations";
import { routeEvalFixtures } from "@/lib/planner/evals/fixtures";
import { interpretTripIntent } from "@/lib/planner/intent";
import { planTrip } from "@/lib/planner/plan-trip";
import type { RouteDataProvider } from "@/lib/planner/providers/types";
import { tripGenerationSchema } from "@/lib/planner/schema";

const staleProvider: RouteDataProvider = {
  id: "stale-provider-fixture",
  mode: "live",
  async load() {
    return {
      status: "partial",
      freshness: {
        observedAt: "2025-01-01T00:00:00.000Z",
        maxAgeMinutes: 60
      },
      assumptions: ["This fixture simulates provider data beyond its freshness window."],
      destinations
    };
  }
};

describe("route-generation eval fixtures", () => {
  for (const fixture of routeEvalFixtures) {
    it(fixture.id, async () => {
      const intent = interpretTripIntent(fixture.input);
      const generation = await planTrip(
        intent,
        fixture.expected.providerScenario === "stale" ? staleProvider : undefined
      );

      expect(tripGenerationSchema.safeParse(generation).success).toBe(true);
      expect(generation.tripIntent.tripLengthDays).toBeGreaterThanOrEqual(4);
      expect(generation.tripIntent.tripLengthDays).toBeLessThanOrEqual(30);
      expect(generation.tripIntent.maxStops).toBeGreaterThanOrEqual(0);
      expect(generation.tripIntent.maxStops).toBeLessThanOrEqual(2);

      generation.routes.forEach((route) => {
        expect(route.estimateStatus).toBe("planning_estimate");
        expect(route.availabilityStatus).toBe("external_search_required");
        expect(route.promotedStopId).toBe(route.stops[1]?.id);
        expect(route.bookingLinks.every((link) => link.status === "external_search")).toBe(
          true
        );

        if (fixture.expected.maxDestinationStops !== undefined) {
          expect(route.stops.filter((stop) => stop.kind === "destination").length).toBeLessThanOrEqual(
            fixture.expected.maxDestinationStops
          );
        }

        for (const tag of fixture.expected.requiredWishTags ?? []) {
          expect(route.wishTags).toContain(tag);
        }

        for (const caveat of fixture.expected.requiredCaveats ?? []) {
          expect(route.reasons).toContain(caveat);
        }

        const routeClaims = [
          route.title,
          route.tagline,
          route.disclaimer,
          ...route.reasons
        ].join(" ");
        for (const forbiddenClaim of fixture.expected.forbiddenRouteClaims ?? []) {
          expect(routeClaims).not.toMatch(forbiddenClaim);
        }

        if (fixture.expected.providerScenario === "stale") {
          expect(route.dataSource).toMatchObject({
            providerId: "stale-provider-fixture",
            mode: "live",
            status: "partial"
          });
          expect(route.dataFreshness).toContain("Provider data is stale");
        }
      });
    });
  }
});
