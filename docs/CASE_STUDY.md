# Wild Route Case Study

## At A Glance

**Role:** Product-focused frontend engineer / individual project owner  
**Product:** Prompt-first adventure route planning and decision support  
**Core stack:** Next.js, React, TypeScript, Supabase, Stripe, Zod, Vitest, Playwright  
**Current mode:** Transparent portfolio deployment with deterministic route data and optional managed services

Wild Route turns a rough travel idea into ranked, explainable multi-stop routes
that can be saved, shared, and continued through external booking searches. It
does not sell travel or imply that planning estimates are confirmed inventory.

## The Product Problem

Independent travelers often split early trip planning across maps, flight
searches, destination articles, notes, and chat threads. That fragmentation
makes it hard to compare a route as a whole: why these stops, which constraints
were respected, how confident is the suggestion, and what still needs external
verification?

The product goal was to make that decision loop coherent without turning Wild
Route into a false booking engine. A useful result had to be specific enough to
act on and honest enough to critique.

## My Contribution

This is an individual product-engineering project. Marcell owned:

- product framing, user flow, visual direction, and interaction design
- responsive React/Next.js implementation and the route-planning workspace
- typed route interpretation, ranking, entitlement, and provider boundaries
- same-origin API contracts, Supabase schema/RLS, auth-aware persistence, and Stripe surfaces
- public-share privacy boundary, degradation states, accessibility, and test strategy
- roadmap, architecture decisions, launch evidence, and documentation

AI development tools were used as an implementation and review accelerator.
Product decisions, acceptance gates, repository guardrails, verification, and
the final shipped artifacts remained under Marcell's direction.

## Key Decisions

### 1. Make the “AI” behavior inspectable

The current route engine is deterministic TypeScript, not a hidden model call.
Prompts are normalized into a typed intent, destination candidates are selected
from known metadata, routes are scored, entitlement rules are enforced, and the
result carries reasons, assumptions, confidence, and freshness.

This was a deliberate trust decision. It creates a stable baseline for tests
and lets a future model improve interpretation without owning authorization,
data access, or final route shape.

### 2. Treat the globe as enhancement, not navigation

The cinematic globe supports the adventure identity, but route cards and a 2D
map/list fallback carry the actual decision-making flow. Reduced-motion users,
small screens, slow devices, and WebGL failures keep access to the same route
information and actions.

### 3. Put sensitive integration boundaries behind the server

Browser clients call same-origin Next.js handlers. Supabase service credentials,
Stripe secrets, webhook verification, entitlement updates, and public-share
lookups stay server-side. User-owned tables use RLS and server ownership checks;
public shares pass through an explicit safe-snapshot mapper.

### 4. Degrade visibly instead of simulating production

When managed services are missing, the app can still demonstrate the product
flow through a secure demo cookie and per-instance memory. Responses and UI copy
identify that data as non-durable. Provider failures disclose fixture fallback,
remote media swaps to bundled artwork, and billing/auth surfaces explain when
configuration is absent.

## Trade-offs

| Choice | Benefit | Cost / follow-up |
| --- | --- | --- |
| Deterministic route engine before live AI | Repeatable behavior, low cost, strong tests, honest claims | Less natural interpretation; model-backed parsing remains future work |
| Fixture destination data | Reliable offline demo and CI | No confirmed availability, weather, advisories, or provider freshness |
| Next.js BFF rather than a separate API | Small deployment surface and clear secret boundary | Long-running provider work will eventually need queues or workers |
| Per-instance demo store | Golden path works without hosted accounts | Data disappears on restart and cannot support production usage |
| 3D globe plus fallback | Memorable interface without excluding constrained devices | More implementation and QA complexity than a list-only planner |
| App-instance rate limiting | Immediate bounded abuse control | Multi-instance launch requires shared storage or edge enforcement |

## Failures And What Changed

The strongest engineering evidence came from issues found during verification:

- **Save and publish initially failed for default routes.** The default planner
  rendered route objects before persisting a generation, so actions could not
  resolve the route ID. The page now reuses the latest generation or persists
  the default once before actions become available.
- **The first public-share boundary was too broad.** Anonymous database reads
  could select whole share rows. Direct public table reads were revoked;
  server-only lookup plus a whitelist mapper now defines the public payload.
- **Webhook retries could repeat entitlement work.** A service-only event ledger
  now claims Stripe event IDs, leases processing, suppresses completed replays,
  and permits safe retries after failure or lease expiry.
- **Remote editorial images could leave broken surfaces.** A resilient image
  component now degrades once to bundled Wild Route artwork, with automated
  browser coverage and correct meaningful/decorative alt behavior.
- **Accessibility automation found real defects.** Invalid ARIA, an unlabeled
  auth input, and an unfocusable skip target were repaired; keyboard order,
  reduced motion, and axe checks now run in Chromium.

## Verification Evidence

The repository contains deterministic unit/API tests, route eval fixtures,
Supabase migration checks, and browser automation for the golden path,
accessibility, keyboard interaction, reduced motion, and media failure.

The repeatable gate is:

```bash
npm run verify:migrations
npm run lint
npm run test
npm run test:e2e
npm run build
npm audit --omit=dev
```

Live Supabase and Stripe evidence is intentionally separate:

```bash
npm run verify:services:strict
```

That command must pass in a configured environment before managed persistence
or live test-mode billing is described as verified.

## Outcome

Wild Route demonstrates the target product-engineering profile: interaction and
visual judgment paired with typed domain logic, backend boundaries, security,
accessibility, failure handling, and evidence-driven delivery. The result is a
credible portfolio product today and a clear foundation for live provider and
model integrations later.

## Known Limits

- Destination data and route ranking remain fixture-backed.
- Supabase auth/RLS and Stripe test-mode execution have not passed the live
  Phase 2 gate in the currently available environment.
- Demo persistence and newsletter preferences are per-instance and non-durable.
- Rate limiting is not distributed, and operational events have no production
  sink or alerts configured here.
- Automated accessibility coverage targets Chromium and does not replace a
  manual screen-reader or broader browser pass.

See the [unfinished surfaces audit](UNFINISHED_SURFACES_AUDIT.md),
[deployment record](DEPLOYMENT.md), and [demo walkthrough](DEMO_WALKTHROUGH.md)
for the presentation-ready evidence package.
