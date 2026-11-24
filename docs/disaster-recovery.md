# JR PHEEF cross-region disaster recovery

## Current topology (verified 2026-11-24)

- Authoritative production data: Supabase project `tzyrlwshwkbnkbhjnpev`, Ireland (`eu-west-1`), PostgreSQL 17.6.
- Secondary project: `vtwkjtxvyixoujkhravo`, Germany (`eu-central-1`), PostgreSQL 17.11. This is a rebuild/staging project, not a verified standby.
- Production web app: Render service `srv-d8um6f6q1p3s73euum50`, Oregon, Free plan, one instance.
- Foundation service: Render service `srv-dboubue417fc739e8prg`, Frankfurt, Free plan, one instance. It is not the production app and must not be promoted as-is.
- Supabase organization is currently on the Free plan.

## Critical finding: no automatic failover today

Do not describe the current Germany project as a replica or backup. On the audit date, Ireland had 91 public tables / 831 columns / 385 constraints / 253 indexes / 86 policies. Germany had 116 public tables / 1,125 columns / 578 constraints / 345 indexes / 116 policies. The schemas are materially different.

The schema comparison found one Ireland-only table (`jp_contact_invites`), 26 Germany-only tables, six Ireland columns missing in Germany, 300 Germany-only columns, and two column-definition differences. The database PostgreSQL minor versions also differ.

The current deployment does not have verified continuous replication, writer fencing, automatic promotion, or a completed restore test. The Render production service has no configured health-check path. Do not change DNS, production environment variables, database URLs, or service routing to point at Germany until the full recovery gates below pass.

## Implemented schema parity instrument

Migration `20261124103000_jr_dr_schema_fingerprint.sql` installs `public.jr_dr_schema_fingerprint()` in both projects. It returns a stable, read-only inventory/fingerprint of public tables, columns, constraints, indexes, RLS flags and policies. Execute is revoked from PUBLIC, anon and authenticated, and granted only to service_role. This is a schema-drift detector, not a data backup or replication mechanism.

## Backup and recovery design

1. Keep Ireland the only writer and source of truth.
2. Obtain provider-supported daily backups and Point-in-Time Recovery (PITR) for Ireland. Supabase documents daily managed backups for Pro/Team/Enterprise; PITR is an add-on and requires at least Small compute. Free projects should use regular off-site logical exports. Confirm plan and billing before enabling paid options.
3. Keep an independent encrypted backup copy outside the source project and region. Include PostgreSQL globals/roles, schema, table data, extensions, function definitions, Edge Function source/configuration, Auth users and identity settings, Storage object bytes (not only storage metadata), bucket settings, secrets/configuration inventory, DNS and Render service configuration.
4. Encrypt backups client-side before upload. Use a dedicated least-privilege backup identity, rotate credentials, never commit credentials or plaintext dumps to GitHub, and test restore into an isolated project.
5. Build a schema reconciliation migration set from the canonical Ireland schema, review it against Germany-only capabilities, and preserve Germany-only data. Never run a destructive schema reset or blindly replay migrations into Germany.
6. After schema parity, perform an initial consistent data seed, then establish a supported continuous replication mechanism with monitored lag and alerting. Supabase managed read replicas are read-only and are not by themselves a complete application failover system; verify supported promotion and endpoint-routing procedures with Supabase before relying on them.
7. Include Auth and Storage in the recovery plan. A PostgreSQL copy alone is insufficient: Supabase Auth configuration/user data, Storage object bytes, Edge Functions, secrets, external integrations and app configuration must also be recovered.
8. Implement a durable single-writer lease/fencing mechanism outside either database. A promoted writer must hold an exclusive, time-bounded lease; all write paths must reject stale epochs. Never allow both regions to accept writes.
9. Use a recovery controller with authenticated health probes, replication-lag checks, quorum/independent failure detection, fencing confirmation, idempotent promotion steps, DNS/config switch, smoke tests, and automatic rollback/abort when any gate fails. Payment and ledger operations require reconciliation before reopening writes.
10. Run quarterly restore and failover exercises, measure actual Recovery Point Objective (RPO) and Recovery Time Objective (RTO), and publish evidence. Do not promise targets until measured.

## Failover gates

- [ ] Latest independent encrypted backup exists and its checksum verifies.
- [ ] Restore to isolated environment succeeded, including Auth and Storage objects.
- [ ] Schema fingerprints match after reviewed migrations.
- [ ] Critical row counts and financial ledger invariants reconcile.
- [ ] Replication lag is within approved RPO.
- [ ] Old writer is fenced and cannot accept writes.
- [ ] New writer epoch is issued once, with durable audit evidence.
- [ ] App/API/Edge Functions and secrets are compatible with target.
- [ ] Login, signup, JP identity privacy, JR LINK, listings/matching, media, and payment safety smoke tests pass.
- [ ] Routing changes and rollback path are verified.

## Operational truth

Until all gates pass, Germany remains staging/recovery preparation only. If Ireland is unavailable today, use the provider's supported restore procedure and controlled manual recovery; do not automatically direct users to Germany.
