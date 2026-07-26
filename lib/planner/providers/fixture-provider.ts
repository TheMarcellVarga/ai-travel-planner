import { destinations } from "@/lib/data/destinations";
import type {
  RouteDataProvider,
  RouteProviderPayload
} from "@/lib/planner/providers/types";

export const FIXTURE_DATA_OBSERVED_AT = "2026-07-01T00:00:00.000Z";

export function createFixtureProviderPayload(): RouteProviderPayload {
  return {
    status: "fixture",
    freshness: {
      observedAt: FIXTURE_DATA_OBSERVED_AT,
      maxAgeMinutes: null
    },
    assumptions: [
      "Destination metadata is a local fixture, not live provider inventory.",
      "Estimated cost is an app-side planning signal."
    ],
    destinations
  };
}

export const fixtureRouteDataProvider: RouteDataProvider = {
  id: "wild-route-destination-fixtures",
  mode: "fixture",
  async load() {
    return createFixtureProviderPayload();
  }
};
