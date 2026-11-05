import type { BookingLink, RouteStop } from "@/lib/types";

const EXTERNAL_SEARCH_DISCLAIMER =
  "External provider search only. Final price and availability are confirmed by the provider, not Wild Route.";

function toQuery(value: string) {
  return encodeURIComponent(value);
}

// Google Flights accepts a compact, URL-safe itinerary parameter. Dates are
// intentionally omitted: Google may suggest dates, which travelers must check.
export function buildGoogleFlightsUrl(stops: RouteStop[]): string | null {
  if (stops.length < 2 || stops.length > 5 || stops.some((stop) => !/^[A-Z]{3}$/.test(stop.code))) return null;
  const bytes: number[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = Array.from(stops[i].code, (char) => char.charCodeAt(0));
    const to = Array.from(stops[i + 1].code, (char) => char.charCodeAt(0));
    bytes.push(0x1a, 0x0e, 0x6a, 0x05, 0x12, 0x03, ...from, 0x72, 0x05, 0x12, 0x03, ...to);
  }
  bytes.push(0x42, 0x01, 0x01, 0x48, 0x01, 0x98, 0x01, stops.length === 2 ? 0x02 : 0x03);
  const itinerary = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `https://www.google.com/travel/flights?tfs=${itinerary}`;
}

export function buildBookingLinks(stops: RouteStop[]): BookingLink[] {
  const routeName = stops.map((stop) => stop.code).join("-");
  const destinationStops = stops.filter((stop) => stop.kind === "destination");

  const routeLink: BookingLink = {
    id: `route-${routeName}`,
    provider: "Google Flights",
    label: "Search full route in Google Flights",
    url: buildGoogleFlightsUrl(stops) ?? `https://www.google.com/travel/flights?q=${toQuery(
      `Flights ${stops.map((stop) => stop.code).join(" to ")}`
    )}`,
    kind: "route",
    status: "external_search",
    disclaimer: EXTERNAL_SEARCH_DISCLAIMER
  };

  const legLinks = stops.slice(0, -1).map((previous, index) => {
    const next = stops[index + 1];
    return {
      id: `${previous.code}-${next.code}-flight`,
      provider: "Google Flights",
      label: `${previous.code} to ${next.code}`,
      url: `https://www.google.com/travel/flights?q=${toQuery(
        `Flights ${previous.code} to ${next.code}`
      )}`,
      kind: "leg" as const,
      status: "external_search" as const,
      disclaimer: EXTERNAL_SEARCH_DISCLAIMER
    };
  });

  const stayLinks = destinationStops.map((stop) => ({
    id: `${stop.code}-stay`,
    provider: "Booking.com",
    label: `Stay in ${stop.name}`,
    url: `https://www.booking.com/searchresults.html?ss=${toQuery(stop.name)}`,
    kind: "stay" as const,
    status: "external_search" as const,
    disclaimer: EXTERNAL_SEARCH_DISCLAIMER
  }));

  return [routeLink, ...legLinks, ...stayLinks];
}
