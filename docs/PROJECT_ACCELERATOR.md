# Project Accelerator

## Purpose
This document is the practical command center for moving Wild Route forward. It is intentionally not a copy of the finance repo. It maps the current travel app to the next implementation work with concrete tasks, target files, acceptance criteria, and verification commands.

Use this before opening broad roadmap docs when the goal is to build.

## Current Verification Snapshot
Last checked: 2026-11-06.

```bash
npm run test
npm run test:e2e
npm run verify:migrations
npm run lint
npm run build
```

Result:
- `npm run test`: passed, 31 test files, 123 tests (including seven route-eval fixtures).
- `npm run test:e2e`: passed, 27 tests in Chromium.
- `npm run verify:migrations`: passed, 8 migration files.
- `npm run lint`: passed.
- `npm run build`: passed with Next.js 15.5.22, including type validation.
- `npm audit --omit=dev`: last checked 2026-08-22; zero known vulnerabilities then.

Build routes currently include:
- public pages: `/`, `/planner`, `/saved`, `/share/[slug]`, `/auth`, `/account`, `/privacy`, `/terms`
- trip APIs: `/api/trips/plan`, `/api/trips/[generationId]`
- route APIs: `/api/routes/[routeId]/save`, `/publish`, `/handoff`
- account APIs: `/api/account/profile`, `/export`, `/delete`
- billing APIs: `/api/billing/checkout`, `/portal`, `/api/stripe/webhook`
- flight/weather APIs: `/api/flights/search`, `/api/weather/current`
- operational APIs: `/api/health`, `/api/newsletter/subscribe`

## What Is Real Today
- Next.js App Router app builds successfully.
- Planner route generation exists with deterministic logic.
- Prompt interpretation has unit tests.
- Route generation has unit tests.
- Demo mode uses a secure cookie, browser-local saved-route vault, and validated
  stateless preview shares so the golden path works across serverless instances.
- Supabase-backed persistent store exists for signed-in users when configured.
- Supabase auth helper exists.
- Stripe checkout, portal, and webhook routes exist.
- Billing route tests cover authentication, missing-service behavior, server-owned pricing, subscription metadata, customer persistence, and portal session creation.
- Stripe webhook tests cover unconfigured service failure, invalid signature rejection, and checkout entitlement sync.
- Stripe test-mode checkout and portal QA now has a repeatable checklist in `docs/STRIPE_TEST_MODE_QA.md`.
- Health route tests cover boolean service status and secret redaction.
- Account profile, export, and deletion routes exist.
- Public share, save, and booking handoff APIs exist.
- Public database clients cannot select full `shared_routes` rows; server-rendered shares use an admin lookup and explicit safe-snapshot mapper.
- The planner persists or reuses its initial generation so the default demo route can be saved and published.
- Current visual direction is already specific: Wild Route, jungle/adventure, route globe, editorial travel cards.

## What Is Still Fallback-Backed Or Thin
- Route generation uses local destination data and app-side scoring, not live flights/stays/weather/provider availability.
- Route generation reads through a normalized provider boundary; runtime prefers
  the configured Supabase catalog while tests and disclosed failures use the
  local deterministic fixture.
- Runtime route generation prefers the configured Supabase destination catalog
  and discloses fallback when the catalog cannot be reached or has no rows.
- The homepage shows three bundled destination examples and labels the planner
  as an interactive demo. It does not generate routes or fetch weather on page
  load. The planner uses app-side route scoring and discloses sample data and
  provider handoff boundaries.
- The planner opens the interactive route globe when available and keeps an
  ordered route fallback visible when WebGL or external globe textures fail.
- Google Flights receives a route-prefilled multi-city link. Flight dates,
  prices, availability, and booking are handled by Google; the app has no live
  flight inventory enabled.
- Planner first load no longer manufactures a default route, and unobserved
  fixture cost arithmetic is not presented as a dollar price in the UI.
- The guarded `RouteCompositionAgent` composes direct, one-stop, and two-stop
  routes, calculates exact cost breakdowns, attaches openly licensed media
  metadata, validates snapshots, and records normalized agent-run status.
