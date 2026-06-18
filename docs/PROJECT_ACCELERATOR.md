# Project Accelerator

## Purpose
This document is the practical command center for moving Wild Route forward. It is intentionally not a copy of the finance repo. It maps the current travel app to the next implementation work with concrete tasks, target files, acceptance criteria, and verification commands.

Use this before opening broad roadmap docs when the goal is to build.

## Current Verification Snapshot
Last checked: 2026-06-17.

```bash
npm run test
npm run build
```

Result:
- `npm run test`: passed, 4 test files, 11 tests.
- `npm run build`: passed with Next.js 15.5.15.

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
- Demo in-memory store exists for local anonymous/demo behavior.
- Supabase-backed persistent store exists for signed-in users when configured.
- Supabase auth helper exists.
- Stripe checkout, portal, and webhook routes exist.
- Account profile, export, and deletion routes exist.
- Public share, save, and booking handoff APIs exist.
- Current visual direction is already specific: Wild Route, jungle/adventure, route globe, editorial travel cards.

## What Is Still Fallback-Backed Or Thin
- Route generation uses local destination data and app-side scoring, not live flights/stays/weather/provider availability.
- `POST /api/trips/plan` falls back to the in-memory demo store if Supabase persistence is unavailable.
- Save/publish/handoff routes fall back to the demo store when database writes are unavailable.
- API route tests are missing.
- Supabase RLS behavior is documented but not automatically verified.
- Entitlement generation limits are enforced at the planning endpoint for anonymous, demo, and Supabase users.
- Booking handoff links are external deep links, not provider-confirmed inventory.
- There is no AI model path yet, which is acceptable until deterministic route generation is stronger.
- Broader browser/accessibility QA remains for Phase 7.

## Current Phase Status
Last audited: 2026-06-17.

| Phase | Status | Reason |
| --- | --- | --- |
| 0. Control Plane | Complete | Roadmap, accelerator, agent rules, docs, and local skills exist. |
| 1. Product And Brand Lock | Complete | Product spec, target and non-target users, exact demo flow, non-goals, concrete entitlements, copy guardrails, and Wild Route visual direction are defined. |
| 2. App Shell And Design System | Complete | Routes and UI shell exist, the 2D map fallback is wired, browser QA is recorded, and the mobile planner breakpoint was checked. |
| 3. Backend And Data Foundation | Complete | Supabase migrations/RLS, clients, health, export/delete, migration verification, and explicit database-vs-memory persistence metadata exist. |
| 4. Route Generation MVP | Complete | Deterministic generation, route metadata, external-search disclaimers, unsupported prompt caveats, unit tests, and trip API tests exist. |
| 5. Save, Share, Account, Billing | Partial | Core routes, generation limits, and Stripe webhook exist; ownership tests, public-share hardening, and live billing verification remain. |
| 6. Real Data And AI Hardening | Not started | No provider adapter boundary, live data/freshness metadata, AI schema/evals, or usage tracking. |
| 7. Security, Observability, QA | Not started | No threat model, rate limits, analytics/log scrubbing implementation, browser QA, accessibility pass, or observability setup. |
| 8. Polish And Launch Prep | Not started | No no-placeholder audit, screenshots, deployment checklist, or demo walkthrough. |

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

Files:
- `docs/BROWSER_QA.md`

Acceptance criteria:
- Extend the existing Phase 2 browser QA record to include public share, signed-in/demo saved routes, account states, and reduced motion.
- Add keyboard navigation checks for planner controls, route cards, auth, saved routes, and account forms.
- Add accessibility notes for focus visibility, labels, route confidence text, and non-map alternatives.
- Record any issues with exact route, viewport, and reproduction steps.

Verification:

```bash
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

### T11: Add Health Check Coverage
Phase: 3. Backend And Data Foundation

Files:
- `app/api/health/route.ts`
- new tests

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
