# Master Execution Roadmap

## Purpose
This roadmap turns Wild Route into an executable build plan. It is the control plane for future AI-assisted implementation: what to build, in what order, which repo-local skills to use, what artifacts each phase produces, and which gates must pass before work moves forward.

The goal is not to build every idea at once. The goal is a polished, production-style travel planner with honest route generation, managed backend services, durable user data, billing-ready entitlements, and a distinctive adventure brand.

## Operating Model
- Start each implementation task by naming the current roadmap phase.
- Do not skip phases unless the user explicitly updates the roadmap or confirms a deliberate exception.
- If a task belongs to a later phase, record it as queued instead of implementing it early.
- Work in phases, not scattered features.
- Each phase must produce visible artifacts: docs, code, tests, screenshots, deploys, eval results, or verified migrations.
- Use the repo-local skills in `ai-dev/skills` to route future AI work.
- Keep the product boundary fixed: route discovery and planning support, not direct booking, guaranteed pricing, visa/legal advice, or unsafe travel encouragement.
- Every implementation task should name phase, skill, target files, acceptance criteria, and verification command.
- For day-to-day execution, use `docs/PROJECT_ACCELERATOR.md` after this roadmap. It records the current build/test snapshot, real-vs-fallback audit, and concrete next task queue.

## Skill Routing
Use this routing table when assigning future AI tasks.

| Work Type | Primary Skill | Support Skill |
| --- | --- | --- |
| Product copy, free/pro limits, route claims, safety wording | `travel-product-guardrails` | `security-review-travel` |
| Landing page, planner UI, route cards, map/globe, mobile polish | `nextjs-travel-ui` | frontend taste skill when available |
| Supabase migrations, RLS, profile/entitlement tables | `supabase-travel-schema` | `security-review-travel` |
| Prompt interpretation, ranking, provider adapters, AI evals | `route-generation-ai` | `travel-product-guardrails` |
| Auth, privacy, billing, export/delete, webhook review | `security-review-travel` | relevant subsystem skill |

## Timeline Overview
Assume a focused solo/AI-assisted build. Compress or expand based on available time, but keep the order.

| Phase | Current Status | Outcome |
| --- | --- | --- |
| 0. Control Plane | Complete | Repo docs, agent rules, local skills, roadmap, and source-of-truth map are in place. |
| 1. Product And Brand Lock | Complete | Positioning, MVP user, golden path, entitlement rules, and visual direction are explicit. |
| 2. App Shell And Design System | Complete | Landing, planner, saved routes, account, shared route views, responsive navigation, and visual tokens are coherent. |
| 3. Backend And Data Foundation | Complete | Supabase migrations, auth/RLS, route-generation persistence, profile/entitlement flows, and health checks are reliable. |
| 4. Route Generation MVP | Complete | Prompt interpretation, destination matching, scoring, free-plan promoted-stop rule, booking handoff links, and tests are stable. |
| 5. Save, Share, Account, Billing | Partially implemented | Saved routes, public shares, account export/delete, Stripe checkout/portal/webhook, and entitlement enforcement are production-style. |
| 6. Real Data And AI Hardening | Not started | Provider adapters, freshness metadata, optional live AI path, structured outputs, cost controls, and eval fixtures are added. |
| 7. Security, Observability, QA | Not started | Abuse controls, webhook validation, privacy review, logging plan, visual QA, and browser verification are complete. |
| 8. Polish And Launch Prep | Not started | No-placeholder pass, README/case study, screenshots, deployment checklist, and demo walkthrough are ready. |

## Current Completion Audit
Last audited: 2026-06-17.

Verification:

```bash
npm run test
npm run build
```

Current result:
- Tests pass: 4 files, 11 tests.
- Production build passes on Next.js 15.5.15.

