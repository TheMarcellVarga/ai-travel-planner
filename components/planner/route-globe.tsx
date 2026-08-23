"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";

import { RouteLoadingMark } from "@/components/planner/route-loading-mark";
import type { RouteOption } from "@/lib/types";

type RouteGlobeProps = {
  routes: RouteOption[];
  activeRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  isComposing?: boolean;
};

type GlobeViewport = {
  width: number;
  height: number;
};

type GlobePoint = {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
  altitude: number;
  color: string;
  radius: number;
  kind: "route-marker" | "route-stop";
  title: string;
  subtitle: string;
  price?: number;
};

type GlobeArc = {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
};

type GlobeRing = {
  id: string;
  lat: number;
  lng: number;
  color: [string, string];
  maxRadius: number;
  propagationSpeed: number;
  repeatPeriod: number;
};

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false
}) as React.ComponentType<GlobeProps & { ref?: React.Ref<GlobeMethods | undefined> }>;

const GLOBE_TEXTURE_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg";
const GLOBE_BUMP_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png";
const GLOBE_ACCENT = "#d4ff00";
const GLOBE_SOFT = "#d8e9e1";

function canUseWebGL() {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

function buildTooltip(point: GlobePoint) {
  const accent = point.kind === "route-marker" ? GLOBE_ACCENT : GLOBE_SOFT;
  const price =
    point.price !== undefined
      ? `<div style="color:${accent};font-weight:800;font-size:13px;margin-top:4px">$${point.price}</div>`
      : "";

  return `
    <div style="min-width:180px;padding:10px 12px;border-radius:14px;background:rgba(6,15,10,0.94);border:1px solid rgba(255,255,255,0.1);box-shadow:0 18px 30px rgba(0,0,0,0.3);color:#edf8ef">
      <div style="font-weight:800;font-size:14px;line-height:1.2">${point.title}</div>
      <div style="margin-top:4px;color:#aac7b4;font-size:12px;line-height:1.35">${point.subtitle}</div>
      ${price}
    </div>
  `;
}

export function RouteGlobe({ routes, activeRouteId, onSelectRoute, isComposing = false }: RouteGlobeProps) {
  const [viewport, setViewport] = useState<GlobeViewport>({ width: 920, height: 920 });
  const [globeReady, setGlobeReady] = useState(false);
  const [globeTimedOut, setGlobeTimedOut] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [idleHighlightIndex, setIdleHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const compactViewport = viewport.width < 1440 || viewport.height < 820;
  const globeWidth = viewport.width;
  const globeHeight = viewport.height;

  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? null;
  const idleRecommendation = routes[idleHighlightIndex % Math.max(routes.length, 1)] ?? null;
  const statusRoute = activeRoute ?? idleRecommendation ?? routes[0] ?? null;
  const isIdle = activeRoute === null;
  const promotedStop =
    activeRoute
      ? activeRoute.stops.find((stop) => stop.id === activeRoute.promotedStopId) ??
        activeRoute.stops[1] ??
        activeRoute.stops[0]
      : null;

  useEffect(() => {
    const current = containerRef.current;
    if (!current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(320, Math.floor(entry.contentRect.height))
      });
    });

    observer.observe(current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setWebGlAvailable(canUseWebGL());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timeout = window.setTimeout(() => {
      setPrefersReducedMotion(mediaQuery.matches);
    }, 0);

    function handleMotionPreferenceChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleMotionPreferenceChange);
    return () => {
      window.clearTimeout(timeout);
      mediaQuery.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);

  useEffect(() => {
    if (globeReady) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setGlobeTimedOut(true);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [globeReady, routes]);

  useEffect(() => {
    if (!globeReady || !globeRef.current) {
      return;
    }

    const controls = globeRef.current.controls();
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = compactViewport ? 200 : 180;
    controls.maxDistance = compactViewport ? 520 : 420;
    controls.rotateSpeed = isIdle ? 0.35 : 0.9;
    controls.zoomSpeed = 0.8;
    controls.autoRotate = isIdle && !prefersReducedMotion;
    controls.autoRotateSpeed = 0.65;
  }, [compactViewport, globeReady, isIdle, prefersReducedMotion, viewport.height, viewport.width]);

  useEffect(() => {
    if (!globeReady || !globeRef.current) {
      return;
    }

    if (isIdle) {
      globeRef.current.pointOfView(
        {
          lat: 12,
          lng: 18,
          altitude: compactViewport ? 2.55 : 2.35
        },
        prefersReducedMotion ? 0 : 1000
      );
      return;
    }

    if (!promotedStop) {
      return;
    }

    globeRef.current.pointOfView(
      {
        lat: promotedStop.coordinates.lat,
        lng: promotedStop.coordinates.lng,
        altitude: compactViewport ? 2.2 : 1.85
      },
      prefersReducedMotion ? 0 : 1000
    );
  }, [compactViewport, globeReady, isIdle, prefersReducedMotion, promotedStop]);

  useEffect(() => {
    if (!isIdle) {
      return;
    }

    const interval = window.setInterval(() => {
      setIdleHighlightIndex((current) => {
        if (routes.length <= 1) {
          return 0;
        }

        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * routes.length);
        }

        return next;
      });
    }, 2600);

    return () => window.clearInterval(interval);
  }, [isIdle, routes.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdleHighlightIndex(0);
  }, [routes]);

  const routeMarkers = useMemo<GlobePoint[]>(
    () => {
      const highlightedRouteId = isIdle ? idleRecommendation?.id : activeRouteId;

      return routes.map((route) => {
        const stop =
          route.stops.find((candidate) => candidate.id === route.promotedStopId) ??
          route.stops[1] ??
          route.stops[0];
        const isHighlighted = route.id === highlightedRouteId;

        return {
          id: `route-${route.id}`,
          routeId: route.id,
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng,
          altitude: isHighlighted ? 0.19 : isIdle ? 0.11 : 0.14,
          color: GLOBE_ACCENT,
          radius: isHighlighted ? 0.5 : isIdle ? 0.28 : 0.34,
          kind: "route-marker",
          title: stop.name,
          subtitle: isIdle ? `Recommendation: ${route.title}` : route.title,
          price: route.estimatedCostUsd
        };
      });
    },
    [activeRouteId, idleRecommendation?.id, isIdle, routes]
  );

  const activeStops = useMemo<GlobePoint[]>(
    () => {
      if (!activeRoute) {
        return [];
      }

      return activeRoute.stops.map((stop) => ({
        id: `stop-${activeRoute.id}-${stop.id}`,
        routeId: activeRoute.id,
        lat: stop.coordinates.lat,
        lng: stop.coordinates.lng,
        altitude: stop.kind === "origin" || stop.kind === "return" ? 0.02 : 0.035,
        color: stop.kind === "origin" || stop.kind === "return" ? GLOBE_SOFT : GLOBE_ACCENT,
        radius: stop.kind === "origin" || stop.kind === "return" ? 0.22 : 0.18,
        kind: "route-stop",
        title: `${stop.name} (${stop.code})`,
        subtitle:
          stop.kind === "origin" ? "Origin" : stop.kind === "return" ? "Return to origin" : stop.scene ?? stop.country
      }));
    },
    [activeRoute]
  );

  const arcsData = useMemo<GlobeArc[]>(
    () => {
      if (!activeRoute) {
        return [];
      }

      return activeRoute.stops.slice(0, -1).map((stop, index) => ({
        id: `${activeRoute.id}-${stop.id}-${activeRoute.stops[index + 1]?.id}`,
        startLat: stop.coordinates.lat,
        startLng: stop.coordinates.lng,
        endLat: activeRoute.stops[index + 1].coordinates.lat,
        endLng: activeRoute.stops[index + 1].coordinates.lng,
        color: [GLOBE_ACCENT, GLOBE_ACCENT]
      }));
    },
    [activeRoute]
  );

  const ringsData = useMemo<GlobeRing[]>(
    () => {
      if (isIdle) {
        if (!idleRecommendation) {
          return [];
        }

        const idleStop =
          idleRecommendation.stops.find((stop) => stop.id === idleRecommendation.promotedStopId) ??
          idleRecommendation.stops[1] ??
          idleRecommendation.stops[0];

        return [
          {
            id: `ring-idle-${idleRecommendation.id}`,
            lat: idleStop.coordinates.lat,
            lng: idleStop.coordinates.lng,
            color: ["rgba(212, 255, 0, 0.88)", "rgba(212, 255, 0, 0)"],
            maxRadius: 5.4,
            propagationSpeed: 1.25,
            repeatPeriod: 1100
          }
        ];
      }

      if (!activeRoute || !promotedStop) {
        return [];
      }

      return [
        {
          id: `ring-${activeRoute.id}`,
          lat: promotedStop.coordinates.lat,
          lng: promotedStop.coordinates.lng,
          color: ["rgba(212, 255, 0, 0.9)", "rgba(212, 255, 0, 0)"],
          maxRadius: 6.4,
          propagationSpeed: 1.5,
          repeatPeriod: 900
        }
      ];
    },
    [activeRoute, idleRecommendation, isIdle, promotedStop]
  );

  const pointsData = useMemo(() => [...routeMarkers, ...activeStops], [activeStops, routeMarkers]);

  return (
    <div className="orbital-globe-stage" ref={containerRef}>
      {statusRoute && !globeReady && !isComposing ? (
        <div className="orbital-globe-status" role="status" aria-live="polite">
          <div className="orbital-globe-status__header">
            <span className="orbital-globe-status__mode">
              {globeTimedOut ? (
                "3D route globe unavailable"
              ) : (
                <span role="status" aria-label="Loading 3D route globe">
                  <RouteLoadingMark />
                </span>
              )}
            </span>
            <small>
              {globeTimedOut
                ? "Use the ranked route options below to choose a route."
                : statusRoute.tagline}
            </small>
          </div>
        </div>
      ) : null}

      {isComposing ? (
        <div className="route-composition-loading" role="status" aria-live="polite">
          <RouteLoadingMark />
          <strong>Plotting route options</strong>
          <span>Comparing stops, cost, and route rhythm.</span>
        </div>
      ) : null}

      {webGlAvailable && !globeTimedOut ? (
        <div
          className={
            globeReady
              ? "orbital-globe-frame"
              : "orbital-globe-frame orbital-globe-frame--loading"
          }
        >
          <Globe
            ref={globeRef}
            width={globeWidth}
            height={globeHeight}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={GLOBE_TEXTURE_URL}
            bumpImageUrl={GLOBE_BUMP_URL}
            showAtmosphere
            atmosphereColor={GLOBE_SOFT}
            atmosphereAltitude={0.16}
            pointsData={pointsData}
            pointLat="lat"
            pointLng="lng"
            pointAltitude="altitude"
            pointColor="color"
            pointRadius="radius"
            pointResolution={18}
            pointLabel={(point) => buildTooltip(point as GlobePoint)}
            onPointClick={(point) => {
              const selectedPoint = point as GlobePoint;
              if (selectedPoint.kind === "route-marker") {
                onSelectRoute(selectedPoint.routeId);
              }
            }}
            arcsData={arcsData}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor="color"
            arcAltitudeAutoScale={0.22}
            arcStroke={0.85}
            arcDashLength={0.38}
            arcDashGap={0.25}
            arcDashAnimateTime={prefersReducedMotion ? 0 : 1400}
            ringsData={ringsData}
            ringLat="lat"
            ringLng="lng"
            ringColor="color"
            ringMaxRadius="maxRadius"
            ringPropagationSpeed="propagationSpeed"
            ringRepeatPeriod="repeatPeriod"
            enablePointerInteraction
            showPointerCursor={(objType, objData) =>
              objType === "point" && (objData as GlobePoint | undefined)?.kind === "route-marker"
            }
            onGlobeReady={() => {
              setGlobeReady(true);
              setGlobeTimedOut(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
