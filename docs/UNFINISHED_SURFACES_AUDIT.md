# Unfinished Surfaces Audit

## Scope

Portfolio Upgrade Phase 4 / product roadmap Phase 8.

Audited on 2026-08-01 across public routes, authenticated routes, API-facing
status copy, README claims, navigation targets, and repository-wide placeholder
markers.

Decision vocabulary:

- **Finish**: required implementation remains before the surface can be called complete.
- **Label**: keep the useful preview behavior and state its boundary in the UI.
- **Hide**: remove the surface from the presented product until it is functional.
- **Remove**: delete obsolete scaffolding.

## Result

No lorem ipsum, `href="#"` navigation, “coming soon” panels, fake customer
names, or unowned TODO/FIXME markers appear in the shipped application. Form
placeholder text is instructional input guidance, not unfinished product copy.

The remaining incomplete surfaces are intentional service or data boundaries:

| Surface | Current behavior | Decision | Evidence / launch condition |
| --- | --- | --- | --- |
| Route destination data | Deterministic local destination fixture drives ranking. | Label | Planner output exposes fixture mode, observation time, assumptions, and external-inventory disclaimer. Finish only after a selected provider passes freshness, failure, privacy, and cost gates. |
| Cost and confidence | App-generated planning estimate and app-defined route fit. | Label | Planner and public share use “est.”, “app confidence”, and provider-ownership language. Never relabel as confirmed without provider evidence. |
| Booking | Opens external provider searches; Wild Route does not transact. | Label | Handoff API and UI preserve the external-booking boundary. This is the intended v1 endpoint, not scaffolding. |
| Demo auth and route storage | Secure demo cookie plus per-instance memory. | Label | Auth, planner, saved, and account surfaces state that demo data is not durable. Managed durability requires live Supabase verification. |
| Newsletter signup | Preferences are held in per-instance memory; optional email may send a confirmation. | Label | Signup now returns and renders explicit non-durable persistence metadata. Finish with durable consent storage and unsubscribe handling before production marketing use. |
| Managed auth and persistence | Code and migrations exist; live environment remains unverified. | Label | Auth switches to an inactive explanatory state when variables are absent. Upgrade Phase 2 remains open until strict service verification passes. |
| Stripe billing | Checkout, portal, webhook signature, replay ledger, and tests exist; live test mode is unverified. | Label | Account explains unavailable billing when configuration is absent. Do not show or claim live billing evidence until the test-mode checklist passes. |
| Editorial media | Remote licensed imagery can fail. | Finish | `ResilientImage` swaps failed remote media to bundled artwork; browser automation verifies the state. No broken-image placeholder remains. |
| 3D globe | WebGL, performance, or reduced-motion conditions can prevent the globe. | Finish | Accessible 2D/list fallback is a first-class route view; planner usability does not depend on WebGL. |
| Rate limiting | Bounded per-instance protection exists. | Label | UI has no false global-limit claim. Production multi-instance use requires a distributed adapter or edge enforcement. |
| Observability | Privacy-safe structured events exist without a hosted sink or alert policy. | Label | Documentation states the boundary. Finish by configuring a production sink, retention, dashboards, and alerts. |
| Accessibility verification | Automated axe, keyboard, and reduced-motion coverage targets Chromium. | Label | Keep manual screen-reader and broader browser checks in known limitations. Do not claim universal accessibility conformance. |

## Removed Or Repaired During The Audit

- Replaced “local machine/session” wording with deployment-safe “environment”
  and “app instance” language.
- Added explicit newsletter persistence metadata to the API response and
  confirmation UI.
- Updated README limitations so completed rate-limit, observability, webhook
  replay, and media-degradation work is no longer described as missing.
- Verified every application navigation target resolves to a real route or an
  intentionally external provider/license destination.

## Release Decision

The product is suitable for a transparent portfolio deployment in demo mode.
It is not suitable for claims of production-ready managed persistence, live
billing, live provider inventory, globally distributed abuse controls, or full
cross-browser accessibility. Those boundaries must remain visible in the demo,
README, deployment record, and case study.
