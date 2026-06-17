# Product Spec

## Product
Wild Route is a prompt-first adventure travel planner. Users describe a trip, add practical constraints, and receive ranked route options with stops, reasons, budget confidence, map/globe visualization, save/share actions, and external booking handoff links.

## One-Sentence Pitch
Wild Route turns vague adventure travel ideas into ranked, shareable multi-stop routes with clear reasoning and external booking handoffs.

## Locked MVP Decisions
- Product name: `Wild Route`.
- Product category: AI-assisted route discovery and travel planning support.
- Primary platform: responsive web.
- Primary segment: adventure-oriented digital nomads and independent travelers.
- Primary route style: one-way adventure routes, not package vacations.
- Default demo origin: Singapore.
- Launch backend: Next.js App Router with Supabase Auth/Postgres/RLS, Stripe Billing, and Resend-compatible email.
- Launch route engine: deterministic route generation with clear confidence/reasoning; live AI is optional later and not required for Phase 1.
- Booking model: external provider handoff only. Wild Route does not sell flights, hotels, insurance, visas, or tours.
- Free-plan product rule: exactly one promoted stop per generated route.
- Safety stance: never present route output as safety, visa, immigration, legal, health, weather, or emergency advice.

## Target User
Primary user:
- Adventure-oriented digital nomads and independent travelers.
- Comfortable planning online but tired of manually combining maps, flight sites, blogs, and destination lists.
- Interested in hiking, surf, mountain biking, animal-friendly stops, crypto-friendly locations, and visually shareable itineraries.

Secondary user:
- Friends planning a group trip and needing a route artifact they can share.
- Creators who want route concepts packaged into public itinerary pages.

Not the target user:
- Package-tour shoppers looking for fully managed travel.
- Users who need visa/legal certainty.
- Corporate travel managers.
- Users looking for guaranteed cheapest-price booking.
- Users expecting Wild Route to complete checkout inside the app.

## Jobs To Be Done
- Turn an open-ended travel prompt into concrete destination options.
- Compare route tradeoffs quickly.
- Save strong routes for later.
- Publish one route as a clean public share page.
- Continue booking on trusted external providers.
- Maintain account preferences and route history.

## MVP Golden Path
1. User lands on the homepage and understands the product in the first viewport.
2. User opens `/planner`.
3. User starts from the Singapore demo route or enters prompt, origin, trip length, stop count, wish tags, and budget mode.
4. App returns 3-5 ranked route options.
5. User inspects route cards and globe/map visualization.
6. User sees estimated cost and confidence as planning estimates, not confirmed provider inventory.
7. User signs in to save a route.
8. User publishes a route to a public share URL.
9. User opens booking handoff links to external providers.
10. User manages saved routes and account preferences.

## Demo Script
Use this exact demo flow until the product scope changes:

1. Start on `/`.
2. Explain: "Wild Route turns a rough adventure idea into a ranked, shareable route. It does not book travel directly."
3. Click `Compose a route`.
4. Use the default Singapore route or enter: `Find a 12 day one-way adventure from Singapore with jungle energy, hiking, crypto-friendly towns, and one meaningful stop.`
5. Select `balanced` budget and `1 stop`.
6. Show ranked route options, route reasoning, confidence, estimated cost, and promoted stop.
7. Save one route after signing in or entering demo mode.
8. Publish the route and open the `/share/[slug]` page.
9. Open booking handoff and state that the provider owns final price and availability.
10. Open `/account` to show profile, plan limits, export/delete, and billing surfaces.

## Core Inputs
- `prompt`: free-text travel idea.
- `origin`: city or airport.
- `tripLengthDays`: total travel window.
- `maxStops`: maximum intermediate destinations.
- `wishTags`: `crypto-friendly`, `animal-friendly`, `hiking`, `mtb`, `surf`.
- `budgetMode`: `value`, `balanced`, `comfort`.

## Core Outputs
- normalized `TripIntent`
- ranked `RouteOption[]`
- route title and tagline
- stops with coordinates and tags
- promoted stop
- score
- confidence
- estimated cost range or estimated cost with clear non-guarantee language
- reasons
- booking links
- persistence IDs for save/share/handoff flows

## Entitlements
Free plan:
- anonymous exploration allowed
- one promoted stop per generated route
- 12 saved routes
- 25 route generations per cycle
- external booking handoff links
- public sharing allowed for MVP, with abuse controls deferred to Phase 7

Pro plan:
- up to 3 promoted stops per generated route
- 500 saved routes
- 500 route generations per cycle
- more expanded stop detail
- future advanced filters and deeper provider integrations

Rules:
- Entitlements must be enforced server-side.
- UI upgrade prompts should explain the unlocked capability directly.
- Do not hide safety or freshness disclosures behind a paid tier.
- Free and Pro limits are defined in `lib/account/entitlements.ts` and should stay aligned with this spec.

## Non-Goals For V1
- In-product flight or hotel checkout.
- Payment processing for travel bookings.
- Visa, immigration, legal, or medical advice.
- Guaranteed travel safety recommendations.
- Real-time airline inventory unless a provider integration explicitly supports it.
- Native mobile apps.
- Social network features beyond public share pages.

## Product Boundaries
- Wild Route recommends and explains routes; it does not guarantee feasibility.
- Booking links are external handoffs; final price and availability belong to the provider.
- Route scoring is app-defined unless explicitly labeled as provider-confirmed.
- AI assistance must be auditable through structured fields and deterministic fallbacks.
- Estimated costs are planning estimates generated by Wild Route unless provider-confirmed data is explicitly added later.
- Public share pages expose route snapshots, not private account data.
- Crypto-friendly means destination metadata and user preference matching; it is not financial advice or an endorsement of specific financial services.

## Copy Guardrails
Use:
- "estimated cost"
- "planning estimate"
- "route confidence"
- "external booking handoff"
- "provider owns final price and availability"
- "route reasoning"
- "shareable route snapshot"

Avoid:
- "book instantly with Wild Route"
- "guaranteed cheapest"
- "safe destination"
- "visa-ready"
- "confirmed availability"
- "AI knows the best route"
- "crypto-approved"
- "risk-free adventure"

## Phase 1 Acceptance Evidence
- One-sentence product explanation exists and avoids booking-engine claims.
- MVP golden path and demo script are explicit.
- Free and Pro limits are concrete.
- Route claim boundaries and copy guardrails are explicit.
- Non-goals prevent scope creep into booking, legal/visa advice, native apps, and guaranteed availability.
- Visual direction is captured in `docs/DESIGN_SYSTEM.md`.

## Success Criteria
- A user can go from prompt to shareable route in under two minutes.
- The generated route feels specific and useful, not generic.
- Route reasoning is transparent enough to critique.
- Saved/share flows are durable.
- The app remains usable if the globe fails or external data is partial.
