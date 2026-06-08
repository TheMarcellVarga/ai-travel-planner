# Implementation Process

## Before Coding
1. Identify the roadmap phase in `docs/MASTER_EXECUTION_ROADMAP.md`.
2. Pick the primary and support skill from the skill routing table.
3. Read the relevant source-of-truth docs.
4. Inspect current git status.
5. Confirm whether existing dirty files are user work before touching them.
6. Define acceptance criteria and verification commands.

## During Coding
- Keep changes scoped to the task.
- Prefer domain logic in `lib`.
- Keep UI components focused on rendering and interaction.
- Validate API inputs.
- Enforce auth and ownership server-side.
- Preserve existing visual direction unless the task is a redesign.
- Do not introduce paid provider calls without explicit approval.
- Add tests with the implementation when risk justifies it.

## Before File Edits By Agents
Agents should state what they are about to edit and why. If a file has unrelated user changes, either avoid it or edit carefully without reverting user work.

## Verification
Minimum local verification for most code changes:

```bash
npm run test
npm run build
```

Frontend changes:
- run the app
- verify the affected route in a browser
- check mobile-sized layout when relevant

Database changes:
- apply migrations to a disposable database
- verify RLS behavior
- update `docs/DATABASE_SCHEMA.md`

Billing changes:
- test checkout/portal in Stripe test mode
- verify webhook signature handling
- verify entitlement update path

AI/provider changes:
- keep fixtures deterministic
- run evals
- verify stale/missing data behavior
- record cost/freshness assumptions

## Pull Request / Commit Checklist
- Scope is clear.
- Tests pass or failures are documented.
- Docs updated when architecture/API/schema/process changed.
- No secrets committed.
- No client-side service-role imports.
- No unrelated user changes reverted.
- Public share payloads do not leak private data.
- Entitlements enforced server-side.

## Definition Of Done
A task is done when:
- acceptance criteria are met
- relevant tests or manual checks are complete
- docs match behavior
- known limitations are documented
- high-risk paths have ownership/security review

