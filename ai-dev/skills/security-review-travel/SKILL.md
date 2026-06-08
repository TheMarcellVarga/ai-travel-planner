# Security Review Travel

## Use When
- Editing auth, billing, webhooks, account export/delete, Supabase clients, RLS, API route handlers, or analytics/logging.

## Rules
- Never expose secrets to the client.
- Never trust client-submitted owner IDs.
- Require auth for private account, save, publish, billing, export, and delete flows.
- Verify Stripe webhook signatures.
- Scrub sensitive prompt, route, email, and billing data from logs.
- Public share payloads must be intentionally public and minimal.

## Checklist
- Is authentication required?
- Is ownership enforced?
- Is input validated?
- Are secrets server-only?
- Does RLS match API assumptions?
- Are webhooks signature-verified and idempotent?
- Does account deletion handle billing state?
- Are analytics/error payloads scrubbed?

