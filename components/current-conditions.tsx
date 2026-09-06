"use client";

import { useEffect, useState } from "react";

import type { CurrentConditions as CurrentConditionsData } from "@/lib/travel-data/weather";

type CurrentConditionsProps = {
  latitude: number;
  longitude: number;
  compact?: boolean;
  initialConditions?: CurrentConditionsData | null;
};

export function CurrentConditions({
  latitude,
  longitude,
  compact = false,
  initialConditions = null
}: CurrentConditionsProps) {
  const [conditions, setConditions] = useState<CurrentConditionsData | null>(initialConditions);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (initialConditions) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });

    fetch(`/api/weather/current?${query}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: CurrentConditionsData) => setConditions(payload))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setUnavailable(true);
        }
      });

    return () => controller.abort();
  }, [initialConditions, latitude, longitude]);

  if (unavailable) {
    return <span>Weather unavailable</span>;
  }

  if (!conditions) {
    return <span>Checking weather…</span>;
  }

  if (compact) {
    return (
      <span title={`Observed ${conditions.observedAt} via Open-Meteo`}>
        {Math.round(conditions.temperature)}{conditions.temperatureUnit} · {conditions.summary}
      </span>
    );
  }

  return (
    <div>
      <p>
        <strong>{Math.round(conditions.temperature)}{conditions.temperatureUnit}</strong>
        {" · "}{conditions.summary}{" · feels like "}
        {Math.round(conditions.apparentTemperature)}{conditions.temperatureUnit}
      </p>
      <p>
        Wind {Math.round(conditions.windSpeed)} {conditions.windSpeedUnit} · precipitation {conditions.precipitation} {conditions.precipitationUnit}
      </p>
      <small>
        Current model conditions observed {conditions.observedAt}. Source: {" "}
        <a href={conditions.sourceUrl} target="_blank" rel="noreferrer">Open-Meteo</a>.
        Weather is context, not a safety or feasibility assessment.
      </small>
    </div>
  );
}
