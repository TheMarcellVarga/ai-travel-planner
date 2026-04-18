create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  promoted_stop_limit integer not null default 1,
  route_save_limit integer not null default 12,
  generation_limit integer not null default 25,
  created_at timestamptz not null default now()
);

create table if not exists public.destinations (
  id text primary key,
  name text not null,
  code text not null,
  country text not null,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  scene text not null,
  image_hint text not null,
  base_cost_usd integer not null,
  comfort_cost_usd integer not null,
  crypto_friendly boolean not null default false,
  activity_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.destination_tag_mappings (
  destination_id text not null references public.destinations(id) on delete cascade,
  tag text not null,
  primary key (destination_id, tag)
);

create table if not exists public.route_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  prompt text not null,
  trip_intent jsonb not null,
  routes jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.route_generations(id) on delete set null,
  route jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.route_generations(id) on delete set null,
  slug text not null unique,
  route jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_handoffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  route_id text not null,
  links jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;
alter table public.route_generations enable row level security;
alter table public.saved_routes enable row level security;
alter table public.shared_routes enable row level security;
alter table public.booking_handoffs enable row level security;

create policy "own entitlements" on public.entitlements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own generations" on public.route_generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own saved routes" on public.saved_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own shared routes" on public.shared_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own booking handoffs" on public.booking_handoffs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shared routes are public" on public.shared_routes
  for select using (true);

