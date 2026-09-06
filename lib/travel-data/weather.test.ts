import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentConditions } from "@/lib/travel-data/weather";

describe("getCurrentConditions", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes current Open-Meteo conditions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            current: {
              time: "2026-09-07T14:15",
              temperature_2m: 28.4,
              apparent_temperature: 31.2,
              precipitation: 0.2,
              weather_code: 61,
              wind_speed_10m: 12.7
            },
            current_units: {
              temperature_2m: "°C",
              apparent_temperature: "°C",
              precipitation: "mm",
              wind_speed_10m: "km/h"
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(getCurrentConditions(1.35, 103.82)).resolves.toMatchObject({
      temperature: 28.4,
      summary: "Rain",
      source: "Open-Meteo"
    });
  });

  it("returns null for unavailable or malformed data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(getCurrentConditions(1.35, 103.82)).resolves.toBeNull();
  });
});
