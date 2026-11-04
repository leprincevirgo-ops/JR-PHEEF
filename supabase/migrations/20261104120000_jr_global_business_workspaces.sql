-- Extend the existing JR Business Workspace model; do not create a parallel business registry.
alter table public.jr_business_workspaces
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists legal_entity_name text,
  add column if not exists registration_country text,
  add column if not exists operating_countries text[] not null default '{}',
  add column if not exists base_currency text,
  add column if not exists timezone text,
  add column if not exists primary_language text,
  add column if not exists status text not null default 'setup',
  add column if not exists template_version text not null default '1.0',
  add column if not exists workspace_config jsonb not null default '{}'::jsonb;

update public.jr_business_workspaces
set slug = coalesce(nullif(slug,''), 'business-' || replace(id::text,'-',''))
where slug is null or slug = '';

create unique index if not exists jr_business_workspaces_owner_slug_uidx
  on public.jr_business_workspaces(owner_member_id, slug);

create table if not exists public.jr_business_workspace_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role_key text not null default 'staff',
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'invited' check (status in ('invited','active','suspended','removed')),
  created_at timestamptz not null default now(),
  unique(business_id, member_id)
);
create index if not exists jr_business_workspace_members_member_idx
  on public.jr_business_workspace_members(member_id, status);

insert into public.jr_business_workspace_members(business_id,member_id,role_key,permissions,status)
select id,owner_member_id,'owner',
 '["business:manage","people:manage","data:import","data:export","integrations:manage","documents:manage","finance:view","approvals:manage"]'::jsonb,
 'active'
from public.jr_business_workspaces
on conflict (business_id,member_id) do nothing;

create table if not exists public.jr_business_import_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
  requested_by uuid not null references public.members(id),
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

alter table public.jr_business_workspace_members enable row level security;
alter table public.jr_business_import_jobs enable row level security;
drop policy if exists jr_business_workspace_members_no_client_access on public.jr_business_workspace_members;
create policy jr_business_workspace_members_no_client_access on public.jr_business_workspace_members
  for all to anon, authenticated using (false) with check (false);
drop policy if exists jr_business_import_jobs_no_client_access on public.jr_business_import_jobs;
create policy jr_business_import_jobs_no_client_access on public.jr_business_import_jobs
  for all to anon, authenticated using (false) with check (false);
revoke all on public.jr_business_workspace_members, public.jr_business_import_jobs from anon, authenticated;
grant all on public.jr_business_workspace_members, public.jr_business_import_jobs to service_role;

alter table public.jr_business_workspaces enable row level security;
drop policy if exists jr_business_workspaces_no_client_access on public.jr_business_workspaces;
create policy jr_business_workspaces_no_client_access on public.jr_business_workspaces
  for all to anon, authenticated using (false) with check (false);
revoke all on public.jr_business_workspaces from anon, authenticated;
grant all on public.jr_business_workspaces to service_role;
