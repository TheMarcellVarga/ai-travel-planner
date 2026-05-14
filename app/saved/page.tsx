import Image from "next/image";
import Link from "next/link";

import { getDestinationMedia, heroMedia } from "@/lib/media";
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
      <main className="planner-command-shell">
        <div className="planner-stage-globe">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `url('${heroMedia.src}') center/cover`,
              opacity: 0.24,
              filter: "blur(12px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(3, 10, 6, 0.75)",
            }}
          />
        </div>
        <div className="planner-stage-header">
          <div className="planner-stage-title">
            <p className="eyebrow">Saved routes</p>
            <h1>
              Sign in to keep route hunts, published slugs, and booking history.
            </h1>
          </div>
        </div>
        <aside className="floating-sidebar floating-sidebar-left">
          <div className="floating-sidebar__inner">
            <p className="lede" style={{ fontSize: "0.95rem" }}>
              Anonymous users can explore the planner, but route storage and
              publishing are account-backed features.
            </p>
            <div className="layout-v-stack" style={{ marginTop: "24px" }}>
              <Link href="/auth" className="button layout-fill">
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
    <main className="planner-command-shell">
      <div className="planner-stage-globe">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `url('${heroMedia.src}') center/cover`,
            opacity: 0.2,
            filter: "blur(12px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(3, 10, 6, 0.75), rgba(3, 10, 6, 0.94))",
          }}
        />
      </div>

      <div className="planner-stage-header">
        <div className="planner-stage-title">
          <p className="eyebrow">Saved route vault</p>
          <h1>
            {savedRoutes.length} routes saved for {user.name}.
          </h1>
        </div>
        <div className="planner-stage-badges">
          <span className="status-pill">
            Plan: {user.entitlement.routeSaveLimit} routes,{" "}
            {user.entitlement.promotedStopLimit} promoted
          </span>
        </div>
      </div>

      <aside className="floating-sidebar floating-sidebar-left">
        <div className="floating-sidebar__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Saved routes</p>
            <h2>Vault</h2>
          </div>

          <div className="stop-stack">
            {savedRoutes.length ? (
              savedRoutes.map((item) => (
                <article className="stop-card" key={item.id} style={{ padding: "18px" }}>
                  <div className="card-header">
                    <div>
                      <strong className="card-title">{item.route.title}</strong>
                      <span className="card-price">${item.route.estimatedCostUsd}</span>
                    </div>
                    <Image
                      alt=""
                      src={getDestinationMedia(item.route.promotedStopId).src}
                      className="card-image-sm"
                      width={80}
                      height={60}
                    />
                  </div>
                  <p className="muted-copy text-small" style={{ margin: "10px 0 0" }}>{item.route.tagline}</p>
                </article>
              ))
            ) : (
              <p className="muted-copy">
                No saved routes yet. Generate in the planner and tap save on any
                route card.
              </p>
            )}
          </div>
          <Link href="/planner" className="button button-ghost layout-fill" style={{ marginTop: "12px" }}>
            Generate more
          </Link>
        </div>
      </aside>

      <aside className="floating-sidebar floating-sidebar-right">
        <div className="floating-sidebar__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Public shares</p>
            <h2>Published pages</h2>
          </div>

          <div className="stop-stack">
            {sharedRoutes.length ? (
              sharedRoutes.map((item) => (
                <article className="stop-card" key={item.id} style={{ padding: "18px" }}>
                  <div className="card-header">
                    <div>
                      <strong className="card-title">{item.route.title}</strong>
                    </div>
                    <Image
                      alt=""
                      src={getDestinationMedia(item.route.promotedStopId).src}
                      className="card-image-sm"
                      width={80}
                      height={60}
                    />
                  </div>
                  <Link className="button button-ghost layout-fill text-small" href={`/share/${item.slug}`} style={{ padding: "8px", marginTop: "10px" }}>
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
