-- Entitlements are server-managed; users may only read their own record.
drop policy if exists "own entitlements" on public.entitlements;
create policy "own entitlements read" on public.entitlements
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.entitlements from anon, authenticated;

-- Reference data is public to read, but cannot be modified by clients.
alter table public.destinations enable row level security;
alter table public.destination_tag_mappings enable row level security;
create policy "destinations public read" on public.destinations for select to anon, authenticated using (true);
create policy "destination tags public read" on public.destination_tag_mappings for select to anon, authenticated using (true);
