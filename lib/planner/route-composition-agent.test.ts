import { afterEach, describe, expect, it, vi } from "vitest";

import { interpretTripIntent } from "@/lib/planner/intent";
import { RouteCompositionAgent } from "@/lib/planner/route-composition-agent";
import { fixtureRouteMediaProvider } from "@/lib/planner/providers/media-provider";
import { fixtureRoutePriceProvider } from "@/lib/planner/providers/price-provider";

const intent = interpretTripIntent({
  prompt: "Find a 12 day hiking route from Singapore with max 2 stops.",
  origin: "Singapore",
  tripLengthDays: 12,
  maxStops: 2,
  wishTags: ["hiking"],
  budgetMode: "balanced"
});

describe("RouteCompositionAgent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns validated multi-stop routes with media and run metadata", async () => {
    const agent = new RouteCompositionAgent();
    const generation = await agent.compose(intent, {
      mediaProvider: fixtureRouteMediaProvider,
      priceProvider: fixtureRoutePriceProvider
    });

    expect(generation.agentRun).toMatchObject({
      mode: "deterministic",
      status: "complete",
      agentVersion: "wild-route-composition-0.1"
    });
    expect(generation.routes.some((route) => route.stops.length === 3)).toBe(true);
    expect(generation.routes[0]?.stops[1]?.media).toMatchObject({
      provider: "local-fallback"
    });
  });

  it("keeps the route usable with partial fixture pricing when a price adapter fails", async () => {
    const agent = new RouteCompositionAgent();
    const generation = await agent.compose(intent, {
      mediaProvider: fixtureRouteMediaProvider,
      priceProvider: {
        id: "broken-price-provider",
        mode: "live",
        async getPrice() {
          throw new Error("provider payload must not escape");
        }
      }
    });

    expect(generation.agentRun?.status).toBe("partial");
    expect(generation.routes[0]?.costBreakdown.transport[0]?.status).toBe("partial");
    expect(generation.routes[0]?.costBreakdown.total).toBe(
      generation.routes[0]?.estimatedCostUsd
    );
    expect(JSON.stringify(generation)).not.toContain("provider payload must not escape");
  });

  it("keeps the deterministic route when model mode is requested but no model adapter exists", async () => {
    vi.stubEnv("ROUTE_AGENT_MODE", "model");

    const agent = new RouteCompositionAgent();
    const generation = await agent.compose(intent, {
      mediaProvider: fixtureRouteMediaProvider
    });

    expect(generation.agentRun).toMatchObject({
      mode: "model",
      status: "fallback"
    });
  });

  it("replaces invalid enrichment results with local artwork", async () => {
    const agent = new RouteCompositionAgent();
    const generation = await agent.compose(intent, {
      mediaProvider: {
        id: "local-fallback",
        async getMedia(destination) {
          return {
            provider: "local-fallback",
            imageUrl: "",
            sourceUrl: "https://github.com/TheMarcellVarga/ai-travel-planner",
            title: destination.name,
            creator: "Wild Route",
            licenseLabel: "Wild Route local artwork",
            licenseUrl: "https://github.com/TheMarcellVarga/ai-travel-planner",
            attributionText: "invalid image fixture",
            fetchedAt: new Date().toISOString()
          };
        }
      }
    });

    expect(generation.agentRun?.status).toBe("complete");
    expect(generation.routes[0]?.stops[1]?.media).toMatchObject({
      provider: "local-fallback"
    });
  });
});
