# Project Accelerator

## Purpose
This document is the practical command center for moving Wild Route forward. It is intentionally not a copy of the finance repo. It maps the current travel app to the next implementation work with concrete tasks, target files, acceptance criteria, and verification commands.

Use this before opening broad roadmap docs when the goal is to build.

## Current Verification Snapshot
Last checked: 2026-08-22.

```bash
npm run test
npm run build
```

Result:
- `npm run test`: passed, 19 test files, 84 tests.
- `npm run test:evals`: passed, 7 fixtures.
- `npm run test:e2e`: passed, 15 tests in Chromium.
- `npm run verify:migrations`: passed, 6 migration files.
- `npm run build`: passed with Next.js 15.5.22.
- `npm audit --omit=dev`: zero known vulnerabilities.

Build routes currently include:
- public pages: `/`, `/planner`, `/saved`, `/share/[slug]`, `/auth`, `/account`, `/privacy`, `/terms`
- trip APIs: `/api/trips/plan`, `/api/trips/[generationId]`
- route APIs: `/api/routes/[routeId]/save`, `/publish`, `/handoff`
- account APIs: `/api/account/profile`, `/export`, `/delete`
- billing APIs: `/api/billing/checkout`, `/portal`, `/api/stripe/webhook`
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
- The homepage uses the same route-generation pipeline as the planner rather
  than a separately hardcoded route/price preview. Homepage and planner show
  source-attributed Open-Meteo current conditions; these do not influence safety
  or feasibility scoring.
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
- There is no live model or commercial price provider enabled yet; the guarded
  adapter seams are present and deterministic fixtures remain the default.
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
