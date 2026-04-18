# Wild Route

`Wild Route` is a prompt-first travel planner for adventure-oriented digital nomads.

## Current state

The project now runs as a Next.js application instead of a static HTML prototype. The
feature commits establish:

- the application shell
- the global design system and jungle-themed visual direction
- the landing page
- planner APIs and route generation
- auth, saved routes, share pages, and booking handoff scaffolding

## Run

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` if you want to wire in Supabase. Without Supabase
credentials, the app still works in demo mode using secure cookies and in-memory data.
