# Security, Privacy, And Compliance

## Data Classification
Sensitive:
- user ID and email
- OAuth identities
- account profile
- prompts and generated travel plans
- saved routes
- non-public shared route management data
- billing customer/subscription identifiers
- account export/delete payloads

Secrets:
- Supabase service role key
- Stripe secret key
- Stripe webhook secret
- OAuth provider secrets
- Resend API key
- future travel provider API keys
- future AI provider API keys

Public:
- marketing page copy
- public shared route snapshots by slug
- static brand assets
- non-sensitive destination metadata

## Auth Rules
- Use Supabase session helpers on server paths.
- Anonymous users may explore only where the product explicitly permits it.
- Save, publish, account, billing, export, and delete flows require auth.
- Never trust a user ID from the client body when session ownership is available.

## Authorization Rules
- Every user-owned row must have an owner check.
- RLS must be enabled on protected Supabase tables.
- Public share reads must return only safe public snapshots.
- Service-role code must be isolated to server-only modules.

## Billing Rules
- Client never submits trusted Stripe price/customer/subscription IDs.
- Checkout uses server-configured price IDs.
- Webhooks require signature verification.
- Entitlements must update from verified webhook events or trusted admin paths only.
- Account deletion must handle active subscriptions deliberately.

## Privacy Rules
- Do not send prompts, route details, emails, billing IDs, or raw provider payloads to analytics by default.
- Scrub logs and error reports.
- Account export should be complete enough to satisfy user expectations.
- Account deletion should delete or anonymize user-owned data according to documented product policy.

## Travel Safety Rules
- Do not present route generation as safety, legal, visa, health, or emergency advice.
- Avoid encouraging illegal, unsafe, or environmentally harmful travel behavior.
- Where future provider/advisory data is added, show source and freshness.
- If data is missing, say so.

## Security Review Checklist
- No secret in client bundle.
- No service-role import in client components.
- API input validation exists.
- Auth required where expected.
- Ownership enforced.
- RLS migration reviewed.
- Webhook signatures verified.
- Entitlement checks server-side.
- Error logs scrub sensitive fields.
- Public share response excludes private fields.
- Tests cover owner isolation for high-risk paths.

