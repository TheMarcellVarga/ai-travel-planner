import { buildBookingLinks } from "@/lib/planner/provider-links";
import { createFixtureProviderPayload } from "@/lib/planner/providers/fixture-provider";
import { createFixtureCostBreakdown } from "@/lib/planner/providers/price-provider";
import type { RouteProviderSnapshot } from "@/lib/planner/providers/types";
import type { DestinationProfile, RouteOption, RouteStop, TripGeneration, TripIntent } from "@/lib/types";

const PLANNING_ESTIMATE_DISCLAIMER =
  "Estimated cost and confidence are Wild Route planning signals, not confirmed provider price, availability, safety, visa, legal, health, weather, or emergency advice.";

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function scoreDestination(destination: DestinationProfile, intent: TripIntent) {
  const tagMatches = destination.tags.filter((tag) => intent.wishTags.includes(tag)).length;
  const budgetBase =
    intent.budgetMode === "value"
      ? 900 - destination.baseCostUsd
      : intent.budgetMode === "comfort"
        ? 900 - destination.comfortCostUsd * 0.55
        : 900 - (destination.baseCostUsd + destination.comfortCostUsd) / 2;
  const cryptoBoost = intent.wishTags.includes("crypto-friendly") && destination.cryptoFriendly ? 70 : 0;
  const stopPenalty = intent.maxStops === 0 ? 60 : 0;

  return tagMatches * 140 + destination.activityScore * 18 + budgetBase * 0.12 + cryptoBoost - stopPenalty;
}

function makeOriginStop(intent: TripIntent): RouteStop {
  return {
    id: `origin-${intent.origin.code}`,
    name: intent.origin.label,
    code: intent.origin.code,
    country: intent.origin.country,
    kind: "origin",
    coordinates: intent.origin.coordinates,
    tags: []
  };
}

function makeDestinationStop(destination: DestinationProfile): RouteStop {
  return {
    id: destination.id,
    name: destination.name,
    code: destination.code,
    country: destination.country,
    kind: "destination",
    coordinates: destination.coordinates,
    tags: destination.tags,
    scene: destination.scene,
    imageHint: destination.imageHint
  };
}

function createReasons(stops: DestinationProfile[], intent: TripIntent) {
  const matchedTags = Array.from(new Set(stops.flatMap((stop) => stop.tags))).filter((tag) =>
    intent.wishTags.includes(tag)
  );

  return [
    `Matches ${matchedTags.length || 1} of your active route wishes.`,
    `Keeps the route within a ${intent.tripLengthDays}-day travel window.`,
    `${stops[0]?.name} is used as the free promoted stop for stronger discovery placement.`,
    "Booking links are external provider searches; final price and availability must be confirmed there.",
    ...intent.exclusions
  ];
}

function buildDestinationSequences(
  ranked: DestinationProfile[],
  maxStops: number
) {
  const sequences: DestinationProfile[][] = [];
  // The existing product contract treats maxStops as the number of route
  // destinations available after the origin, with direct-only still showing
  // one destination. Keep the public v1 cap at two destination stops while
  // allowing the optimizer to compose direct and multi-stop alternatives.
  const destinationCount = Math.min(maxStops === 0 ? 1 : 2, ranked.length);

  if (destinationCount === 1) {
    return ranked.map((destination) => [destination]);
  }

  for (let index = 0; index <= ranked.length - destinationCount; index += 1) {
    sequences.push(ranked.slice(index, index + destinationCount));
  }

  // Keep a few non-adjacent combinations so the agent can surface a route
  // with a meaningful rhythm instead of only walking the ranked list.
  if (destinationCount >= 2 && ranked.length >= destinationCount + 1) {
    sequences.push([
      ranked[0],
      ...ranked.slice(destinationCount, destinationCount + destinationCount - 1)
    ]);
  }

  return sequences;
}

function scoreSequence(stops: DestinationProfile[], intent: TripIntent) {
  return stops.reduce(
    (total, destination, index) => total + scoreDestination(destination, intent) / (index + 1),
    0
  ) - Math.max(0, stops.length - 1) * 8;
}

function createTitle(stops: DestinationProfile[], intent: TripIntent) {
  const first = stops[0];
  if (intent.vibe === "jungle") {
    return `${first.name} Jungle Signal`;
  }
  if (intent.vibe === "coastal") {
    return `${first.name} Breakline`;
  }
  if (intent.vibe === "alpine") {
    return `${first.name} Ridge Run`;
  }
  return `${first.name} Route Hunt`;
}

