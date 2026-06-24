# API Spec

## Principles
- Validate all request bodies.
- Return structured errors.
- Enforce auth and ownership server-side.
- Include freshness/confidence/assumption fields where route data may be incomplete.
- Do not expose provider secrets or raw provider payloads.

## Error Shape

```ts
type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};
```

## Route Planning

### `POST /api/trips/plan`
Creates a route-generation result.

Request:

```ts
type PlanTripRequest = {
  prompt: string;
  origin?: string;
  tripLengthDays?: number;
  maxStops?: number;
  wishTags?: string[];
  budgetMode?: "value" | "balanced" | "comfort";
};
```

Response:

```ts
type PlanTripResponse = {
  generationId: string;
  tripIntent: TripIntent;
  routes: RouteOption[];
  entitlement: {
    plan: "free" | "pro";
    generationLimit: number;
  };
  usage: {
    limit: number;
    used: number;
    remaining: number;
    allowed: boolean;
  };
};
```

Rules:
- Anonymous users may plan within free limits.
- When the generation limit is reached, the endpoint returns `403` with `code: "GENERATION_LIMIT_REACHED"` and entitlement usage metadata.
- Prompt must not be empty.
- `tripLengthDays` and `maxStops` must be bounded.
- Response must not claim confirmed price or availability unless a provider confirms it.

### `GET /api/trips/[generationId]`
Returns a persisted generation result.

Rules:
- Public access is allowed only if the generation is intentionally public or decoupled from private owner data.
- Private generation access requires owner auth.

## Route Actions

### `POST /api/routes/[routeId]/save`
Saves a generated route to the signed-in user's vault.

Rules:
- Requires auth.
- Enforce route-save entitlement server-side.
- Route must belong to a generation the user can access.

### `POST /api/routes/[routeId]/publish`
Creates or updates a public share slug for a route.

Rules:
- Requires auth.
- Public payload must be a safe route snapshot.
- Do not expose user email, billing identifiers, private notes, or internal provider payloads.
- The public `/share/[slug]` page must read through the public-share mapper, which redacts owner IDs, generation IDs, booking links, and any non-whitelisted route JSON fields.

### `POST /api/routes/[routeId]/handoff`
Records outbound booking intent and returns external provider URLs.

Rules:
- Auth is optional if anonymous handoff is allowed.
- Persist enough metadata for analytics without storing sensitive raw provider payloads.
- Provider final price and availability remain external.

## Account

### `GET /api/account/profile`
Returns signed-in user profile and preferences.

### `PATCH /api/account/profile`
Updates profile fields.

Rules:
- Requires auth.
- Validate preferred currency, home airport, travel style, and notification booleans.

### `GET /api/account/export`
Returns account-owned export data.

Rules:
- Requires auth.
- Include saved routes, shared route metadata, profile, entitlement, and booking handoff history where appropriate.

### `DELETE /api/account/delete`
Deletes account-owned data.

Rules:
- Requires auth.
- Block or warn when active Stripe subscription exists according to product policy.

## Auth

### `POST /api/auth/signin`
Starts Supabase sign-in flow.

### `POST /api/auth/signout`
Ends current session.

### `GET /auth/callback`
Handles Supabase auth callback.

## Billing

### `POST /api/billing/checkout`
Creates Stripe checkout session.

Rules:
- Requires auth.
- Uses configured pro price ID.
- Does not trust client-submitted price IDs.

### `POST /api/billing/portal`
Creates Stripe billing portal session.

Rules:
- Requires auth.
- User must have or resolve a Stripe customer ID.

### `POST /api/stripe/webhook`
Receives Stripe subscription lifecycle events.

Rules:
- Verify Stripe signature.
- Invalid signatures must return a generic error without echoing provider details.
- Update entitlements from trusted Stripe event data.
- Implement idempotency for repeated events in Phase 7.

## Operational

### `GET /api/health`
Reports service configuration status.

Rules:
- Must not reveal secrets.
- Can report missing optional integrations by boolean status.

## Future API Work
- Add OpenAPI contract once API shape stabilizes.
- Add request IDs and structured logs.
- Add rate limits for generation, handoff, and auth-adjacent endpoints.
