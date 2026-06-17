"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { PlannerForm } from "@/components/planner/planner-form";
import { RouteActions } from "@/components/planner/route-actions";
import { RouteGlobe } from "@/components/planner/route-globe";
import { getDestinationMedia } from "@/lib/media";
import type { PersistenceStatus } from "@/lib/store/persistence";
import type { RouteOption, TripGeneration } from "@/lib/types";

type PlannerWorkspaceProps = {
  initialGeneration: TripGeneration;
};

type PlannerApiResponse = {
  generationId: string;
  tripIntent: TripGeneration["tripIntent"];
  routes: RouteOption[];
  persistence?: PersistenceStatus;
};

export function PlannerWorkspace({ initialGeneration }: PlannerWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const [generation, setGeneration] = useState(initialGeneration);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus | null>(null);
  const [isMissionPanelOpen, setIsMissionPanelOpen] = useState(false);

  const [prompt, setPrompt] = useState(initialGeneration.tripIntent.prompt);
  const [secondaryValues, setSecondaryValues] = useState({
    origin: initialGeneration.tripIntent.origin.label,
    tripLengthDays: initialGeneration.tripIntent.tripLengthDays,
    maxStops: initialGeneration.tripIntent.maxStops,
    wishTags: initialGeneration.tripIntent.wishTags,
    budgetMode: initialGeneration.tripIntent.budgetMode,
  });

  const activeRoute =
    generation.routes.find((route) => route.id === activeRouteId) ?? null;
  const promotedStop = activeRoute?.stops.find(
    (stop) => stop.id === activeRoute.promotedStopId,
  );
  const promotedMedia = getDestinationMedia(promotedStop?.id ?? "bali");
  const destinationStops = useMemo(
    () =>
      activeRoute?.stops.filter((stop) => stop.kind === "destination") ?? [],
    [activeRoute],
  );
  const inspectorWishTags = activeRoute?.wishTags.slice(0, 3) ?? [];
  const inspectorWishOverflow = Math.max(
    0,
    (activeRoute?.wishTags.length ?? 0) - inspectorWishTags.length,
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
          ...secondaryValues,
        }),
      });

      if (!response.ok) {
        setErrorMessage(
          "Route generation failed. Try adjusting the prompt or selected wishes.",
        );
        return;
      }

      const payload = (await response.json()) as PlannerApiResponse;
      setGeneration({
        id: payload.generationId,
        createdAt: new Date().toISOString(),
        tripIntent: payload.tripIntent,
        routes: payload.routes,
      });
      setPersistenceStatus(payload.persistence ?? null);
      setActiveRouteId(null);
      setIsMissionPanelOpen(false);
    });
  }

  return (
    <main className="planner-command-shell route-studio">
      <section className="route-studio__layout">
        <header className="route-studio__summary">
          <p className="route-studio__kicker">
            {activeRoute ? "Selected route" : "Route composition"}
          </p>
          <h1>{activeRoute ? activeRoute.title : "Choose a direction."}</h1>
          <p className="route-studio__summary-copy">
            {activeRoute
              ? activeRoute.tagline
              : "Choose a route from the globe or the considered set below."}
          </p>
          <div className="route-studio__metrics">
            <span>
              {activeRoute
                ? `${Math.round(activeRoute.confidence * 100)}% confidence`
                : recommendationCountLabel}
            </span>
            <strong>
              {activeRoute ? `$${activeRoute.estimatedCostUsd}` : "ready"}
            </strong>
          </div>
        </header>

        <div className="route-studio__globe">
          <RouteGlobe
            routes={generation.routes}
            activeRouteId={activeRouteId}
            onSelectRoute={(routeId) => {
              setActiveRouteId(routeId);
              setIsMissionPanelOpen(false);
            }}
          />
        </div>

        <section className="route-studio__dock" aria-label="Ranked route options">
          {generation.routes.map((route, index) => (
            <button
              key={route.id}
              type="button"
              className={
                route.id === activeRoute?.id
                  ? "route-studio__route route-studio__route--active"
                  : "route-studio__route"
              }
              onClick={() => {
                setActiveRouteId(route.id);
                setIsMissionPanelOpen(false);
              }}
            >
              <span className="route-studio__route-index">0{index + 1}</span>
              <strong>{route.title}</strong>
              <small>
                ${route.estimatedCostUsd} · {Math.round(route.confidence * 100)}%
              </small>
            </button>
          ))}
        </section>

        <aside
          className={
            isMissionPanelOpen
              ? "route-studio__controls route-studio__controls--open"
              : "route-studio__controls"
          }
        >
          <button
            className="route-studio__controls-toggle"
            aria-expanded={isMissionPanelOpen}
            onClick={() => setIsMissionPanelOpen((current) => !current)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" />
            <span>Route controls</span>
            <ChevronDown aria-hidden="true" />
          </button>

          {isMissionPanelOpen ? (
            <div className="route-studio__controls-body">
              <div className="route-studio__section-heading">
                <p>Route brief</p>
                <span>Adjust the shape of the journey, then compose a new set.</span>
              </div>
              <div className="route-studio__brief">
                <textarea
                  className="route-studio__prompt"
                  placeholder="Jungle riding, cold water, one dramatic stop, low friction transfers..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <button
                  className="route-studio__primary-action"
                  onClick={handlePlan}
                  disabled={isPending}
                >
                  {isPending ? "Composing..." : "Compose new routes"}
                </button>
                {errorMessage ? (
                  <p className="route-studio__error">{errorMessage}</p>
                ) : null}
                {persistenceStatus && !persistenceStatus.durable ? (
                  <p className="route-studio__notice">
                    Demo persistence: this route set is kept only for the current local app session.
                  </p>
                ) : null}
              </div>

              <PlannerForm
                initialIntent={generation.tripIntent}
                onChange={setSecondaryValues}
              />
            </div>
          ) : null}
        </aside>

        <aside className="route-studio__inspector">
          {activeRoute ? (
            <>
              <div className="route-studio__inspector-media">
                <Image
                  alt={promotedMedia.alt}
                  className="route-studio__inspector-image"
                  src={promotedMedia.src}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="route-studio__inspector-overlay" />
                <div className="route-studio__inspector-copy">
                  <p>Target stop</p>
                  <strong>{promotedStop?.name}</strong>
                  <span>{promotedMedia.punchline}</span>
                </div>
              </div>

              <section className="route-studio__inspector-section">
                <p className="route-studio__kicker">Route path</p>
                <p className="route-studio__path">{activeRoute.tagline}</p>
                <div className="route-studio__tags">
                  {inspectorWishTags.map((tag) => (
                    <span key={tag}>
                      {tag}
                    </span>
                  ))}
                  {inspectorWishOverflow > 0 ? (
                    <span>+{inspectorWishOverflow}</span>
                  ) : null}
                </div>
              </section>

              <section className="route-studio__inspector-section">
                <p className="route-studio__kicker">Leg order</p>
                <div className="route-studio__stops">
                  {destinationStops.map((stop) => (
                    <article key={stop.id}>
                      <strong>
                        {stop.name} ({stop.code})
                      </strong>
                      <span>{stop.scene}</span>
                    </article>
                  ))}
                </div>
              </section>

              <RouteActions routeId={activeRoute.id} />
            </>
          ) : (
            <div className="route-studio__inspector-empty">
              <p className="route-studio__kicker">Route detail</p>
              <strong>Select a route</strong>
              <span>Route legs, travel wishes, and decision tools appear here.</span>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
