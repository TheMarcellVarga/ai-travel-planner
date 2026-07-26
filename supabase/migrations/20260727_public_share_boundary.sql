drop policy if exists "shared routes are public" on public.shared_routes;

comment on table public.shared_routes is
  'Owner-managed route snapshots. Public reads must go through a server-only, sanitized application response.';
