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
  onSubmit: (values: PlannerFormValues) => void;
  pending: boolean;
};

export function PlannerForm({ initialIntent, onSubmit, pending }: PlannerFormProps) {
  const [prompt, setPrompt] = useState(initialIntent.prompt);
  const [origin, setOrigin] = useState(initialIntent.origin.label);
  const [tripLengthDays, setTripLengthDays] = useState(initialIntent.tripLengthDays);
  const [maxStops, setMaxStops] = useState(initialIntent.maxStops);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(initialIntent.budgetMode);
  const [selectedTags, setSelectedTags] = useState<WishTag[]>(initialIntent.wishTags);

  useEffect(() => {
    setPrompt(initialIntent.prompt);
    setOrigin(initialIntent.origin.label);
    setTripLengthDays(initialIntent.tripLengthDays);
    setMaxStops(initialIntent.maxStops);
    setBudgetMode(initialIntent.budgetMode);
    setSelectedTags(initialIntent.wishTags);
  }, [initialIntent]);

  function toggleTag(tag: WishTag) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      prompt,
      origin,
      tripLengthDays,
      maxStops,
      wishTags: selectedTags,
      budgetMode
    });
  }

  return (
    <form className="planner-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Prompt</span>
        <textarea
          rows={5}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Find a one-way jungle-heavy route from Singapore with hiking and a crypto-friendly stop."
        />
      </label>

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

      <div className="planner-submit">
        <div>
          <p className="eyebrow">Free plan</p>
          <p className="muted-copy">One promoted stop per route. Publish and save come in later feature commits.</p>
        </div>
        <button className="button" disabled={pending} type="submit">
          {pending ? "Generating..." : "Generate Route Hunt"}
        </button>
      </div>
    </form>
  );
}

