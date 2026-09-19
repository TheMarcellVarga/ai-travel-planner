import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { CurrentConditions } from "@/components/current-conditions";
import type { CurrentConditions as CurrentConditionsData } from "@/lib/travel-data/weather";

const conditions: CurrentConditionsData = {
  observedAt: "2026-09-19T12:00",
  temperature: 24,
  temperatureUnit: "°C",
  apparentTemperature: 27,
  precipitation: 0,
  precipitationUnit: "mm",
  windSpeed: 12,
  windSpeedUnit: "km/h",
  summary: "Clear",
  source: "Open-Meteo",
  sourceUrl: "https://open-meteo.com/"
};

describe("CurrentConditions", () => {
  it("keeps the full weather hierarchy and provenance visible", () => {
    render(
      <CurrentConditions
        initialConditions={conditions}
        latitude={1.29}
        longitude={103.85}
      />
    );

    expect(screen.getByText("24").closest("p")).toHaveClass(
      "current-conditions__temperature"
    );
    expect(screen.getByText("Clear").closest("div")).toHaveClass(
      "current-conditions__summary"
    );
    expect(screen.getByText("Wind")).toBeInTheDocument();
    expect(screen.getByText("Precipitation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open-Meteo" })).toHaveAttribute(
      "href",
      conditions.sourceUrl
    );
    expect(screen.getByText(/Weather context only/)).toBeInTheDocument();
  });

  it("keeps the compact presentation single-line", () => {
    render(
      <CurrentConditions
        compact
        initialConditions={conditions}
        latitude={1.29}
        longitude={103.85}
      />
    );

    expect(screen.getByTitle(/Observed .* via Open-Meteo/)).toHaveClass(
      "current-conditions--compact"
    );
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.queryByText("Wind")).not.toBeInTheDocument();
  });
});
