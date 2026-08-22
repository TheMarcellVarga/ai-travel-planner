import type {
  DestinationProfile,
  RouteCostBreakdown,
  RouteCostStatus,
  TripIntent
} from "@/lib/types";

export type RoutePriceRequest = {
  intent: TripIntent;
  destinations: DestinationProfile[];
};

export type RoutePriceResult = {
  providerId: string;
  mode: "fixture" | "live";
  status: "fixture" | "available" | "partial" | "unavailable";
  checkedAt: string;
  freshness: {
    observedAt: string | null;
    maxAgeMinutes: number | null;
  };
  assumptions: string[];
  breakdown: RouteCostBreakdown;
};

export function normalizeRouteCostBreakdown(
  breakdown: RouteCostBreakdown
): RouteCostBreakdown {
  return {
    ...breakdown,
    total:
      breakdown.transport.reduce((sum, leg) => sum + leg.amount, 0) +
      breakdown.stays.reduce((sum, stay) => sum + stay.amount, 0),
    transport: breakdown.transport.map((leg) => ({ ...leg })),
    stays: breakdown.stays.map((stay) => ({ ...stay })),
    assumptions: [...breakdown.assumptions]
  };
}

export interface RoutePriceProvider {
  id: string;
  mode: "fixture" | "live";
  getPrice(request: RoutePriceRequest): Promise<RoutePriceResult>;
}

function destinationBudget(destination: DestinationProfile, budgetMode: TripIntent["budgetMode"]) {
  if (budgetMode === "value") {
    return destination.baseCostUsd;
  }

  if (budgetMode === "comfort") {
    return destination.comfortCostUsd;
  }

  return Math.round((destination.baseCostUsd + destination.comfortCostUsd) / 2);
}

export function createFixtureCostBreakdown(
  intent: TripIntent,
  destinations: DestinationProfile[],
  status: RouteCostStatus = "planning_estimate"
): RouteCostBreakdown {
  const safeDestinations = destinations.length ? destinations : [];
  const budgets = safeDestinations.map((destination) => destinationBudget(destination, intent.budgetMode));
  const total = budgets.reduce((sum, amount) => sum + amount, 0);
  const nightsPerStop = Math.max(
    1,
    Math.round(Math.max(intent.tripLengthDays - 1, safeDestinations.length) / Math.max(safeDestinations.length, 1))
  );
  const transport = safeDestinations.map((destination, index) => {
    const previousCode = index === 0 ? intent.origin.code : safeDestinations[index - 1].code;
    const amount = Math.round(budgets[index] * 0.35);

    return {
      fromCode: previousCode,
      toCode: destination.code,
      amount,
      status,
      source: status === "provider_observed" ? "route-price-provider" : "wild-route-price-fixtures",
      observedAt: null
    };
  });

  const stays = safeDestinations.map((destination, index) => ({
    stopId: destination.id,
    nights: nightsPerStop,
    amount: budgets[index] - transport[index].amount,
    status
  }));

  return {
    currency: "USD",
    total,
    transport,
    stays,
    assumptions: [
      "This cost is a Wild Route planning estimate, not a confirmed provider price.",
      "Fixture costs split each destination budget into estimated transport and stay portions.",
      ...(intent.departureDate
        ? [`No live inventory was queried for the ${intent.departureDate} departure date.`]
        : ["No departure date was supplied, so live fare lookup was not attempted."])
    ]
  };
}

export const fixtureRoutePriceProvider: RoutePriceProvider = {
  id: "wild-route-price-fixtures",
  mode: "fixture",
  async getPrice({ intent, destinations: routeDestinations }) {
    return {
      providerId: "wild-route-price-fixtures",
      mode: "fixture",
      status: "fixture",
      checkedAt: new Date().toISOString(),
      freshness: {
        observedAt: null,
        maxAgeMinutes: null
      },
      assumptions: [
        "The route uses local price fixtures because no live price provider is configured."
      ],
      breakdown: createFixtureCostBreakdown(intent, routeDestinations)
    };
  }
};

const unavailableLiveRoutePriceProvider: RoutePriceProvider = {
  id: "wild-route-live-price-provider",
  mode: "live",
  async getPrice({ intent, destinations: routeDestinations }) {
    const breakdown = createFixtureCostBreakdown(intent, routeDestinations, "partial");

    return {
      providerId: "wild-route-live-price-provider",
      mode: "live",
      status: "unavailable",
      checkedAt: new Date().toISOString(),
      freshness: {
        observedAt: null,
        maxAgeMinutes: null
      },
      assumptions: [
        "Live price mode is enabled, but no server-side commercial price provider is configured.",
        "Wild Route used partial fixture arithmetic and provider confirmation is still required."
      ],
      breakdown: {
        ...breakdown,
        assumptions: [
          ...breakdown.assumptions,
          "Live price provider unavailable; transport and stay rows are partial fixture estimates."
        ]
      }
    };
  }
};

export function getRoutePriceProvider(): RoutePriceProvider {
  return process.env.ROUTE_PRICE_MODE === "live"
    ? unavailableLiveRoutePriceProvider
    : fixtureRoutePriceProvider;
}
