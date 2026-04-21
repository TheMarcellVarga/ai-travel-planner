# Wild Route

Wild Route is a Next.js travel planner with a production-style backend built on managed services instead of a custom auth or billing stack.

## Stack

- Next.js App Router for the product UI and server routes
- Supabase Auth + Postgres + Row Level Security for identity and user data
- Stripe Billing for subscription checkout, portal access, and webhook-based entitlement sync
- Resend-compatible email delivery for confirmations and route notifications

## What Is Included

- Multi-auth through Supabase: magic link email plus OAuth providers such as Google and GitHub
- Account management: durable user profile, notification preferences, billing portal, export, and deletion flow
- User data storage: route generations, saved routes, public shares, booking handoffs, entitlements, and profiles
- Payment: Stripe checkout, Stripe billing portal, and subscription-to-entitlement syncing

## Data Model

Supabase migrations live in [supabase/migrations](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/supabase/migrations).

- `entitlements`: free/pro limits and Stripe identifiers
- `profiles`: account identity, travel defaults, and notification preferences
- `route_generations`: generated trip payloads
- `saved_routes`: private route vault
- `shared_routes`: public share pages
- `booking_handoffs`: outbound booking handoff history

All user-owned tables use RLS policies keyed on `auth.uid()`.

## Local Setup

1. Copy [.env.example](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/.env.example) to `.env.local`.
2. Add Supabase project values and run the SQL migrations in order.
3. Configure Supabase Auth providers you want enabled, such as Google and GitHub.
4. Add the Stripe product price ID and point your Stripe webhook to `/api/stripe/webhook`.
5. Run `npm install` and `npm run dev`.

## Operational Endpoints

- `/api/health`: config-aware health status for auth/database/billing/email wiring
- `/api/account/export`: JSON export of account-owned data
- `/api/account/delete`: permanent account deletion, blocked while an active Stripe subscription exists
- `/api/stripe/webhook`: Stripe subscription sync

## Why Supabase Instead Of Replacing It

This repo already used Supabase session cookies, Postgres tables, and RLS policies. Replacing that with Clerk or Better Auth would mean rewriting identity, session handling, and the user-to-data permission model. Keeping Supabase as the auth and data control plane is the lower-risk move here, while still using Stripe as a managed billing system.
