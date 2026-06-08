# Architecture

## System Boundary
Wild Route is a travel route discovery and planning application. It separates UI, route generation, auth, persistence, billing, email, and external handoffs so the product can mature without mixing provider details into presentation code.

## High-Level Components

| Component | Responsibility |
| --- | --- |
| Next.js App Router | Marketing pages, app UI, route handlers, auth-aware server actions/BFF behavior, Stripe webhook, rendering |
| Supabase Auth | User identity, sessions, OAuth and magic-link login |
| Supabase Postgres | Route generations, saved routes, public shares, booking handoffs, profiles, entitlements, newsletter data |
| Supabase RLS | User-owned data isolation |
| Stripe | Checkout, portal, subscriptions, entitlement events |
| Resend-compatible email | Newsletters and route/account notifications |
| Provider adapters | Booking links, future flights/stays/maps/weather/advisory data |
| Route generation pipeline | Intent parsing, candidate expansion, scoring, entitlement enforcement, snapshot persistence |

## System Diagram

```mermaid
flowchart LR
  Browser["Browser"] --> Next["Next.js App Router"]
  Next --> UI["Public and app UI"]
  Next --> API["Same-origin API routes"]
  API --> Planner["Route generation pipeline"]
  API --> Supabase["Supabase Auth and Postgres"]
  API --> Stripe["Stripe Billing"]
  API --> Email["Email Provider"]
  Planner --> DestinationData["Destination metadata"]
  Planner --> ProviderAdapters["Provider adapters"]
  ProviderAdapters --> External["External booking/data providers"]
  Supabase --> RLS["RLS policies"]
```

## Request Flow
1. Browser renders public pages or authenticated app pages through Next.js.
2. Supabase Auth manages session cookies.
3. Planner form posts to `POST /api/trips/plan`.
4. Server validates input and interprets prompt into `TripIntent`.
5. Route generation selects candidates, scores routes, enforces entitlement limits, and builds booking links.
6. Generation snapshots are persisted when Supabase is configured; deterministic fallback is allowed only where explicitly documented.
7. Save/publish/handoff APIs require ownership checks and durable route IDs.
8. Stripe webhook updates entitlements after verified subscription events.

## Repository Shape

```txt
app/                    Next.js routes, pages, route handlers
components/             Shared UI components and planner components
lib/                    Domain, auth, Supabase, billing, email, planner logic
supabase/migrations/    SQL migrations and RLS policies
public/                 Brand and editorial assets
docs/                   Source-of-truth process and architecture docs
ai-dev/skills/          Repo-local AI work-routing skills
```

## Runtime Principles
- Keep domain logic in `lib`, not embedded in React components.
- Keep provider-specific details behind adapter modules.
- Keep auth and ownership checks server-side.
- Keep Supabase service role usage server-only.
- Make optional integrations fail closed for private data and fail soft for public UX.
- Prefer durable snapshots for generated routes so public shares do not mutate unexpectedly.

## Deployment Direction
- Web app: Vercel or equivalent Next.js hosting.
- Database/auth: Supabase.
- Billing: Stripe.
- Email: Resend-compatible provider.
- Future cache/rate limit: Upstash or provider-native equivalent.

## Architecture Non-Goals
- Separate custom backend service for v1 unless provider/data complexity requires it.
- Client-side direct database writes for protected resources.
- Long-running route jobs without a queue strategy.
- Model calls directly reading private database data.