- Wikimedia Commons is the primary media adapter, Openverse is the filtered
  fallback, and local Wild Route artwork is the resilient final fallback.
- Optional MapLibre rendering is wired behind a public style URL; the existing
  SVG route map remains the no-WebGL, reduced-motion, and missing-config path.
- `POST /api/trips/plan` can use the in-memory demo store when Supabase
  persistence is unavailable; route responses label that state non-durable.
- Demo saves use browser storage, demo publishing uses a bounded validated route
  recipe that omits the prompt, and handoff links are rebuilt server-side.
- Supabase migrations, required tables, RLS enablement, owner policies, public
  share revocation, and the service-role-only Stripe ledger are statically
  verified; live managed-project behavior remains environment-dependent.
- Stripe checkout and portal flows still need live Stripe test-mode verification using `docs/STRIPE_TEST_MODE_QA.md`.
- Entitlement generation limits are enforced at the planning endpoint for anonymous, demo, and Supabase users.
- Booking handoff links are external deep links, not provider-confirmed inventory.
- Remote Unsplash media now degrades once to bundled Wild Route artwork and the
  failure path is covered in Chromium.
- There is no live model or commercial price provider enabled; a Skyscanner
  endpoint is separately gated and unverified, and deterministic route fixtures
  remain the default.
- Automated keyboard order, active reduced motion, axe scans, and media failure
  behavior are covered; manual screen-reader and broader multi-browser QA remain.

## Current Phase Status
Last audited: 2026-08-01.

| Phase | Status | Reason |
| --- | --- | --- |
| 0. Control Plane | Complete | Roadmap, accelerator, agent rules, docs, and local skills exist. |
| 1. Product And Brand Lock | Complete | Product spec, target and non-target users, exact demo flow, non-goals, concrete entitlements, copy guardrails, and Wild Route visual direction are defined. |
| 2. App Shell And Design System | Complete | Routes and UI shell exist, the 2D map fallback is wired, browser QA is recorded, and the mobile planner breakpoint was checked. |
| 3. Backend And Data Foundation | Complete | Supabase migrations/RLS, clients, health, export/delete, migration verification, explicit database-vs-memory persistence metadata, and the server-only sanitized public-share boundary exist. |
| 4. Route Generation MVP | Complete | Deterministic generation, route metadata, external-search disclaimers, unsupported prompt caveats, unit tests, and trip API tests exist. |
| 5. Save, Share, Account, Billing | Partial | Core routes, generation limits, ownership tests, public-share hardening, deterministic billing/webhook tests, and Stripe test-mode QA checklist exist; live Stripe checkout/portal execution remains. |
| 6. Real Data And AI Hardening | In progress | Guarded composition agent, 0–2-stop optimizer, exact cost contracts, optional price/media adapters, strict schemas, cache/RLS migration, and eval coverage exist; live credentials, model usage, and cost tracking remain. |
| 7. Security, Observability, QA | In progress | Direct public `shared_routes` reads are revoked; bounded rate limits, privacy-safe operational events, Stripe replay protection, dependency audit, and Chromium axe/keyboard/reduced-motion/media QA exist. A formal threat model, distributed limiter, production alert sink, and broader browser/screen-reader QA remain. |
| 8. Polish And Launch Prep | Complete | The verified Vercel demo, serverless-safe golden path, no-placeholder audit, screenshots, deployment/environment checklist, demo walkthrough, trust-boundary diagram, and case study are committed. |

## Active Development Lane
The fastest useful lane is not adding live AI. It is hardening the existing product loop:

`prompt -> generated routes -> persisted generation -> save -> publish -> share page -> handoff -> account/export/delete`

This gives the project a reliable spine before deeper provider or AI work.

## Next 12 Tasks

### T1: Add API Route Tests For Planner
Phase: 4. Route Generation MVP

Status: complete.

Files:
- `app/api/trips/plan/route.ts`
- `app/api/trips/[generationId]/route.ts`
- new tests near the route or under `lib/planner`

Acceptance criteria:
- Empty prompt returns validation failure or controlled error.
- Valid prompt returns `generationId`, `tripIntent`, and routes.
- Response respects max days/stops constraints.
- Returned routes include confidence, reasons, promoted stop, and booking links.

