"use client";

import { useMemo, useState, useTransition } from "react";

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
  const destinationStops = useMemo(
    () => activeRoute.stops.filter((stop) => stop.kind === "destination"),
    [activeRoute]
  );

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
    <main className="shell planner-dashboard">
      <aside className="planner-sidebar">
        <div className="planner-sidebar__header">
          <p className="eyebrow">Prompt cockpit</p>
          <h1>Build the route from the left rail. Read the world from the center.</h1>
          <p className="lede">
            The globe is now the main interaction surface. Every route option lands on
            the earth as a selectable marker-card instead of living in a detached list.
          </p>
        </div>

        <PlannerForm initialIntent={generation.tripIntent} onSubmit={handlePlan} pending={isPending} />

        {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}

        <div className="planner-sidebar__meta">
          <div className="planner-meta-card">
            <p className="eyebrow">Current generation</p>
            <strong>{generation.routes.length} routes projected</strong>
            <span>{generation.tripIntent.origin.label} origin, {generation.tripIntent.tripLengthDays}-day window.</span>
          </div>
          <div className="planner-meta-card">
            <p className="eyebrow">Free plan</p>
            <strong>1 promoted stop</strong>
            <span>That promoted stop is the marker-card that leads the globe experience.</span>
          </div>
        </div>
      </aside>

      <section className="planner-main">
        <div className="planner-main__topbar">
          <div>
            <p className="eyebrow">Active route</p>
            <h2>{activeRoute.title}</h2>
          </div>
          <div className="planner-main__badges">
            <span className="status-pill">Confidence {Math.round(activeRoute.confidence * 100)}%</span>
            <span className="status-pill status-pill-accent">${activeRoute.estimatedCostUsd}</span>
          </div>
        </div>

        <div className="planner-main__layout">
          <section className="globe-stage-panel">
            <div className="globe-desktop globe-desktop-dashboard">
              <RouteGlobe
                routes={generation.routes}
                activeRouteId={activeRoute.id}
                onSelectRoute={setActiveRouteId}
              />
            </div>
            <div className="map-mobile">
              <RouteMapFallback route={activeRoute} />
            </div>
            <div className="mobile-route-strip">
              {generation.routes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  className={route.id === activeRoute.id ? "mobile-route-card mobile-route-card-active" : "mobile-route-card"}
                  onClick={() => setActiveRouteId(route.id)}
                >
                  <strong>{route.title}</strong>
                  <span>${route.estimatedCostUsd}</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="route-inspector">
            <div className="route-inspector__media">
              <img alt={promotedMedia.alt} className="route-inspector__image" src={promotedMedia.src} />
              <div className="route-inspector__overlay" />
              <div className="route-inspector__copy">
                <p className="eyebrow">Promoted stop</p>
                <strong>{promotedStop?.name}</strong>
                <span>{promotedMedia.punchline}</span>
              </div>
            </div>

            <div className="route-inspector__section">
              <p className="eyebrow">Route line</p>
              <p className="route-tagline">{activeRoute.tagline}</p>
              <div className="route-chip-row">
                {activeRoute.wishTags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="route-inspector__section">
              <p className="eyebrow">Why this route</p>
              <ul className="reason-list">
                {activeRoute.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>

            <div className="route-inspector__section">
              <p className="eyebrow">Stop order</p>
              <div className="stop-stack">
                {destinationStops.map((stop) => (
                  <article className="stop-card" key={stop.id}>
                    <strong>
                      {stop.name} ({stop.code})
                    </strong>
                    <span>{stop.scene}</span>
                  </article>
                ))}
              </div>
            </div>

            <MediaCredit asset={promotedMedia} compact />
            <RouteActions routeId={activeRoute.id} />
          </aside>
        </div>
      </section>
    </main>
  );
}
