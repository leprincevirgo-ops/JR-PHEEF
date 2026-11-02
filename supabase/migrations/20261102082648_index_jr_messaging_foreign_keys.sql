-- Add covering indexes for the JR Connect messaging foreign keys.
-- These support joins and parent-row maintenance without changing access policy.
create index if not exists jr_conversations_created_by_idx
  on public.jr_conversations (created_by);

create index if not exists jr_messages_sender_id_idx
  on public.jr_messages (sender_id);
