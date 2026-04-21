# Wild Route

`Wild Route` is a prompt-first travel planner for adventure-oriented digital nomads.

## Current state

The project now runs as a Next.js application instead of a static HTML prototype. The
feature commits establish:

- the application shell
- the global design system and jungle-themed visual direction
- the landing page
- planner APIs and route generation
- Supabase-backed auth, storage, and share flows with demo fallback
- Stripe-backed billing primitives for managed checkout and the customer portal

## Run

```bash
npm install
npm run dev
npm test
```

## Environment

Copy `.env.example` to `.env.local` if you want to wire in Supabase. Without Supabase
credentials, the app still works in demo mode using secure cookies and in-memory data.

Managed SaaS services:

- `SUPABASE_SERVICE_ROLE_KEY` to support webhook-driven entitlement sync
- `STRIPE_SECRET_KEY` for checkout and billing portal sessions
- `STRIPE_WEBHOOK_SECRET` for `/api/stripe/webhook`
- `STRIPE_PRO_PRICE_ID` for the paid plan

Optional email support:

- `RESEND_API_KEY` to enable newsletter and transactional email delivery
- `EMAIL_FROM` for the sender address used by the email provider

If those values are missing, newsletter subscriptions still store locally in demo mode,
but outbound mail is skipped.
