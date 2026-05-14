import { notFound } from "next/navigation";

import Image from "next/image";
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
      <div className="planner-stage-globe" style={{ position: "relative" }}>
        <Image alt={shareMedia.alt} className="hero-media-image" src={shareMedia.src} fill sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="product-hero__overlay" />
      </div>

      <div className="planner-stage-header">
        <div className="planner-stage-title">
          <p className="eyebrow">Shared route</p>
          <h1>{sharedRoute.route.title}</h1>
        </div>
        <div className="planner-stage-badges">
          <span className="status-pill status-pill-accent">
            ${sharedRoute.route.estimatedCostUsd}
          </span>
          <span className="status-pill">
            Confidence {Math.round(sharedRoute.route.confidence * 100)}%
          </span>
        </div>
      </div>

      <aside className="floating-sidebar floating-sidebar-left">
        <div className="floating-sidebar__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Discover</p>
            <h2>{sharedRoute.route.tagline}</h2>
          </div>
          <div className="tag-row" style={{ marginTop: "12px" }}>
            {sharedRoute.route.wishTags.map((tag) => (
              <span className="tag-pill" key={tag}>{tag}</span>
            ))}
          </div>

          <div
            className="route-inspector__section"
            style={{ marginTop: "24px" }}
          >
            <p className="eyebrow" style={{ marginBottom: "8px" }}>
              Take Action
            </p>
            <p
              className="muted-copy"
              style={{ marginBottom: "12px", fontSize: "0.85rem" }}
            >
              Published {new Date(sharedRoute.publishedAt).toLocaleString()}.
            </p>
            <RouteActions routeId={sharedRoute.route.id} />
          </div>

          <div className="margin-top-auto">
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
              <article className="stop-card" key={stop.id} style={{ padding: "18px" }}>
                <div className="card-header">
                  <div className="card-stack" style={{ gap: "4px" }}>
                    <p className="eyebrow" style={{ fontSize: "0.6rem" }}>{stop.kind}</p>
                    <strong className="card-title text-small">{stop.name} ({stop.code})</strong>
                  </div>
                  {stop.kind === "destination" && (
                    <Image
                      alt=""
                      src={getDestinationMedia(stop.id).src}
                      className="card-image-xs"
                      width={60}
                      height={60}
                    />
                  )}
                </div>
                <p className="muted-copy text-small" style={{ margin: "10px 0 0" }}>{stop.country}</p>
                {stop.scene ? <p className="route-tagline text-small" style={{ marginTop: "8px" }}>{stop.scene}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
