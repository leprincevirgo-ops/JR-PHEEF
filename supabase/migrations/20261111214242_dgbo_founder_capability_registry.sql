create table if not exists public.dgbo_capabilities (
  id uuid primary key default gen_random_uuid(),
  capability_key text not null unique check (capability_key ~ '^[a-z][a-z0-9_.:-]{1,79}$'),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  category text not null default 'general' check (char_length(btrim(category)) between 2 and 60),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'proposed' check (status in ('proposed','approved','in_development','available','paused','retired')),
  scope jsonb not null default '{}'::jsonb check (jsonb_typeof(scope)='object'),
  created_by uuid not null references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dgbo_capabilities_status_category_idx on public.dgbo_capabilities(status,category);
alter table public.dgbo_capabilities enable row level security;
revoke all on public.dgbo_capabilities from anon, authenticated;
