"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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
  const isMissionPanelExpanded = isMissionPanelOpen;
  const missionPanelShellClass = isMissionPanelExpanded
    ? "floating-sidebar floating-sidebar-left floating-sidebar-left-planner planner-mission-panel-shell planner-mission-panel-shell-open"
    : "floating-sidebar floating-sidebar-left floating-sidebar-left-planner planner-mission-panel-shell planner-mission-panel-shell-docked";
  const plannerStageClassName = [
    "planner-command-stage",
    isMissionPanelExpanded
      ? "planner-command-stage-mission-open"
      : "planner-command-stage-mission-docked",
    activeRoute
      ? "planner-command-stage-route-active"
      : "planner-command-stage-route-idle",
  ].join(" ");

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
      setActiveRouteId(null);
      setIsMissionPanelOpen(false);
    });
  }

  return (
    <main className="planner-command-shell planner-command-deck">
      <section className={plannerStageClassName}>
        <div
          className={
            activeRoute
              ? "planner-stage-header planner-stage-header-active"
              : "planner-stage-header planner-stage-header-idle"
          }
        >
          <div className="planner-stage-title">
            <p className="eyebrow">
              {activeRoute ? "Active route" : "Orbital planner"}
            </p>
            <h1>
              {activeRoute
                ? activeRoute.title
                : "Pick a signal."}
            </h1>
            <p className="planner-stage-subcopy">
              {activeRoute
                ? activeRoute.tagline
                : "The globe stays primary. Open the mission console only when you need to tune the sweep."}
            </p>
          </div>
          <div className="planner-stage-badges">
            {activeRoute ? (
              <>
                <span className="status-pill">
                  Confidence {Math.round(activeRoute.confidence * 100)}%
                </span>
                <span className="status-pill status-pill-accent">
                  ${activeRoute.estimatedCostUsd}
                </span>
              </>
            ) : (
              <>
                <span className="status-pill">{recommendationCountLabel}</span>
                <span className="status-pill status-pill-accent">Tap a pulse</span>
              </>
            )}
          </div>
        </div>

        <div className="planner-stage-globe">
          <RouteGlobe
            routes={generation.routes}
            activeRouteId={activeRouteId}
            onSelectRoute={(routeId) => {
              setActiveRouteId(routeId);
              setIsMissionPanelOpen(false);
            }}
          />
        </div>

        <aside className={missionPanelShellClass}>
          <div className="floating-sidebar__inner floating-sidebar__inner-planner planner-mission-panel">
            <button
              className="planner-mission-panel__toggle"
              aria-expanded={isMissionPanelExpanded}
              aria-label="Toggle mission parameters"
              onClick={() => setIsMissionPanelOpen((current) => !current)}
              type="button"
            >
              <SlidersHorizontal
                className="planner-mission-panel__toggle-icon"
                aria-hidden="true"
              />
              <span>Mission Parameters</span>
              <ChevronDown
                className="planner-mission-panel__toggle-chevron"
                aria-hidden="true"
              />
            </button>

            <div className="planner-mission-panel__body">
              <div className="floating-sidebar__header">
                <p className="eyebrow">Mission Parameters</p>
                <h2>Constraints</h2>
                <p className="muted-copy">Tune the sweep, then launch.</p>
              </div>

              <PlannerForm
                initialIntent={generation.tripIntent}
                onChange={setSecondaryValues}
              />

              <div className="planner-mission-panel__brief">
                <div className="planner-mission-panel__brief-copy">
                  <p className="eyebrow">Route Brief</p>
                </div>
                <textarea
                  className="planner-mission-panel__prompt"
                  placeholder="Jungle riding, cold water, one dramatic stop, low friction transfers..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={1}
                />
                <button
                  className="button planner-mission-panel__launch"
                  onClick={handlePlan}
                  disabled={isPending}
                >
                  {isPending ? "Calculating..." : "Generate Route Hunt"}
                </button>
                {errorMessage ? (
                  <p className="error-copy planner-mission-panel__error">
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        {activeRoute ? (
          <aside className="floating-sidebar floating-sidebar-right">
            <div className="floating-sidebar__inner floating-sidebar__inner-tight">
              <div className="route-inspector__media" style={{ position: "relative" }}>
                <Image
                  alt={promotedMedia.alt}
                  className="route-inspector__image"
                  src={promotedMedia.src}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                />
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
                  {inspectorWishTags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                  {inspectorWishOverflow > 0 ? (
                    <span className="tag-pill">+{inspectorWishOverflow}</span>
                  ) : null}
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
              className={
                route.id === activeRoute.id
                  ? "mobile-route-card mobile-route-card-active"
                  : "mobile-route-card"
              }
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
