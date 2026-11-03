-- JR PHEEF: durable action-consent and security-event foundation.
-- This records user decisions. It does not execute actions or store provider credentials.
create table if not exists public.jr_action_proposals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  action_key text not null check (action_key ~ '^[a-z][a-z0-9_.:-]{1,79}$'),
  summary text not null check (char_length(btrim(summary)) between 5 and 280),
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired','executed','failed')),
  requires_confirmation boolean not null default true,
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 8 and 100),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  decided_at timestamptz,
  executed_at timestamptz,
  result_summary text check (result_summary is null or char_length(result_summary) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, idempotency_key)
);
create index if not exists jr_action_proposals_member_recent_idx
  on public.jr_action_proposals(member_id, created_at desc);
create index if not exists jr_action_proposals_pending_idx
  on public.jr_action_proposals(member_id, expires_at)
  where status = 'pending';

create table if not exists public.jr_security_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 80),
  resource_type text not null check (char_length(resource_type) between 2 and 80),
  resource_id text check (resource_id is null or char_length(resource_id) <= 120),
  summary text not null check (char_length(summary) between 2 and 280),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists jr_security_events_member_recent_idx
  on public.jr_security_events(member_id, created_at desc);

alter table public.jr_action_proposals enable row level security;
drop policy if exists deny_client_jr_action_proposals on public.jr_action_proposals;
create policy deny_client_jr_action_proposals on public.jr_action_proposals
  for all to anon, authenticated using (false) with check (false);
revoke all on table public.jr_action_proposals from anon, authenticated;
grant all on table public.jr_action_proposals to service_role;

alter table public.jr_security_events enable row level security;
drop policy if exists deny_client_jr_security_events on public.jr_security_events;
create policy deny_client_jr_security_events on public.jr_security_events
  for all to anon, authenticated using (false) with check (false);
revoke all on table public.jr_security_events from anon, authenticated;
grant all on table public.jr_security_events to service_role;

comment on table public.jr_action_proposals is
  'Member-scoped JR action proposals and explicit decisions. Approval records consent only; connected execution handlers must separately verify permissions and provider outcomes.';
comment on table public.jr_security_events is
  'Private member-scoped security and consent event history. Server-side access only; never store secrets or raw authentication tokens.';
