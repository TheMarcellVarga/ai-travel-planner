# Deployment Record

## Current Portfolio Deployment

- Canonical URL: https://ai-travel-planner-psi-five.vercel.app
- Platform: Vercel production
- Verified: 2026-08-01
- Verified application commit: `e83adab`
- Deployment ID: `dpl_CqiKvLUdzPjWD4gkod4SrKfVEuTi`
- Framework: Next.js 15.5.22
- Deployment state: ready

This is a transparent portfolio/demo deployment. It proves the public product
and serverless-safe demo golden path; it does not claim live managed Supabase,
Stripe, email, travel-provider, or model execution.

## Environment State

The production project currently has no configured application environment
variables. `/api/health` correctly reports `degraded` with these boolean service
states:

| Service | Configured |
| --- | --- |
| Supabase auth | No |
| Supabase database | No |
| Supabase admin API | No |
| Stripe billing | No |
| Email delivery | No |

No secret values are returned by the health endpoint. Missing services do not
break builds or public/demo exploration.

## Verified Hosted Golden Path

The canonical deployment was checked in the in-app Chromium browser after the
production build completed:

1. `/` rendered the product framing and planner CTA.
2. Demo sign-in created a secure session and redirected to `/saved`.
3. `/planner` rendered four ranked routes, planning-estimate language, and the
   2D route fallback.
4. Save stored the selected route in the browser-local demo vault.
5. Publish returned a validated stateless `/share/preview-*` link.
6. The share link rendered from a different serverless request without relying
   on process memory and did not embed the original prompt.
7. Booking handoff returned a provider search and displayed the successful
   handoff state.
8. `/saved` hydrated the browser-local route and preview-share link.

Hosted route checks returned `200` for `/`, `/planner`, `/auth`, `/saved`,
`/account`, `/privacy`, `/terms`, and `/api/health`.

## Deployment Failure Found And Repaired

The first Phase 4 production check found that demo Save returned `Route not
found.` Vercel page rendering and API actions can execute in different function
instances, so a generation written to process memory was not a reliable bridge
between requests.

The repaired demo boundary is explicit:

- saved demo routes live in the current browser's `localStorage`
- published demo previews encode a bounded, schema-validated route recipe
- the recipe omits the original prompt and regenerates only public route data
- booking links are rebuilt by the server rather than trusted from the client
- managed Supabase accounts continue to use database ownership and RLS paths

This repair makes the portfolio walkthrough reliable without representing demo
storage as managed persistence.

## Release Checklist

### Required For Every Deployment

- [x] Production build completes.
- [x] Public, planner, auth, saved, account, privacy, terms, and health routes respond.
- [x] Demo sign-in, plan, save, publish, share, and handoff work across serverless requests.
- [x] Fixture, estimate, external-provider, browser-local, and stateless-preview boundaries are visible.
- [x] No environment or secret values appear in health output or client-facing copy.
- [x] Automated test, accessibility, media-degradation, and production dependency gates pass locally.

### Required Before Enabling Managed Services

- [ ] Configure the variables in `.env.example` in the correct Vercel environments.
- [ ] Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS URL.
- [ ] Apply all Supabase migrations in order.
- [ ] Configure Supabase redirect URLs and OAuth providers.
- [ ] Run `npm run verify:services:strict` against the deployed configuration.
- [ ] Complete the live Supabase auth/RLS/public-share checks from Upgrade Phase 2.
- [ ] Configure Stripe test-mode product/price, checkout return URLs, and webhook endpoint.
- [ ] Complete `docs/STRIPE_TEST_MODE_QA.md` and record event IDs without customer data.
- [ ] Configure independent production values for rate-limit and observability hash secrets.

### Required Before A Production Launch Claim

- [ ] Select and verify a live travel-data provider with freshness and failure policy.
- [ ] Replace per-instance rate limiting with shared storage or edge enforcement.
- [ ] Configure an operational-event sink, retention, dashboards, and alerts.
- [ ] Add durable newsletter consent storage and unsubscribe handling.
- [ ] Complete manual screen-reader and broader browser/device verification.
- [ ] Review privacy/terms copy for the actual launch jurisdictions and processors.

## Known Limitations

- Route interpretation and ranking use deterministic destination fixtures.
- Prices are Wild Route planning estimates; availability is externally confirmed.
- Demo saves are device/browser-specific and are not account records.
- Preview-share recipes are public, validated, and stateless; they are not owner-managed records.
- Supabase, Stripe, email, live providers, and live AI are disabled in this deployment.
- Rate limiting is per application instance.
- Operational events have no hosted sink or alerts.
- Automated browser and accessibility evidence targets Chromium.

Upgrade Phase 2 remains open until live Supabase and Stripe verification passes.
The deployment above must not be used as evidence that those managed-service
checks are complete.
