create table if not exists public.jr_partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  organization_name text not null check (char_length(organization_name) between 2 and 140),
  partner_type text not null check (partner_type in ('business','technology','education','community','delivery','financial_services','public_sector','other')),
  details text not null check (char_length(details) between 20 and 3000),
  status text not null default 'received' check (status in ('received','under_review','contacted','closed')),
  created_at timestamptz not null default now()
);
alter table public.jr_partner_inquiries enable row level security;
revoke all on table public.jr_partner_inquiries from anon, authenticated;
grant all on table public.jr_partner_inquiries to service_role;
comment on table public.jr_partner_inquiries is 'Private staging partner enquiries submitted by authenticated JR PHEEF members; accessed only through a verified server-side function.';
