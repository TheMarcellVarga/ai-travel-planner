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
    <div className="planner-form">
      <div className="planner-grid">
        <label className="field">
          <span>Origin</span>
          <input value={origin} onChange={(event) => setOrigin(event.target.value)} />
        </label>

        <label className="field">
          <span>Trip length</span>
          <input
            min={4}
            max={30}
            type="number"
            value={tripLengthDays}
            onChange={(event) => setTripLengthDays(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>Max stops</span>
          <select value={maxStops} onChange={(event) => setMaxStops(Number(event.target.value))}>
            <option value={0}>Direct only</option>
            <option value={1}>Up to 1 stop</option>
            <option value={2}>Up to 2 stops</option>
          </select>
        </label>

        <label className="field">
          <span>Budget mode</span>
          <select
            value={budgetMode}
            onChange={(event) => setBudgetMode(event.target.value as BudgetMode)}
          >
            <option value="value">Value</option>
            <option value="balanced">Balanced</option>
            <option value="comfort">Comfort</option>
          </select>
        </label>
      </div>

      <div className="field">
        <span>Trip wishes</span>
        <div className="tag-row">
          {wishTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={selectedTags.includes(tag) ? "chip chip-active" : "chip"}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
