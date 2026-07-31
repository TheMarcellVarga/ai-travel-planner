# Portfolio Upgrade Roadmap

## Purpose

This roadmap applies the career and portfolio criteria in
`marcell_context_and_portfolio_goals.md` to Wild Route without replacing the
product execution authority in `docs/MASTER_EXECUTION_ROADMAP.md`.

The product roadmap answers what Wild Route needs as a product. This overlay
answers what the repository must prove to a hiring manager evaluating Marcell
as a product-focused frontend engineer with strong UX judgment.

## Review Snapshot

Reviewed: 2026-07-27.

Evidence checked:

- application routes, domain modules, API handlers, migrations, and tests
- the public README and source-of-truth documentation
- authentication, public sharing, billing, account export/delete, and fallback paths
- `npm run test`, `npm run lint`, and `npm run build`
- recent commit history and tracked repository artifacts

Verified baseline:

- 9 test files and 40 tests pass
- the Next.js 15.5.15 production build passes
- lint passes, but the script uses the deprecated `next lint` wrapper
- the repository is clean before upgrade work begins
- no deployment URL or live Supabase/Stripe verification evidence is present in the repository

## Portfolio Assessment

Recommended classification: **Flagship upgrade candidate**.

Wild Route already demonstrates a strong product concept, distinctive visual
direction, typed domain logic, same-origin APIs, deterministic route scoring,
Supabase RLS migrations, Stripe integration code, degraded states, and a
meaningful test suite. It aligns well with frontend product engineering and
trustworthy applied-AI positioning because it deliberately keeps model-like
claims, provider data, and deterministic rules separate.

It is not ready to be described as production-ready. The repository does not
yet prove a live end-to-end managed-service deployment, provider-backed travel
data, comprehensive accessibility, rate limiting, observability, or AI
evaluation. Demo persistence is process-local, and Stripe flows have automated
contract tests plus a manual checklist rather than recorded live test-mode
execution.

### Current hiring signal

| Area | Assessment | Evidence |
| --- | --- | --- |
| Career relevance | Strong | Product UI, APIs, data, auth, billing, and decision-support boundaries form a coherent product story. |
| Product credibility | Strong concept, incomplete proof | Golden path and constraints are explicit; live integrations and deployment evidence remain unverified. |
| Frontend and UX | Strong | Distinctive responsive interface, globe fallback, interaction states, and product-specific design system. |
| Backend and architecture | Credible | App Router BFF, isolated domain logic, Supabase clients/RLS, Stripe handlers, and persistence fallback boundary. |
| Reliability and testing | Moderate | Core deterministic, API, ownership, billing, and page behavior have 40 tests; no browser automation or live service integration suite. |
| Security and privacy | Moderate | Server-side auth and webhook verification exist; direct public-table access to `shared_routes` currently weakens the intended safe-snapshot boundary. |
| Applied AI credibility | Honest but early | Deterministic pipeline is correctly disclosed; provider adapters, structured model output, evals, cost, and latency evidence are not implemented. |
| Documentation | Deep internally, weak publicly | Source-of-truth docs are unusually thorough; the README has machine-specific links and over-compresses real versus fallback status. |
| Interview value | High after upgrade | Strong material for product trade-offs, graceful degradation, RLS, entitlements, and honest decision-support UX. |

## Upgrade Phase 1 — Immediate Credibility And Security Fixes

Status: complete.

Primary skill: `travel-product-guardrails`.

Support skill: `security-review-travel`.

This is the first phase under the portfolio overlay. It does not repeat the
already-complete Product And Brand Lock phase in the product roadmap.

### Deliverables

1. Replace the public `shared_routes` table-read policy with a server-only,
   sanitized public-share read path.
2. Rewrite the README around the product problem, real implementation evidence,
   architecture, quality checks, honest limitations, and portable repository
   links.
3. Replace the deprecated `next lint` script with the ESLint CLI.
4. Stop tracking generated `tsconfig.tsbuildinfo` state.
5. Record verification evidence and update roadmap status.

### Acceptance gate

- Anonymous Supabase clients cannot select entire `shared_routes` rows.
- Public share pages still render through a server-only lookup and the explicit
  public snapshot mapper.
- README links work outside the original workstation.
- README distinguishes implemented code, demo fallback, and unverified live
  integrations.
- `npm run verify:migrations`, `npm run lint`, `npm run test`, and
  `npm run build` pass.
- Each deliverable is committed independently, followed by a phase-completion
  documentation commit.

### Completion evidence

Completed: 2026-07-27.

Feature commits:

- `b5585d6` — portfolio upgrade roadmap and evidence-based phase scope
- `3c4f08c` — sanitized server-only public-share reads and policy revocation
- `c5d12f3` — recruiter-facing README with honest implementation status
- `a5f0123` — ESLint CLI migration and generated build-state cleanup

Verification:

