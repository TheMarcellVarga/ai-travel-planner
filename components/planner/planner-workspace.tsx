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
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prompt, setPrompt] = useState(initialGeneration.tripIntent.prompt);
  const [secondaryValues, setSecondaryValues] = useState({
    origin: initialGeneration.tripIntent.origin.label,
    tripLengthDays: initialGeneration.tripIntent.tripLengthDays,
    maxStops: initialGeneration.tripIntent.maxStops,
    wishTags: initialGeneration.tripIntent.wishTags,
    budgetMode: initialGeneration.tripIntent.budgetMode
  });

  const activeRoute = generation.routes.find((route) => route.id === activeRouteId) ?? null;
  const promotedStop = activeRoute?.stops.find((stop) => stop.id === activeRoute.promotedStopId);
  const promotedMedia = getDestinationMedia(promotedStop?.id ?? "bali");
  const destinationStops = useMemo(
    () => activeRoute?.stops.filter((stop) => stop.kind === "destination") ?? [],
    [activeRoute]
  );
  const recommendationCountLabel =
    generation.routes.length === 1
      ? "1 route ready"
      : `${generation.routes.length} routes ready`;

  function handlePlan() {
    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch("/api/trips/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          ...secondaryValues
        })
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
      setActiveRouteId(null);
    });
  }

  return (
    <main className="planner-command-shell planner-command-deck">
      <section className="planner-command-stage">
        <div className={activeRoute ? "planner-stage-header" : "planner-stage-header planner-stage-header-idle"}>
          <div className="planner-stage-title">
            <p className="eyebrow">{activeRoute ? "Active route" : "Recommendation sweep"}</p>
            <h1>{activeRoute ? activeRoute.title : "Spin the globe for pinned recommendations."}</h1>
          </div>
          <div className="planner-stage-badges">
            {activeRoute ? (
              <>
                <span className="status-pill">Confidence {Math.round(activeRoute.confidence * 100)}%</span>
                <span className="status-pill status-pill-accent">${activeRoute.estimatedCostUsd}</span>
              </>
            ) : (
              <>
                <span className="status-pill">{recommendationCountLabel}</span>
                <span className="status-pill status-pill-accent">Click a glowing pin to inspect</span>
              </>
            )}
          </div>
        </div>

        <div className="planner-stage-globe">
          <RouteGlobe
            routes={generation.routes}
            activeRouteId={activeRouteId}
            onSelectRoute={(routeId) => setActiveRouteId(routeId)}
          />
        </div>

        <aside className="floating-sidebar floating-sidebar-left floating-sidebar-left-planner">
          <div className="floating-sidebar__inner floating-sidebar__inner-planner">
            <div className="floating-sidebar__header">
              <p className="eyebrow">Mission Parameters</p>
              <h2>Constraints</h2>
              <p className="muted-copy">
                Tune the technical rules for the route generation.
              </p>
            </div>

            <PlannerForm initialIntent={generation.tripIntent} onChange={setSecondaryValues} />

            <section className="planner-intent-panel">
              <div className="planner-intent-panel__header">
                <p className="eyebrow">Strategic Intent</p>
                <p className="muted-copy">Describe the trip you want generated.</p>
              </div>
              <div className="planner-intent-panel__input-wrap">
                <textarea
                  className="planner-intent-panel__textarea"
                  placeholder="Describe your perfect one-way adventure..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <button
                className="button planner-intent-panel__button"
                onClick={handlePlan}
                disabled={isPending}
              >
                {isPending ? "Calculating..." : "Generate Route Hunt"}
              </button>
              {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
            </section>
          </div>
        </aside>

        {activeRoute ? (
          <aside className="floating-sidebar floating-sidebar-right">
            <div className="floating-sidebar__inner floating-sidebar__inner-tight">
              <div className="route-inspector__media">
                <img alt={promotedMedia.alt} className="route-inspector__image" src={promotedMedia.src} />
                <div className="route-inspector__overlay" />
                <div className="route-inspector__copy">
                  <p className="eyebrow">Target stop</p>
                  <strong>{promotedStop?.name}</strong>
                  <span>{promotedMedia.punchline}</span>
                </div>
              </div>

              <div className="route-inspector__section">
                <p className="eyebrow">Route path</p>
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
                <p className="eyebrow">Leg order</p>
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
        ) : null}
      </section>

      {activeRoute ? (
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
      ) : null}
    </main>
  );
}
