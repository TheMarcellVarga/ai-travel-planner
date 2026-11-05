# Environment

## Local Setup
1. Copy `.env.example` to `.env.local`.
2. Add Supabase URL and publishable key.
3. Add Supabase service-role key only for server/admin local flows.
4. Configure OAuth providers in Supabase if testing social sign-in.
5. Add Stripe variables only when testing billing.
6. Add Resend-compatible email variables only when testing email.
7. Run migrations in `supabase/migrations` in order.
8. Install dependencies and start the app.

```bash
npm install
npm run verify:migrations
npm run verify:services
npm run dev
```

## Required For Core App
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Fallback:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted for older projects.

## Server/Admin
- `SUPABASE_SERVICE_ROLE_KEY`

Rules:
- Server-only.
- Never expose to browser bundles.

## App URL
- `NEXT_PUBLIC_APP_URL`

Default:
- `http://localhost:3000`

## OAuth Providers
- `AUTH_OAUTH_PROVIDERS` (optional comma-separated list: `google`, `github`)

Rules:
- Enable only providers configured in the Supabase project.
- The sign-in UI and server route accept only the explicitly enabled providers.

## Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `BILLING_UI_ENABLED` (default: `false`)

Rules:
- The flag gates account controls and checkout/portal API routes. Keep it false
  until the Stripe test-mode QA checklist passes.
- Webhook verification requires `STRIPE_WEBHOOK_SECRET`.
- Live checkout and portal verification should follow `docs/STRIPE_TEST_MODE_QA.md`.

## Email
- `RESEND_API_KEY`
- `EMAIL_FROM`

Rules:
- Email should be optional for local non-email work.
- Missing email config must not crash unrelated pages.

## Operational Privacy Salts
- `RATE_LIMIT_HASH_SECRET`
- `OBSERVABILITY_HASH_SECRET`

Rules:
- Server-only, random, and independent from provider/auth secrets.
- Recommended in production so pseudonymous rate-limit and operational keys
  remain stable across process restarts.
- When absent, each process creates an ephemeral random salt so builds and local
  development remain functional without retaining raw identifiers.

## Optional Provider Variables
Each provider needs:
- server-only API key
- data freshness policy
- rate-limit policy
- fallback behavior
- privacy review

The optional Skyscanner adapter is disabled by default and is not connected to
the planner UI. Do not enable `SKYSCANNER_ENABLED` or add its API key without
approved partner access and production-grade shared quota controls. The planner
currently hands selected routes to Google Flights for external search.

## Health Checks
Use `/api/health` to inspect whether auth/database/billing/email wiring is present without exposing secret values.

Use `npm run verify:services` for read-only reachability and mode checks. The
report exposes booleans and status labels only; it does not print URLs, keys,
account IDs, or provider error payloads.

Use `npm run verify:services:strict` only when CI or a release environment is
expected to provide reachable Supabase admin access, a verified public-share
read boundary, and reachable Stripe test-mode configuration.

## CI Defaults
- External paid calls disabled.
- Live AI disabled.
- Deterministic fixtures preferred.
- Secrets available only in protected environments.
