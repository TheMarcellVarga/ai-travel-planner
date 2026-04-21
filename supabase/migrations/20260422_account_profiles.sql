create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  home_airport_code text,
  preferred_currency text not null default 'USD',
  travel_style text not null default 'balanced',
  newsletter_opt_in boolean not null default false,
  route_alerts_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_preferred_currency_check
    check (preferred_currency in ('USD', 'EUR', 'GBP', 'SGD')),
  constraint profiles_travel_style_check
    check (travel_style in ('balanced', 'budget', 'luxury', 'remote-work'))
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();