Verification:

```bash
npm run test
npm run build
```

### T2: Enforce Generation Limits Server-Side
Phase: 5. Save, Share, Account, Billing

Status: complete.

Files:
- `app/api/trips/plan/route.ts`
- `lib/account/entitlements.ts`
- `lib/store/persistent-store.ts`
- `lib/store/demo-store.ts`

Acceptance criteria:
- Free users cannot exceed configured generation limit.
- Supabase users are checked against persisted generation count.
- Demo users are checked against demo store count.
- Anonymous users get an explicit policy, either allowed within anonymous limit or blocked after limit.

Verification:

```bash
npm run test
npm run build
```

### T3: Make Persistence Fallback Explicit In Responses
Phase: 3. Backend And Data Foundation

Status: complete.

Files:
- `app/api/trips/plan/route.ts`
- `app/api/routes/[routeId]/save/route.ts`
- `app/api/routes/[routeId]/publish/route.ts`
- `app/api/routes/[routeId]/handoff/route.ts`
- `lib/types.ts`

Acceptance criteria:
- API responses disclose whether the result was persisted to Supabase or demo memory.
- UI can show a non-alarming local/demo persistence notice when needed.
- Production paths do not silently pretend memory-backed routes are durable.

Verification:

```bash
npm run test
npm run build
```

### T4: Add Supabase Migration Verification Script
Phase: 3. Backend And Data Foundation

Status: complete.

Files:
- `scripts/verify-supabase-migrations`
- `package.json`
- `docs/DATABASE_SCHEMA.md`

Acceptance criteria:
- Script checks migration filenames are ordered.
- Script checks required table names appear in migrations.
- Script checks protected tables have RLS enable statements.
- `npm run verify:migrations` exists.

Verification:

```bash
npm run verify:migrations
npm run test
```

### T5: Add Route Ownership Tests
Phase: 5. Save, Share, Account, Billing

Status: complete.

Files:
- `lib/store/persistent-store.ts`
- `lib/store/demo-store.test.ts` or new store tests

Acceptance criteria:
- User A cannot save User B private generated route.
- Shared routes can be read only through public share payload.
- Handoff can resolve public shared route without exposing private user data.
- Demo memory fallback uses owner-or-public route resolution for save, publish, and handoff.

Verification:

```bash
npm run test
```

### T6: Harden Public Share Payload
Phase: 5. Save, Share, Account, Billing

Status: complete.

Files:
- `app/share/[slug]/page.tsx`
- `lib/store/persistent-store.ts`
- `lib/types.ts`

Acceptance criteria:
- Public share page renders from a safe route snapshot.
- No user email, billing data, private profile, or internal provider payload can appear.
- Missing slug has a clear not-found state.

Verification:

```bash
npm run test
npm run build
```

### T7: Upgrade Booking Handoff Contract
Phase: 4. Route Generation MVP

Status: complete for deterministic MVP. Live provider adapters and provider-confirmed freshness remain in Phase 6.

Files:
- `lib/planner/provider-links.ts`
- `app/api/routes/[routeId]/handoff/route.ts`
- `lib/types.ts`

Acceptance criteria:
- Every booking link has provider, kind, URL, label, and disclaimer/freshness context.
- Handoff response states external provider owns price and availability.
- Invalid route ID returns structured error.

Verification:

```bash
npm run test
npm run build
```

### T8: Expand Browser QA And Accessibility Pass
Phase: 7. Security, Observability, QA

Status: complete. Golden-path desktop/mobile QA is recorded. Automated axe
checks cover five critical routes, all visible application controls are checked
for sequential keyboard access, demo-authenticated saved/account states are
covered, and active reduced-motion emulation passes.

Files:
- `docs/BROWSER_QA.md`

Acceptance criteria:
- Extend the existing Phase 2 browser QA record to include public share, signed-in/demo saved routes, account states, and reduced motion.
- Add keyboard navigation checks for planner controls, route cards, auth, saved routes, and account forms.
- Add accessibility notes for focus visibility, labels, route confidence text, and non-map alternatives.
- Record any issues with exact route, viewport, and reproduction steps.

Verification:

