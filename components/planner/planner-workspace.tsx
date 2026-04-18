"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { PlannerForm } from "@/components/planner/planner-form";
import { RouteActions } from "@/components/planner/route-actions";
import { RouteGlobe } from "@/components/planner/route-globe";
import { RouteMapFallback } from "@/components/planner/route-map-fallback";
import type { RouteOption, TripGeneration } from "@/lib/types";

type PlannerWorkspaceProps = {
  initialGeneration: TripGeneration;
};

type PlannerApiResponse = {
  generationId: string;
  tripIntent: TripGeneration["tripIntent"];
  routes: RouteOption[];
};

export function PlannerWorkspace({ initialGeneration }: PlannerWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const [generation, setGeneration] = useState(initialGeneration);
  const [activeRouteId, setActiveRouteId] = useState(initialGeneration.routes[0]?.id ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRoute =
    generation.routes.find((route) => route.id === activeRouteId) ?? generation.routes[0];

  function handlePlan(values: {
    prompt: string;
    origin: string;
    tripLengthDays: number;
    maxStops: number;
    wishTags: string[];
    budgetMode: string;
  }) {
    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch("/api/trips/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        setErrorMessage("Route generation failed. Try adjusting the prompt or selected wishes.");
        return;
      }

      const payload = (await response.json()) as PlannerApiResponse;
      setGeneration({
        id: payload.generationId,
        createdAt: new Date().toISOString(),
        tripIntent: payload.tripIntent,
        routes: payload.routes
      });
      setActiveRouteId(payload.routes[0]?.id ?? "");
    });
  }

  return (
    <main className="shell planner-shell">
      <section className="planner-panel">
        <div className="section-heading">
          <p className="eyebrow">Planner workspace</p>
          <h1>Turn a travel prompt into ranked one-way route hunts.</h1>
        </div>
        <p className="lede">
          The current build uses real place data and live-style booking handoff links,
          with app-side route scoring tuned for adventure nomads.
        </p>
        <PlannerForm initialIntent={generation.tripIntent} onSubmit={handlePlan} pending={isPending} />
        {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
      </section>

      <section className="visual-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Live route visualizer</p>
            <h2>{activeRoute.title}</h2>
          </div>
          <span className="status-pill">Confidence {Math.round(activeRoute.confidence * 100)}%</span>
        </div>

        <div className="globe-desktop">
          <RouteGlobe route={activeRoute} />
        </div>
        <div className="map-mobile">
          <RouteMapFallback route={activeRoute} />
        </div>

        <article className="focus-card">
          <p className="eyebrow">Promoted stop</p>
          <strong>
            {activeRoute.stops.find((stop) => stop.id === activeRoute.promotedStopId)?.name}
          </strong>
          <span>{activeRoute.reasons[2]}</span>
        </article>
      </section>

      <section className="results-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Ranked route options</p>
            <h2>{generation.routes.length} routes ready</h2>
          </div>
          <Link href={`/api/trips/${generation.id}`} className="button button-ghost">
            Inspect JSON
          </Link>
        </div>

        <div className="results-grid">
          {generation.routes.map((route) => (
            <article
              className={route.id === activeRoute.id ? "route-card route-card-active" : "route-card"}
              key={route.id}
            >
              <div className="route-card-top">
                <div>
                  <p className="eyebrow">Route option</p>
                  <h3>{route.title}</h3>
                </div>
                <span className="route-price">${route.estimatedCostUsd}</span>
              </div>

              <p className="route-tagline">{route.tagline}</p>
              <button className="button button-ghost route-select" onClick={() => setActiveRouteId(route.id)} type="button">
                {route.id === activeRoute.id ? "Active Route" : "Preview Route"}
              </button>
              <div className="route-chip-row">
                {route.wishTags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
              <ul className="reason-list">
                {route.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <RouteActions routeId={route.id} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
