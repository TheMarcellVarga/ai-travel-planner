import { createTripGeneration } from "@/lib/planner/generate-routes";
import { fixtureRouteDataProvider } from "@/lib/planner/providers/fixture-provider";
import { resolveRouteProvider } from "@/lib/planner/providers/resolve-provider";
import type { RouteDataProvider } from "@/lib/planner/providers/types";
import { tripGenerationSchema } from "@/lib/planner/schema";
import type { TripIntent } from "@/lib/types";

export async function planTrip(
  intent: TripIntent,
  provider: RouteDataProvider = fixtureRouteDataProvider
) {
  const providerSnapshot = await resolveRouteProvider(provider, intent);
  return tripGenerationSchema.parse(createTripGeneration(intent, providerSnapshot));
}