| Phase | Done Now | Not Done Yet | Status |
| --- | --- | --- | --- |
| 0. Control Plane | `AGENTS.md`, `app/AGENTS.md`, `docs/*`, `ai-dev/*`, README map, and `docs/PROJECT_ACCELERATOR.md` exist. | Nothing blocking. | Complete |
| 1. Product And Brand Lock | Product spec, guardrails, target users, non-target users, exact demo script, MVP golden path, concrete Free/Pro limits, non-goals, copy boundaries, and visual direction are documented. Existing UI reflects the Wild Route brand. | Nothing blocking Phase 2 implementation. Future pricing/product changes should be explicit roadmap changes. | Complete |
| 2. App Shell And Design System | Public/app routes build: `/`, `/planner`, `/saved`, `/share/[slug]`, `/auth`, `/account`, `/privacy`, `/terms`. Header/footer/global styles and distinctive planner UI exist. `RouteMapFallback` is wired into `RouteGlobe`. Browser QA covers homepage, planner, saved, auth, account, planner interaction, and mobile planner viewport. | Broader accessibility and multi-browser QA remain in Phase 7. | Complete |
| 3. Backend And Data Foundation | Supabase migrations exist for entitlements, destinations, generation, saved routes, shared routes, booking handoffs, and profiles. RLS policies exist. Server/admin Supabase clients, health endpoint, export/delete flows, and demo fallback exist. `npm run verify:migrations` validates migration order, required tables, RLS enablement, owner policies, and public share policy. Generation/save/publish/handoff APIs disclose database vs memory persistence. | Live Supabase application remains environment-dependent; deeper owner-isolation API tests remain in Phase 5. | Complete |
| 4. Route Generation MVP | Deterministic prompt interpretation, destination matching, scoring, 3-4 route options, confidence, reasons, promoted stop, booking links, planning-estimate metadata, external-search disclaimers, unsupported safety/visa/guarantee caveats, unit tests, and trip API tests exist. | Live provider adapters and provider-confirmed freshness remain Phase 6 hardening work. | Complete |
| 5. Save, Share, Account, Billing | Save, publish, handoff, account profile, export, delete, checkout, portal, and Stripe webhook routes exist. Save limit is enforced. Webhook signature verification exists. | Generation limit is displayed but not enforced by `/api/trips/plan`. Route ownership/API behavior lacks automated tests. Public share payload has not had a documented privacy hardening pass. Stripe flows are not live-verified here. | Partial |
| 6. Real Data And AI Hardening | None beyond deterministic route generation and external booking search links. | No provider adapter boundary, live travel data, freshness metadata, optional AI path, AI schema/evals, or usage/cost tracking. | Not started |
| 7. Security, Observability, QA | Basic auth checks, RLS policies, server-only clients, and webhook signature verification exist. | No threat model, rate-limit strategy, analytics/log scrubbing implementation, browser QA checklist/pass, accessibility pass, or observability setup. | Not started |
| 8. Polish And Launch Prep | README and process docs exist; app builds. | No no-placeholder audit, screenshots, deployment checklist, demo walkthrough, or final launch/case-study package. | Not started |

## Phase 0: Control Plane
Status: complete.

Primary skills: none.

Deliverables:
- `AGENTS.md`
- `app/AGENTS.md`
- `docs/*` source-of-truth documents
- `ai-dev/README.md`
- `ai-dev/skills/*`
- `docs/PROJECT_ACCELERATOR.md`
- README documentation map

Acceptance gate:
- Future agents can identify the source of truth.
- Every high-risk surface has a doc: architecture, API, database, AI/route generation, security, testing, environment, and implementation process.
- No implementation task is blocked by missing process guidance.

## Phase 1: Product And Brand Lock
Status: complete.

Primary skills: `travel-product-guardrails`, `nextjs-travel-ui`.

Deliverables:
- `docs/PRODUCT_SPEC.md`
- target user and value proposition
- MVP golden path
- free/pro entitlement rules
- route claim boundaries
- brand and media direction
- exact demo script
- copy guardrails
- non-target users and non-goals

Acceptance gate:
- Wild Route can be explained in one sentence without implying it books travel.
- The free-plan promoted-stop limit is concrete enough to test.
- The MVP demo flow is exact.
- Visual direction is specific enough to preserve across implementation.
- Free and Pro limits are concrete and aligned with `lib/account/entitlements.ts`.
- Copy guardrails prevent guaranteed price, safety, visa/legal, and direct-booking claims.

## Phase 2: App Shell And Design System
Status: complete.

Primary skills: `nextjs-travel-ui`.

Deliverables:
- responsive landing page
- planner workspace
- saved routes page
- account page
- auth page
- public share page
- header/footer/navigation
- global theme tokens
- map/globe fallback behavior
- Phase 2 browser QA record in `docs/BROWSER_QA.md`

Acceptance gate:
- Public and authenticated routes render on desktop and mobile.
- The app has loading, empty, and error states for route generation.
- The globe/map does not block core route-card usability.
- Visual direction matches Wild Route: jungle/adventure/editorial, not generic SaaS.

