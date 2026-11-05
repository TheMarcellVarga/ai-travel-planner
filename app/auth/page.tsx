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
      ? "Supabase auth is not configured in this environment. Use demo mode or add the Supabase environment variables."
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
    <main className="shell auth-shell auth-simple">
      <section className="page-panel auth-panel auth-simple__card" aria-labelledby="auth-title">
        <div className="section-heading auth-simple__heading">
          <h1 id="auth-title">
            {user?.authMode === "supabase"
              ? "You’re signed in"
              : user?.authMode === "demo"
                ? "Your demo is ready"
                : "Welcome to Wild Route"}
          </h1>
          <p className="muted-copy">
            {user?.authMode === "supabase"
              ? "Your routes are ready when you are."
              : user?.authMode === "demo"
                ? "Your demo routes stay in this browser."
                : hasSupabaseEnv
                  ? "Sign in to sync routes, or explore with demo data."
                  : "Explore with sample data. Demo routes stay in this browser."}
          </p>
        </div>

        {errorMessage ? (
          <p className="status-copy auth-status auth-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="status-copy auth-status" role="status">
            {successMessage}
          </p>
        ) : null}
        {params.sent === "1" ? (
          <p className="status-copy auth-status" role="status">
            Check your inbox for a sign-in link sent to <strong>{params.email}</strong>.
          </p>
        ) : null}

        {user ? (
          <div className="auth-simple__account">
            <p>
              {user.authMode === "supabase" ? (
                <>Signed in as <strong>{user.email}</strong></>
              ) : (
                "Demo session active on this device."
              )}
            </p>
            <Link className="button auth-simple__button" href="/saved">
              View saved routes
            </Link>
            <form action="/api/auth/signout" method="post">
              <button className="button button-ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <>
            {hasSupabaseEnv ? (
              <>
                <form
                  action="/api/auth/signin"
                  className="auth-form auth-simple__form"
                  method="post"
                >
                  <input name="next" type="hidden" value="/saved" />
                  <label className="field" htmlFor="auth-email">
                    <span>Email address</span>
                    <input
                      id="auth-email"
                      name="email"
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <button className="button auth-simple__button" type="submit">
                    Continue with email
                  </button>
                </form>
                {oauthProviders.length > 0 ? (
                  <form action="/api/auth/signin" className="auth-simple__providers" method="post">
                    <input name="next" type="hidden" value="/saved" />
                    {oauthProviders.map((provider) => (
                      <button
                        className="button button-ghost"
                        key={provider}
                        name="provider"
                        type="submit"
                        value={provider}
                      >
                        Continue with {getOAuthProviderLabel(provider)}
                      </button>
                    ))}
                  </form>
                ) : null}
                <p className="auth-simple__hint">
                  We’ll email you a secure link. No password needed.
                </p>
                <p className="auth-simple__or" aria-hidden="true">
                  <span>or</span>
                </p>
              </>
            ) : (
              <p className="auth-simple__hint">
                Account sign-in is not connected in this preview.
              </p>
            )}
            <form
              action="/api/auth/demo"
              className="auth-simple__demo"
              method="post"
            >
              <input name="next" type="hidden" value="/saved" />
              <button
                className={`button${hasSupabaseEnv ? " button-ghost" : ""} auth-simple__button`}
                type="submit"
              >
                Explore demo
              </button>
            </form>
          </>
        )}
        <div className="auth-simple__footer">
          <Link href="/planner">Continue exploring</Link>
        </div>
      </section>
    </main>
  );
}
