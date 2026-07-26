import { createTripGeneration } from "@/lib/planner/generate-routes";
import { fixtureRouteDataProvider } from "@/lib/planner/providers/fixture-provider";
import { resolveRouteProvider } from "@/lib/planner/providers/resolve-provider";
import type { RouteDataProvider } from "@/lib/planner/providers/types";
import type { TripIntent } from "@/lib/types";

export async function planTrip(
  intent: TripIntent,
  provider: RouteDataProvider = fixtureRouteDataProvider
) {
  const providerSnapshot = await resolveRouteProvider(provider, intent);
  return createTripGeneration(intent, providerSnapshot);
}
