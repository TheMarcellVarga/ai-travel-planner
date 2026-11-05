# AI And Route Generation

## Current Model
Wild Route uses a guarded `RouteCompositionAgent` around deterministic TypeScript
route generation. The first production slice is deterministic by default: a
future model may interpret intent or explain a result, but it cannot invent
coordinates, prices, availability, licenses, or safety claims.

## Pipeline
1. Validate request input.
2. Interpret prompt into `TripIntent`.
3. Normalize origin.
4. Collect explicit and inferred wish tags.
5. Resolve a normalized route-data provider snapshot.
6. Select and score destination candidates.
7. Compose direct, one-stop, and two-stop destination sequences, returning to the origin by default unless the normalized intent is one-way.
8. Read a fixture or server-only live price provider snapshot.
9. Calculate exact cost breakdowns deterministically.
10. Enrich destination stops with allowlisted openly licensed media.
11. Validate the complete generation schema and attach agent-run metadata.
12. Enforce entitlement limits, including promoted stops.
13. Attach booking handoff links.
14. Persist generation, agent-run, and media-cache metadata when durability is required.
15. Render route cards, cost details, map/globe, save/share/handoff actions.

## Core Domain Types
- `TripIntent`
- `DestinationProfile`
- `RouteStop`
- `BookingLink`
- `RouteOption`
- `RouteDataSource`
- `RouteCostBreakdown`
- `RouteMediaAsset`
- `AgentRunMetadata`
- `TripGeneration`
- `Entitlement`

`TripIntent.routeType` is `round_trip` by default and may be explicitly set to
`one_way`. Round-trip routes include a distinct return leg to the origin in the
route stops, pricing estimate, map path, and external handoff links.

The canonical definitions currently live in `lib/types.ts`.

## AI Rules
- Live model calls are optional and must be disabled by default in tests and CI.
- Model output must be schema-validated before use.
- Model calls must not directly access raw database credentials.
- Route safety, entitlement limits, and provider-data boundaries are deterministic rules, not prompt suggestions.
- AI output must include assumptions and confidence/freshness fields where it affects user decisions.
- Prompt injection must not override product guardrails.
- The model, when enabled, receives only the travel prompt and normalized
  preferences through an allowlisted adapter. Deterministic code owns stop
  count, budget arithmetic, route order, entitlement limits, and final schema
  validation.
- A model timeout, malformed output, or provider failure returns the validated
  deterministic fixture result and marks the run as `fallback` or `partial`.

## Provider Data Rules
- Provider adapters must return normalized data plus freshness metadata.
- Provider snapshots include provider ID, fixture/live mode, status, observation time, latency, fallback provider, and assumptions.
- Do not claim confirmed availability or final price unless a provider confirms it.
- If provider data is stale or unavailable, return partial route output with status.
- Keep provider-specific payloads out of UI and analytics unless explicitly reviewed.
- Current MVP route output uses `planning_estimate` and `external_search_required` metadata because no live provider inventory is queried.
- The default `wild-route-destination-fixtures` adapter is deterministic and requires no API key.
- Runtime route generation now prefers the configured Supabase destination catalog through
  `wild-route-supabase-destinations`; an empty, unreachable, or invalid catalog degrades to the
  disclosed local fixture adapter.
- Failed adapters degrade to that fixture through `resolveRouteProvider`; raw provider errors are not exposed in route output.
- Current booking links use `external_search` status and disclaimers to keep the provider-confirmation boundary explicit.

## Price And Media Contracts
- `RoutePriceProvider` normalizes fixture or live transport/stay observations
  into USD, source, observation time, freshness, assumptions, and partial
  failure status. No departure date means no live fare query and a visible
  planning-estimate label.
- `RouteCostBreakdown.total` is calculated from normalized leg and stay rows;
  it is never accepted from model output.
- Wikimedia Commons is queried before Openverse. Only public domain, CC0,
  CC BY, and CC BY-SA assets pass the license filter. NC and ND assets are
  rejected. Each accepted asset retains title, creator, source, license, and
  attribution text.
