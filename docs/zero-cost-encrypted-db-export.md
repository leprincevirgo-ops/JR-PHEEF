# Zero-cost encrypted database export

This is a **database-export safety net**, not a complete Supabase disaster-recovery system or a replica.

## What it exports

The workflow connects to the Ireland production PostgreSQL database and uses the official Supabase CLI export path to create:
- database roles (role definitions only; custom role passwords are not exported),
- application schema and database definitions,
- application table data.

The Supabase CLI intentionally excludes Supabase-managed schemas such as `auth` and `storage`, and extension-managed schemas. Therefore this export alone does **not** recover Auth configuration/users, Storage object bytes, Edge Function secrets, provider settings, or external integrations. Those need separate, tested recovery procedures. Do not describe this artifact as a complete platform backup.

## Security model

- The repository is public. Never put passwords, connection strings, service-role keys, or private encryption keys in tracked files.
- Add the production database connection string as the GitHub Actions repository secret `JR_SUPABASE_DB_URL`.
- Generate an age key pair on a trusted device using `age-keygen`. Store the **private key offline** in a protected password manager/offline backup. Add only the public recipient string (the line beginning `age1...`) as `JR_BACKUP_AGE_RECIPIENT`.
- The workflow encrypts the archive before upload. Plaintext SQL files and the plaintext tar archive are removed before artifact upload.
- Never paste either the database connection string or age private key into ChatGPT, issues, pull requests, logs, or source control.

## Enable it

1. In GitHub, open the repository Settings → Secrets and variables → Actions → New repository secret.
2. Add `JR_SUPABASE_DB_URL` using the Ireland project's PostgreSQL connection string. Prefer the Supabase Session Pooler connection string if direct IPv6 connectivity is unavailable.
3. Add `JR_BACKUP_AGE_RECIPIENT` with the public age recipient only.
4. Open Actions → **JR PHEEF encrypted database export** → Run workflow.
5. Confirm the run succeeds and download the encrypted artifact. Verify it with `sha256sum -c SHA256SUMS`.
6. Move a copy to a separate, trusted storage location you control before the seven-day GitHub artifact retention expires. GitHub Actions artifacts are temporary staging, not durable independent backup storage.
7. Keep the age private key separately and test decryption/restore into an isolated environment before relying on the export.

The workflow also runs daily at 02:17 UTC (05:17 East Africa Time) after the two secrets have been configured. If either secret is absent, it emits a warning and does not connect to the database or create an artifact.

## Restore outline — isolated environment only

1. Download the encrypted artifact and verify its checksum.
2. Decrypt on a trusted machine with the offline age private key.
3. Extract the SQL files.
4. Restore into a disposable, compatible PostgreSQL/Supabase test project following the current Supabase backup/restore documentation.
5. Validate schema, row counts, RLS/policies, functions, triggers, sequences and application smoke tests.
6. Never point production at the restored project until the full DR gates in `disaster-recovery.md` are independently satisfied.

## Current limitations

- No credentials are configured by this change; the first run will be a safe warning/no-op until repository secrets are added.
- The artifact expires after seven days. A person must copy it to durable offsite storage; this workflow does not silently treat GitHub as a permanent backup vault.
- Auth, Storage object bytes and project configuration are outside this export.
- No restore test, replication, writer fencing, or automatic failover is established by this workflow.
- The workflow is free within GitHub's applicable Actions usage limits, but those limits and retention policies can change. It does not create a paid service.
