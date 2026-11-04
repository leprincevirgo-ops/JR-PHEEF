-- Global business workspace foundation. Server-side service-role access only.
create extension if not exists pgcrypto;

create table if not exists public.jr_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_member_id text not null,
  name text not null check (char_length(name) between 2 and 140),
  slug text not null,
  industry_key text not null default 'general',
  description text,
  legal_entity_name text,
  registration_country text,
  operating_countries text[] not null default '{}',
  base_currency text,
  timezone text,
  primary_language text,
  status text not null default 'setup' check (status in ('setup','active','paused','closed')),
  template_version text not null default '1.0',
  workspace_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_member_id, slug)
);

create index if not exists jr_businesses_owner_updated_idx
  on public.jr_businesses(owner_member_id, updated_at desc);

create table if not exists public.jr_business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.jr_businesses(id) on delete cascade,
  member_id text not null,
  role_key text not null default 'staff',
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'invited' check (status in ('invited','active','suspended','removed')),
  created_at timestamptz not null default now(),
  unique(business_id, member_id)
);

create index if not exists jr_business_members_member_idx
  on public.jr_business_members(member_id, status);

create table if not exists public.jr_business_import_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.jr_businesses(id) on delete cascade,
  requested_by text not null,
  source_system text,
  source_type text not null check (source_type in ('csv','xlsx','json','xml','database_backup','api_connector','documents','other')),
  data_domains text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','uploaded','scanning','needs_mapping','preview_ready','approved','processing','completed','failed','cancelled')),
  file_reference text,
  mapping jsonb not null default '{}'::jsonb,
  validation_summary jsonb not null default '{}'::jsonb,
  consent_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jr_business_import_jobs_business_idx
  on public.jr_business_import_jobs(business_id, created_at desc);

-- All business data is accessed through authenticated server routes. No direct
-- browser/anon/authenticated table access is granted by this foundation.
alter table public.jr_businesses enable row level security;
alter table public.jr_business_members enable row level security;
alter table public.jr_business_import_jobs enable row level security;

drop policy if exists jr_businesses_no_client_access on public.jr_businesses;
create policy jr_businesses_no_client_access on public.jr_businesses
  for all to anon, authenticated using (false) with check (false);
drop policy if exists jr_business_members_no_client_access on public.jr_business_members;
create policy jr_business_members_no_client_access on public.jr_business_members
  for all to anon, authenticated using (false) with check (false);
drop policy if exists jr_business_import_jobs_no_client_access on public.jr_business_import_jobs;
create policy jr_business_import_jobs_no_client_access on public.jr_business_import_jobs
  for all to anon, authenticated using (false) with check (false);

revoke all on public.jr_businesses, public.jr_business_members, public.jr_business_import_jobs from anon, authenticated;
grant all on public.jr_businesses, public.jr_business_members, public.jr_business_import_jobs to service_role;
