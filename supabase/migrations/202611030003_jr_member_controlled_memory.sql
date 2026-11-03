-- JR PHEEF: user-controlled, non-sensitive continuity memory.
-- Only explicit member-approved items may be reused as AI context.
create table if not exists public.jr_memory_items (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  memory_kind text not null check (memory_kind in ('preference','goal','project_context','workflow','non_sensitive_fact')),
  memory_text text not null check (char_length(btrim(memory_text)) between 3 and 1000),
  consent_ai_context boolean not null default false,
  active boolean not null default true,
  source text not null default 'member_entered' check (source in ('member_entered','member_confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jr_memory_items_member_active_idx
  on public.jr_memory_items(member_id, updated_at desc) where active = true;
alter table public.jr_memory_items enable row level security;
drop policy if exists deny_client_jr_memory_items on public.jr_memory_items;
create policy deny_client_jr_memory_items on public.jr_memory_items
  for all to anon, authenticated using (false) with check (false);
revoke all on table public.jr_memory_items from anon, authenticated;
grant all on table public.jr_memory_items to service_role;
comment on table public.jr_memory_items is
  'Explicitly member-entered non-sensitive continuity memory. Reuse as AI context only when consent_ai_context is true. Never infer or store sensitive personal data.';
