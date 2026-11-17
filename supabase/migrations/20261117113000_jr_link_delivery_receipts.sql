-- JR LINK: per-recipient message delivery and read acknowledgements.
-- Only the authenticated server API can read/write receipt records.
create table if not exists public.jr_message_receipts (
  message_id uuid not null references public.jr_messages(id) on delete cascade,
  recipient_id uuid not null references public.members(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (message_id, recipient_id),
  check (read_at is null or delivered_at is not null)
);
create index if not exists jr_message_receipts_recipient_idx
  on public.jr_message_receipts(recipient_id, delivered_at, read_at);
alter table public.jr_message_receipts enable row level security;
drop policy if exists jr_message_receipts_deny_client_access on public.jr_message_receipts;
create policy jr_message_receipts_deny_client_access on public.jr_message_receipts
  for all to anon, authenticated using (false) with check (false);
revoke all on public.jr_message_receipts from anon, authenticated;

-- Idempotency key prevents duplicate chat messages when offline sends are retried.
alter table public.jr_messages add column if not exists client_message_id uuid;
create unique index if not exists jr_messages_sender_client_id_uidx
  on public.jr_messages(sender_id, client_message_id)
  where client_message_id is not null;

-- Private, short-lived typing indicators; expired rows are ignored by the API.
create table if not exists public.jr_message_typing (
  conversation_id uuid not null references public.jr_conversations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  expires_at timestamptz not null,
  primary key (conversation_id, member_id)
);
create index if not exists jr_message_typing_expiry_idx
  on public.jr_message_typing(conversation_id, expires_at);
alter table public.jr_message_typing enable row level security;
drop policy if exists jr_message_typing_deny_client_access on public.jr_message_typing;
create policy jr_message_typing_deny_client_access on public.jr_message_typing
  for all to anon, authenticated using (false) with check (false);
revoke all on public.jr_message_typing from anon, authenticated;
