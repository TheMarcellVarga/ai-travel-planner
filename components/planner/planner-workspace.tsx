"use client";

import { useMemo, useState, useTransition } from "react";

import { MediaCredit } from "@/components/media-credit";
import { PlannerForm } from "@/components/planner/planner-form";
import { RouteActions } from "@/components/planner/route-actions";
import { RouteGlobe } from "@/components/planner/route-globe";
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
    <main className="shell planner-command-deck">
      <section className="planner-command-stage">
        <div className="planner-stage-header">
          <div>
            <p className="eyebrow">Active route</p>
            <h1>{activeRoute.title}</h1>
          </div>
          <div className="planner-stage-badges">
            <span className="status-pill">Confidence {Math.round(activeRoute.confidence * 100)}%</span>
            <span className="status-pill status-pill-accent">${activeRoute.estimatedCostUsd}</span>
          </div>
        </div>

        <div className="planner-stage-globe">
          <RouteGlobe
            routes={generation.routes}
            activeRouteId={activeRoute.id}
            onSelectRoute={setActiveRouteId}
          />
        </div>

        <aside className="floating-sidebar floating-sidebar-left">
          <div className="floating-sidebar__inner">
            <div className="floating-sidebar__header">
              <p className="eyebrow">Prompt cockpit</p>
              <h2>Route brief</h2>
              <p className="muted-copy">
                Set the prompt on the left, then choose route cards directly on the globe.
              </p>
            </div>

            <PlannerForm initialIntent={generation.tripIntent} onSubmit={handlePlan} pending={isPending} />

            {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
          </div>
        </aside>

        <aside className="floating-sidebar floating-sidebar-right">
          <div className="floating-sidebar__inner floating-sidebar__inner-tight">
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
          </div>
        </aside>
      </section>

      <section className="planner-mobile-routebar">
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
      </section>
    </main>
  );
}
