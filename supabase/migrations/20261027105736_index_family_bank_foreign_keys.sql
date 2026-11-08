-- Add covering indexes for the two FAMILY Bank foreign keys identified by
-- Supabase's database linter. These are additive and do not alter existing data.
create index if not exists family_bank_audit_events_actor_member_id_idx
  on public.family_bank_audit_events (actor_member_id);

create index if not exists family_bank_ledger_batches_created_by_idx
  on public.family_bank_ledger_batches (created_by);
