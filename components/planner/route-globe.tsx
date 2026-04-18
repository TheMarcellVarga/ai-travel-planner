"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import type { RouteOption } from "@/lib/types";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type RouteGlobeProps = {
  routes: RouteOption[];
  activeRouteId: string;
  onSelectRoute: (routeId: string) => void;
};

type MarkerData = {
  routeId: string;
  lat: number;
  lng: number;
  title: string;
  price: number;
  confidence: number;
  tagline: string;
  active: boolean;
};

export function RouteGlobe({ routes, activeRouteId, onSelectRoute }: RouteGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState(760);

  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? routes[0];

  const markerData = useMemo<MarkerData[]>(
    () =>
      routes.map((route) => {
        const promotedStop =
          route.stops.find((stop) => stop.id === route.promotedStopId) ?? route.stops[1] ?? route.stops[0];

        return {
          routeId: route.id,
          lat: promotedStop.coordinates.lat,
          lng: promotedStop.coordinates.lng,
          title: promotedStop.name,
          price: route.estimatedCostUsd,
          confidence: route.confidence,
          tagline: route.title,
          active: route.id === activeRouteId
        };
      }),
    [routes, activeRouteId]
  );

  const arcsData = useMemo(
    () =>
      activeRoute.stops.slice(1).map((stop, index) => ({
        startLat: activeRoute.stops[index].coordinates.lat,
        startLng: activeRoute.stops[index].coordinates.lng,
        endLat: stop.coordinates.lat,
        endLng: stop.coordinates.lng,
        color: ["#9eff67", "#f7df8e"]
      })),
    [activeRoute]
  );

  const pointsData = useMemo(
    () =>
      activeRoute.stops.map((stop) => ({
        lat: stop.coordinates.lat,
        lng: stop.coordinates.lng,
        size: stop.kind === "origin" ? 0.18 : stop.id === activeRoute.promotedStopId ? 0.28 : 0.22,
        color: stop.id === activeRoute.promotedStopId ? "#f7df8e" : "#9eff67"
      })),
    [activeRoute]
  );

  const ringsData = useMemo(
    () =>
      markerData.filter((marker) => marker.active).map((marker) => ({
        lat: marker.lat,
        lng: marker.lng,
        maxR: 8,
        propagationSpeed: 1.6,
        repeatPeriod: 1200
      })),
    [markerData]
  );

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) {
      return;
    }

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.enablePan = false;
    controls.minDistance = 220;
    controls.maxDistance = 420;
  }, [activeRouteId]);

  useEffect(() => {
    const current = containerRef.current;
    if (!current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = Math.max(420, Math.min(entry.contentRect.width, 920));
      setSize(nextSize);
    });

    observer.observe(current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="globe-visual globe-dashboard" ref={containerRef}>
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        arcsData={arcsData}
        arcColor={"color"}
        arcStroke={0.7}
        arcDashLength={0.55}
        arcDashGap={0.18}
        arcDashAnimateTime={1800}
        atmosphereColor="#9eff67"
        atmosphereAltitude={0.16}
        htmlElementsData={markerData}
        htmlElement={(markerObject) => {
          const marker = markerObject as MarkerData;
          const element = document.createElement("button");
          element.type = "button";
          element.className = marker.active
            ? "globe-route-marker globe-route-marker-active"
            : "globe-route-marker";
          element.innerHTML = `
            <span class="globe-route-marker__pin"></span>
            <span class="globe-route-marker__card">
              <span class="globe-route-marker__title">${marker.title}</span>
              <span class="globe-route-marker__meta">${marker.tagline}</span>
              <span class="globe-route-marker__price">$${marker.price}</span>
            </span>
          `;
          element.onclick = () => onSelectRoute(marker.routeId);
          return element;
        }}
        htmlElementVisibilityModifier={(element, isVisible) => {
          element.style.opacity = isVisible ? "1" : "0";
          element.style.pointerEvents = isVisible ? "auto" : "none";
        }}
        pointsData={pointsData}
        pointAltitude={"size"}
        pointColor={"color"}
        pointRadius={0.38}
        ringsData={ringsData}
        ringColor={() => "#f7df8e"}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
}
