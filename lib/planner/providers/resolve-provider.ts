import {
  createFixtureProviderPayload,
  fixtureRouteDataProvider
} from "@/lib/planner/providers/fixture-provider";
import type {
  RouteDataProvider,
  RouteProviderSnapshot
} from "@/lib/planner/providers/types";
import type { TripIntent } from "@/lib/types";

export async function resolveRouteProvider(
  provider: RouteDataProvider,
  intent: TripIntent
): Promise<RouteProviderSnapshot> {
  const startedAt = Date.now();

  try {
    const payload = await provider.load(intent);

    if (!payload.destinations.length) {
      throw new Error("Provider returned no normalized destinations.");
    }

    return {
      ...payload,
      providerId: provider.id,
      mode: provider.mode,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      fallbackProviderId: null
    };
  } catch {
    const fallback = createFixtureProviderPayload();

    return {
      ...fallback,
      providerId: provider.id,
      mode: provider.mode,
      status: "unavailable",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      fallbackProviderId: fixtureRouteDataProvider.id,
      assumptions: [
        "The selected provider was unavailable; Wild Route used local destination fixtures.",
        ...fallback.assumptions
      ]
    };
  }
}
