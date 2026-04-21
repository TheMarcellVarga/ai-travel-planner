import { notFound } from "next/navigation";

import { MediaCredit } from "@/components/media-credit";
import { RouteActions } from "@/components/planner/route-actions";
import { getDestinationMedia } from "@/lib/media";
import { getSharedRoute } from "@/lib/store/demo-store";
import { getSharedRouteFromDatabase } from "@/lib/store/persistent-store";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const sharedRoute =
    (await getSharedRouteFromDatabase(slug)) ?? getSharedRoute(slug);

  if (!sharedRoute) {
    notFound();
  }

  const shareMedia = getDestinationMedia(sharedRoute.route.promotedStopId);

  return (
    <main className="planner-command-shell">
      <div className="planner-stage-globe">
        <img alt={shareMedia.alt} className="hero-media-image" src={shareMedia.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(3, 10, 6, 0.86) 18%, rgba(3, 10, 6, 0.44) 52%, rgba(3, 10, 6, 0.94) 100%)" }} />
      </div>

      <div className="planner-stage-header">
        <div className="planner-stage-title">
          <p className="eyebrow">Shared route</p>
          <h1>{sharedRoute.route.title}</h1>
        </div>
        <div className="planner-stage-badges">
          <span className="status-pill status-pill-accent">${sharedRoute.route.estimatedCostUsd}</span>
          <span className="status-pill">Confidence {Math.round(sharedRoute.route.confidence * 100)}%</span>
        </div>
      </div>

      <aside className="floating-sidebar floating-sidebar-left">
        <div className="floating-sidebar__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Discover</p>
            <h2>{sharedRoute.route.tagline}</h2>
          </div>
          <div className="tag-row" style={{ marginTop: "8px" }}>
            {sharedRoute.route.wishTags.map((tag) => (
              <span className="tag-pill" key={tag}>{tag}</span>
            ))}
          </div>
          
          <div className="route-inspector__section" style={{ marginTop: "24px" }}>
             <p className="eyebrow" style={{ marginBottom: "8px" }}>Take Action</p>
             <p className="muted-copy" style={{ marginBottom: "12px", fontSize: "0.85rem" }}>
               Published {new Date(sharedRoute.publishedAt).toLocaleString()}.
             </p>
             <RouteActions routeId={sharedRoute.route.id} />
          </div>

          <div style={{ marginTop: "auto" }}>
             <MediaCredit asset={shareMedia} compact />
          </div>
        </div>
      </aside>

      <aside className="floating-sidebar floating-sidebar-right">
        <div className="floating-sidebar__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Stops</p>
            <h2>Journey breakdown</h2>
          </div>
          <div className="stop-stack">
            {sharedRoute.route.stops.map((stop) => (
              <article className="stop-card" key={stop.id} style={{ display: "grid", gap: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "2px" }}>
                    <p className="eyebrow" style={{ fontSize: "0.6rem" }}>{stop.kind}</p>
                    <strong style={{ fontSize: "1.05rem" }}>{stop.name} ({stop.code})</strong>
                  </div>
                  {stop.kind === "destination" && (
                    <img 
                      alt="" 
                      src={getDestinationMedia(stop.id).src} 
                      style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }} 
                    />
                  )}
                </div>
                <p className="muted-copy" style={{ margin: 0, fontSize: "0.85rem" }}>{stop.country}</p>
                {stop.scene ? <p className="route-tagline" style={{ fontSize: "0.85rem" }}>{stop.scene}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
