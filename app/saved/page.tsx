import Link from "next/link";

import { DemoBrowserRoutes, DemoBrowserShares } from "@/components/demo-browser-vault";
import { ResilientImage } from "@/components/resilient-image";
import { getDestinationMedia, heroMedia } from "@/lib/media";
import { formatRouteTagline, routePriceLabel } from "@/lib/planner/display";
import { getCurrentUser } from "@/lib/auth";
import {
  getSavedRoutesForUser,
  getSharedRoutesForUser,
} from "@/lib/store/demo-store";
import {
  getSavedRoutesForUserFromDatabase,
  getSharedRoutesForUserFromDatabase,
} from "@/lib/store/persistent-store";

export default async function SavedPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="planner-command-shell saved-vault-shell saved-vault-shell-empty">
        <div className="planner-stage-globe saved-vault-media">
          <ResilientImage
            alt={heroMedia.alt}
            className="saved-vault-media__image"
            fill
            priority
            sizes="100vw"
            src={heroMedia.src}
          />
          <div className="saved-vault-media__wash" />
        </div>
        <div className="planner-stage-header">
          <div className="planner-stage-title">
            <p className="eyebrow">Saved routes</p>
            <h1>
              Save the routes worth returning to.
            </h1>
          </div>
        </div>
        <aside className="floating-sidebar floating-sidebar-left vault-panel vault-panel-left">
          <div className="floating-sidebar__inner vault-panel__inner">
            <p className="lede vault-panel__lede">
              Sign in to keep private routes and publish shareable route pages.
              You can still explore and compose without an account.
            </p>
            <div className="vault-panel__actions">
              <Link href="/auth" className="button button-island layout-fill">
                Sign In
              </Link>
              <Link href="/planner" className="button button-ghost layout-fill">
                Open planner
              </Link>
            </div>
          </div>
        </aside>
      </main>
    );
  }

  const savedRoutes =
    user.authMode === "supabase"
      ? await getSavedRoutesForUserFromDatabase(user.id)
      : getSavedRoutesForUser(user.id);
  const sharedRoutes =
    user.authMode === "supabase"
      ? await getSharedRoutesForUserFromDatabase(user.id)
      : getSharedRoutesForUser(user.id);

  return (
    <main className="planner-command-shell saved-vault-shell">
      <div className="planner-stage-globe saved-vault-media">
        <ResilientImage
          alt={heroMedia.alt}
          className="saved-vault-media__image"
          fill
          priority
          sizes="100vw"
          src={heroMedia.src}
        />
        <div className="saved-vault-media__wash" />
      </div>

      <div className="planner-stage-header">
        <div className="planner-stage-title">
          <p className="eyebrow">Saved route vault</p>
          <h1>
            {user.authMode === "demo"
              ? "Browser-local demo vault."
              : `${savedRoutes.length} route files in the vault.`}
          </h1>
        </div>
        <div className="planner-stage-badges">
          <span className="status-pill">
            {user.authMode === "demo" ? "This device only" : `Plan: ${user.entitlement.routeSaveLimit} routes, ${user.entitlement.promotedStopLimit} promoted`}
          </span>
        </div>
      </div>

      <aside className="floating-sidebar floating-sidebar-left vault-panel vault-panel-left">
        <div className="floating-sidebar__inner vault-panel__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Saved routes</p>
            <h2>Private route stack</h2>
          </div>

          <div className="stop-stack vault-card-stack">
            {user.authMode === "demo" ? (
              <DemoBrowserRoutes />
            ) : savedRoutes.length ? (
              savedRoutes.map((item) => (
                <article className="stop-card vault-route-card" key={item.id}>
                  <div className="card-header">
                    <div>
                      <strong className="card-title">{item.route.title}</strong>
                      <span className="card-price">{routePriceLabel(item.route)}</span>
                    </div>
                    <ResilientImage
                      alt=""
                      src={getDestinationMedia(item.route.promotedStopId).src}
                      className="card-image-sm"
                      width={80}
                      height={60}
                    />
                  </div>
                  <p className="muted-copy text-small vault-route-card__tagline">
                    {formatRouteTagline(item.route.tagline)}
                  </p>
                </article>
              ))
            ) : (
              <p className="muted-copy">
                No saved routes yet. Generate in the planner and tap save on any
                route card.
              </p>
            )}
          </div>
          <Link href="/planner" className="button button-ghost layout-fill vault-panel__footer-action">
            Generate more
          </Link>
        </div>
      </aside>

      <aside className="floating-sidebar floating-sidebar-right vault-panel vault-panel-right">
        <div className="floating-sidebar__inner vault-panel__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Public shares</p>
            <h2>Share slugs</h2>
          </div>

          <div className="stop-stack vault-card-stack">
            {user.authMode === "demo" ? (
              <DemoBrowserShares />
            ) : sharedRoutes.length ? (
              sharedRoutes.map((item) => (
                <article className="stop-card vault-route-card" key={item.id}>
                  <div className="card-header">
                    <div>
                      <strong className="card-title">{item.route.title}</strong>
                    </div>
                    <ResilientImage
                      alt=""
                      src={getDestinationMedia(item.route.promotedStopId).src}
                      className="card-image-sm"
                      width={80}
                      height={60}
                    />
                  </div>
                  <Link className="button button-ghost layout-fill text-small vault-route-card__link" href={`/share/${item.slug}`}>
                    Open /share/{item.slug}
                  </Link>
                </article>
              ))
            ) : (
              <p className="muted-copy">
                No published pages yet. Publish any route from the planner to
                create a shareable slug.
              </p>
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}
