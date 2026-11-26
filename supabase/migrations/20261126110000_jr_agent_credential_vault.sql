-- Encrypted, member-owned external provider credentials. Never expose ciphertext to browser APIs.
alter table public.jr_agents add column if not exists encrypted_credentials text;
alter table public.jr_agents add column if not exists credential_updated_at timestamptz;
