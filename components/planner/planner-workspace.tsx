"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { PlannerForm } from "@/components/planner/planner-form";
import { CurrentConditions } from "@/components/current-conditions";
import { MediaCredit } from "@/components/media-credit";
import { ResilientImage } from "@/components/resilient-image";
import { RouteActions } from "@/components/planner/route-actions";
import { RouteGlobe } from "@/components/planner/route-globe";
import { RouteLoadingMark } from "@/components/planner/route-loading-mark";
import { defaultOrigin } from "@/lib/data/destinations";
import { getRouteStopMedia } from "@/lib/media";
import { hasProviderObservedPrice, routePriceLabel } from "@/lib/planner/display";
import type { PersistenceStatus } from "@/lib/store/persistence";
import type { RouteOption, TripGeneration } from "@/lib/types";

type PlannerWorkspaceProps = {
  initialGeneration: TripGeneration | null;
};

type PlannerApiResponse = {
  generationId: string;
  tripIntent: TripGeneration["tripIntent"];
  routes: RouteOption[];
  agentRun?: TripGeneration["agentRun"];
  persistence?: PersistenceStatus;
};

const EMPTY_PLANNER_INTENT: TripGeneration["tripIntent"] = {
  prompt: "",
  origin: defaultOrigin,
  routeType: "round_trip",
  tripLengthDays: 12,
  maxStops: 1,
  departureDate: null,
  wishTags: [],
  budgetMode: "balanced",
  vibe: "adventure",
  exclusions: []
};

