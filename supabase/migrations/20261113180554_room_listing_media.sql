-- Idempotent follow-up for room listing media support.
alter table public.room_listings add column if not exists media jsonb not null default '[]'::jsonb;
