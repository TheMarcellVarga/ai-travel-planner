import type { RouteOption } from "@/lib/types";

type RouteMapFallbackProps = {
  route: RouteOption;
};

function project(lat: number, lng: number) {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100
  };
}

export function RouteMapFallback({ route }: RouteMapFallbackProps) {
  const points = route.stops.map((stop) => ({
    ...stop,
    ...project(stop.coordinates.lat, stop.coordinates.lng)
  }));

  return (
    <div className="map-fallback">
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-label="2D route map fallback">
        <rect x="0" y="0" width="100" height="50" rx="6" className="map-ocean" />
        {points.slice(1).map((point, index) => {
          const previous = points[index];
          return (
            <line
              key={`${previous.id}-${point.id}`}
              x1={previous.x}
              y1={previous.y / 2}
              x2={point.x}
              y2={point.y / 2}
              className="map-line"
            />
          );
        })}
        {points.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y / 2} r={point.kind === "origin" ? 1.6 : 1.8} className="map-point" />
            <text x={point.x} y={point.y / 2 - 3} textAnchor="middle" className="map-label">
              {point.code}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