```bash
npm run test:e2e -- e2e/accessibility.spec.ts
npm run build
```

### T9: Add Route Generation Fixture Set
Phase: 6. Real Data And AI Hardening

Files:
- `lib/planner/fixtures`
- `lib/planner/generate-routes.test.ts`
- `docs/AI_AND_ROUTE_GENERATION.md`

Acceptance criteria:
- Fixtures cover vague adventure prompt, surf prompt, hiking prompt, direct-only prompt, and unsafe/unsupported prompt.
- Expected outputs validate schema, stop count, tags, and no guaranteed claims.

Verification:

```bash
npm run test
```

### T10: Add Provider Adapter Boundary
Phase: 6. Real Data And AI Hardening

Files:
- `lib/planner/providers/*`
- `lib/planner/generate-routes.ts`
- `lib/types.ts`

Acceptance criteria:
- Destination metadata remains local for now.
- Provider interface returns normalized data with `freshness`, `confidence`, and `status`.
- Route generator can run with a fixture provider.
- No live API keys are required.

Verification:

```bash
npm run test
npm run build
```

### T13: Build Guarded Route Composition Agent
Phase: 6. Real Data And AI Hardening

Status: complete for the deterministic first slice. Live model and commercial
price adapters remain feature-flagged follow-up work.

Files:
- `lib/planner/route-composition-agent.ts`
- `lib/planner/providers/price-provider.ts`
- `lib/planner/providers/media-provider.ts`
- `components/planner/route-map-libre.tsx`
- `supabase/migrations/20260822081641_route_agent_runs_and_destination_media.sql`

Acceptance criteria:
- Route generation validates a deterministic, persisted-ready snapshot.
- Direct, one-stop, and two-stop options retain exact cost breakdowns.
- Departure-date absence is disclosed as a planning estimate.
- Commons/Openverse media is license-filtered, attributed, cached, and locally
  resilient.
- MapLibre is optional and the SVG route fallback remains primary for
  accessibility and WebGL failure.
- User-owned agent-run metadata and public media cache rows have RLS policies.

Verification:

```bash
npm run test
npm run test:evals
npm run verify:migrations
npm run build
```

### T11: Add Health Check Coverage
Phase: 3. Backend And Data Foundation

Status: complete.

Files:
- `app/api/health/route.ts`
- `app/api/health/route.test.ts`

Acceptance criteria:
- Health route reports Supabase, Stripe, email config status without exposing values.
- Missing optional integrations are reported as disabled, not fatal.

Verification:

```bash
npm run test
npm run build
```

### T12: No-Placeholder Product Audit
Phase: 8. Polish And Launch Prep

Files:
- `docs/UNFINISHED_SURFACES_AUDIT.md`
- all pages under `app`

Acceptance criteria:
- Every visible placeholder, fixture-only claim, broken CTA, and incomplete surface is listed.
- Each item has one decision: finish, remove, hide, or label as demo.
- Audit becomes the final polish queue.

Verification:

```bash
npm run build
```

## Recommended Sprint Order
Sprint 1: Product Spine Hardening
- T1: Add API Route Tests For Planner
- T2: Enforce Generation Limits Server-Side
- T3: Make Persistence Fallback Explicit In Responses
- T5: Add Route Ownership Tests

Sprint 2: Trust And Durability
- T4: Add Supabase Migration Verification Script
- T6: Harden Public Share Payload
- T7: Upgrade Booking Handoff Contract
- T11: Add Health Check Coverage

Sprint 3: Route Quality
- T9: Add Route Generation Fixture Set
- T10: Add Provider Adapter Boundary
- T13: Build Guarded Route Composition Agent

Sprint 4: Launch Readiness
- T8: Expand Browser QA And Accessibility Pass
- T12: No-Placeholder Product Audit

## What Not To Do Next
- Do not add live AI before route persistence and entitlement limits are tested.
- Do not add flight/hotel provider APIs before the provider adapter boundary exists.
- Do not redesign the whole UI before the golden path is verified.
- Do not treat demo memory fallback as production persistence.
- Do not add more broad docs unless they remove ambiguity for a specific implementation task.