function describeFreshness(snapshot: RouteProviderSnapshot) {
  if (snapshot.status === "unavailable") {
    return "Selected provider unavailable; local destination fixtures were used and external inventory was not queried.";
  }

  if (snapshot.mode === "fixture") {
    return `Local destination fixture observed ${snapshot.freshness.observedAt}; external provider inventory was not queried.`;
  }

  const observedAt = snapshot.freshness.observedAt
    ? new Date(snapshot.freshness.observedAt).getTime()
    : null;
  const checkedAt = new Date(snapshot.checkedAt).getTime();
  const maxAgeMs =
    snapshot.freshness.maxAgeMinutes === null
      ? null
      : snapshot.freshness.maxAgeMinutes * 60_000;
  const isStale =
    observedAt !== null &&
    maxAgeMs !== null &&
    checkedAt - observedAt > maxAgeMs;

  if (isStale) {
    return `Provider data is stale (observed ${snapshot.freshness.observedAt}); treat this route as partial and confirm externally.`;
  }

  return snapshot.freshness.observedAt
    ? `Provider data observed ${snapshot.freshness.observedAt}; final price and availability still require provider confirmation.`
    : "Provider returned no observation timestamp; treat route data as partial and confirm externally.";
}

function buildRouteOptions(
  intent: TripIntent,
  providerSnapshot: RouteProviderSnapshot
): RouteOption[] {
  const ranked = [...providerSnapshot.destinations]
    .sort((a, b) => scoreDestination(b, intent) - scoreDestination(a, intent))
    .slice(0, 6);

  const sequences = buildDestinationSequences(ranked, intent.maxStops)
    .sort((a, b) => scoreSequence(b, intent) - scoreSequence(a, intent))
    .slice(0, 4);

  return sequences.map((routeDestinations, index) => {
    const primary = routeDestinations[0];
    const stops = [makeOriginStop(intent), ...routeDestinations.map(makeDestinationStop)];
    const costBreakdown = createFixtureCostBreakdown(intent, routeDestinations);

    return {
      id: createId("route"),
      title: createTitle(routeDestinations, intent),
      tagline: stops.map((stop) => stop.code).join(" -> "),
      vibe: intent.vibe,
      promotedStopId: routeDestinations[0].id,
      score: Math.round(scoreSequence(routeDestinations, intent)),
      confidence: Number(
        Math.min(0.96, Math.max(0.48, 0.76 - index * 0.06 + intent.wishTags.length * 0.03)).toFixed(2)
      ),
      estimatedCostUsd: costBreakdown.total,
      costBreakdown,
      estimateStatus: "planning_estimate",
      availabilityStatus: "external_search_required",
      dataFreshness: describeFreshness(providerSnapshot),
      dataSource: {
        providerId: providerSnapshot.providerId,
        fallbackProviderId: providerSnapshot.fallbackProviderId,
        mode: providerSnapshot.mode,
        status: providerSnapshot.status,
        checkedAt: providerSnapshot.checkedAt,
        latencyMs: providerSnapshot.latencyMs,
        freshness: providerSnapshot.freshness,
        assumptions: [...providerSnapshot.assumptions]
      },
      disclaimer: PLANNING_ESTIMATE_DISCLAIMER,
      reasons: createReasons(routeDestinations, intent),
      wishTags: Array.from(new Set(routeDestinations.flatMap((stop) => stop.tags))).filter((tag) =>
        intent.wishTags.length ? intent.wishTags.includes(tag) : true
      ),
      stops,
      bookingLinks: buildBookingLinks(stops)
    };
  });
}

export function createTripGeneration(
  intent: TripIntent,
  providerSnapshot: RouteProviderSnapshot = {
    ...createFixtureProviderPayload(),
    providerId: "wild-route-destination-fixtures",
    mode: "fixture",
    checkedAt: new Date().toISOString(),
    latencyMs: 0,
    fallbackProviderId: null
  }
): TripGeneration {
  return {
    id: createId("generation"),
    createdAt: new Date().toISOString(),
    tripIntent: intent,
    routes: buildRouteOptions(intent, providerSnapshot)
  };
}