export function PlannerWorkspace({ initialGeneration }: PlannerWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const [generation, setGeneration] = useState<TripGeneration | null>(initialGeneration);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(
    initialGeneration?.routes[0]?.id ?? null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus | null>(null);
  const [isMissionPanelOpen, setIsMissionPanelOpen] = useState(false);

  const [prompt, setPrompt] = useState(initialGeneration?.tripIntent.prompt ?? "");
  const initialIntent = initialGeneration?.tripIntent ?? EMPTY_PLANNER_INTENT;
  const [secondaryValues, setSecondaryValues] = useState({
    origin: initialIntent.origin.label,
    routeType: initialIntent.routeType,
    tripLengthDays: initialIntent.tripLengthDays,
    maxStops: initialIntent.maxStops,
    departureDate: initialIntent.departureDate ?? null,
    wishTags: initialIntent.wishTags,
    budgetMode: initialIntent.budgetMode,
  });

  const activeRoute =
    generation?.routes.find((route) => route.id === activeRouteId) ?? null;
  const promotedStop = activeRoute?.stops.find(
    (stop) => stop.id === activeRoute.promotedStopId,
  );
  const promotedMedia = getRouteStopMedia(promotedStop);
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
    generation?.routes.length === 1
      ? "1 route ready"
      : generation?.routes.length
        ? `${generation.routes.length} routes ready`
        : "No routes yet";

  useEffect(() => {
    // On a narrow screen the route result is the primary task. Keep the
    // long-form controls available without making them occupy the first scroll.
    if (window.matchMedia("(max-width: 760px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMissionPanelOpen(false);
    }
  }, []);

  function handlePlan() {
    startTransition(async () => {
      setErrorMessage(null);
      setStatusMessage("Composing a fresh route set…");

      try {
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
            response.status === 429
              ? "You have reached the planning limit for this preview. Try again later or sign in for a larger allowance."
              : "Route generation failed. Check the route brief and try again.",
          );
          setStatusMessage(null);
          return;
        }

        const payload = (await response.json()) as PlannerApiResponse;
        setGeneration({
          id: payload.generationId,
          createdAt: new Date().toISOString(),
          tripIntent: payload.tripIntent,
          routes: payload.routes,
          agentRun: payload.agentRun
        });
        setPersistenceStatus(payload.persistence ?? null);
        setActiveRouteId(payload.routes[0]?.id ?? null);
        setIsMissionPanelOpen(false);
        setStatusMessage(
          `${payload.routes.length} ${payload.routes.length === 1 ? "route" : "routes"} ready to inspect.`,
        );
      } catch {
        setErrorMessage(
          "We could not reach the route planner. Check your connection and try again.",
        );
        setStatusMessage(null);
      }
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
                ? `${Math.round(activeRoute.confidence * 100)}% app confidence`
                : recommendationCountLabel}
            </span>
            <strong>
              {activeRoute ? routePriceLabel(activeRoute) : "ready"}
            </strong>
          </div>
        </header>

        <div className="route-studio__globe">
          <RouteGlobe
            routes={generation?.routes ?? []}
            activeRouteId={activeRouteId}
            isComposing={isPending}
            onSelectRoute={(routeId) => {
              setActiveRouteId(routeId);
              setIsMissionPanelOpen(false);
            }}
          />
        </div>

        <section className="route-studio__dock" aria-label="Ranked route options">
          {(generation?.routes ?? []).map((route, index) => (
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
              aria-pressed={route.id === activeRoute?.id}
            >
              <span className="route-studio__route-index">0{index + 1}</span>
              <strong>{route.title}</strong>
              <small>
                {routePriceLabel(route)} / {Math.round(route.confidence * 100)}% app fit
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
              {isPending ? (
                <div className="route-composition-loading route-composition-loading--panel" aria-hidden="true">
                  <RouteLoadingMark />
                  <strong>Composing route options</strong>
                  <span>Comparing stops, cost, and route rhythm.</span>
                </div>
              ) : (
                <>
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
                      aria-busy={isPending}
                    >
                      Compose new routes
                    </button>
                    <p className="route-studio__status" role="status" aria-live="polite">
                      {statusMessage}
                    </p>
                    {errorMessage ? (
                      <p className="route-studio__error" role="alert">{errorMessage}</p>
                    ) : null}
                    {persistenceStatus && !persistenceStatus.durable ? (
                      <p className="route-studio__notice">
                        Demo persistence: this route set is kept only for the current app instance and is not durable.
                      </p>
                    ) : null}
                  </div>

                  <PlannerForm
                    initialIntent={generation?.tripIntent ?? EMPTY_PLANNER_INTENT}
                    onChange={setSecondaryValues}
                  />
                </>
              )}
            </div>
          ) : null}
        </aside>

        <aside className="route-studio__inspector">
          {activeRoute ? (
            <>
              <div className="route-studio__inspector-media">
                <ResilientImage
                  alt={promotedMedia.alt}
                  className="route-studio__inspector-image"
                  src={promotedMedia.src}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="route-studio__inspector-overlay" />
                <div className="route-studio__inspector-copy">
                  <p>Target stop</p>
                  <strong>{promotedStop?.name}</strong>
                  <span>{promotedMedia.punchline}</span>
                </div>
              </div>
              <MediaCredit asset={promotedMedia} compact />

              <section className="route-studio__inspector-section route-studio__route-overview">
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

              {promotedStop ? (
                <section className="route-studio__inspector-section">
                  <p className="route-studio__kicker">Current conditions</p>
                  <CurrentConditions
                    latitude={promotedStop.coordinates.lat}
                    longitude={promotedStop.coordinates.lng}
                  />
                </section>
              ) : null}

              <details className="route-studio__inspector-details">
                <summary>
                  <span>Why this route</span>
                  <small>{activeRoute.reasons.length} signals</small>
                </summary>
                <div className="route-studio__inspector-details-body">
                  <div className="route-studio__reasons">
                    {activeRoute.reasons.slice(0, 3).map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                  </div>
                </div>
              </details>

              <details className="route-studio__inspector-details">
                <summary>
                  <span>Stops &amp; sources</span>
                  <small>{destinationStops.length} stops</small>
                </summary>
                <div className="route-studio__inspector-details-body">
                  <div className="route-studio__stops">
                    {destinationStops.map((stop) => (
                      <article key={stop.id}>
                        <ResilientImage
                          alt={getRouteStopMedia(stop).alt}
                          className="route-studio__stop-image"
                          src={getRouteStopMedia(stop).src}
                          width={52}
                          height={52}
                          unoptimized
                        />
                        <strong>
                          {stop.name} ({stop.code})
                        </strong>
                        <span>{stop.scene}</span>
                        <MediaCredit asset={getRouteStopMedia(stop)} compact />
                      </article>
                    ))}
                  </div>
                </div>
              </details>

              <section className="route-studio__inspector-section route-studio__cost-breakdown">
                <div className="route-studio__cost-header">
                  <p className="route-studio__kicker">Route cost</p>
                  <strong>{routePriceLabel(activeRoute)}</strong>
                </div>
                <p className="route-studio__cost-status">
                  {hasProviderObservedPrice(activeRoute)
                    ? "Provider-observed snapshot · confirm current availability"
                    : "No live fare or stay inventory was queried"}
                </p>
                <details className="route-studio__cost-details">
                  <summary>
                    {hasProviderObservedPrice(activeRoute)
                      ? "View observed cost breakdown"
                      : "View data status"}
                  </summary>
                  <div className="route-studio__cost-details-body">
                    {hasProviderObservedPrice(activeRoute) ? (
                      <div className="route-studio__cost-rows">
                        {activeRoute.costBreakdown.transport.map((leg) => (
                          <div key={`${leg.fromCode}-${leg.toCode}`}>
                            <span>{leg.fromCode} → {leg.toCode}</span>
                            <strong>${leg.amount}</strong>
                          </div>
                        ))}
                        {activeRoute.costBreakdown.stays.map((stay) => (
                          <div key={stay.stopId}>
                            <span>{stay.nights} nights · {stay.stopId}</span>
                            <strong>${stay.amount}</strong>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <p className="route-studio__cost-note">
                      Price status · {Array.from(new Set(activeRoute.costBreakdown.transport.map((leg) => leg.status))).join(", ")}.
                      {activeRoute.costBreakdown.transport.some((leg) => leg.observedAt)
                        ? ` Observed ${activeRoute.costBreakdown.transport.find((leg) => leg.observedAt)?.observedAt}.`
                        : " No provider observation; live inventory was not queried."}
                    </p>
                    <ul className="route-studio__cost-assumptions">
                      {activeRoute.costBreakdown.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                    <div className="route-studio__estimate-note">
                      <p>
                        Wild Route shows planning estimates and app-side route confidence. External
                        providers own final price and availability.
                      </p>
                      {generation?.agentRun?.status === "fallback" ? (
                        <p role="status">
                          {generation.agentRun.mode === "model"
                            ? "Model composition was unavailable, so Wild Route used its deterministic route planner."
                            : "Route composition encountered an issue, so Wild Route used its deterministic fallback."}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </details>
              </section>

              <RouteActions
                routeId={activeRoute.id}
                route={activeRoute}
                tripIntent={generation?.tripIntent}
              />
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
