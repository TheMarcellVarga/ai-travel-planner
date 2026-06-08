# Product Spec

## Product
Wild Route is a prompt-first adventure travel planner. Users describe a trip, add practical constraints, and receive ranked route options with stops, reasons, budget confidence, map/globe visualization, save/share actions, and external booking handoff links.

## One-Sentence Pitch
Wild Route turns vague adventure travel ideas into ranked, shareable multi-stop routes with clear reasoning and external booking handoffs.

## Target User
Primary user:
- Adventure-oriented digital nomads and independent travelers.
- Comfortable planning online but tired of manually combining maps, flight sites, blogs, and destination lists.
- Interested in hiking, surf, mountain biking, animal-friendly stops, crypto-friendly locations, and visually shareable itineraries.

Secondary user:
- Friends planning a group trip and needing a route artifact they can share.
- Creators who want route concepts packaged into public itinerary pages.

## Jobs To Be Done
- Turn an open-ended travel prompt into concrete destination options.
- Compare route tradeoffs quickly.
- Save strong routes for later.
- Publish one route as a clean public share page.
- Continue booking on trusted external providers.
- Maintain account preferences and route history.

## MVP Golden Path
1. User lands on the homepage and understands the product in the first viewport.
2. User enters prompt, origin, trip length, stop count, tags, and budget mode.
3. App returns 3-5 ranked route options.
4. User inspects route cards and globe/map visualization.
5. User signs in to save a route.
6. User publishes a route to a public share URL.
7. User opens booking handoff links.
8. User manages saved routes and account preferences.

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
- limited saved routes
- limited generation volume
- public sharing can be limited if abuse becomes a concern

Pro plan:
- more saved routes
- higher generation volume
- more promoted or expanded stop detail
- future advanced filters and deeper provider integrations

Rules:
- Entitlements must be enforced server-side.
- UI upgrade prompts should explain the unlocked capability directly.
- Do not hide safety or freshness disclosures behind a paid tier.

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

## Success Criteria
- A user can go from prompt to shareable route in under two minutes.
- The generated route feels specific and useful, not generic.
- Route reasoning is transparent enough to critique.
- Saved/share flows are durable.
- The app remains usable if the globe fails or external data is partial.