## Phase 3: Backend And Data Foundation
Status: complete.

Primary skills: `supabase-travel-schema`, `security-review-travel`.

Deliverables:
- Supabase migrations for generations, saved routes, shared routes, booking handoffs, entitlements, profiles, newsletter
- RLS policies for user-owned data
- server/admin Supabase clients
- health endpoint
- account export and delete flows
- deterministic store fallback where explicitly intended
- `npm run verify:migrations`
- explicit API persistence metadata for database vs memory fallback

Acceptance gate:
- Migrations apply in order.
- Anonymous exploration works without granting private data access.
- Save/share/account APIs enforce ownership.
- Health endpoint reflects missing optional services without crashing builds.
- Static migration verification passes.
- Demo-memory fallback is explicit in API responses.

## Phase 4: Route Generation MVP
Status: complete.

Primary skills: `route-generation-ai`, `travel-product-guardrails`.

Deliverables:
- prompt interpretation
- structured `TripIntent`
- destination candidate selection
- route scoring
- 3-5 ranked route options
- promoted-stop entitlement enforcement
- confidence and reasons
- booking handoff links
- unit tests for intent and generation
- trip planning API tests
- planning-estimate and external-search metadata
- unsupported safety/visa/guarantee caveats

Acceptance gate:
- Routes respect origin, days, stop count, tags, and budget mode.
- Free users get exactly one promoted stop per generated route.
- Confidence values and reasons are plausible and clearly app-generated.
- Missing provider data does not fabricate confirmed prices or availability.
- Invalid trip planning input returns a controlled `400` response.
- Booking links disclose external provider search status.

## Phase 5: Save, Share, Account, Billing
Status: partially implemented.

Primary skills: `security-review-travel`, `supabase-travel-schema`.

Deliverables:
- Supabase Auth session behavior
- saved routes
- public share slugs
- booking handoff records
- account profile preferences
- account export
- account deletion guardrails
- Stripe checkout
- Stripe portal
- Stripe webhook entitlement sync

Acceptance gate:
- Signed-in users can retrieve only their own saved/private route data.
- Public share pages expose only intended public route snapshots.
- Stripe webhook signature failure is rejected.
- Entitlements are server-enforced, not UI-only.

## Phase 6: Real Data And AI Hardening
Status: not started.

Primary skills: `route-generation-ai`, `security-review-travel`.

Deliverables:
- provider adapter contracts for flights/stays/maps/weather/travel advisories where selected
- cache/freshness fields
- optional model-backed prompt interpretation
- structured AI output schema
- deterministic fixture mode for tests
- eval fixtures for unsafe travel, stale data, prompt injection, and schema validity
- cost/latency/usage tracking

Acceptance gate:
- Live calls are disabled by default in local tests and CI.
- AI outputs include assumptions, confidence, and freshness.
- Unsafe or impossible travel prompts are reframed or refused.
- Provider failures degrade to partial route results with visible status.

## Phase 7: Security, Observability, QA
Status: not started.

Primary skills: `security-review-travel`.

Deliverables:
- threat model
- privacy review
- rate-limit strategy
- analytics/event scrubbing plan
- error monitoring plan
- webhook replay/idempotency notes
- browser QA checklist
- accessibility pass

Acceptance gate:
- No secrets are exposed in client bundles.
- User-owned API paths enforce auth and ownership.
- Prompt and route data are not sent to analytics by default.
- Critical flows have tests or documented manual verification.

## Phase 8: Polish And Launch Prep
Status: not started.

Primary skills: `nextjs-travel-ui`, `travel-product-guardrails`.

Deliverables:
- no-placeholder audit
- production README
- demo walkthrough
- screenshots
- deployment checklist
- environment variable checklist
- known limitations
- portfolio/case-study narrative if needed

Acceptance gate:
- Visible scaffolds are finished, replaced, or removed.
- The golden path can be demoed end to end.
- Docs match the shipped product.
- Deployment risks are listed explicitly.

## Task Template
Use this for future implementation tasks:

```md
Phase:
Primary skill:
Support skill:
Goal:
Files:
Acceptance criteria:
Verification:
Risks / guardrails:
```

## Verification Commands
Current commands:

```bash
npm run test
npm run build
```

Notes:
- `npm run lint` currently maps to `next lint`; verify the installed Next.js version still supports that command before treating it as required.
- Add dedicated migration, API contract, browser, and AI eval scripts as those surfaces mature.
