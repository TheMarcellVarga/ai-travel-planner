# Testing Strategy

## Principle
Testing should scale with risk. Route generation, auth, ownership, RLS, billing, account deletion, and AI/provider behavior require stronger coverage than static marketing pages.

## Current Command

```bash
npm run test
npm run test:evals
```

## Unit Tests
Targets:
- prompt interpretation
- origin normalization
- wish-tag inference
- route scoring
- promoted-stop enforcement
- provider link building
- entitlement utilities
- profile validation
- environment guards

Existing examples:
- `lib/planner/intent.test.ts`
- `lib/planner/generate-routes.test.ts`
- `lib/account/profile.test.ts`
- `lib/store/demo-store.test.ts`
- `lib/planner/providers/resolve-provider.test.ts`

## API Tests
Targets:
- `POST /api/trips/plan`
- save route
- publish route
- handoff route
- account export
- account delete
- billing checkout
- billing portal
- Stripe webhook
- health endpoint

Rules:
- Auth-required endpoints must reject anonymous requests.
- Owner-only endpoints must reject cross-user access.
- Webhooks must reject invalid signatures.

## Database Tests
Targets:
- migrations apply in order
- RLS enabled on protected tables
- owner can read/write own rows
- other users cannot read/write protected rows
- public shared routes expose only safe fields

## AI And Provider Evals
Executable fixtures live in `lib/planner/evals` and currently cover:
- schema validity
- stale data disclosure
- unsafe travel prompt handling
- prompt injection resistance
- no guaranteed price/availability claims
- entitlement enforcement
- provider failure fallback
- ownership isolation

The suite validates provider payloads and completed route generations against
strict Zod schemas. Malformed or unavailable providers must fall back without
leaking raw error content.

## Frontend QA
Check:
- homepage
- planner workspace
- saved routes
- account page
- auth page
- public share page
- mobile layout
- desktop layout
- reduced motion
- keyboard navigation
- visible focus
- loading/empty/error states
- globe failure fallback

## Golden Path
1. User opens homepage.
2. User generates route options anonymously.
3. User reviews cards and map/globe.
4. User signs in.
5. User saves a route.
6. User publishes a public share.
7. User opens share URL.
8. User records booking handoff.
9. User visits account page.
10. User exports account data.

## Acceptance Rule
No high-risk feature is complete until it has either automated tests or a documented manual verification checklist with exact steps.
