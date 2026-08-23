import { afterEach, describe, expect, it, vi } from "vitest";

import { destinations } from "@/lib/data/destinations";
import { interpretTripIntent } from "@/lib/planner/intent";
import {
  createFixtureCostBreakdown,
  getRoutePriceProvider,
  normalizeRouteCostBreakdown
} from "@/lib/planner/providers/price-provider";

describe("route price planning estimates", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [0, 1],
    [1, 1],
    [2, 2]
  ])("keeps exact cost totals for maxStops=%i", (maxStops, destinationCount) => {
    const intent = interpretTripIntent({
      prompt: "Find an adventure from Singapore.",
      origin: "Singapore",
      tripLengthDays: 12,
      maxStops,
      budgetMode: "balanced"
    });
    const breakdown = createFixtureCostBreakdown(intent, destinations.slice(0, destinationCount));

    expect(breakdown.currency).toBe("USD");
    expect(breakdown.total).toBe(
      breakdown.transport.reduce((total, leg) => total + leg.amount, 0) +
        breakdown.stays.reduce((total, stay) => total + stay.amount, 0)
    );
    expect(breakdown.transport.every((leg) => leg.status === "planning_estimate")).toBe(true);
    expect(breakdown.transport.at(-1)?.toCode).toBe("SIN");
  });

  it("does not imply a live fare without a departure date", () => {
    const intent = interpretTripIntent({
      prompt: "Find a coastal route from Sydney.",
      origin: "Sydney",
      budgetMode: "value"
    });
    const breakdown = createFixtureCostBreakdown(intent, destinations.slice(0, 1));

    expect(breakdown.assumptions).toContain(
      "No departure date was supplied, so live fare lookup was not attempted."
    );
    expect(breakdown.transport[0]?.observedAt).toBeNull();
    expect(breakdown.transport.at(-1)?.toCode).toBe("SYD");
  });

  it("uses a disclosed partial result when live pricing is enabled without an adapter", async () => {
    vi.stubEnv("ROUTE_PRICE_MODE", "live");

    const provider = getRoutePriceProvider();
    const result = await provider.getPrice({
      intent: interpretTripIntent({ prompt: "Find a route from Singapore." }),
      destinations: destinations.slice(0, 1)
    });

    expect(result.status).toBe("unavailable");
    expect(result.breakdown.transport[0]?.status).toBe("partial");
    expect(result.assumptions[0]).toContain("no server-side commercial price provider");
  });

  it("recalculates provider totals from normalized line items", () => {
    const breakdown = createFixtureCostBreakdown(
      interpretTripIntent({ prompt: "Find a route from Singapore." }),
      destinations.slice(0, 1)
    );

    const normalized = normalizeRouteCostBreakdown({ ...breakdown, total: 1 });

    expect(normalized.total).toBe(breakdown.total);
  });
});
