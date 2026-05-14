"use client";

import { useEffect, useState } from "react";

import { wishTags } from "@/lib/site";
import type { BudgetMode, TripIntent, WishTag } from "@/lib/types";

type PlannerFormValues = {
  prompt: string;
  origin: string;
  tripLengthDays: number;
  maxStops: number;
  wishTags: WishTag[];
  budgetMode: BudgetMode;
};

type PlannerFormProps = {
  initialIntent: TripIntent;
  onChange: (values: Omit<PlannerFormValues, "prompt">) => void;
};

const maxStopOptions = [
  { value: 0, label: "Direct", hint: "0 hops" },
  { value: 1, label: "1 Stop", hint: "1 hop" },
  { value: 2, label: "2 Stops", hint: "2 hops" },
] as const;

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
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PlannerForm({ initialIntent, onChange }: PlannerFormProps) {
  const [origin, setOrigin] = useState(initialIntent.origin.label);
  const [tripLengthDays, setTripLengthDays] = useState(initialIntent.tripLengthDays);
  const [maxStops, setMaxStops] = useState(initialIntent.maxStops);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(initialIntent.budgetMode);
  const [selectedTags, setSelectedTags] = useState<WishTag[]>(initialIntent.wishTags);

  useEffect(() => {
    setOrigin(initialIntent.origin.label);
    setTripLengthDays(initialIntent.tripLengthDays);
    setMaxStops(initialIntent.maxStops);
    setBudgetMode(initialIntent.budgetMode);
    setSelectedTags(initialIntent.wishTags);
  }, [initialIntent]);

  useEffect(() => {
    onChange({
      origin,
      tripLengthDays,
      maxStops,
      wishTags: selectedTags,
      budgetMode
    });
  }, [origin, tripLengthDays, maxStops, selectedTags, budgetMode, onChange]);

  function toggleTag(tag: WishTag) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  return (
    <div className="planner-form planner-form-hud">
      <div className="planner-grid planner-grid-hud">
        <label className="field field-hud field-span-2">
          <span>Origin</span>
          <input value={origin} onChange={(event) => setOrigin(event.target.value)} />
        </label>

        <label className="field field-hud">
          <span>Trip length</span>
          <div className="field-number-shell">
            <input
              min={4}
              max={30}
              type="number"
              value={tripLengthDays}
              onChange={(event) => setTripLengthDays(Number(event.target.value))}
            />
            <small>days</small>
          </div>
        </label>

        <div className="field field-hud">
          <span>Max stops</span>
          <div className="segment-grid">
            {maxStopOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  maxStops === option.value
                    ? "segment-chip segment-chip-active"
                    : "segment-chip"
                }
                onClick={() => setMaxStops(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="field field-hud field-span-2">
          <span>Budget posture</span>
          <div className="segment-grid segment-grid-triple">
            {budgetModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  budgetMode === option.value
                    ? "segment-chip segment-chip-active"
                    : "segment-chip"
                }
                onClick={() => setBudgetMode(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field field-hud">
        <span>Trip wishes</span>
        <div className="wish-grid">
          {wishTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={selectedTags.includes(tag) ? "wish-chip wish-chip-active" : "wish-chip"}
              onClick={() => toggleTag(tag)}
            >
              {formatWishLabel(tag)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
