-- Store a member-declared country of origin separately from current country/location.
-- The value is selected by the member; it is never inferred.
alter table public.members add column if not exists country_of_origin_code char(2);
alter table public.members drop constraint if exists members_country_of_origin_code_format;
alter table public.members add constraint members_country_of_origin_code_format
  check (country_of_origin_code is null or country_of_origin_code ~ '^[A-Z]{2}$');
comment on column public.members.country_of_origin_code is
  'Member-declared country of origin, ISO 3166-1 alpha-2. Separate from current country/location; public profile flag is hidden for founder JP-01.';
