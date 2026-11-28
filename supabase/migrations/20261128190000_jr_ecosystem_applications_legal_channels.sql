-- JR ecosystem applications, staged human approvals, legal acknowledgements and channel directory.
create table if not exists public.jr_ecosystem_applications (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique default ('JRA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
 applicant_member_id uuid not null references public.members(id) on delete restrict,
 company_slug text not null check (company_slug in ('dgbo','jr-pheef','jr-move','family','jr-link')),
 application_kind text not null check (application_kind in ('employment','driver','agent','partner','opportunity','membership','other')),
 opportunity_title text not null check (char_length(btrim(opportunity_title)) between 3 and 180),
 department text, message text,
 form_data jsonb not null default '{}'::jsonb check (jsonb_typeof(form_data)='object'),
 technical_status text not null default 'completed' check (technical_status in ('queued','completed','needs_information','failed')),
 technical_report jsonb not null default '{}'::jsonb check (jsonb_typeof(technical_report)='object'),
 status text not null default 'awaiting_human_review' check (status in ('awaiting_human_review','information_requested','approved','declined','withdrawn')),
 approval_chain text[] not null default array['department_manager','company_manager','founder']::text[],
 current_approval_index integer not null default 0 check (current_approval_index >= 0),
 submitted_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz
);
create index if not exists jr_ecosystem_applications_applicant_idx on public.jr_ecosystem_applications(applicant_member_id,submitted_at desc);
create index if not exists jr_ecosystem_applications_review_idx on public.jr_ecosystem_applications(company_slug,status,submitted_at desc);
create table if not exists public.jr_ecosystem_application_events (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.jr_ecosystem_applications(id) on delete cascade,
 actor_member_id uuid references public.members(id) on delete set null,
 event_type text not null check (event_type in ('submitted','technical_check_completed','information_requested','stage_approved','declined','approved','withdrawn')),
 details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
 created_at timestamptz not null default now()
);
create index if not exists jr_ecosystem_application_events_app_idx on public.jr_ecosystem_application_events(application_id,created_at);
create table if not exists public.jr_ecosystem_application_approvals (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.jr_ecosystem_applications(id) on delete cascade,
 stage_key text not null,
 reviewer_member_id uuid not null references public.members(id) on delete restrict,
 decision text not null check (decision in ('approved','rejected','information_requested')),
 note text, created_at timestamptz not null default now(),
 unique(application_id,stage_key)
);
create index if not exists jr_ecosystem_application_approvals_reviewer_idx on public.jr_ecosystem_application_approvals(reviewer_member_id,created_at desc);
create table if not exists public.jr_terms_acceptances (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.members(id) on delete cascade,
 document_key text not null check (document_key in ('terms','privacy','ai_notice')),
 document_version text not null, accepted_at timestamptz not null default now(),
 unique(member_id,document_key,document_version)
);
create index if not exists jr_terms_acceptances_member_idx on public.jr_terms_acceptances(member_id,accepted_at desc);
create table if not exists public.jr_external_channel_connections (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.members(id) on delete cascade,
 provider text not null check (provider in ('whatsapp_business','telegram','messenger','instagram','youtube','email','sms','rss')),
 account_label text,
 status text not null default 'requested' check (status in ('requested','connected','revoked','unavailable')),
 permissions jsonb not null default '{}'::jsonb check (jsonb_typeof(permissions)='object'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(member_id,provider,account_label)
);
create index if not exists jr_external_channel_connections_member_idx on public.jr_external_channel_connections(member_id,created_at desc);
alter table public.jr_ecosystem_applications enable row level security;
alter table public.jr_ecosystem_application_events enable row level security;
alter table public.jr_ecosystem_application_approvals enable row level security;
alter table public.jr_terms_acceptances enable row level security;
alter table public.jr_external_channel_connections enable row level security;
revoke all on public.jr_ecosystem_applications from anon, authenticated;
revoke all on public.jr_ecosystem_application_events from anon, authenticated;
revoke all on public.jr_ecosystem_application_approvals from anon, authenticated;
revoke all on public.jr_terms_acceptances from anon, authenticated;
revoke all on public.jr_external_channel_connections from anon, authenticated;
