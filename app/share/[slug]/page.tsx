import { notFound } from "next/navigation";

import { MediaCredit } from "@/components/media-credit";
import { RouteActions } from "@/components/planner/route-actions";
import { ResilientImage } from "@/components/resilient-image";
import { getDestinationMedia } from "@/lib/media";
import { getPublicSharedRoute } from "@/lib/store/demo-store";
import { getPublicSharedRouteFromDatabase } from "@/lib/store/persistent-store";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const sharedRoute =
    (await getPublicSharedRouteFromDatabase(slug)) ?? getPublicSharedRoute(slug);

  if (!sharedRoute) {
    notFound();
  }

  const shareMedia = getDestinationMedia(sharedRoute.route.promotedStopId);

  return (
    <main className="planner-command-shell share-route-shell">
      <div className="planner-stage-globe share-route-media">
        <ResilientImage
          alt={shareMedia.alt}
          className="share-route-media__image"
          fill
          priority
          sizes="100vw"
          src={shareMedia.src}
        />
        <div className="share-route-media__wash" />
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

      <aside className="floating-sidebar floating-sidebar-left share-route-panel share-route-panel-left">
        <div className="floating-sidebar__inner share-route-panel__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Discover</p>
            <h2>{sharedRoute.route.tagline}</h2>
          </div>
          <div className="tag-row share-route-tags">
            {sharedRoute.route.wishTags.map((tag) => (
              <span className="tag-pill" key={tag}>{tag}</span>
            ))}
          </div>

          <div className="route-inspector__section share-route-actions">
            <p className="eyebrow">
              Take Action
            </p>
            <p className="muted-copy share-route-actions__date">
              Published {new Date(sharedRoute.publishedAt).toLocaleString()}.
            </p>
            <p className="muted-copy text-small">
              {sharedRoute.route.disclaimer}
            </p>
            <p className="muted-copy text-small">
              Availability: external provider search required. Freshness:{" "}
              {sharedRoute.route.dataFreshness}.
            </p>
            <RouteActions routeId={sharedRoute.route.id} />
          </div>

          <div className="margin-top-auto">
             <MediaCredit asset={shareMedia} compact />
          </div>
        </div>
      </aside>

      <aside className="floating-sidebar floating-sidebar-right share-route-panel share-route-panel-right">
        <div className="floating-sidebar__inner share-route-panel__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Stops</p>
            <h2>Journey breakdown</h2>
          </div>
          <div className="stop-stack share-stop-stack">
            {sharedRoute.route.stops.map((stop) => (
              <article className="stop-card share-stop-card" key={stop.id}>
                <div className="card-header">
                  <div className="card-stack share-stop-card__copy">
                    <p className="eyebrow">{stop.kind}</p>
                    <strong className="card-title text-small">{stop.name} ({stop.code})</strong>
                  </div>
                  {stop.kind === "destination" && (
                    <ResilientImage
                      alt=""
                      src={getDestinationMedia(stop.id).src}
                      className="card-image-xs"
                      width={60}
                      height={60}
                    />
                  )}
                </div>
                <p className="muted-copy text-small share-stop-card__country">{stop.country}</p>
                {stop.scene ? <p className="route-tagline text-small share-stop-card__scene">{stop.scene}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
