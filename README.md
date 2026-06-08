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

## Project Process And Guidelines

Future implementation should start from the repo process docs:

- [AGENTS.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/AGENTS.md): top-level rules for AI agents and contributors
- [docs/MASTER_EXECUTION_ROADMAP.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/MASTER_EXECUTION_ROADMAP.md): phase order, gates, skills, and task template
- [docs/PROJECT_ACCELERATOR.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/PROJECT_ACCELERATOR.md): current build status, real-vs-fallback audit, and next implementation tasks
- [docs/PRODUCT_SPEC.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/PRODUCT_SPEC.md): product scope, target user, golden path, and non-goals
- [docs/ARCHITECTURE.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/ARCHITECTURE.md): system components and runtime boundaries
- [docs/API_SPEC.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/API_SPEC.md): route handler contracts and API rules
- [docs/DATABASE_SCHEMA.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/DATABASE_SCHEMA.md): Supabase table responsibilities and RLS expectations
- [docs/AI_AND_ROUTE_GENERATION.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/AI_AND_ROUTE_GENERATION.md): route-generation pipeline, AI rules, provider-data rules, and eval expectations
- [docs/SECURITY_PRIVACY_AND_COMPLIANCE.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/SECURITY_PRIVACY_AND_COMPLIANCE.md): auth, privacy, billing, and travel-safety checklist
- [docs/TESTING_STRATEGY.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/TESTING_STRATEGY.md): unit, API, database, AI/provider, and frontend QA expectations
- [docs/ENVIRONMENT.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/ENVIRONMENT.md): local setup and environment variables
- [docs/IMPLEMENTATION_PROCESS.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/docs/IMPLEMENTATION_PROCESS.md): coding workflow, verification, and definition of done
- [ai-dev/README.md](/Users/marcellvarga/Github%20-%20Personal%20Projects/ai-travel-planner/ai-dev/README.md): repo-local AI task skills and usage

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

## Supabase Env Names

The app supports Supabase's current publishable-key naming:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For older projects, `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still accepted as a fallback.
