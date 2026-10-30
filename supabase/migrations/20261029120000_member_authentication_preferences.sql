-- JR PHEEF optional sign-in preferences.
-- Storage groundwork only: server routes/UI must be deployed before settings are exposed.
-- Existing members retain phone sign-in by default; contact numbers are never removed.

create table if not exists public.member_authentication_preferences (
  member_id uuid primary key references public.members(id) on delete cascade,
  phone_login_enabled boolean not null default true,
  face_unlock_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.member_authentication_preferences enable row level security;

-- Authentication preferences are managed only by the trusted JR PHEEF server.
revoke all on table public.member_authentication_preferences from anon, authenticated;
grant all on table public.member_authentication_preferences to service_role;

comment on table public.member_authentication_preferences is
  'Private per-member sign-in preferences. Face Unlock is opt-in; no biometric data is stored.';
comment on column public.member_authentication_preferences.phone_login_enabled is
  'Controls phone-number sign-in only; it does not delete the stored contact number.';
comment on column public.member_authentication_preferences.face_unlock_enabled is
  'Opt-in preference for platform Face Unlock where supported. WebAuthn/passkeys do not prove face-only verification.';
