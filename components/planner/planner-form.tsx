"use client";

import { useEffect, useState } from "react";

import { wishTags } from "@/lib/site";
import type { BudgetMode, RouteType, TripIntent, WishTag } from "@/lib/types";

type PlannerFormValues = {
  prompt: string;
  origin: string;
  routeType: RouteType;
  tripLengthDays: number;
  maxStops: number;
  departureDate: string | null;
  wishTags: WishTag[];
  budgetMode: BudgetMode;
};

type PlannerFormProps = {
  initialIntent: TripIntent;
  onChange: (values: Omit<PlannerFormValues, "prompt">) => void;
};

const maxStopOptions = [
  { value: 0, label: "Direct", hint: "0 hops" },
  { value: 1, label: "1 stop", hint: "1 hop" },
  { value: 2, label: "2 stops", hint: "2 hops" },
] as const;

const routeTypeOptions = [
  { value: "round_trip", label: "Round trip", hint: "return to origin" },
  { value: "one_way", label: "One-way", hint: "finish elsewhere" }
] as const satisfies ReadonlyArray<{ value: RouteType; label: string; hint: string }>;

const budgetModeOptions = [
  { value: "value", label: "Value", hint: "lean spend" },
  { value: "balanced", label: "Balanced", hint: "mixed play" },
  { value: "comfort", label: "Comfort", hint: "soft landings" },
] satisfies ReadonlyArray<{
  value: BudgetMode;
  label: string;
  hint: string;
}>;

function formatWishLabel(tag: WishTag) {
  return tag.replaceAll("-", " ");
}

export function PlannerForm({ initialIntent, onChange }: PlannerFormProps) {
  const [origin, setOrigin] = useState(initialIntent.origin.label);
  const [routeType, setRouteType] = useState<RouteType>(initialIntent.routeType);
  const [tripLengthDays, setTripLengthDays] = useState(initialIntent.tripLengthDays);
  const [maxStops, setMaxStops] = useState(initialIntent.maxStops);
  const [departureDate, setDepartureDate] = useState(initialIntent.departureDate ?? "");
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(initialIntent.budgetMode);
  const [selectedTags, setSelectedTags] = useState<WishTag[]>(initialIntent.wishTags);

  useEffect(() => {
    setOrigin(initialIntent.origin.label);
    setRouteType(initialIntent.routeType);
    setTripLengthDays(initialIntent.tripLengthDays);
    setMaxStops(initialIntent.maxStops);
    setDepartureDate(initialIntent.departureDate ?? "");
    setBudgetMode(initialIntent.budgetMode);
    setSelectedTags(initialIntent.wishTags);
  }, [initialIntent]);

  useEffect(() => {
    onChange({
      origin,
      routeType,
      tripLengthDays,
      maxStops,
      departureDate: departureDate || null,
      wishTags: selectedTags,
      budgetMode
    });
  }, [origin, routeType, tripLengthDays, maxStops, departureDate, selectedTags, budgetMode, onChange]);

  function toggleTag(tag: WishTag) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  return (
    <div className="route-studio-form">
      <div className="route-studio-form__grid">
        <label className="route-studio-form__field route-studio-form__field--wide" htmlFor="planner-origin">
          <span>Origin</span>
          <input
            id="planner-origin"
            value={origin}
            maxLength={80}
            onChange={(event) => setOrigin(event.target.value)}
          />
        </label>

        <label className="route-studio-form__field" htmlFor="planner-trip-length">
          <span>Trip length</span>
          <div className="route-studio-form__number">
            <input
              id="planner-trip-length"
              min={4}
              max={30}
              required
              type="number"
              value={tripLengthDays}
              onChange={(event) => {
                const nextValue = event.target.valueAsNumber;
                if (Number.isFinite(nextValue)) {
                  setTripLengthDays(Math.min(30, Math.max(4, nextValue)));
                }
              }}
            />
            <small>days</small>
          </div>
        </label>

        <label className="route-studio-form__field" htmlFor="planner-departure-date">
          <span>Departure date</span>
          <input
            id="planner-departure-date"
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            value={departureDate}
            onChange={(event) => setDepartureDate(event.target.value)}
          />
          <small>Optional · live price lookup needs a date</small>
        </label>

        <fieldset className="route-studio-form__field route-studio-form__fieldset">
          <legend>Route shape</legend>
          <div className="route-studio-form__segments route-studio-form__segments--stops">
            {routeTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  routeType === option.value
                    ? "route-studio-form__segment route-studio-form__segment--active"
                    : "route-studio-form__segment"
                }
                onClick={() => setRouteType(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="route-studio-form__field route-studio-form__fieldset">
          <legend>Max stops</legend>
          <div className="route-studio-form__segments route-studio-form__segments--stops">
            {maxStopOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  maxStops === option.value
                    ? "route-studio-form__segment route-studio-form__segment--active"
                    : "route-studio-form__segment"
                }
                onClick={() => setMaxStops(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="route-studio-form__field route-studio-form__field--wide route-studio-form__fieldset">
          <legend>Budget posture</legend>
          <div className="route-studio-form__segments route-studio-form__segments--budget">
            {budgetModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  budgetMode === option.value
                    ? "route-studio-form__segment route-studio-form__segment--active"
                    : "route-studio-form__segment"
                }
                onClick={() => setBudgetMode(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="route-studio-form__field route-studio-form__fieldset">
        <legend>Trip wishes</legend>
        <div className="route-studio-form__wishes">
          {wishTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={
                selectedTags.includes(tag)
                  ? "route-studio-form__wish route-studio-form__wish--active"
                  : "route-studio-form__wish"
              }
              onClick={() => toggleTag(tag)}
            >
              {formatWishLabel(tag)}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
