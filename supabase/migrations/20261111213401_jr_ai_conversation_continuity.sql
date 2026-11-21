create table if not exists public.jr_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text not null default 'Conversation' check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists jr_ai_conversations_member_recent_idx
  on public.jr_ai_conversations(member_id, last_message_at desc);
create table if not exists public.jr_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.jr_ai_conversations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists jr_ai_messages_conversation_time_idx
  on public.jr_ai_messages(conversation_id, created_at asc);
alter table public.jr_ai_conversations enable row level security;
alter table public.jr_ai_messages enable row level security;
revoke all on public.jr_ai_conversations from anon, authenticated;
revoke all on public.jr_ai_messages from anon, authenticated;
