-- JR AGENT UNIVERSE — private registry and approval ledger.
-- Apply through the project's reviewed Supabase migration workflow.
create table if not exists public.jr_agents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '',
  provider text,
  agent_type text not null check (agent_type in ('external','jr_managed','human','workflow')),
  endpoint_domain text,
  capabilities text[] not null default '{}',
  status text not null default 'paused' check (status in ('active','paused','disabled')),
  trust_status text not null default 'unverified' check (trust_status in ('unverified','review_pending','verified','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jr_agents_capabilities_limit check (cardinality(capabilities) <= 10)
);
create index if not exists jr_agents_member_updated_idx on public.jr_agents(member_id, updated_at desc);

create table if not exists public.jr_agent_runs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  agent_id uuid not null references public.jr_agents(id) on delete cascade,
  task text not null check (char_length(task) between 3 and 2000),
  capability text not null,
  status text not null default 'awaiting_approval' check (status in ('awaiting_approval','approved_not_executed','rejected','cancelled','completed','failed')),
  risk text not null check (risk in ('standard','high')),
  approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists jr_agent_runs_member_created_idx on public.jr_agent_runs(member_id, created_at desc);
create index if not exists jr_agent_runs_agent_created_idx on public.jr_agent_runs(agent_id, created_at desc);

alter table public.jr_agents enable row level security;
alter table public.jr_agent_runs enable row level security;
-- These tables are accessed only by the trusted server using its secret key.
revoke all on public.jr_agents from anon, authenticated;
revoke all on public.jr_agent_runs from anon, authenticated;

-- Bind every agent record to the authenticated JR PHEEF identity as a second
-- ownership boundary. The server supplies members.id; auth.uid() is JWT-derived.
alter table public.jr_agents add column if not exists owner_auth_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.jr_agent_runs add column if not exists owner_auth_id uuid references auth.users(id) on delete cascade default auth.uid();
grant select,insert,update,delete on public.jr_agents to authenticated;
grant select,insert,update,delete on public.jr_agent_runs to authenticated;
drop policy if exists "agent owners manage their agents" on public.jr_agents;
create policy "agent owners manage their agents" on public.jr_agents for all to authenticated
using (owner_auth_id = (select auth.uid())) with check (owner_auth_id = (select auth.uid()));
drop policy if exists "agent owners manage their runs" on public.jr_agent_runs;
create policy "agent owners manage their runs" on public.jr_agent_runs for all to authenticated
using (owner_auth_id = (select auth.uid())) with check (owner_auth_id = (select auth.uid()));

-- Protocol metadata for interoperable agent discovery and adapter selection.
alter table public.jr_agents add column if not exists protocol text not null default 'manual'
check (protocol in ('mcp','a2a','openai_compatible','https_api','webhook','human','manual'));
