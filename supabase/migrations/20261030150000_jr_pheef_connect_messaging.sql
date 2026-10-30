-- JR PHEEF CONNECT: private direct and group text messaging.
-- Browser clients cannot access these tables directly; trusted API routes use the service role.
create table if not exists public.jr_conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.members(id) on delete cascade,
  title text check (title is null or char_length(title) between 1 and 80),
  is_group boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_group and title is not null) or (not is_group and title is null))
);
create table if not exists public.jr_conversation_participants (
  conversation_id uuid not null references public.jr_conversations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, member_id)
);
create index if not exists jr_conversation_participants_member_idx
  on public.jr_conversation_participants(member_id, conversation_id);
create table if not exists public.jr_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.jr_conversations(id) on delete cascade,
  sender_id uuid not null references public.members(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists jr_messages_conversation_created_idx
  on public.jr_messages(conversation_id, created_at desc);
alter table public.jr_conversations enable row level security;
alter table public.jr_conversation_participants enable row level security;
alter table public.jr_messages enable row level security;
drop policy if exists jr_conversations_deny_client_access on public.jr_conversations;
create policy jr_conversations_deny_client_access on public.jr_conversations
  for all to anon, authenticated using (false) with check (false);
drop policy if exists jr_conversation_participants_deny_client_access on public.jr_conversation_participants;
create policy jr_conversation_participants_deny_client_access on public.jr_conversation_participants
  for all to anon, authenticated using (false) with check (false);
drop policy if exists jr_messages_deny_client_access on public.jr_messages;
create policy jr_messages_deny_client_access on public.jr_messages
  for all to anon, authenticated using (false) with check (false);
revoke all on public.jr_conversations, public.jr_conversation_participants, public.jr_messages from anon, authenticated;
