import Link from "next/link";

import { BillingActions } from "@/components/account/billing-actions";
import { supportedCurrencies, travelStyles } from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth";
import { hasStripeEnv } from "@/lib/env";
import {
  getSavedRoutesForUserFromDatabase,
  getSharedRoutesForUserFromDatabase
} from "@/lib/store/persistent-store";

type AccountPageProps = {
  searchParams: Promise<{ status?: string; error?: string; billing?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    return (
      <main className="shell auth-shell">
        <section className="page-panel auth-panel">
          <div className="section-heading">
            <p className="eyebrow">Account</p>
            <h1>Your routes, in one place.</h1>
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

  if (user.authMode === "demo") {
    return (
      <main className="shell auth-shell">
        <section className="page-panel auth-panel demo-account">
          <div className="section-heading">
            <h1>Your demo workspace.</h1>
            <p className="lede">Saved routes stay in this browser. Share links show a public route preview.</p>
          </div>
          <div className="button-row">
            <Link href="/saved" className="button">View saved routes</Link>
            <Link href="/planner" className="button button-ghost">Plan a route</Link>
            <form action="/api/auth/signout" method="post">
              <button className="button button-ghost" type="submit">Sign Out</button>
            </form>
          </div>
          <details className="demo-account__features">
            <summary>Account features</summary>
            <p className="muted-copy">Profiles, cloud sync, and billing are unavailable in demo mode.</p>
            <BillingActions hasBilling={false} canManage={false} />
          </details>
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
  const isManagedAccount = user.authMode === "supabase";
  const statusMessage =
    params.status === "profile-saved"
      ? "Account profile updated."
      : params.billing === "success"
        ? "Billing checkout completed. Stripe may take a few seconds to sync the entitlement."
        : params.billing === "cancelled"
          ? "Billing checkout was cancelled."
          : null;
  const errorMessage =
    params.error === "invalid-profile"
      ? "Enter a valid name and account preference values."
      : params.error === "sign-in-required"
        ? "Sign in before managing account settings."
        : params.error === "supabase-unavailable"
          ? "Supabase is unavailable in this environment."
          : params.error === "delete-confirmation"
            ? 'Type "DELETE" before requesting permanent account deletion.'
            : params.error === "cancel-billing-first"
              ? "Cancel your active subscription in the billing portal before deleting the account."
              : params.error === "delete-failed"
                ? "Account deletion failed. Check the service-role configuration and try again."
                : null;

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

        {statusMessage ? <p className="status-copy auth-status">{statusMessage}</p> : null}
        {errorMessage ? (
          <p className="status-copy auth-status auth-status-error">{errorMessage}</p>
        ) : null}

        <div className="auth-grid" style={{ marginBottom: "18px" }}>
          {isManagedAccount ? (
            <article className="auth-card">
              <p className="eyebrow">Account profile</p>
              <h2>Identity and travel defaults</h2>
              <p className="muted-copy">
                Update your details and travel preferences.
              </p>
              <form action="/api/account/profile" className="auth-form" method="post">
                <label className="field">
                  <span>Full name</span>
                  <input
                    defaultValue={user.profile?.fullName ?? user.name}
                    name="fullName"
                    required
                    type="text"
                  />
                </label>
                <label className="field">
                  <span>Home airport</span>
                  <input
                    defaultValue={user.profile?.homeAirportCode ?? ""}
                    maxLength={8}
                    name="homeAirportCode"
                    placeholder="SIN"
                    type="text"
                  />
                </label>
                <label className="field">
                  <span>Preferred currency</span>
                  <select
                    defaultValue={user.profile?.preferredCurrency ?? "USD"}
                    name="preferredCurrency"
                  >
                    {supportedCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Travel style</span>
                  <select defaultValue={user.profile?.travelStyle ?? "balanced"} name="travelStyle">
                    {travelStyles.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="newsletter-option">
                  <input
                    defaultChecked={Boolean(user.profile?.newsletterOptIn)}
                    name="newsletterOptIn"
                    type="checkbox"
                  />
                  <span>
                    <strong>Monthly newsletter</strong>
                    <small>Account-level marketing consent stored with your profile.</small>
                  </span>
                </label>
                <label className="newsletter-option">
                  <input
                    defaultChecked={Boolean(user.profile?.routeAlertsOptIn)}
                    name="routeAlertsOptIn"
                    type="checkbox"
                  />
                  <span>
                    <strong>Route alerts</strong>
                    <small>Enable emails for save, publish, and booking handoff events.</small>
                  </span>
                </label>
                <button className="button" type="submit">
                  Save Account Settings
                </button>
              </form>
            </article>
          ) : (
            <article className="auth-card auth-card-inactive">
              <p className="eyebrow">Account profile</p>
              <h2>Managed profile is disabled in demo mode.</h2>
              <p className="muted-copy">
                Sign in with Supabase to persist preferences, export data, delete the account, and sync billing.
              </p>
              <Link className="button" href="/auth">
                Switch To Managed Sign-In
              </Link>
            </article>
          )}

          <article className="auth-card">
            <p className="eyebrow">Subscription</p>
            <h2>Billing status</h2>
            <p className="muted-copy">
              Status: {user.entitlement.subscriptionStatus ?? "inactive"}
            </p>
            <p className="muted-copy">
              Period end: {user.entitlement.currentPeriodEnd ?? "n/a"}
            </p>
            <BillingActions hasBilling={hasStripeEnv && process.env.BILLING_UI_ENABLED === "true"} canManage={hasPortal} />
          </article>
        </div>

        <div className="auth-grid">
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

          {isManagedAccount ? (
            <article className="auth-card">
              <p className="eyebrow">Data lifecycle</p>
              <h2>Export or delete account data</h2>
              <p className="muted-copy">
                Export includes profile, entitlements, generations, saved routes, shares, and booking handoffs.
              </p>
              <div className="button-row" style={{ marginTop: "18px" }}>
                <a className="button button-ghost" href="/api/account/export">
                  Export Account JSON
                </a>
              </div>
              <form action="/api/account/delete" className="auth-form" method="post">
                <label className="field">
                  <span>Type DELETE to confirm permanent removal</span>
                  <input
                    autoComplete="off"
                    name="confirmation"
                    placeholder="DELETE"
                    type="text"
                  />
                </label>
                <button className="button button-ghost" type="submit">
                  Delete Account
                </button>
              </form>
            </article>
          ) : (
            <article className="auth-card auth-card-inactive">
              <p className="eyebrow">Data lifecycle</p>
              <h2>Demo sessions do not support export or deletion.</h2>
              <p className="muted-copy">
                The managed account flows depend on Supabase auth identity and the service-role admin API.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
