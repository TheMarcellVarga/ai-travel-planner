"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";

import type { RouteOption } from "@/lib/types";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type RouteGlobeProps = {
  route: RouteOption;
};

export function RouteGlobe({ route }: RouteGlobeProps) {
  const globeRef = useRef<any>(null);

  const pointsData = useMemo(
    () =>
      route.stops.map((stop) => ({
        lat: stop.coordinates.lat,
        lng: stop.coordinates.lng,
        size: stop.kind === "origin" ? 0.22 : 0.3,
        color: stop.id === route.promotedStopId ? "#f7df8e" : "#9eff67",
        label: `${stop.name} (${stop.code})`
      })),
    [route]
  );

  const arcsData = useMemo(
    () =>
      route.stops.slice(1).map((stop, index) => ({
        startLat: route.stops[index].coordinates.lat,
        startLng: route.stops[index].coordinates.lng,
        endLat: stop.coordinates.lat,
        endLng: stop.coordinates.lng,
        color: ["#9eff67", "#f7df8e"]
      })),
    [route]
  );

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) {
      return;
    }

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
  }, [route]);

  return (
    <div className="globe-visual">
      <Globe
        ref={globeRef}
        width={520}
        height={520}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        arcsData={arcsData}
        arcColor={"color"}
        arcStroke={0.8}
        arcDashLength={0.65}
        arcDashGap={0.15}
        arcDashAnimateTime={2200}
        pointsData={pointsData}
        pointAltitude={"size"}
        pointColor={"color"}
        pointRadius={0.45}
      />
    </div>
  );
}

