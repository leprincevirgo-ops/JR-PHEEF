create table if not exists public.jr_world_progress (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  world_key text not null check (world_key in ('personal','learning','creative','work','business','opportunities','relationships','community','family','civic','exploration','health','culture')),
  stage text not null default 'discovering' check (stage in ('discovering','learning','practising','building','contributing','paused')),
  progress jsonb not null default '{}'::jsonb check (jsonb_typeof(progress) = 'object'),
  last_position jsonb not null default '{}'::jsonb check (jsonb_typeof(last_position) = 'object'),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, world_key)
);
create index if not exists jr_world_progress_member_recent_idx on public.jr_world_progress(member_id, last_interaction_at desc);

create table if not exists public.jr_growth_journal (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  event_kind text not null check (event_kind in ('interaction','milestone','reflection','learning','creation','work','connection','resume')),
  world_key text check (world_key is null or world_key in ('personal','learning','creative','work','business','opportunities','relationships','community','family','civic','exploration','health','culture')),
  title text not null check (char_length(btrim(title)) between 2 and 140),
  detail text not null default '' check (char_length(detail) <= 2000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists jr_growth_journal_member_recent_idx on public.jr_growth_journal(member_id, created_at desc);
create index if not exists jr_growth_journal_member_world_idx on public.jr_growth_journal(member_id, world_key, created_at desc);

create table if not exists public.jr_capability_permissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  capability_key text not null check (capability_key in ('learning','discovery','creation','projects','marketplace','business_operations','connections','private_files','notifications')),
  enabled boolean not null default false,
  scope jsonb not null default '{}'::jsonb check (jsonb_typeof(scope) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, capability_key)
);

alter table public.jr_world_progress enable row level security;
alter table public.jr_growth_journal enable row level security;
alter table public.jr_capability_permissions enable row level security;

comment on table public.jr_world_progress is 'Private, member-scoped continuity across JR PHEEF life worlds. Access only through trusted server routes.';
comment on table public.jr_growth_journal is 'Private member growth and interaction journal; never public by default.';
comment on table public.jr_capability_permissions is 'Member-controlled capability preferences. High-impact actions still require transaction-specific confirmation.';
