import type { RouteDataProvider } from "@/lib/planner/providers/types";
import { routeCompositionAgent } from "@/lib/planner/route-composition-agent";
import type { RouteCompositionAgentOptions } from "@/lib/planner/route-composition-agent";
import type { TripIntent } from "@/lib/types";

export async function planTrip(
  intent: TripIntent,
  provider?: RouteDataProvider,
  options: Omit<RouteCompositionAgentOptions, "destinationProvider"> = {}
) {
  return routeCompositionAgent.compose(intent, {
    ...options,
    destinationProvider: provider
  });
}
