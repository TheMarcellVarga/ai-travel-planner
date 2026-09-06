import { createTripGeneration } from "@/lib/planner/generate-routes";
import {
  enrichRoutesWithMedia,
  getRouteMediaProvider,
  type RouteMediaCache
} from "@/lib/planner/providers/media-provider";
import {
  fixtureRoutePriceProvider,
  getRoutePriceProvider,
  normalizeRouteCostBreakdown,
  type RoutePriceResult,
  type RoutePriceProvider
} from "@/lib/planner/providers/price-provider";
import { getRouteDataProvider } from "@/lib/planner/providers/supabase-provider";
import { resolveRouteProvider } from "@/lib/planner/providers/resolve-provider";
import type { RouteDataProvider } from "@/lib/planner/providers/types";
import type { RouteMediaProvider } from "@/lib/planner/providers/media-provider";
import { tripGenerationSchema } from "@/lib/planner/schema";
import type { TripGeneration, TripIntent } from "@/lib/types";

const AGENT_VERSION = "wild-route-composition-0.1";

function requestedAgentMode() {
  return process.env.ROUTE_AGENT_MODE === "model" ? "model" : "deterministic";
}

export type RouteCompositionAgentOptions = {
  destinationProvider?: RouteDataProvider;
  priceProvider?: RoutePriceProvider;
  mediaProvider?: RouteMediaProvider;
  mediaCache?: RouteMediaCache;
};

export class RouteCompositionAgent {
  async compose(
    intent: TripIntent,
    options: RouteCompositionAgentOptions = {}
  ): Promise<TripGeneration> {
    const startedAt = Date.now();
    const destinationProvider = options.destinationProvider ?? getRouteDataProvider();
    const priceProvider = options.priceProvider ?? getRoutePriceProvider();
    const mediaProvider = options.mediaProvider ?? getRouteMediaProvider();
    const requestedMode = requestedAgentMode();

    try {
      const providerSnapshot = await resolveRouteProvider(destinationProvider, intent);
      const generation = createTripGeneration(intent, providerSnapshot);
      const pricedRouteResults = await Promise.all(
        generation.routes.map(async (route) => {
          const destinations = route.stops
            .filter((stop) => stop.kind === "destination")
            .map((stop) => providerSnapshot.destinations.find((candidate) => candidate.id === stop.id))
            .filter((destination): destination is NonNullable<typeof destination> => Boolean(destination));
          let price: RoutePriceResult;
          try {
            price = await priceProvider.getPrice({ intent, destinations });
          } catch {
            const fallbackPrice = await fixtureRoutePriceProvider.getPrice({ intent, destinations });
            price = {
              ...fallbackPrice,
              status: "partial" as const,
              assumptions: [
                ...fallbackPrice.assumptions,
                "The selected price provider failed; Wild Route used partial fixture arithmetic."
              ],
              breakdown: {
                ...fallbackPrice.breakdown,
                transport: fallbackPrice.breakdown.transport.map((leg) => ({
                  ...leg,
                  status: "partial" as const
                })),
                stays: fallbackPrice.breakdown.stays.map((stay) => ({
                  ...stay,
                  status: "partial" as const
                }))
              }
            };
          }
          const costBreakdown = normalizeRouteCostBreakdown(price.breakdown);

          return {
            route: {
              ...route,
              estimatedCostUsd: costBreakdown.total,
              costBreakdown: {
                ...costBreakdown,
                assumptions: Array.from(
                  new Set([...costBreakdown.assumptions, ...price.assumptions])
                )
              }
            },
            status: price.status
          };
        })
      );
      const routes = await enrichRoutesWithMedia(
        pricedRouteResults.map(({ route }) => route),
        mediaProvider,
        options.mediaCache
      );
      const pricePartial = pricedRouteResults.some(
        ({ status }) => status === "partial" || status === "unavailable"
      );

      return tripGenerationSchema.parse({
        ...generation,
        routes,
        agentRun: {
          mode: requestedMode,
          agentVersion: AGENT_VERSION,
          status:
            requestedMode === "model"
              ? "fallback"
              : providerSnapshot.status === "unavailable" ||
                  providerSnapshot.status === "partial" ||
                  pricePartial
                ? "partial"
                : "complete",
          latencyMs: Date.now() - startedAt
        }
      });
    } catch {
      const fallback = createTripGeneration(
        intent,
        undefined
      );

      return tripGenerationSchema.parse({
        ...fallback,
        agentRun: {
          mode: requestedMode,
          agentVersion: AGENT_VERSION,
          status: "fallback",
          latencyMs: Date.now() - startedAt
        }
      });
    }
  }
}

export const routeCompositionAgent = new RouteCompositionAgent();
