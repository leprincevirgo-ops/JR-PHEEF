-- JR PHEEF partner event gateway.
-- API credentials are one-time displayed bearer secrets; only SHA-256 hashes are persisted.
-- Incoming events are private inbox records and never trigger actions by themselves.
create table if not exists public.jr_partner_connections (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 60),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  scopes text[] not null default array['events:write']::text[] check (scopes <@ array['events:write']::text[]),
  active boolean not null default true,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists jr_partner_connections_member_idx
  on public.jr_partner_connections(member_id, created_at desc);

create table if not exists public.jr_partner_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  connection_id uuid not null references public.jr_partner_connections(id) on delete cascade,
  event_type text not null check (event_type in ('status_update','task_update','inventory_update','delivery_update','message_received','calendar_update','other')),
  title text not null check (char_length(btrim(title)) between 2 and 100),
  summary text not null check (char_length(btrim(summary)) between 2 and 500),
  external_event_id text not null check (char_length(external_event_id) between 3 and 120),
  occurred_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  event_data jsonb not null default '{}'::jsonb check (jsonb_typeof(event_data) = 'object'),
  unique (connection_id, external_event_id)
);
create index if not exists jr_partner_events_member_recent_idx
  on public.jr_partner_events(member_id, received_at desc);
create index if not exists jr_partner_events_connection_recent_idx
  on public.jr_partner_events(connection_id, received_at desc);

alter table public.jr_partner_connections enable row level security;
drop policy if exists deny_client_jr_partner_connections on public.jr_partner_connections;
create policy deny_client_jr_partner_connections on public.jr_partner_connections
  for all to anon, authenticated using (false) with check (false);
revoke all on table public.jr_partner_connections from anon, authenticated;
grant all on table public.jr_partner_connections to service_role;

alter table public.jr_partner_events enable row level security;
drop policy if exists deny_client_jr_partner_events on public.jr_partner_events;
create policy deny_client_jr_partner_events on public.jr_partner_events
  for all to anon, authenticated using (false) with check (false);
revoke all on table public.jr_partner_events from anon, authenticated;
grant all on table public.jr_partner_events to service_role;

comment on table public.jr_partner_connections is
  'Member-owned inbound integration credentials. Store only SHA-256 token hashes; credentials have events:write scope only.';
comment on table public.jr_partner_events is
  'Private, deduplicated inbound partner events. Events are informational and never execute actions automatically.';
