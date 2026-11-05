# Database Schema

## System Of Record
Supabase Postgres is the relational system of record. SQL migrations live in `supabase/migrations` and must be applied in chronological order.

## Existing Migration Files
- `20260418_initial.sql`
- `20260420_billing.sql`
- `20260422_account_profiles.sql`
- `20260727_public_share_boundary.sql`
- `20260731161920_stripe_webhook_idempotency.sql`
- `20260822081641_route_agent_runs_and_destination_media.sql`
- `20261105180559_secure_entitlements.sql`
- `20261105182145_lock_profile_trigger_search_path.sql`

## Core Tables

### `entitlements`
Purpose: user plan and billing-derived limits.

Expected fields:
- user ID
- plan
- promoted stop limit
- route save limit
- generation limit
- Stripe customer ID
- Stripe subscription ID
- subscription status
- current period end

Rules:
- Server code must enforce these limits.
- Stripe webhook is the trusted source for subscription updates.
- Users may read only their own entitlements; plan and billing writes require the server-only service role. A missing row uses the free-plan defaults.

### `profiles`
Purpose: account identity and travel preferences.

Expected fields:
- user ID
- full name
- home airport code
- preferred currency
- travel style
- newsletter opt-in
- route alerts opt-in

Rules:
- User can read and update only their own profile.

### `route_generations`
Purpose: durable snapshots of generated route results.

Expected fields:
- generation ID
- owner user ID nullable if anonymous generations are persisted
- prompt
- trip intent JSON
- routes JSON
- created timestamp
- data freshness metadata when available
- validated `RouteOption` JSON including cost breakdowns and normalized stop media

Rules:
- Persist snapshots before save/share flows depend on them.
- Do not mutate existing snapshots in a way that breaks public shares.

### `destination_media`
Purpose: cache safe, normalized public image metadata for destination stops.

Expected fields:
- destination ID and provider (`wikimedia-commons`, `openverse`, or fallback)
- image URL, source URL, title, creator, license label/URL, attribution text
- fetched, expiry, created, and updated timestamps

Rules:
- Only public-domain, CC0, CC BY, and CC BY-SA assets are accepted by the
  application; NC and ND assets are rejected.
- The table is publicly readable because it contains only the allowlisted
  attribution contract. Inserts and updates remain server/admin operations.
- Raw Commons/Openverse responses, prompts, credentials, and private route data
  are never stored.

### `route_agent_runs`
Purpose: normalized execution metadata for a completed route composition.

Expected fields:
- nullable authenticated owner ID
- generation ID as text, matching the app's current generation identifier
- deterministic/model mode, complete/partial/fallback status, agent version,
  optional model ID, latency, and created timestamp

Rules:
- RLS is enabled and authenticated users can access only their own rows.
- The row stores operational metadata only, never prompts, raw model output,
  provider payloads, or secrets.
- Anonymous/demo runs may remain in memory and do not create durable agent rows.

### `saved_routes`
Purpose: private user route vault.

Expected fields:
- saved route ID
- user ID
- generation ID
- route JSON snapshot
- saved timestamp

Rules:
- Owner-only read/write.
- Enforce route-save entitlement.

### `shared_routes`
Purpose: public route share pages.

Expected fields:
- share ID
- user ID
- slug
- generation ID
- public route snapshot
- published timestamp

Rules:
- Public clients cannot select rows directly from this table.
- Public payload must not include private profile, billing, or internal provider data.
- Server-rendered public share pages must use the server-only admin client to select only the share ID, slug, route snapshot, and published timestamp, then pass route JSON through the public-share whitelist before rendering.
- Owner-only create/update/delete.

### `booking_handoffs`
Purpose: track outbound booking intent.

Expected fields:
- handoff ID
- route ID
- user ID nullable
- booking links JSON
- created timestamp

Rules:
- Store only what is needed for product analytics and support.
- Do not store sensitive payment details.

### `stripe_webhook_events`
Purpose: durable Stripe delivery ledger for duplicate suppression and retry-safe
entitlement synchronization.

Expected fields:
- Stripe event ID primary key
- event type and processing status
- attempt count and processing lease expiry
- received, updated, and processed timestamps
- normalized last error class only

Rules:
- Service-role access only; `anon` and `authenticated` receive no table grants.
- RLS remains enabled with no public/user policies.
- Never persist webhook payloads, billing emails, customer IDs, subscription
  IDs, error messages, or stack traces in this ledger.
- Completed event IDs are acknowledged without repeating entitlement writes.
- Failed or expired processing leases may be reclaimed by a later Stripe retry.

### Newsletter subscribers
Current state: newsletter subscriptions are handled by the local demo store and optional email delivery path. There is no persistent `newsletter_subscribers` table in the current Supabase migrations.

Planned table purpose: email subscriptions and route notification preferences.

Rules:
- Validate email.
- Keep unsubscribe/export/delete behavior clear.
- Add a migration, RLS/service-role policy, and export/delete behavior before treating newsletter subscriptions as durable account data.

## RLS Policy Requirements
- User-owned tables must use `auth.uid()` ownership checks.
- Public share routes are read server-side and exposed only as safe snapshots by slug.
- Service-role operations must remain server-only.
- Migration reviews must confirm RLS is enabled on protected tables.
- Public media and private agent-run policies must be reviewed together so a
  public image never becomes a path to private route or model data.

## JSON Data Rules
- Use typed TypeScript domain objects for JSON payloads.
- Validate JSON input and output around API boundaries.
- Avoid storing raw provider payloads unless a retention reason is documented.
- Add version fields if route payload shape changes incompatibly.

## Migration Process
1. Add a new timestamped SQL migration.
2. Include RLS changes in the same feature migration where possible.
3. Test locally against a disposable Supabase database or SQL runner.
4. Update this doc when table responsibilities change.
5. Add tests for ownership and entitlement-sensitive behavior.

## Static Verification
Run:

```bash
npm run verify:migrations
```

The verifier checks:
- timestamped migration filenames
- required current tables
- RLS enablement for protected tables
- owner policies using `auth.uid() = user_id`
- revocation of the original full-row public read policy for `shared_routes`
- service-role-only protection for the Stripe webhook event ledger