- Media cache rows contain normalized metadata only. Provider payloads,
  prompts, secrets, and private route details are not persisted.
- MapLibre is an optional renderer selected by a public style URL. The SVG
  route map remains the accessible and no-WebGL fallback; map tile usage and
  attribution remain the responsibility of the configured tile provider.
- Homepage and planner destination views request normalized current conditions
  from Open-Meteo. The UI shows observation time and source and explicitly keeps
  weather outside route safety and feasibility scoring.

## Feature Flags
- `ROUTE_AGENT_MODE=deterministic|model` (model currently records a guarded
  deterministic fallback until a reviewed model adapter is configured).
- `ROUTE_DESTINATION_MODE=supabase|fixture` (Supabase is the runtime default;
  tests use deterministic fixtures, and provider failure is disclosed).
- `ROUTE_PRICE_MODE=fixture|live` (live currently returns a disclosed partial
  result until a commercial provider is approved and configured).
- `ROUTE_MEDIA_MODE=fixture|commons|openverse|hybrid` (hybrid is the default
  Commons-first/Openverse-fallback path).
- `NEXT_PUBLIC_MAP_RENDERER=svg|maplibre` plus
  `NEXT_PUBLIC_MAP_STYLE_URL` and `NEXT_PUBLIC_MAP_ATTRIBUTION` for an
  explicitly configured MapLibre style and tile attribution.

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
The executable fixture set lives in `lib/planner/evals` and runs with:

```bash
npm run test:evals
```

Current fixture groups:
- schema validity
- unsafe travel reframe/refusal
- stale data disclosure
- prompt injection resistance
- entitlement enforcement
- no guaranteed price/availability claims
- no hidden direct-booking claims
- ownership isolation for saved/private route data

Provider payloads and completed trip generations are validated with Zod before
they cross the orchestration boundary. Invalid provider output degrades to the
disclosed local fixture rather than reaching scoring or persistence.

## Acceptance Rule
No AI-backed route feature is complete until deterministic tests still pass and eval fixtures catch at least schema, unsafe-travel, and stale-data failures.

## Current Deterministic MVP Status
Phase 6 guarded composition slice:
- prompt interpretation is deterministic
- route scoring is deterministic
- direct, one-stop, and two-stop route sequences are generated and bounded
- round-trip routes return to the origin by default; explicit one-way requests remain one-way
- fixture costs expose exact transport/stay totals and assumptions
- optional server-only price and media provider seams exist
- selected stops carry media attribution or local artwork fallback
- agent-run metadata records deterministic, partial, or fallback execution
- route output includes planning-estimate metadata
- booking links disclose external-search status
- unsupported safety, visa, guarantee, and illegal-travel claims are captured as caveats
- trip API tests cover invalid input, successful planning, persistence metadata, and memory-backed retrieval
- provider adapter tests cover deterministic fixture metadata and disclosed failure fallback
- route evals cover schema validity, activity/direct constraints, unsafe and illegal requests, prompt injection, and stale-provider disclosure

Live provider credentials, a model adapter, production map tiles, and provider-
confirmed freshness remain feature-flagged rollout work. The route contract is
ready for those adapters without changing the UI or persistence boundary.

## Skyscanner flight-only search (in progress)

The opt-in `/api/flights/search` is separate from route scoring and cost
snapshots. It requires a managed authenticated session and validates explicitly
entered, contiguous dated airport/city codes. When configured, the server calls
Skyscanner Live Prices create/poll and returns sanitized flight-only itinerary
prices, partial/complete status, observation time, transfer type, and booking
links. It does not store provider payloads or blend flight offers with fixture
stay amounts. Full multi-ticket options are retained only when every booking link
passes the HTTPS Skyscanner gateway allowlist.

This is an unverified partner integration, disabled by default. Activation needs
approved partner access, private credentials, managed authentication, and
production-grade distributed quotas; current in-memory limits are not sufficient
for multi-instance cost control. The test suite mocks all provider traffic.
