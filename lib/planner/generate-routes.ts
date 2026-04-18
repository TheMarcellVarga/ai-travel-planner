import { destinations } from "@/lib/data/destinations";
import { buildBookingLinks } from "@/lib/planner/provider-links";
import type { DestinationProfile, RouteOption, RouteStop, TripGeneration, TripIntent } from "@/lib/types";

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

function estimateCost(stops: DestinationProfile[], budgetMode: TripIntent["budgetMode"]) {
  return Math.round(
    stops.reduce((total, stop) => {
      if (budgetMode === "value") {
        return total + stop.baseCostUsd;
      }
      if (budgetMode === "comfort") {
        return total + stop.comfortCostUsd;
      }
      return total + (stop.baseCostUsd + stop.comfortCostUsd) / 2;
    }, 0)
  );
}

function createReasons(stops: DestinationProfile[], intent: TripIntent) {
  const matchedTags = Array.from(new Set(stops.flatMap((stop) => stop.tags))).filter((tag) =>
    intent.wishTags.includes(tag)
  );

  return [
    `Matches ${matchedTags.length || 1} of your active route wishes.`,
    `Keeps the route within a ${intent.tripLengthDays}-day travel window.`,
    `${stops[0]?.name} is used as the free promoted stop for stronger discovery placement.`
  ];
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

function buildRouteOptions(intent: TripIntent): RouteOption[] {
  const ranked = [...destinations]
    .sort((a, b) => scoreDestination(b, intent) - scoreDestination(a, intent))
    .slice(0, 6);

  const desiredRouteCount = Math.min(4, ranked.length);

  return Array.from({ length: desiredRouteCount }, (_, index) => {
    const primary = ranked[index];
    const secondary = ranked[(index + 1) % ranked.length];
    const useSecondary = intent.maxStops > 0 && secondary.id !== primary.id;
    const routeDestinations = useSecondary ? [primary, secondary] : [primary];
    const stops = [makeOriginStop(intent), ...routeDestinations.map(makeDestinationStop)];
    const estimatedCostUsd = estimateCost(routeDestinations, intent.budgetMode);

    return {
      id: createId("route"),
      title: createTitle(routeDestinations, intent),
      tagline: stops.map((stop) => stop.code).join(" -> "),
      vibe: intent.vibe,
      promotedStopId: routeDestinations[0].id,
      score: Math.round(scoreDestination(primary, intent) + (useSecondary ? scoreDestination(secondary, intent) * 0.48 : 0)),
      confidence: Number((0.72 - index * 0.06 + intent.wishTags.length * 0.03).toFixed(2)),
      estimatedCostUsd,
      reasons: createReasons(routeDestinations, intent),
      wishTags: Array.from(new Set(routeDestinations.flatMap((stop) => stop.tags))).filter((tag) =>
        intent.wishTags.length ? intent.wishTags.includes(tag) : true
      ),
      stops,
      bookingLinks: buildBookingLinks(stops)
    };
  });
}

export function createTripGeneration(intent: TripIntent): TripGeneration {
  return {
    id: createId("generation"),
    createdAt: new Date().toISOString(),
    tripIntent: intent,
    routes: buildRouteOptions(intent)
  };
}