## Task Kickoff Template
Use this exact format when starting a task from this accelerator:

```md
Task:
Phase:
Primary files:
Expected behavior:
Tests to add:
Verification:
Risk:
```

## Interview Demo Simplification — 2026-11-05

Phase: 8 (polish and launch prep). Primary skill: `nextjs-travel-ui`;
support: `travel-product-guardrails` and `impeccable` distillation.

The presentation path is overview → planner → demo access → save/share → external
flight search. The homepage uses bundled destination examples rather than running
a generation and weather requests on every visit. Repeated workflow/metrics/story
sections, newsletter signup, header status copy, and the duplicate planner CTA
have been removed from the presentation surface.

The empty planner opens its brief, disables empty submissions, keeps preference
edits when collapsed, and puts optional settings behind a disclosure. Weather is
removed from the planner's decision surface. The interactive globe is the route
overview when available, with the ordered journey as a resilient fallback.
Public-share pages offer only flight search, keeping save/publish controls in the
private planner. Route reasoning, source attribution, data freshness,
assumptions, app confidence, and price boundaries remain available.
External handoff returns a visible provider link rather than relying on an async
popup. Demo access uses a unique server-generated session identity without asking for an email.
Saved routes use a simple reading layout. Demo accounts expose only local saves,
shared previews, and sign-out; unavailable account features live in a disclosure.

Paid-plan controls and the checkout/portal endpoints are disabled in demo mode.
Managed-account billing UI and API routes also require
`BILLING_UI_ENABLED=true` after completing `docs/STRIPE_TEST_MODE_QA.md`;
credentials alone do not enable billing. Existing server billing security and
entitlement rules remain in place. No live AI generation or in-app provider
inventory is claimed; Google Flights remains an external handoff.

Acceptance: no empty-route dead end, no lost preference edits, no billing action
in demo mode, clear local-save boundaries, responsive layouts, and a verified
plan/save/share/handoff journey. Verification: unit tests, lint, production build,
and Chromium accessibility, responsive, media fallback, and journey tests.

Verified locally for this pass: 105 unit tests in 24 files; 24 Chromium browser
tests; ESLint; production build including TypeScript checks. Regression coverage
also verifies that guests start with an empty planner instead of reusing another
anonymous visitor's process-memory generation. Demo remains a portfolio preview:
local saves, curated/fixture route data, and external provider confirmation.

Double-check follow-up (2026-11-05): demo session identities are unique and
server-generated, preventing shared process-memory history across visitors. Demo
redirects are restricted to app destinations. Save/share/handoff requests time out
and missing share/provider links show a controlled error instead of success.
Follow-up verification: 109 unit tests in 26 files, 24 Chromium tests, ESLint,
and the production build including TypeScript validation all pass. For an
interview walkthrough, explore the demo before planning, then compare, save,
publish, and follow the external flight-search link.

### Globe restored — 2026-11-06

The interactive route globe is restored in the planner following user feedback.
The ordered journey view remains visible when WebGL is unavailable or the globe
times out. The current globe still depends on externally hosted earth textures.
A focused fallback test and a local browser check cover the change; this does not
constitute a fresh full-suite or deployed verification.

## Phase 6 task: Skyscanner flight search — 2026-11-06

Primary skill: `route-generation-ai`; support: `travel-product-guardrails` and
`security-review-travel`. The user selected Skyscanner. Build an opt-in server-only
flight search for explicitly dated itinerary legs, separate from fixture route and
stay estimates. Skyscanner returns complete-itinerary prices, not per-leg or
flight-plus-hotel totals; never distribute those prices across fixture lines or
mark stays as provider observed. Include all booking links for a multi-ticket
option and a transfer warning; bookings happen on external sites.

The integration is off unless credentials and an explicit server flag are set.
Access is limited to managed authenticated users, requests are schema validated,
rate limited, timeout bounded, and provider results are sanitized and not logged
or persisted. Tests mock provider traffic; no live calls occur in tests or CI.
Skyscanner access is partner-approved and must be obtained by the user. The
existing in-process rate limiter is not a distributed production spending control;
production activation requires a distributed quota and partner approval. Missing
credentials, missing leg dates, incomplete provider results, and failures must
produce explicit states, never invented prices. This is a Phase 6 integration,
not a claim that the overall Phase 6 or production gate is complete.

