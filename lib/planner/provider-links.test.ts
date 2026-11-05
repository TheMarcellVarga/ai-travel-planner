import { describe, expect, it } from "vitest";
import { buildGoogleFlightsUrl } from "./provider-links";
import type { RouteStop } from "@/lib/types";

const stops = (...codes: string[]) => codes.map((code) => ({ code }) as RouteStop);

describe("Google Flights route link", () => {
  it("encodes the selected multi-city itinerary without invented dates", () => {
    expect(buildGoogleFlightsUrl(stops("SIN", "CNX", "DPS", "SIN"))).toBe(
      "https://www.google.com/travel/flights?tfs=Gg5qBRIDU0lOcgUSA0NOWBoOagUSA0NOWHIFEgNEUFMaDmoFEgNEUFNyBRIDU0lOQgEBSAGYAQM"
    );
  });
  it("does not construct a route for invalid airport codes", () => {
    expect(buildGoogleFlightsUrl(stops("SIN", "?"))).toBeNull();
  });
});
