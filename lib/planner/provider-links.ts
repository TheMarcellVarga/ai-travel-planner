import type { BookingLink, RouteStop } from "@/lib/types";

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
    kind: "route"
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
        kind: "leg" as const
      },
      {
        id: `${stop.code}-stay`,
        provider: "Booking.com",
        label: `Stay in ${stop.name}`,
        url: `https://www.booking.com/searchresults.html?ss=${toQuery(stop.name)}`,
        kind: "stay" as const
      }
    ];
  });

  return [routeLink, ...legLinks];
}