```bash
npm run verify:migrations
npm run lint
npm run test
npm run build
```

Result:

- 4 ordered Supabase migrations verified
- direct full-row public reads of `shared_routes` are revoked
- ESLint passes
- 9 test files and 40 tests pass
- Next.js 15.5.15 production build passes

Live managed-service behavior was not claimed or marked verified during this
phase. Supabase and Stripe environment execution remains part of Upgrade Phase
2.

## Upgrade Phase 2 — Flagship Product Proof

Status: in progress.

Goal: turn existing architecture into demonstrable end-to-end evidence.

Planned outcomes:

- provider adapter boundary and deterministic provider fixtures
- route-generation evaluation set for schema, unsafe requests, stale data, and prompt injection
- integration evidence for Supabase auth/RLS and Stripe test-mode checkout/portal/webhook
- explicit fixture/live modes with freshness, latency, and failure metadata
- golden-path browser automation for plan, save, publish, share, and handoff

This phase maps primarily to product roadmap Phases 5 and 6.

### Progress evidence

Implemented and committed:

- `afb07fd` — normalized fixture/live provider contract, freshness, latency, assumptions, and failure fallback
- `f87fe0c` — strict Zod schemas and seven route-generation eval fixtures
- `673f709` — Chromium automation for plan, save, publish, share, handoff, and saved vault
- `06f306b` — isolated browser tests from the Vitest unit/integration suite
- `8933a4f` — deterministic handoff and hydration-aware browser assertions
- `1110357` — patched Next.js runtime and transitive production dependencies
- `d8695f5` — secret-safe Supabase and Stripe readiness command

Verified locally:

- 11 Vitest files and 52 tests pass
- 7 route eval fixtures pass
- Chromium golden path passes
- Next.js 15.5.22 production build passes
- `npm audit --omit=dev` reports zero known vulnerabilities

External gates still open:

- Supabase variables are present, but the configured project was not reachable
  through read-only admin queries from this environment. Auth/RLS and the live
  public-share boundary therefore remain unverified.
- Stripe is not configured. Checkout, portal, and webhook behavior is covered
  by deterministic tests, but live Stripe test-mode execution remains
  unverified.

Run `npm run verify:services:strict` when both managed services are available.
Do not mark this phase complete until that command passes and the Stripe QA
checklist records checkout, portal, and webhook delivery.

## Upgrade Phase 3 — Reliability And Accessible Interaction Evidence

Status: in progress.

Goal: demonstrate engineering depth beyond visual polish.

Planned outcomes:

- keyboard order and active reduced-motion verification
- automated accessibility checks on critical routes
- rate-limit strategy and implementation for abuse-prone endpoints
- privacy-safe logging and error-observability plan
- webhook replay/idempotency behavior
- reliable local media or explicit image degradation behavior

This phase maps primarily to product roadmap Phase 7.

Phase 3 began after a second `npm run verify:services` check confirmed that the
Phase 2 managed-service gates were still externally blocked: Supabase remained
unreachable from this environment and Stripe remained unconfigured. The user's
instruction to continue authorized locally verifiable Phase 3 work without
closing or bypassing those Phase 2 gates.

### Progress evidence

Implemented and committed:

- `c22f3c3` — axe-powered WCAG checks for `/`, `/planner`, `/auth`, and
  `/saved`, plus keyboard skip-link and active reduced-motion verification
- `0be905e` — sequential keyboard-order coverage for every visible control on
  the homepage, planner, authentication, and saved-route surfaces
- `b25bcda` — account axe coverage and demo-authenticated keyboard checks for
  saved routes and account controls
- repaired the invalid homepage ARIA region, missing auth-field labels, and
  unfocusable skip-link target discovered by the new checks

Verified locally:

- 11 Vitest files and 52 tests pass
- all 14 Chromium tests pass, including 13 focused accessibility checks and
  the existing golden path
- Next.js 15.5.22 production build passes

Open Phase 3 outcomes:

- rate limiting for abuse-prone endpoints
- privacy-safe logging and error observability
- webhook replay/idempotency behavior
- reliable local media or explicit image degradation behavior

## Upgrade Phase 4 — Presentation And Case Study

Status: queued.

Goal: package the verified product as concise portfolio evidence.

Planned outcomes:

- deployed golden path with environment and known-limitations checklist
- current desktop and mobile screenshots
- short demo walkthrough
- architecture and trust-boundary diagram
- case study covering problem framing, key decisions, trade-offs, failures, and personal contribution
- final audit that removes or labels all placeholder and fixture-backed surfaces

This phase maps primarily to product roadmap Phase 8.

## Commit Policy

For this upgrade:

- one feature, security boundary, documentation surface, or tooling change per commit
- tests and docs that define a change ship in the same commit as that change
- phase status and verification evidence use a final phase-completion commit
- no phase is marked complete when a required live-service check could not be performed
