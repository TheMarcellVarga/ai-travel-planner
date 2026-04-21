import Link from "next/link";

import { MediaCredit } from "@/components/media-credit";
import { getDestinationMedia } from "@/lib/media";
import { getCurrentUser } from "@/lib/auth";
import { getSavedRoutesForUser, getSharedRoutesForUser } from "@/lib/store/demo-store";
import {
  getSavedRoutesForUserFromDatabase,
  getSharedRoutesForUserFromDatabase
} from "@/lib/store/persistent-store";

export default async function SavedPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="planner-command-shell">
        <div className="planner-stage-globe">
           <div style={{ position: "absolute", inset: 0, background: "url('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg') center/cover", opacity: 0.2, filter: "blur(12px)" }} />
           <div style={{ position: "absolute", inset: 0, background: "rgba(3, 10, 6, 0.75)" }} />
        </div>
        <div className="planner-stage-header">
          <div className="planner-stage-title">
            <p className="eyebrow">Saved routes</p>
            <h1>Sign in to keep route hunts, published slugs, and booking history.</h1>
          </div>
        </div>
        <aside className="floating-sidebar floating-sidebar-left">
          <div className="floating-sidebar__inner">
            <p className="lede" style={{ fontSize: "0.95rem" }}>
              Anonymous users can explore the planner, but route storage and publishing are
              account-backed features.
            </p>
            <div className="button-row" style={{ flexDirection: "column", marginTop: "24px" }}>
              <Link href="/auth" className="button" style={{ width: "100%", justifyContent: "center" }}>
                Sign In
              </Link>
              <Link href="/planner" className="button button-ghost" style={{ width: "100%", justifyContent: "center" }}>
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
        <div style={{ position: "absolute", inset: 0, background: "url('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg') center/cover", opacity: 0.15, filter: "blur(12px)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(3, 10, 6, 0.75), rgba(3, 10, 6, 0.94))" }} />
      </div>

      <div className="planner-stage-header">
        <div className="planner-stage-title">
          <p className="eyebrow">Saved route vault</p>
          <h1>{savedRoutes.length} routes saved for {user.name}.</h1>
        </div>
        <div className="planner-stage-badges">
           <span className="status-pill">Plan: {user.entitlement.routeSaveLimit} routes, {user.entitlement.promotedStopLimit} promoted</span>
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
                <article className="stop-card" key={item.id} style={{ display: "grid", gap: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>{item.route.title}</strong>
                      <span style={{ display: "block", color: "var(--accent)", fontWeight: 800 }}>${item.route.estimatedCostUsd}</span>
                    </div>
                    <img 
                      alt="" 
                      src={getDestinationMedia(item.route.promotedStopId).src} 
                      style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover" }} 
                    />
                  </div>
                  <p className="muted-copy" style={{ fontSize: "0.82rem", margin: 0 }}>{item.route.tagline}</p>
                </article>
              ))
            ) : (
              <p className="muted-copy">No saved routes yet. Generate in the planner and tap save on any route card.</p>
            )}
          </div>
          <Link href="/planner" className="button button-ghost" style={{ marginTop: "12px", justifyContent: "center" }}>
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
                <article className="stop-card" key={item.id} style={{ display: "grid", gap: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>{item.route.title}</strong>
                    </div>
                    <img 
                      alt="" 
                      src={getDestinationMedia(item.route.promotedStopId).src} 
                      style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover" }} 
                    />
                  </div>
                  <Link className="button button-ghost" href={`/share/${item.slug}`} style={{ fontSize: "0.85rem", padding: "8px", justifyContent: "center" }}>
                    Open /share/{item.slug}
                  </Link>
                </article>
              ))
            ) : (
              <p className="muted-copy">No published pages yet. Publish any route from the planner to create a shareable slug.</p>
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}
