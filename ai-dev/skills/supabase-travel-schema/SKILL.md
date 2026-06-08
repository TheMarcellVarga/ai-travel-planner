# Supabase Travel Schema

## Use When
- Adding or changing migrations.
- Editing RLS policies.
- Updating profile, entitlement, route generation, saved route, shared route, booking handoff, or newsletter persistence.

## Rules
- Supabase Postgres is the system of record.
- Protected tables require RLS.
- User-owned rows require `auth.uid()` ownership checks.
- Public share tables may expose only safe route snapshots.
- Service-role access is server-only.
- Update `docs/DATABASE_SCHEMA.md` when responsibilities or fields change.

## Checklist
- Migration filename is timestamped and ordered.
- RLS enabled on protected tables.
- Owner policies exist for select/insert/update/delete as needed.
- Public policies expose only intended data.
- Entitlement limits can be enforced server-side.
- Tests or manual SQL verification are documented.

