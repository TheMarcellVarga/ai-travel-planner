"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { MediaCredit } from "@/components/media-credit";
import { PlannerForm } from "@/components/planner/planner-form";
import { RouteActions } from "@/components/planner/route-actions";
import { RouteGlobe } from "@/components/planner/route-globe";
import { RouteMapFallback } from "@/components/planner/route-map-fallback";
import { getDestinationMedia } from "@/lib/media";
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
  const promotedStop = activeRoute.stops.find((stop) => stop.id === activeRoute.promotedStopId);
  const promotedMedia = getDestinationMedia(promotedStop?.id ?? "bali");

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
          The build now uses real media-backed destination surfaces instead of treating
          route cards like plain text inventory.
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
          <div className="focus-media">
            <img alt={promotedMedia.alt} className="focus-media-image" src={promotedMedia.src} />
            <div className="focus-media-overlay" />
          </div>
          <p className="eyebrow">Promoted stop</p>
          <strong>{promotedStop?.name}</strong>
          <span>{promotedMedia.punchline}</span>
          <span>{activeRoute.reasons[2]}</span>
          <MediaCredit asset={promotedMedia} compact />
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
          {generation.routes.map((route) => {
            const routeMedia = getDestinationMedia(route.promotedStopId);

            return (
              <article
                className={route.id === activeRoute.id ? "route-card route-card-active" : "route-card"}
                key={route.id}
              >
                <div className="route-visual">
                  <img alt={routeMedia.alt} className="route-visual-image" src={routeMedia.src} />
                  <div className="route-visual-overlay" />
                  <div className="route-visual-copy">
                    <p className="eyebrow">Visual hook</p>
                    <strong>{routeMedia.location}</strong>
                  </div>
                </div>

                <div className="route-card-top">
                  <div>
                    <p className="eyebrow">Route option</p>
                    <h3>{route.title}</h3>
                  </div>
                  <span className="route-price">${route.estimatedCostUsd}</span>
                </div>

                <p className="route-tagline">{route.tagline}</p>
                <button
                  className="button button-ghost route-select"
                  onClick={() => setActiveRouteId(route.id)}
                  type="button"
                >
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
                <MediaCredit asset={routeMedia} compact />
                <RouteActions routeId={route.id} />
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
