import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

type AuthPageProps = {
  searchParams: Promise<{ sent?: string; email?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  return (
    <main className="shell auth-shell">
      <section className="page-panel auth-panel">
        <div className="section-heading">
          <p className="eyebrow">Account access</p>
          <h1>Sign in to save routes and publish a public share page.</h1>
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

        {params.sent === "1" ? (
          <p className="status-copy">
            Magic link sent to <strong>{params.email}</strong>. Finish sign-in from your inbox.
          </p>
        ) : null}

        <div className="auth-grid">
          <article className="auth-card">
            <p className="eyebrow">Supabase auth</p>
            <h2>Email magic link</h2>
            <p className="muted-copy">
              Works with real Supabase credentials. Falls back to demo mode guidance when env vars are missing.
            </p>
            <form action="/api/auth/signin" className="auth-form" method="post">
              <input name="next" type="hidden" value="/saved" />
              <input name="email" placeholder="traveler@example.com" type="email" />
              <button className="button" disabled={!hasSupabaseEnv} type="submit">
                Send Magic Link
              </button>
            </form>
            <form action="/api/auth/signin" method="post">
              <input name="next" type="hidden" value="/saved" />
              <input name="provider" type="hidden" value="google" />
              <button className="button button-ghost" disabled={!hasSupabaseEnv} type="submit">
                Continue With Google
              </button>
            </form>
          </article>

          <article className="auth-card">
            <p className="eyebrow">Demo mode</p>
            <h2>Try the product without backend secrets.</h2>
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

