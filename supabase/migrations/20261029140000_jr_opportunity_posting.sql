-- JR PHEEF opportunity posting foundation.
-- Public application access is mediated by the trusted Express API; direct client access is denied.
create table if not exists public.jr_opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.members(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 140),
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  opportunity_type text not null default 'business_opportunity'
    check (opportunity_type in ('business_opportunity')),
  availability_status text not null default 'available_now'
    check (availability_status in ('available_now','coming_soon','seeking_interest','recurring')),
  audience_scope text not null default 'local_and_international'
    check (audience_scope in ('local','national','international','local_and_international','remote')),
  country_code text,
  location text,
  eligible_regions text[] not null default '{}',
  offer_details text not null default '',
  requirements text not null default '',
  commercial_terms text not null default '',
  currency_code char(3),
  deadline_at timestamptz,
  publication_status text not null default 'published'
    check (publication_status in ('draft','pending_review','published','closed','expired','removed')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','rejected')),
  report_count integer not null default 0 check (report_count >= 0),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  check (currency_code is null or currency_code ~ '^[A-Z]{3}$')
);
create index if not exists jr_opportunities_public_feed_idx
  on public.jr_opportunities (publication_status, availability_status, published_at desc);
create index if not exists jr_opportunities_owner_idx
  on public.jr_opportunities (owner_user_id, created_at desc);
create index if not exists jr_opportunities_regions_idx
  on public.jr_opportunities using gin (eligible_regions);

create table if not exists public.jr_opportunity_interests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.jr_opportunities(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 1500),
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, member_id)
);
create index if not exists jr_opportunity_interests_member_idx
  on public.jr_opportunity_interests (member_id, created_at desc);
create index if not exists jr_opportunity_interests_opportunity_idx
  on public.jr_opportunity_interests (opportunity_id, created_at desc);

alter table public.jr_opportunities enable row level security;
alter table public.jr_opportunity_interests enable row level security;
revoke all on public.jr_opportunities from anon, authenticated;
revoke all on public.jr_opportunity_interests from anon, authenticated;
grant all on public.jr_opportunities to service_role;
grant all on public.jr_opportunity_interests to service_role;
