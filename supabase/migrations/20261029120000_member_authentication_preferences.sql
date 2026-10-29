-- JR PHEEF optional sign-in preferences.
-- This migration creates storage only; server routes/UI must be deployed before
-- settings are exposed. Existing members keep current sign-in behavior by
-- default. Phone contact data is not removed when phone login is disabled.

create table if not exists public.member_authentication_preferences (
  member_id uuid primary key references public.members(id) on delete cascade,
  phone_login_enabled boolean not null default true,
  device_unlock_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.member_authentication_preferences enable row level security;

-- Authentication preferences are managed by the trusted JR PHEEF server.
-- Do not allow browser clients to read or mutate another member's settings.
revoke all on table public.member_authentication_preferences from anon, authenticated;
grant all on table public.member_authentication_preferences to service_role;

comment on table public.member_authentication_preferences is
  'Private per-member login preferences. Device unlock is opt-in and must be backed by platform passkey/WebAuthn support; this table does not store biometric data.';
comment on column public.member_authentication_preferences.phone_login_enabled is
  'Controls phone-number sign-in only; it does not delete the stored contact number.';
comment on column public.member_authentication_preferences.device_unlock_enabled is
  'Member opt-in preference for supported device authentication; not proof that face recognition is available.';
