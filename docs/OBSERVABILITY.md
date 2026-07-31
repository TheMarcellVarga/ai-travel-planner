# Privacy-Safe Observability

## Purpose

Wild Route emits a deliberately small structured operational event set for
availability, abuse, webhook reliability, and provider-boundary failures. The
event boundary is implemented in `lib/observability/operational-events.ts` so
callers cannot pass arbitrary payloads to the log sink.

## Allowed Event Shape

Events may contain only:

- timestamp, level, and an allowlisted event name
- a route template, never a full URL
- HTTP status and stable machine-readable code
- bounded duration
- provider or Stripe event type when it matches the safe token format
- an HMAC-pseudonymized subject identifier
- a normalized error class, never a message or stack

The current sink is one-line JSON through the server console. Production may
forward these records to an observability vendor without changing the event
contract.

## Forbidden Data

Never include:

- email, name, user ID, IP address, auth token, cookies, or OAuth identity
- prompt text, precise route details, saved-route content, or public share slug
- Stripe customer/subscription IDs, billing email, webhook payload, or secrets
- provider response payloads, API keys, error messages, or stack traces
- account export/delete content

Dynamic strings are accepted only in bounded token fields. Values containing
spaces, line breaks, email syntax, or other unapproved characters are dropped.
Identifiers that are useful for deduplication are HMAC-pseudonymized with
`OBSERVABILITY_HASH_SECRET`; a process-random salt keeps local builds tolerant
of missing secrets.

## Event Catalog And Initial Alerts

| Event | Level | Suggested alert |
| --- | --- | --- |
| `request.rate_limited` | warn | sustained increase over 5 minutes by route |
| `stripe.webhook.invalid_signature` | warn | any sudden burst |
| `stripe.webhook.duplicate` | info | monitor ratio, no page by default |
| `stripe.webhook.failed` | error | any sustained failure or retry backlog |
| `stripe.webhook.processed` | info | compare processed/failed counts |

## Retention And Access

- Default operational-log retention: 30 days.
- Aggregate availability and count metrics may be retained longer if they
  cannot be traced back to a person or route.
- Access is restricted to maintainers responsible for production operations.
- Never promote debug logging with raw request or provider bodies to production.
- Incident exports must follow the same field allowlist.

## Verification

```bash
npm test -- lib/observability/operational-events.test.ts
```
