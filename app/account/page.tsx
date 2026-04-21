import Link from "next/link";

import { BillingActions } from "@/components/account/billing-actions";
import { getCurrentUser } from "@/lib/auth";
import { hasStripeEnv } from "@/lib/env";
import {
  getSavedRoutesForUserFromDatabase,
  getSharedRoutesForUserFromDatabase
} from "@/lib/store/persistent-store";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="shell auth-shell">
        <section className="page-panel auth-panel">
          <div className="section-heading">
            <p className="eyebrow">Account</p>
            <h1>Sign in to manage your billing, saved routes, and subscription.</h1>
          </div>
          <div className="button-row" style={{ marginTop: "24px" }}>
            <Link href="/auth" className="button">
              Sign In
            </Link>
            <Link href="/planner" className="button button-ghost">
              Back To Planner
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const savedRoutes =
    user.authMode === "supabase"
      ? await getSavedRoutesForUserFromDatabase(user.id)
      : [];
  const sharedRoutes =
    user.authMode === "supabase"
      ? await getSharedRoutesForUserFromDatabase(user.id)
      : [];
  const hasPortal = Boolean(user.entitlement.stripeCustomerId);

  return (
    <main className="shell auth-shell">
      <section className="page-panel auth-panel">
        <div className="section-heading">
          <p className="eyebrow">Account</p>
          <h1>{user.name}</h1>
          <p className="lede">
            {user.email} · {user.authMode} · plan {user.entitlement.plan}
          </p>
        </div>

        <div className="auth-grid">
          <article className="auth-card">
            <p className="eyebrow">Subscription</p>
            <h2>Billing status</h2>
            <p className="muted-copy">
              Status: {user.entitlement.subscriptionStatus ?? "inactive"}
            </p>
            <p className="muted-copy">
              Period end: {user.entitlement.currentPeriodEnd ?? "n/a"}
            </p>
            <BillingActions hasBilling={hasStripeEnv} canManage={hasPortal} />
          </article>

          <article className="auth-card">
            <p className="eyebrow">Usage</p>
            <h2>Current allowance</h2>
            <p className="muted-copy">
              Saves: {savedRoutes.length} / {user.entitlement.routeSaveLimit}
            </p>
            <p className="muted-copy">
              Published shares: {sharedRoutes.length}
            </p>
            <p className="muted-copy">
              Generations per cycle: {user.entitlement.generationLimit}
            </p>
            <div className="button-row" style={{ marginTop: "16px" }}>
              <Link href="/saved" className="button button-ghost">
                View Saved Routes
              </Link>
              <form action="/api/auth/signout" method="post">
                <button className="button button-ghost" type="submit">
                  Sign Out
                </button>
              </form>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
