-- DGBO / JR PHEEF / FAMILY ecosystem foundation
-- Apply in Supabase SQL Editor after reviewing against the live project.
-- Adds a dedicated authorization role to existing JR PHEEF members, then creates separate group-management tables.
begin;

alter table public.members add column if not exists role text;

create table if not exists public.dgbo_ventures (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  purpose text not null,
  status text not null default 'planned'
    check (status in ('planned','building','active','paused','retired')),
  legal_entity text not null default 'business_unit'
    check (legal_entity in ('business_unit','subsidiary','partner')),
  owner_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dgbo_finance_entries (
  id uuid primary key default gen_random_uuid(),
  venture_code text not null references public.dgbo_ventures(code),
  entry_type text not null
    check (entry_type in ('revenue','expense','reserve','investment','dividend','intercompany','refund','other')),
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null default 'KES',
  description text not null,
  reference_code text,
  entry_date date not null default current_date,
  status text not null default 'recorded'
    check (status in ('draft','recorded','reconciled','void')),
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.dgbo_approval_requests (
  id uuid primary key default gen_random_uuid(),
  venture_code text not null references public.dgbo_ventures(code),
  requested_by text not null,
  title text not null,
  details text not null,
  amount numeric(14,2) check (amount is null or amount >= 0),
  currency char(3) not null default 'KES',
  risk_level text not null default 'normal'
    check (risk_level in ('low','normal','high','critical')),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  decision_by text,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.family_service_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  status text not null default 'planned'
    check (status in ('planned','pilot','active','paused')),
  provider_name text,
  requires_authorised_partner boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_member_preferences (
  id uuid primary key default gen_random_uuid(),
  member_id text not null unique,
  financial_education_opt_in boolean not null default false,
  service_updates_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dgbo_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_member_id text,
  venture_code text,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dgbo_finance_entries_venture_date_idx
  on public.dgbo_finance_entries (venture_code, entry_date desc);
create index if not exists dgbo_approval_requests_status_date_idx
  on public.dgbo_approval_requests (status, created_at desc);
create index if not exists dgbo_audit_events_created_at_idx
  on public.dgbo_audit_events (created_at desc);

alter table public.dgbo_ventures enable row level security;
alter table public.dgbo_finance_entries enable row level security;
alter table public.dgbo_approval_requests enable row level security;
alter table public.family_service_catalog enable row level security;
alter table public.family_member_preferences enable row level security;
alter table public.dgbo_audit_events enable row level security;

-- No client-facing policies are created intentionally. The server must enforce
-- JR PHEEF session checks and owner authorization before using its server key.
-- Never put SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY in browser code.

insert into public.dgbo_ventures (code,name,purpose,status,legal_entity)
values
 ('DGBO','DIME GLOBAL BUSINESS OPERATORS','Parent company governance, group strategy, oversight and generational continuity','building','business_unit'),
 ('JR_PHEEF','JR PHEEF','Commerce, matching, listings, delivery and opportunity services','active','business_unit'),
 ('FAMILY','FAMILY','Financial access, financial education and future authorised financial services','planned','business_unit')
on conflict (code) do nothing;

insert into public.family_service_catalog (code,name,description,status,provider_name,requires_authorised_partner)
values
 ('FAMILY_WALLET','FAMILY Wallet','Future wallet-service entry point; not a live deposit or stored-value service until approved and integrated.','planned',null,true),
 ('FAMILY_SAVING','Saving access','Financial education and potential saving access through appropriately authorised providers.','planned',null,true),
 ('FAMILY_INVESTING','Investment access','Potential access to suitable investment products through authorised providers; returns are not guaranteed.','planned',null,true),
 ('FAMILY_EDUCATION','Financial education','Educational content for budgeting, saving, risk and informed financial decisions.','planned',null,false)
on conflict (code) do nothing;

commit;
