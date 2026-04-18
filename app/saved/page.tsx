import Link from "next/link";

import { MediaCredit } from "@/components/media-credit";
import { getDestinationMedia } from "@/lib/media";
import { getCurrentUser } from "@/lib/auth";
import { getSavedRoutesForUser, getSharedRoutesForUser } from "@/lib/store/demo-store";

export default async function SavedPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="shell page-panel">
        <div className="section-heading">
          <p className="eyebrow">Saved routes</p>
          <h1>Sign in to keep route hunts, published slugs, and booking history.</h1>
        </div>
        <p className="lede">
          Anonymous users can explore the planner, but route storage and publishing are
          account-backed features.
        </p>
        <div className="button-row">
          <Link href="/auth" className="button">
            Sign In
          </Link>
          <Link href="/planner" className="button button-ghost">
            Open planner
          </Link>
        </div>
      </main>
    );
  }

  const savedRoutes = getSavedRoutesForUser(user.id);
  const sharedRoutes = getSharedRoutesForUser(user.id);

  return (
    <main className="shell saved-shell">
      <section className="page-panel">
        <div className="section-heading">
          <p className="eyebrow">Saved route vault</p>
          <h1>{savedRoutes.length} routes saved for {user.name}.</h1>
        </div>
        <p className="lede">
          Free plan: {user.entitlement.routeSaveLimit} saved routes,{" "}
          {user.entitlement.promotedStopLimit} promoted stop per route.
        </p>
      </section>

      <section className="results-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Saved routes</p>
            <h2>Vault</h2>
          </div>
          <Link href="/planner" className="button button-ghost">
            Generate more
          </Link>
        </div>
        <div className="results-grid">
          {savedRoutes.length ? (
            savedRoutes.map((item) => (
              <article className="route-card" key={item.id}>
                <div className="route-visual">
                  <img
                    alt={getDestinationMedia(item.route.promotedStopId).alt}
                    className="route-visual-image"
                    src={getDestinationMedia(item.route.promotedStopId).src}
                  />
                  <div className="route-visual-overlay" />
                </div>
                <div className="route-card-top">
                  <div>
                    <p className="eyebrow">Saved route</p>
                    <h3>{item.route.title}</h3>
                  </div>
                  <span className="route-price">${item.route.estimatedCostUsd}</span>
                </div>
                <p className="route-tagline">{item.route.tagline}</p>
                <p className="muted-copy">Saved {new Date(item.savedAt).toLocaleString()}</p>
                <MediaCredit asset={getDestinationMedia(item.route.promotedStopId)} compact />
              </article>
            ))
          ) : (
            <article className="route-card">
              <h3>No saved routes yet.</h3>
              <p className="muted-copy">Generate in the planner and tap save on any route card.</p>
            </article>
          )}
        </div>
      </section>

      <section className="results-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Public shares</p>
            <h2>Published route pages</h2>
          </div>
        </div>
        <div className="results-grid">
          {sharedRoutes.length ? (
            sharedRoutes.map((item) => (
              <article className="route-card" key={item.id}>
                <div className="route-visual">
                  <img
                    alt={getDestinationMedia(item.route.promotedStopId).alt}
                    className="route-visual-image"
                    src={getDestinationMedia(item.route.promotedStopId).src}
                  />
                  <div className="route-visual-overlay" />
                </div>
                <h3>{item.route.title}</h3>
                <p className="route-tagline">{item.route.tagline}</p>
                <Link className="button button-ghost" href={`/share/${item.slug}`}>
                  Open /share/{item.slug}
                </Link>
                <MediaCredit asset={getDestinationMedia(item.route.promotedStopId)} compact />
              </article>
            ))
          ) : (
            <article className="route-card">
              <h3>No published pages yet.</h3>
              <p className="muted-copy">Publish any route from the planner to create a shareable slug.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
