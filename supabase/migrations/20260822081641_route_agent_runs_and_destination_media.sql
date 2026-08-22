create table if not exists public.destination_media (
  id text primary key,
  destination_id text not null references public.destinations(id) on delete cascade,
  provider text not null check (provider in ('wikimedia-commons', 'openverse', 'local-fallback')),
  image_url text not null,
  source_url text not null,
  title text not null,
  creator text not null,
  license_label text not null,
  license_url text not null,
  attribution_text text not null,
  fetched_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists destination_media_destination_id_idx
  on public.destination_media(destination_id);

create table if not exists public.route_agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  generation_id text,
  mode text not null check (mode in ('deterministic', 'model')),
  status text not null check (status in ('complete', 'partial', 'fallback')),
  agent_version text not null,
  model_id text,
  latency_ms integer not null check (latency_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists route_agent_runs_user_created_idx
  on public.route_agent_runs(user_id, created_at desc);

alter table public.destination_media enable row level security;
alter table public.route_agent_runs enable row level security;

create policy "destination media is publicly readable"
  on public.destination_media
  for select using (true);

create policy "own agent runs"
  on public.route_agent_runs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
