-- Private, server-side-only storage for bounded member UI preferences.
create table if not exists public.jr_member_preferences (
  member_id uuid primary key references public.members(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint jr_member_preferences_object check (jsonb_typeof(preferences) = 'object')
);

alter table public.jr_member_preferences enable row level security;
drop policy if exists deny_client_jr_member_preferences on public.jr_member_preferences;
create policy deny_client_jr_member_preferences on public.jr_member_preferences
  for all to anon, authenticated using (false) with check (false);
revoke all on table public.jr_member_preferences from anon, authenticated;
grant all on table public.jr_member_preferences to service_role;
