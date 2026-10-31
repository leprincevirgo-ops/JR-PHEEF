create table if not exists public.jr_status_updates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 700),
  background text not null default 'ocean' check (background in ('ocean','violet','sunset','emerald','midnight','rose')),
  visibility text not null default 'connections' check (visibility in ('connections','everyone')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists jr_status_updates_member_created_idx on public.jr_status_updates(member_id, created_at desc);
create index if not exists jr_status_updates_expiry_idx on public.jr_status_updates(expires_at);
create table if not exists public.jr_status_views (
  status_id uuid not null references public.jr_status_updates(id) on delete cascade,
  viewer_id uuid not null references public.members(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(status_id, viewer_id)
);
create index if not exists jr_status_views_viewer_idx on public.jr_status_views(viewer_id, viewed_at desc);
alter table public.jr_status_updates enable row level security;
alter table public.jr_status_views enable row level security;
revoke all on public.jr_status_updates from anon, authenticated;
revoke all on public.jr_status_views from anon, authenticated;
