# Wild Route MVP Plan

## Summary
Build `Wild Route` as a responsive web product for adventure-oriented digital nomads: prompt-first trip planning, round-trip-by-default route discovery with explicit one-way support, a cinematic globe/map view, saved/shareable itineraries, account creation, and external booking handoff. Keep the current jungle/00s-adventure visual direction, but replace the static prototype with a production-ready app architecture.

The first launch should be a real product, not just a demo:
- Web only, mobile-browser first-class, no native apps in v1.
- Managed backend with Supabase for auth, Postgres, storage, and row-level access control.
- Hybrid data strategy: real destination/map/geocoding data plus real outbound booking handoff; route ranking and multi-stop recommendation logic can combine provider results with app-side scoring.
- Core product hook is prompt planning depth, with sharing still included as a key feature.

## Implementation Changes
### Product and UX
- Replace the static page with a real app shell: landing page, planner workspace, saved routes page, and public shared-route page.
- Preserve the bold visual identity: dark jungle palette, high-contrast lime accents, oversized display type, 3D globe hero, animated route arcs, and card-based “Insta-ready” itinerary outputs.
- Support a planner flow with these inputs: origin airport/city, trip length in days, max stops, budget sensitivity, and wish tags such as `crypto-friendly`, `animal-friendly`, `hiking`, `mtb`, `surf`.
- Show 3-5 ranked route options per prompt, each with stops, reasoning, approximate travel cost/confidence, trip vibe tags, and a single promoted stop on the free tier.
- Allow signed-in users to save routes, regenerate variants, and publish one route to a public share page.

### App Architecture
- Use Next.js with TypeScript and App Router for the frontend and server endpoints.
- Use Supabase Auth with email magic link plus Google sign-in; require auth for saved routes and publishing, but allow anonymous exploration on the landing/planner screen.
- Use Postgres via Supabase for users, saved routes, shared routes, destination metadata cache, and route-generation jobs/results.
- Use a globe/map library suitable for a cinematic 3D world view with route arcs and tappable pins; implement it as the main planner visualization, with a 2D fallback map/list on smaller screens if performance drops.
- Add a server-side prompt interpretation step that converts free text into a structured trip intent before route generation.
- Build route generation as a pipeline: parse prompt -> expand candidate destinations from tags/region rules -> fetch provider/travel metadata -> score route options -> persist result snapshot -> render/share.
- Implement external booking handoff per leg or route using provider deep links; v1 stops at handoff and does not attempt in-product checkout.

### Monetization and Limits
- Keep the free-plan rule explicit in the domain model: one promoted stop per route on free tier.
- Do not make Stripe launch-blocking, but design the entitlement model so paid tiers can later unlock more promoted stops, more saved routes, and higher generation limits without a data-model rewrite.
- Expose upgrade surfaces in the UI, but keep actual billing integration as a later milestone unless explicitly promoted to launch scope.

## Public Interfaces and Data Shapes
### Core API surface
- `POST /api/trips/plan`
  - Input: `{ prompt, origin, routeType, tripLengthDays, maxStops, wishTags[], budgetMode }`
  - Output: `{ tripIntent, routes[], generationId }`
- `GET /api/trips/:generationId`
  - Returns persisted route-generation result with scores, stops, and metadata.
- `POST /api/routes/:routeId/save`
  - Requires auth; saves a generated route to the user account.
- `POST /api/routes/:routeId/publish`
  - Requires auth; creates/updates a public shareable route slug.
- `GET /share/:slug`
  - Public route view with route summary, stop cards, and booking handoff links.
- `POST /api/routes/:routeId/handoff`
  - Records outbound booking intent and returns provider URLs.

### Core types
- `TripIntent`: normalized prompt output with origin, days, stop limit, tags, vibe, budget mode, and exclusions.
- `RouteOption`: ranked itinerary with `stops[]`, `promotedStopId`, `score`, `estimatedCost`, `confidence`, `reasons[]`, and `bookingLinks[]`.
- `Stop`: destination id, airport/city label, geo coordinates, tags, image/media references, and provider metadata.
- `Entitlement`: free or paid capability flags, including promoted-stop limit and route-save limit.

### Initial data/model defaults
- `users`
- `saved_routes`
- `shared_routes`
- `route_generations`
- `destinations`
- `destination_tag_mappings`
- `booking_handoffs`
- `entitlements`

## Test Plan
- Prompt parsing: confirm vague/adventurous prompts normalize into valid `TripIntent` objects and preserve stop/day/tag constraints.
- Route generation: verify returned routes respect origin, duration, max stops, and only include destinations matching at least one selected preference unless the prompt explicitly broadens scope.
- Free-plan rule: confirm only one stop can be marked promoted in route results and on the share page for free users.
- Auth and persistence: verify anonymous users can explore, but save/publish requires login; signed-in users can retrieve only their own saved routes.
- Share flow: confirm published routes are publicly viewable by slug and remain stable even if the user later regenerates a new route.
- Handoff flow: verify external provider links are attached correctly and tracking records are written without blocking the UI.
- Frontend quality: test desktop and mobile layouts, globe performance degradation path, loading/empty/error states, and route-card/share-page rendering.
- Fallbacks: if external data is missing or slow, return partial route results with clear confidence/status instead of failing the planner entirely.

## Assumptions and Defaults
- Initial user segment is adventure nomads, not mainstream package tourists.
- First launch is responsive web only.
- Launch scope includes auth, saved routes, public sharing, and booking handoff; it excludes native apps and in-app checkout.
- Backend default is Supabase-managed services, not a separate custom API service.
- Billing is designed for but not required at first launch.
- Default origin can start prefilled to Singapore in the UX, but the system should support arbitrary origin input from day one.
- Hybrid data means real place/geography/provider handoff data with app-controlled scoring/recommendation logic; provider adapters should be isolated so deeper real-flight integrations can replace or augment the first version later.
