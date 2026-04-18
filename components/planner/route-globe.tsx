"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { RouteOption } from "@/lib/types";

type RouteGlobeProps = {
  routes: RouteOption[];
  activeRouteId: string;
  onSelectRoute: (routeId: string) => void;
};

type ProjectedPoint = {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
};

function projectToSphere(lat: number, lng: number, rotation: number, radius: number): ProjectedPoint {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = ((lng + rotation) * Math.PI) / 180;

  const x3d = Math.cos(latRad) * Math.sin(lngRad);
  const y3d = Math.sin(latRad);
  const z3d = Math.cos(latRad) * Math.cos(lngRad);

  return {
    x: radius + x3d * radius * 0.9,
    y: radius - y3d * radius * 0.9,
    scale: 0.62 + Math.max(z3d, 0) * 0.52,
    visible: z3d > -0.16
  };
}

function createArcPath(points: Array<ProjectedPoint & { id: string }>) {
  if (points.length < 2) {
    return "";
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    const controlY = Math.min(previous.y, point.y) - 42;

    return `${path} Q ${controlX} ${controlY} ${point.x} ${point.y}`;
  }, "");
}

export function RouteGlobe({ routes, activeRouteId, onSelectRoute }: RouteGlobeProps) {
  const [size, setSize] = useState(920);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? routes[0];
  const promotedStop =
    activeRoute.stops.find((stop) => stop.id === activeRoute.promotedStopId) ?? activeRoute.stops[1] ?? activeRoute.stops[0];
  const radius = size / 2;

  useEffect(() => {
    const current = containerRef.current;
    if (!current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setSize(Math.max(520, Math.min(entry.contentRect.width, 980)));
    });

    observer.observe(current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      const time = Date.now();
      const targetRotation = -promotedStop.coordinates.lng + Math.sin(time / 3200) * 8;

      setRotation((current) => current + (targetRotation - current) * 0.035);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [promotedStop.coordinates.lng]);

  const activeStopPoints = useMemo(
    () =>
      activeRoute.stops.map((stop) => ({
        id: stop.id,
        ...projectToSphere(stop.coordinates.lat, stop.coordinates.lng, rotation, radius)
      })),
    [activeRoute, radius, rotation]
  );

  const activeArcPath = useMemo(
    () => createArcPath(activeStopPoints.filter((point) => point.visible)),
    [activeStopPoints]
  );

  const routeMarkers = useMemo(
    () =>
      routes.map((route) => {
        const stop =
          route.stops.find((candidate) => candidate.id === route.promotedStopId) ??
          route.stops[1] ??
          route.stops[0];
        return {
          route,
          stop,
          point: projectToSphere(stop.coordinates.lat, stop.coordinates.lng, rotation, radius)
        };
      }),
    [routes, rotation, radius]
  );

  return (
    <div className="orbital-globe-stage" ref={containerRef}>
      <div className="orbital-globe-shell" style={{ width: size, height: size }}>
        <div className="orbital-globe-shadow" />
        <div className="orbital-globe-atmosphere" />
        <div className="orbital-globe" />

        <svg
          className="orbital-globe-arcs"
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          {activeArcPath ? <path className="orbital-globe-arc" d={activeArcPath} /> : null}
          {activeStopPoints
            .filter((point) => point.visible)
            .map((point) => (
              <circle
                key={point.id}
                className="orbital-globe-node"
                cx={point.x}
                cy={point.y}
                r={point.id === activeRoute.promotedStopId ? 7 : 5}
              />
            ))}
        </svg>

        <div className="orbital-globe-overlay">
          {routeMarkers.map(({ route, stop, point }) =>
            point.visible ? (
              <button
                key={route.id}
                type="button"
                className={
                  route.id === activeRouteId
                    ? "orbital-marker orbital-marker-active"
                    : "orbital-marker"
                }
                style={{
                  left: point.x,
                  top: point.y,
                  transform: `translate(-50%, -50%) scale(${point.scale})`
                }}
                onClick={() => onSelectRoute(route.id)}
              >
                <span className="orbital-marker__pin" />
                <span className="orbital-marker__card">
                  <strong>{stop.name}</strong>
                  <span>{route.title}</span>
                  <span className="orbital-marker__price">${route.estimatedCostUsd}</span>
                </span>
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
