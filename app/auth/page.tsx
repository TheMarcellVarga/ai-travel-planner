import Link from "next/link";

import { getOAuthProviderLabel, oauthProviders } from "@/lib/auth-providers";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

type AuthPageProps = {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    status?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const errorMessage =
    params.error === "supabase-not-configured"
      ? "Supabase auth is not configured in this local environment yet. Use demo mode or add the Supabase env vars."
      : params.error === "supabase-unavailable"
        ? "Supabase auth client could not be created. Check the project URL and public key."
        : params.error === "missing-email"
          ? "Enter an email address before continuing."
          : params.error === "oauth-start-failed"
            ? "Google sign-in could not be started. Check your Supabase OAuth provider settings."
            : params.error === "otp-start-failed"
              ? "Magic link sign-in could not be started. Check your Supabase email auth settings."
              : null;
  const successMessage =
    params.status === "account-deleted"
      ? "Your account data was deleted and the session has been closed."
      : null;

  return (
    <main className="shell auth-shell">
      <section className="page-panel auth-panel">
        <div className="section-heading">
          <p className="eyebrow">Account access</p>
          <h1>Access your route vault without fighting broken auth controls.</h1>
          <p className="muted-copy">
            Use Supabase auth when backend credentials are configured. Otherwise, enter demo mode and keep the product flow moving locally.
          </p>
        </div>

        {user ? (
          <div className="auth-state">
            <p className="lede">
              Signed in as <strong>{user.email}</strong> via {user.authMode}.
            </p>
            <form action="/api/auth/signout" method="post">
              <button className="button button-ghost" type="submit">
                Sign Out
              </button>
            </form>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="status-copy auth-status auth-status-error">{errorMessage}</p>
        ) : null}

        {successMessage ? (
          <p className="status-copy auth-status">{successMessage}</p>
        ) : null}

        {params.sent === "1" ? (
          <p className="status-copy auth-status">
            Magic link sent to <strong>{params.email}</strong>. Finish sign-in from your inbox.
          </p>
        ) : null}

        <div className="auth-grid">
          {hasSupabaseEnv ? (
            <article className="auth-card">
              <p className="eyebrow">Supabase auth</p>
              <h2>Email magic link</h2>
              <p className="muted-copy">
                Real auth is active in this environment. Use magic link or Google OAuth to sync routes, billing, and account data.
              </p>
              <form action="/api/auth/signin" className="auth-form" method="post">
                <input name="next" type="hidden" value="/saved" />
                <input name="email" placeholder="traveler@example.com" type="email" />
                <button className="button" type="submit">
                  Send Magic Link
                </button>
              </form>
              <form action="/api/auth/signin" className="auth-form" method="post">
                <input name="next" type="hidden" value="/saved" />
                {oauthProviders.map((provider) => (
                  <button
                    className="button button-ghost"
                    key={provider}
                    name="provider"
                    type="submit"
                    value={provider}
                  >
                    Continue With {getOAuthProviderLabel(provider)}
                  </button>
                ))}
              </form>
            </article>
          ) : (
            <article className="auth-card auth-card-inactive">
              <p className="eyebrow">Managed auth</p>
              <h2>Supabase is not wired on this machine yet.</h2>
              <p className="muted-copy">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to enable magic link and OAuth sign-in here.
              </p>
              <p className="muted-copy">
                Until then, use demo mode on the right. The route save, publish, and handoff flows still work locally.
              </p>
            </article>
          )}

          <article className="auth-card">
            <p className="eyebrow">Demo mode</p>
            <h2>Enter locally and keep testing.</h2>
            <p className="muted-copy">
              Demo auth uses a secure cookie so save, publish, and handoff flows work locally.
            </p>
            <form action="/api/auth/demo" className="auth-form" method="post">
              <input name="next" type="hidden" value="/saved" />
              <input defaultValue="demo@wildroute.local" name="email" type="email" />
              <button className="button" type="submit">
                Enter Demo Mode
              </button>
            </form>
            <Link className="button button-ghost" href="/planner">
              Keep Exploring Anonymously
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
