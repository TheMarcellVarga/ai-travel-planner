# AI Development Setup

This directory contains planning-time AI development assets for Wild Route. It does not implement the app. It prepares future AI agents to build the product consistently.

## Contents
- `skills/`: repo-local project skills for future Codex/agent work.
- `../AGENTS.md`: top-level instructions every future agent should follow.
- `../docs/MASTER_EXECUTION_ROADMAP.md`: execution authority.
- `../docs/AI_AND_ROUTE_GENERATION.md`: route-generation and AI rules.

## Skill Usage
The skills in `ai-dev/skills` are source-controlled scaffolds. When implementation starts, install or copy the relevant skills into the active agent skill directory used by the environment.

Use the skills by task:
- Product copy, route claims, pricing, entitlement language: `travel-product-guardrails`
- Next.js planner UI, landing page, route cards, map/globe polish: `nextjs-travel-ui`
- Supabase migrations, RLS, user-owned route data: `supabase-travel-schema`
- Prompt interpretation, scoring, provider adapters, AI evals: `route-generation-ai`
- Auth, privacy, billing, webhooks, account export/delete: `security-review-travel`

## External Taste Skills
Frontend taste skills may be used for premium UI polish, but they do not override Wild Route's product, safety, architecture, privacy, or entitlement rules.

## Setup Status
This is intentionally planning/process scaffolding. Add deterministic scripts for migrations, browser QA, and AI evals as those systems mature.