Implementation notes: `app/api/flights/search` accepts 1–4 contiguous, dated
three-letter city/airport legs and requires a managed Supabase session, but it is
not connected to the planner UI. Current route actions use a Google Flights
handoff and do not request inventory. After the server flag and partner key are
configured, API callers must submit explicit codes and dates; the adapter uses
one adult, economy, Singapore market, and USD. Quotes are returned only as
complete-itinerary flight prices with links for all bookings; they are not added
to route snapshots or shown as total trip prices. Partial searches are labeled
and no result is promised to remain available. The provider adapter uses the
create/poll API, bounds polling and timeouts, validates provider data, and only
accepts HTTPS `agw.skyscnr.com` booking links. Unknown link hosts are discarded
pending partner verification.

Skyscanner's published Travel API eligibility requires a commercial business and
at least 100,000 monthly active users. As of 2026-11-06, that is a likely blocker
for an individual portfolio project. No partner credentials or real responses
were available for verification. Activation requires approved access, setting
`SKYSCANNER_API_KEY` privately and `SKYSCANNER_ENABLED=true` on the server, a
managed account, and production-grade distributed quota controls. Do not paste
keys into chat or commit them. Partner activation and any billing are user-owned.
Source: https://www.partners.skyscanner.net/contact/travel-api

Verification: 121 unit tests (31 files), including nine new mocked provider/API/UI
tests; ESLint; TypeScript; and an isolated production build passed. A local browser
check confirmed the disconnected state. No Skyscanner requests were made.

### Provider access follow-up

Skyscanner's published 100,000 monthly-active-user threshold makes partner access
unlikely for this portfolio project. User asked to find a Google Flights GitHub
solution. Research on 2026-11-06 found:

- SerpApi's maintained Google Flights integration supports multi-city via
  `multi_city_json`, with a staged `departure_token` flow for selecting each leg
  and a `booking_token` flow for booking options. The vendor's GitHub repository
  is https://github.com/serpapi/google-flights-scraper and documentation is
  https://serpapi.com/google-flights-api. As published, the free plan allows
  250 searches per month, and the Starter plan is $25/month for 1,000 searches:
  https://serpapi.com/pricing. A complete multi-city selection can take multiple
  searches, so do not present the free quota as 250 full trip bookings.
- SerpApi is a third-party hosted scraper, not an official Google API. Route/date
  searches are transmitted to SerpApi; its documentation says ZeroTrace is
  Enterprise-only. Review retention and terms before using real user itineraries.
- https://github.com/punitarani/fli provides a JavaScript port and free
  self-hosted parsing, but its own current README says multi-city search and
  booking-option retrieval are unavailable due to Google changes. It is not an
  adequate replacement for Wild Route's central multi-stop use case.

No Google Flights data API has been integrated or live-tested. The planner now
builds a route-prefilled Google Flights handoff; Google owns dates, inventory,
prices, and booking. The optional Skyscanner API adapter remains disabled.
Mocked provider tests are not evidence of live provider access.


### Route-based flight search simplification — 2026-11-06

For the interview demo, the user chose a direct link to Google Flights using the
selected route stops. The planner does not display in-app flight inventory.
Google owns date selection, flight availability, prices, and booking.
The multi-city `tfs` link was checked in a browser with multiple route options;
the selected origin, intermediate stops, and return destination appeared in
Google Flights. Google supplied suggested dates, which still require user review.

### Interview demo verification — 2026-11-06

The sign-in screen now keeps the local demo entry available when managed auth is
not configured, so the plan/save/share handoff is reachable without fake account
credentials. OAuth buttons appear only for providers listed in
`AUTH_OAUTH_PROVIDERS`. Checkout and billing portal APIs fail closed unless
`BILLING_UI_ENABLED=true`, just like their UI controls. Final local verification
passed: 123 unit tests, 27 Chromium tests, migration verification for 8 files,
ESLint, and a production build with type validation. The main browser journey
covers planning, comparing, saving, publishing, public preview, and the external
flight handoff.
