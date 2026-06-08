# Agent Instructions

## Project Identity
This repo is for Wild Route: an AI-assisted adventure travel planner for prompt-first route discovery, multi-stop itinerary ranking, saved routes, public sharing, and external booking handoff.

It is not a travel agency, OTA, airline, insurance seller, visa authority, or guaranteed-price booking engine. Future agents must keep the product honest: route planning and travel decision support with clear assumptions, confidence, freshness, and handoff boundaries.

## Source Of Truth
Before implementing product, AI, backend, schema, security, billing, or UX work, read the relevant docs in this order:

1. `docs/MASTER_EXECUTION_ROADMAP.md`
2. `docs/PROJECT_ACCELERATOR.md`
3. `AI-TRAVEL-PLANNER-PLAN.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ARCHITECTURE.md`
6. `docs/AI_AND_ROUTE_GENERATION.md`
7. `docs/SECURITY_PRIVACY_AND_COMPLIANCE.md`
8. `docs/IMPLEMENTATION_PROCESS.md`

`docs/MASTER_EXECUTION_ROADMAP.md` is the execution authority. Follow its phase order, dependency rules, task template, and acceptance gates unless the user explicitly updates the roadmap.

Use `ai-dev/skills` as the repo-local skill source for future AI-assisted implementation. These skills are planning and review scaffolds; install or copy them into the active agent skill path only when needed.

## Product Guardrails
- Do not present generated route prices, availability, safety, visa rules, or weather as guaranteed.
- Do not imply Wild Route completes bookings; v1 records and redirects to external booking providers only.
- Always distinguish app-side route scoring from provider-confirmed travel data.
- Free-plan behavior must preserve the domain rule: one promoted stop per route unless the entitlement says otherwise.
- Adventure copy can be bold, but it must not encourage unsafe travel, illegal activity, ignored advisories, animal harm, or irresponsible environmental behavior.
- If external travel data is stale, partial, missing, or fixture-backed, disclose that in the UI and API response.
- AI outputs must expose assumptions, confidence, and route reasoning. Avoid pretending deterministic rules are a live LLM.

## Architecture Rules
- Next.js App Router owns marketing pages, app UI, server route handlers, auth-aware BFF behavior, billing/webhook surfaces, and route rendering.
- Supabase owns auth, Postgres, RLS, user-owned route data, profiles, entitlements, and persisted route generations.
- Stripe owns checkout, billing portal, subscription status, and entitlement sync.
- Resend-compatible email delivery owns transactional route/account notifications.
- Provider integrations must be isolated behind app-owned adapters, not scattered through UI components.
- Browser clients may call same-origin Next.js route handlers. They must not receive service-role keys, Stripe secrets, provider secrets, webhook secrets, or unrestricted database access.
- Keep builds tolerant of missing production secrets. External clients should be lazy-initialized and feature-gated.

## AI And Route Generation Rules
- Treat route generation as a pipeline: validate input -> interpret intent -> select candidates -> fetch or read metadata -> score -> enforce entitlements -> persist snapshot -> render/share.
- Do not let model calls access raw database credentials or unrestricted user data.
- Persist generated results before exposing save/share/handoff actions when a durable route ID is required.
- Add deterministic tests for prompt interpretation, scoring constraints, entitlement limits, and share/handoff behavior before relying on AI polish.
- Live AI or paid provider calls must stay disabled in tests and CI unless explicitly approved.
- If real model integration is added later, use schema validation, safety fixtures, citation/freshness fields, usage accounting, and fallback behavior.

## Security Rules
- Treat user identity, prompts, route generations, saved routes, shared route ownership, billing identifiers, profile defaults, and email addresses as sensitive.
- Never expose service-role keys, Stripe keys, webhook secrets, OAuth secrets, Resend keys, or raw auth tokens to the client.
- Validate every API input with a schema or explicit parser.
- Enforce ownership on every user-owned route, generation, handoff, profile, entitlement, export, and deletion path.
- Stripe webhooks require signature verification.
- Supabase RLS policies must remain enabled for user-owned tables.
- Scrub emails, prompts, precise travel plans, billing identifiers, and raw provider payloads from analytics and error logs unless explicitly safe.

## Working Style
- Start every implementation task by identifying the roadmap phase and primary/support skill.
- Do not skip ahead to later roadmap phases unless the current phase gate is satisfied or the user explicitly changes priority.
- If a requested task conflicts with the roadmap, update the roadmap or call out the exception before implementation.
- Prefer documented decisions in this repo over inventing new architecture.
- If a plan is ambiguous, update the docs before writing production code.
- Keep changes scoped. No unrelated refactors, no hidden provider switches, and no accidental rewrites of user edits.
- Add tests proportional to risk, especially around auth, RLS, billing, route generation, entitlement limits, AI behavior, and privacy.
- After frontend changes, verify the relevant route in a browser when a dev server target is known.
