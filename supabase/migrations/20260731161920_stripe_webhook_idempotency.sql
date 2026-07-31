create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'processing',
  attempt_count integer not null default 1,
  lease_expires_at timestamptz,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_kind text,
  constraint stripe_webhook_events_event_id_length
    check (char_length(event_id) between 1 and 255),
  constraint stripe_webhook_events_event_type_length
    check (char_length(event_type) between 1 and 120),
  constraint stripe_webhook_events_status
    check (status in ('processing', 'completed', 'failed')),
  constraint stripe_webhook_events_attempt_count
    check (attempt_count > 0),
  constraint stripe_webhook_events_error_kind_length
    check (last_error_kind is null or char_length(last_error_kind) <= 80)
);

create index if not exists stripe_webhook_events_retention_idx
  on public.stripe_webhook_events (received_at);

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from anon, authenticated;
grant select, insert, update on table public.stripe_webhook_events to service_role;

comment on table public.stripe_webhook_events is
  'Service-role-only Stripe event ledger for duplicate suppression and retry-safe entitlement processing. No webhook payloads or billing identifiers are stored.';
