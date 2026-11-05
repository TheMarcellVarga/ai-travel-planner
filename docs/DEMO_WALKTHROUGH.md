# Demo Walkthrough

## Five-Minute Portfolio Flow

Use a clean browser session and the deployed URL recorded in `docs/DEPLOYMENT.md`.
If that deployment is unavailable, run `npm run dev` and use
`http://localhost:3000`.

### 0:00 — Frame The Product

Open `/`.

Say:

> Wild Route turns a rough adventure idea into a ranked, shareable route. It is
> planning support, not a booking engine; estimates and app confidence are not
> confirmed provider inventory.

Point out the adventure/editorial direction, bundled destination examples, and
the clear planner CTA.

### 0:40 — Compose And Compare

Open `/planner`, expand **Route controls**, and use:

> Find a 12 day adventure from Singapore with jungle energy, hiking,
> crypto-friendly towns, and one meaningful stop.

Keep **balanced** budget and **1 stop**, then select **Compose new routes**.

Show:

- the **Demo data** pill and its route-data disclosure
- typed practical constraints and ranked alternatives
- route reasoning, data sources, cost status, and app-defined confidence
- exactly one promoted stop on the Free entitlement
- visible fixture/freshness and external-inventory boundaries
- the interactive route globe and ordered fallback, which keeps the planner
  usable without WebGL

### 2:00 — Save, Publish, And Hand Off

Open `/auth` and select **Explore demo**. No email is required. Return to the
planner, then:

1. Save the selected route.
2. Publish it.
3. Open the generated `/share/[slug]` page.
4. Follow the route-prefilled Google Flights link while explaining that Google
   owns dates, inventory, final price, and availability.

Call out that saved demo routes stay in the current browser, while shared
previews are stateless links. Managed accounts use Supabase ownership and RLS
when the configured environment is available.

### 3:30 — Show Product Depth

Open `/saved` to show the private route vault and public share link. Open
`/account` to show that profiles, cloud sync, and billing are unavailable in
demo mode. Managed accounts expose the profile and data lifecycle controls.

Briefly explain:

- same-origin server handlers keep service and billing secrets out of clients
- public shares are server-read and reduced to an allowlisted snapshot
- Stripe webhooks use signature verification and a replay-safe event ledger
- automated checks cover route rules, ownership, golden path, route details,
  accessibility, keyboard order, reduced motion, and failed media

### 4:40 — Close With The Trade-off

Say:

> I built the deterministic pipeline first so the product is testable and
> inspectable before adding live AI or travel providers. The remaining live
> Supabase, Stripe, provider, and model gates are documented rather than hidden
> behind demo claims.

## Pre-Demo Check

```bash
npm run verify:migrations
npm run lint
npm run test
npm run test:e2e
npm run build
npm audit --omit=dev
```

Also verify:

- `/api/health` returns without secret values
- the homepage, planner, auth, saved, account, privacy, and terms routes render
- demo sign-in, save, publish, share, and handoff complete
- both desktop and mobile layouts have no horizontal overflow
- external provider navigation is described as a handoff, not booking

Do not claim live managed persistence or Stripe verification unless
`npm run verify:services:strict` passes in that environment.
