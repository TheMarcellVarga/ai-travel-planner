import { z } from "zod";

const openMeteoResponseSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    precipitation: z.number(),
    weather_code: z.number().int(),
    wind_speed_10m: z.number()
  }),
  current_units: z.object({
    temperature_2m: z.string(),
    apparent_temperature: z.string(),
    precipitation: z.string(),
    wind_speed_10m: z.string()
  })
});

export type CurrentConditions = {
  observedAt: string;
  temperature: number;
  temperatureUnit: string;
  apparentTemperature: number;
  precipitation: number;
  precipitationUnit: string;
  windSpeed: number;
  windSpeedUnit: string;
  summary: string;
  source: "Open-Meteo";
  sourceUrl: string;
};

function describeWeatherCode(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorms";
  return "Mixed conditions";
}

export async function getCurrentConditions(
  latitude: number,
  longitude: number
): Promise<CurrentConditions | null> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    timezone: "auto"
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "WildRoute/0.1 (+https://github.com/TheMarcellVarga/ai-travel-planner)"
      },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(3_500)
    });
    if (!response.ok) return null;

    const parsed = openMeteoResponseSchema.safeParse(await response.json());
    if (!parsed.success) return null;

    return {
      observedAt: parsed.data.current.time,
      temperature: parsed.data.current.temperature_2m,
      temperatureUnit: parsed.data.current_units.temperature_2m,
      apparentTemperature: parsed.data.current.apparent_temperature,
      precipitation: parsed.data.current.precipitation,
      precipitationUnit: parsed.data.current_units.precipitation,
      windSpeed: parsed.data.current.wind_speed_10m,
      windSpeedUnit: parsed.data.current_units.wind_speed_10m,
      summary: describeWeatherCode(parsed.data.current.weather_code),
      source: "Open-Meteo",
      sourceUrl: "https://open-meteo.com/"
    };
  } catch {
    return null;
  }
}
