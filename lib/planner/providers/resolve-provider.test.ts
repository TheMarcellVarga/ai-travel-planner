import { describe, expect, it } from "vitest";

import { interpretTripIntent } from "@/lib/planner/intent";
import { planTrip } from "@/lib/planner/plan-trip";
import { FIXTURE_DATA_OBSERVED_AT } from "@/lib/planner/providers/fixture-provider";
import type { RouteDataProvider } from "@/lib/planner/providers/types";

const intent = interpretTripIntent({
  prompt: "Find a hiking route from Singapore.",
  origin: "Singapore",
  wishTags: ["hiking"]
});

describe("route data providers", () => {
  it("uses deterministic fixture data by default", async () => {
    const generation = await planTrip(intent);

    generation.routes.forEach((route) => {
      expect(route.dataSource).toMatchObject({
        providerId: "wild-route-destination-fixtures",
        fallbackProviderId: null,
        mode: "fixture",
        status: "fixture",
        freshness: {
          observedAt: FIXTURE_DATA_OBSERVED_AT,
          maxAgeMinutes: null
        }
      });
      expect(route.dataSource.assumptions).toContain(
        "Destination metadata is a local fixture, not live provider inventory."
      );
    });
  });

  it("degrades to disclosed fixture data when a provider fails", async () => {
    const unavailableProvider: RouteDataProvider = {
      id: "future-live-provider",
      mode: "live",
      async load() {
        throw new Error("secret provider payload should never reach route output");
      }
    };

    const generation = await planTrip(intent, unavailableProvider);

    expect(generation.routes).toHaveLength(4);
    generation.routes.forEach((route) => {
      expect(route.dataSource).toMatchObject({
        providerId: "future-live-provider",
        fallbackProviderId: "wild-route-destination-fixtures",
        mode: "live",
        status: "unavailable"
      });
      expect(route.dataFreshness).toContain("provider unavailable");
      expect(JSON.stringify(route)).not.toContain("secret provider payload");
      expect(route.dataSource.assumptions).toContain(
        "The selected provider was unavailable; Wild Route used local destination fixtures."
      );
    });
  });
});
