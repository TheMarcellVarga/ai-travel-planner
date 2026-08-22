"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import type { RouteOption } from "@/lib/types";

type RouteMapLibreProps = {
  routes: RouteOption[];
  activeRouteId: string | null;
  styleUrl: string;
  onSelectRoute: (routeId: string) => void;
};

function toFeatureCollection(routes: RouteOption[]) {
  return {
    type: "FeatureCollection" as const,
    features: routes.flatMap((route) => {
      const line = {
        type: "Feature" as const,
        properties: { routeId: route.id },
        geometry: {
          type: "LineString" as const,
          coordinates: route.stops.map((stop) => [stop.coordinates.lng, stop.coordinates.lat])
        }
      };
      const stops = route.stops.map((stop) => ({
        type: "Feature" as const,
        properties: {
          routeId: route.id,
          stopId: stop.id,
          stopCode: stop.code,
          kind: stop.kind,
          promoted: stop.id === route.promotedStopId
        },
        geometry: {
          type: "Point" as const,
          coordinates: [stop.coordinates.lng, stop.coordinates.lat]
        }
      }));

      return [line, ...stops];
    })
  };
}

export function RouteMapLibre({ routes, activeRouteId, styleUrl, onSelectRoute }: RouteMapLibreProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    let disposed = false;

    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (disposed || !mapNodeRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: mapNodeRef.current,
        style: styleUrl,
        center: [0, 20],
        zoom: 1.1,
        attributionControl: false,
        cooperativeGestures: true
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION
        }),
        "bottom-right"
      );

      map.on("load", () => {
        if (disposed) {
          return;
        }

        map.addSource("wild-route-data", {
          type: "geojson",
          data: toFeatureCollection(routes)
        });

        map.addLayer({
          id: "wild-route-alternates",
          type: "line",
          source: "wild-route-data",
          filter: ["==", ["geometry-type"], "LineString"],
          paint: {
            "line-color": "#76866e",
            "line-opacity": 0.35,
            "line-width": 2,
            "line-dasharray": [2, 2]
          }
        });

        map.addLayer({
          id: "wild-route-active",
          type: "line",
          source: "wild-route-data",
          filter: [
            "all",
            ["==", ["geometry-type"], "LineString"],
            ["==", ["get", "routeId"], activeRouteId ?? routes[0]?.id ?? ""]
          ],
          paint: {
            "line-color": "#d7ff3f",
            "line-opacity": 0.95,
            "line-width": 4
          }
        });

        map.addLayer({
          id: "wild-route-alternate-stops",
          type: "circle",
          source: "wild-route-data",
          filter: [
            "all",
            ["==", ["geometry-type"], "Point"],
            ["!=", ["get", "routeId"], activeRouteId ?? routes[0]?.id ?? ""]
          ],
          paint: {
            "circle-color": "#76866e",
            "circle-opacity": 0.6,
            "circle-radius": 4,
            "circle-stroke-color": "#07120d",
            "circle-stroke-width": 2
          }
        });

        map.addLayer({
          id: "wild-route-stops",
          type: "circle",
          source: "wild-route-data",
          filter: [
            "all",
            ["==", ["geometry-type"], "Point"],
            ["==", ["get", "routeId"], activeRouteId ?? routes[0]?.id ?? ""]
          ],
          paint: {
            "circle-color": "#d7ff3f",
            "circle-radius": 5,
            "circle-stroke-color": "#07120d",
            "circle-stroke-width": 2
          }
        });

        map.addLayer({
          id: "wild-route-promoted-stop",
          type: "circle",
          source: "wild-route-data",
          filter: [
            "all",
            ["==", ["geometry-type"], "Point"],
            ["==", ["get", "promoted"], true]
          ],
          paint: {
            "circle-color": "#ff745c",
            "circle-radius": 8,
            "circle-stroke-color": "#07120d",
            "circle-stroke-width": 2
          }
        });

        const selectRoute = (event: maplibregl.MapLayerMouseEvent) => {
          const routeId = event.features?.[0]?.properties?.routeId;
          if (typeof routeId === "string") {
            onSelectRoute(routeId);
          }
        };

        [
          "wild-route-alternates",
          "wild-route-active",
          "wild-route-alternate-stops",
          "wild-route-stops",
          "wild-route-promoted-stop"
        ].forEach((layerId) => {
          map.on("click", layerId, selectRoute);
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        });

        const bounds = new maplibregl.LngLatBounds();
        routes.forEach((route) => {
          route.stops.forEach((stop) => bounds.extend([stop.coordinates.lng, stop.coordinates.lat]));
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 48, maxZoom: 3.7, duration: 0 });
        }
      });

      mapRef.current = map;
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [activeRouteId, onSelectRoute, routes, styleUrl]);

  return (
    <div
      ref={mapNodeRef}
      className="route-map-libre"
      role="img"
      aria-label="Interactive map showing the ranked route options"
    />
  );
}
