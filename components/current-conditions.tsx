"use client";

import React, { useEffect, useState } from "react";

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
    return (
      <span
        className={`current-conditions current-conditions--status${compact ? " current-conditions--compact" : ""}`}
        role="status"
        aria-live="polite"
      >
        Weather unavailable
      </span>
    );
  }

  if (!conditions) {
    return (
      <span
        className={`current-conditions current-conditions--status${compact ? " current-conditions--compact" : ""}`}
        role="status"
        aria-live="polite"
      >
        Checking weather…
      </span>
    );
  }

  if (compact) {
    return (
      <span className="current-conditions current-conditions--compact" title={`Observed ${conditions.observedAt} via ${conditions.source}`}>
        <strong>{Math.round(conditions.temperature)}{conditions.temperatureUnit}</strong>
        <span aria-hidden="true">·</span>
        <span>{conditions.summary}</span>
      </span>
    );
  }

  return (
    <div className="current-conditions">
      <div className="current-conditions__primary">
        <p className="current-conditions__temperature">
          <strong>{Math.round(conditions.temperature)}</strong>
          <span>{conditions.temperatureUnit}</span>
        </p>
        <div className="current-conditions__summary">
          <strong>{conditions.summary}</strong>
          <span>Feels like {Math.round(conditions.apparentTemperature)}{conditions.temperatureUnit}</span>
        </div>
      </div>

      <dl className="current-conditions__metrics">
        <div>
          <dt>Wind</dt>
          <dd>{Math.round(conditions.windSpeed)} {conditions.windSpeedUnit}</dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>{conditions.precipitation} {conditions.precipitationUnit}</dd>
        </div>
      </dl>

      <p className="current-conditions__source">
        Observed <time dateTime={conditions.observedAt}>{conditions.observedAt}</time>
        <span aria-hidden="true"> · </span>
        Source: <a href={conditions.sourceUrl} target="_blank" rel="noreferrer">{conditions.source}</a>
      </p>
      <p className="current-conditions__disclaimer">
        Weather context only — not a safety or feasibility assessment.
      </p>
    </div>
  );
}
