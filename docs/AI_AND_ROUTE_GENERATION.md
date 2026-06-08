# AI And Route Generation

## Current Model
Wild Route currently uses deterministic TypeScript logic for prompt interpretation and route generation. This is good for testability and avoids hidden provider cost. Future AI integration should enhance this pipeline, not replace domain constraints.

## Pipeline
1. Validate request input.
2. Interpret prompt into `TripIntent`.
3. Normalize origin.
4. Collect explicit and inferred wish tags.
5. Select destination candidates.
6. Score candidates against intent.
7. Build route combinations.
8. Estimate cost with non-guarantee language.
9. Enforce entitlement limits, including promoted stops.
10. Attach booking handoff links.
11. Persist generation snapshot when durability is required.
12. Render route cards, map/globe, save/share/handoff actions.

## Core Domain Types
- `TripIntent`
- `DestinationProfile`
- `RouteStop`
- `BookingLink`
- `RouteOption`
- `TripGeneration`
- `Entitlement`

The canonical definitions currently live in `lib/types.ts`.

## AI Rules
- Live model calls are optional and must be disabled by default in tests and CI.
- Model output must be schema-validated before use.
- Model calls must not directly access raw database credentials.
- Route safety, entitlement limits, and provider-data boundaries are deterministic rules, not prompt suggestions.
- AI output must include assumptions and confidence/freshness fields where it affects user decisions.
- Prompt injection must not override product guardrails.

## Provider Data Rules
- Provider adapters must return normalized data plus freshness metadata.
- Do not claim confirmed availability or final price unless a provider confirms it.
- If provider data is stale or unavailable, return partial route output with status.
- Keep provider-specific payloads out of UI and analytics unless explicitly reviewed.

## Scoring Principles
Route scoring should consider:
- user wish tags
- origin and feasible travel window
- stop count
- budget mode
- activity score
- destination uniqueness
- provider confidence when available
- free/pro entitlement limits

Scoring should not:
- optimize for unsafe travel behavior
- hide important constraints
- pretend a paid placement is organic unless clearly labeled
- fabricate provider confirmation

## Evals And Fixtures
Required fixture groups when AI is introduced:
- schema validity
- unsafe travel reframe/refusal
- stale data disclosure
- prompt injection resistance
- entitlement enforcement
- no guaranteed price/availability claims
- no hidden direct-booking claims
- ownership isolation for saved/private route data

## Acceptance Rule
No AI-backed route feature is complete until deterministic tests still pass and eval fixtures catch at least schema, unsafe-travel, and stale-data failures.

