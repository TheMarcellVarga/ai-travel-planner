import { notFound } from "next/navigation";

import { MediaCredit } from "@/components/media-credit";
import { RouteActions } from "@/components/planner/route-actions";
import { ResilientImage } from "@/components/resilient-image";
import { getRouteStopMedia } from "@/lib/media";
import {
  formatRouteTagline,
  hasProviderObservedPrice,
  routePriceLabel
} from "@/lib/planner/display";
import { resolveDemoShare } from "@/lib/store/demo-preview";
import { getPublicSharedRoute } from "@/lib/store/demo-store";
import { getPublicSharedRouteFromDatabase } from "@/lib/store/persistent-store";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const persistedSharedRoute =
    (await getPublicSharedRouteFromDatabase(slug)) ?? getPublicSharedRoute(slug);
  const demoShare = persistedSharedRoute ? null : await resolveDemoShare(slug);
  const sharedRoute = persistedSharedRoute ?? demoShare?.publicRoute;

  if (!sharedRoute) {
    notFound();
  }

  const shareMedia = getRouteStopMedia(
    sharedRoute.route.stops.find((stop) => stop.id === sharedRoute.route.promotedStopId)
  );
  const hasObservedPrice = hasProviderObservedPrice(sharedRoute.route);

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
            {routePriceLabel(sharedRoute.route)}
          </span>
          <span className="status-pill">
            App confidence {Math.round(sharedRoute.route.confidence * 100)}%
          </span>
        </div>
      </div>

      <aside className="floating-sidebar floating-sidebar-left share-route-panel share-route-panel-left">
        <div className="floating-sidebar__inner share-route-panel__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Discover</p>
            <h2>{formatRouteTagline(sharedRoute.route.tagline)}</h2>
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
            <div className="share-route-cost-breakdown">
              <p className="eyebrow">{hasObservedPrice ? "Observed cost breakdown" : "Price status"}</p>
              {hasObservedPrice ? sharedRoute.route.costBreakdown.transport.map((leg) => (
                <div key={leg.fromCode + "-" + leg.toCode}>
                  <span>{leg.fromCode} → {leg.toCode}</span>
                  <strong>{"$"}{leg.amount}</strong>
                </div>
              )) : null}
              {hasObservedPrice ? sharedRoute.route.costBreakdown.stays.map((stay) => (
                <div key={stay.stopId}>
                  <span>{stay.nights} nights · {stay.stopId}</span>
                  <strong>{"$"}{stay.amount}</strong>
                </div>
              )) : null}
              <p className="share-route-cost-breakdown__note">
                Status: {Array.from(new Set(sharedRoute.route.costBreakdown.transport.map((leg) => leg.status))).join(", ")}.
                {hasObservedPrice
                  ? ` Observed ${sharedRoute.route.costBreakdown.transport.find((leg) => leg.observedAt)?.observedAt}.`
                  : " A complete provider-observed fare and stay quote is unavailable. Check current prices with external providers."}
              </p>
              <ul className="share-route-cost-breakdown__assumptions">
                {sharedRoute.route.costBreakdown.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </div>
            <RouteActions routeId={sharedRoute.route.id} route={demoShare?.route} />
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
                      src={getRouteStopMedia(stop).src}
                      className="card-image-xs"
                      width={60}
                      height={60}
                      unoptimized
                    />
                  )}
                </div>
                <p className="muted-copy text-small share-stop-card__country">{stop.country}</p>
                {stop.scene ? <p className="route-tagline text-small share-stop-card__scene">{stop.scene}</p> : null}
                {stop.kind === "destination" ? (
                  <MediaCredit asset={getRouteStopMedia(stop)} compact />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
