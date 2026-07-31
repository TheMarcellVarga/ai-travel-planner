# Stripe Test Mode QA

## Purpose
This checklist is the Phase 5 live verification gate for Wild Route billing. Unit tests cover server-owned checkout and portal behavior, but this checklist must be run with Stripe test-mode credentials before Phase 5 is marked complete.

## Scope
Verify:
- Supabase-authenticated users can start Stripe Checkout for the server-configured Pro price.
- Checkout creates or reuses the entitlement Stripe customer.
- Stripe webhooks update entitlements only after signature verification.
- Users with a Stripe customer can open the billing portal.
- Billing failures degrade clearly without exposing secrets.

Do not verify external travel booking, provider inventory, or in-app travel checkout here. Wild Route billing is only for app entitlements.

## Required Environment
Set these in `.env.local` or the target preview environment:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

Use a Stripe test-mode recurring price for `STRIPE_PRO_PRICE_ID`.

## Local Webhook Setup
Use the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the emitted `whsec_...` value into `STRIPE_WEBHOOK_SECRET`, then restart the app.

## Test Steps
1. Run the deterministic local checks:

```bash
npm run test
npm run build
```

2. Start the app:

```bash
npm run dev
```

3. Sign in with a real Supabase test user.
4. Open `/account`.
5. Start checkout from the account billing action.
6. Confirm Stripe Checkout shows the configured Pro recurring price, not a client-submitted price.
7. Complete checkout with a Stripe test card.
8. Confirm the app returns to `/account?billing=success`.
9. Confirm `/account` initially shows the sync-pending message if the webhook has not completed yet.
10. Confirm Stripe CLI receives at least:
    - `checkout.session.completed`
    - `customer.subscription.created` or `customer.subscription.updated`
11. Confirm the Supabase `entitlements` row for the test user has:
    - `plan = pro`
    - `stripe_customer_id` populated
    - `stripe_subscription_id` populated
    - `subscription_status` set to an active Stripe status
    - Pro limits matching `lib/account/entitlements.ts`
12. Return to `/account` and open the billing portal.
13. Confirm the portal opens for the same Stripe customer and returns to `/account`.
14. Cancel the subscription in the portal.
15. Confirm a subscription update or delete webhook returns the entitlement to Free limits.
16. Resend one successfully processed Stripe event and confirm:
    - the endpoint returns `200` with `duplicate: true`
    - the entitlement row is unchanged
    - the matching `stripe_webhook_events` row remains `completed`
17. Confirm the ledger row contains only the event ID/type, processing state,
    attempt/lease metadata, timestamps, and normalized error kind—never the raw
    payload, email, customer/subscription ID, or error message.

## Negative Checks
- Remove `STRIPE_SECRET_KEY` or `STRIPE_PRO_PRICE_ID`, restart, and confirm checkout returns a clear unavailable state.
- Send a webhook request without the Stripe signature and confirm it returns an error without provider details.
- Temporarily make the webhook ledger unavailable and confirm the endpoint
  returns `503`, allowing Stripe to retry instead of applying an untracked write.
- Confirm no Stripe secret, webhook secret, service-role key, customer ID, or subscription ID appears in browser-rendered source or client bundles.

## Acceptance Evidence
Record:
- Date and environment.
- Stripe test customer ID prefix only, for example `cus_...abcd`.
- Stripe test subscription ID prefix only, for example `sub_...abcd`.
- Supabase test user ID prefix only.
- Final entitlement state after subscribe and after cancel.
- Any failed step with exact route, status code, and console/server log excerpt with sensitive values redacted.

Phase 5 remains partial until this checklist passes in a Stripe test-mode environment.
