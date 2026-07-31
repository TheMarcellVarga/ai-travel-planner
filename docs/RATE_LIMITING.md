# Rate Limiting

## Protected Surfaces

Wild Route applies fixed-window request limits before expensive or externally
visible work begins:

| Surface | Limit | Window | Protected cost |
| --- | ---: | ---: | --- |
| `POST /api/trips/plan` | 10 | 1 minute | route generation and future provider/model calls |
| `POST /api/auth/demo` and `POST /api/auth/signin` | 5 | 10 minutes | session and managed-auth initiation |
| `POST /api/newsletter/subscribe` | 3 | 1 hour | subscription writes and confirmation email |

Rejected requests return `429`, `RATE_LIMITED`, `Retry-After`, and RateLimit
metadata without echoing the client identifier.

## Privacy And Trust Boundary

- Client addresses are read only on the server and immediately HMAC-hashed.
- Raw IP addresses, emails, prompts, routes, and user IDs are not retained by
  the limiter or included in its response.
- Set `RATE_LIMIT_HASH_SECRET` in production for a stable private HMAC salt. A
  process-local random salt is used when it is absent so local builds remain
  secret-tolerant.
- Forwarded-address headers are trusted only when the deployment proxy replaces
  incoming values. The production platform must strip client-supplied forwarding
  headers before this limiter is treated as an identity boundary.

## Runtime Model

The current store is bounded to 10,000 process-local buckets and collapses new
identities into a shared overflow bucket after expired entries are pruned. This
is a deterministic baseline for local use and a single application instance.

At multi-instance scale, retain the same policy and response contract but move
bucket consumption to an atomic distributed adapter or enforce equivalent
limits at the deployment edge. Per-instance limiting must not be represented as
a global quota.

## Verification

```bash
npm test -- lib/security/rate-limit.test.ts
npm run test:e2e
```
