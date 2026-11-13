create table if not exists public.dgbo_opportunity_dossiers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  summary text not null check (char_length(btrim(summary)) between 20 and 5000),
  sector text not null default 'general' check (char_length(btrim(sector)) between 2 and 80),
  target_market text not null default '' check (char_length(target_market) <= 240),
  source_type text not null check (source_type in ('public_research','member_submission')),
  source_name text not null check (char_length(btrim(source_name)) between 2 and 180),
  source_url text,
  source_published_at timestamptz,
  customer_problem text not null default '' check (char_length(customer_problem) <= 3000),
  proposed_solution text not null default '' check (char_length(proposed_solution) <= 3000),
  revenue_model text not null default '' check (char_length(revenue_model) <= 3000),
  startup_requirements text not null default '' check (char_length(startup_requirements) <= 3000),
  startup_cost_estimate text not null default '' check (char_length(startup_cost_estimate) <= 500),
  risks text not null default '' check (char_length(risks) <= 3000),
  research_notes text not null default '' check (char_length(research_notes) <= 6000),
  confidence_score numeric(5,2) check (confidence_score is null or confidence_score between 0 and 100),
  source_evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(source_evidence)='array'),
  submitted_by_member_id uuid references public.members(id) on delete set null,
  consent_to_dgbo boolean not null default false,
  status text not null default 'ready_for_review' check (status in ('draft','ready_for_review','in_review','approved','rejected','needs_research','in_development','launched','archived')),
  created_by_member_id uuid references public.members(id) on delete set null,
  reviewed_by_member_id uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_type='public_research' and source_url ~ '^https://[^[:space:]]+$' and consent_to_dgbo=true)
    or
    (source_type='member_submission' and source_url is null and submitted_by_member_id is not null and consent_to_dgbo=true)
  )
);
create index if not exists dgbo_opportunity_dossiers_status_idx on public.dgbo_opportunity_dossiers(status,created_at desc);
create index if not exists dgbo_opportunity_dossiers_sector_idx on public.dgbo_opportunity_dossiers(sector,created_at desc);
create table if not exists public.dgbo_opportunity_reviews (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dgbo_opportunity_dossiers(id) on delete cascade,
  reviewer_member_id uuid not null references public.members(id),
  decision text not null check (decision in ('approved','rejected','needs_research')),
  notes text not null default '' check (char_length(notes)<=4000),
  next_steps text not null default '' check (char_length(next_steps)<=3000),
  created_at timestamptz not null default now()
);
create index if not exists dgbo_opportunity_reviews_dossier_idx on public.dgbo_opportunity_reviews(dossier_id,created_at desc);
create table if not exists public.dgbo_venture_projects (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null unique references public.dgbo_opportunity_dossiers(id),
  venture_name text not null check (char_length(btrim(venture_name)) between 2 and 180),
  stage text not null default 'validation' check (stage in ('validation','business_plan','pilot','partnership','operations','paused','closed')),
  business_model text not null default '' check (char_length(business_model)<=4000),
  validation_plan text not null default '' check (char_length(validation_plan)<=4000),
  next_milestone text not null default '' check (char_length(next_milestone)<=1000),
  target_date date,
  owner_member_id uuid references public.members(id),
  created_by_member_id uuid not null references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dgbo_venture_projects_stage_idx on public.dgbo_venture_projects(stage,updated_at desc);
create table if not exists public.dgbo_opportunity_events (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dgbo_opportunity_dossiers(id) on delete cascade,
  actor_member_id uuid references public.members(id),
  actor_type text not null check (actor_type in ('member','founder','system')),
  event_type text not null check (event_type in ('submitted','review_started','reviewed','research_requested','venture_started','stage_changed','archived')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  created_at timestamptz not null default now()
);
create index if not exists dgbo_opportunity_events_dossier_idx on public.dgbo_opportunity_events(dossier_id,created_at desc);
do $$
declare t text;
begin
 foreach t in array array['dgbo_opportunity_dossiers','dgbo_opportunity_reviews','dgbo_venture_projects','dgbo_opportunity_events'] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from anon, authenticated',t);
   execute format('grant all on public.%I to service_role',t);
   if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='deny_client_access') then
     execute format('create policy deny_client_access on public.%I for all to anon, authenticated using (false) with check (false)',t);
   end if;
 end loop;
end $$;
