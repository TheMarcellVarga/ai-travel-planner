import type { BookingLink, RouteStop } from "@/lib/types";

const EXTERNAL_SEARCH_DISCLAIMER =
  "External provider search only. Final price and availability are confirmed by the provider, not Wild Route.";

function toQuery(value: string) {
  return encodeURIComponent(value);
}

export function buildBookingLinks(stops: RouteStop[]): BookingLink[] {
  const routeName = stops.map((stop) => stop.code).join("-");
  const destinationStops = stops.filter((stop) => stop.kind === "destination");

  const routeLink: BookingLink = {
    id: `route-${routeName}`,
    provider: "Google Flights",
    label: "Search full route in Google Flights",
    url: `https://www.google.com/travel/flights?q=${toQuery(
      `Flights ${stops[0]?.code} to ${destinationStops.map((stop) => stop.code).join(" ")}`
    )}`,
    kind: "route",
    status: "external_search",
    disclaimer: EXTERNAL_SEARCH_DISCLAIMER
  };

  const legLinks = destinationStops.flatMap((stop, index) => {
    const previous = stops[index];
    return [
      {
        id: `${previous.code}-${stop.code}-flight`,
        provider: "Google Flights",
        label: `${previous.code} to ${stop.code}`,
        url: `https://www.google.com/travel/flights?q=${toQuery(
          `Flights ${previous.code} to ${stop.code}`
        )}`,
        kind: "leg" as const,
        status: "external_search" as const,
        disclaimer: EXTERNAL_SEARCH_DISCLAIMER
      },
      {
        id: `${stop.code}-stay`,
        provider: "Booking.com",
        label: `Stay in ${stop.name}`,
        url: `https://www.booking.com/searchresults.html?ss=${toQuery(stop.name)}`,
        kind: "stay" as const,
        status: "external_search" as const,
        disclaimer: EXTERNAL_SEARCH_DISCLAIMER
      }
    ];
  });

  return [routeLink, ...legLinks];
}
