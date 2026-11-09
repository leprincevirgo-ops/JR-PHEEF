# JR PHEEF Staging Environment

Created: 2026-11-09
Purpose: isolated deployment for the complete JR PHEEF rebuild. Production remains separate and unchanged.

## Staging resources

- Supabase project: `jr-pheef-rebuild-staging`
- Supabase project ref: `vtwkjtxvyixoujkhravo`
- Supabase region: `eu-central-1` (Frankfurt)
- Supabase API URL: `https://vtwkjtxvyixoujkhravo.supabase.co`
- Render service: `jr-pheef-rebuild-staging`
- Render service ID: `srv-dbot19c9v7es738adeu0`
- Render region: Frankfurt
- Render plan: Free
- Render dashboard: `https://dashboard.render.com/web/srv-dbot19c9v7es738adeu0`
- Staging URL: `https://jr-pheef-rebuild-staging.onrender.com`
- Branch: `rebuild/architecture-foundation`

## Database bootstrap

The staging database has a schema-only baseline derived from production metadata:
- 86 public tables
- 795 columns
- 356 constraints (including 91 foreign keys)
- 238 indexes (129 explicitly defined non-constraint indexes plus primary/unique indexes)
- 86 RLS policies
- RLS enabled on all 86 public tables
- RLS forced on 51 public tables
- 8 functions, 2 triggers
- 0 anon/authenticated table grants
- 602 service-role table privilege entries
- 3 storage buckets created with matching names, public/private visibility and upload limits

No production rows, user accounts, sessions, uploaded objects, payment records or credentials were copied. Staging storage buckets are empty.

The migration source is `supabase/migrations/20261109160000_jr_pheef_fresh_project_schema_baseline.sql`. The staging database's migration history contains the baseline and bootstrap application entries.

## Required manual secret configuration

The Render service build succeeded, but the process correctly refuses to start without a privileged Supabase server key. Do not weaken that requirement and do not use a public anon/publishable key for trusted server operations.

In Render Dashboard → staging service → Environment, add:

- `SUPABASE_URL` = `https://vtwkjtxvyixoujkhravo.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = the service-role/secret key from the **staging** Supabase project only
- `PAYMENTS_ENABLED` = `false`

The URL and payment flag are already configured. Only the staging service-role/secret key remains to be added. Retrieve it from Supabase Dashboard → staging project → Project Settings → API Keys. Copy it directly into Render's environment variable field; never paste it into GitHub, source files, chat messages or logs.

After saving, Render should redeploy automatically. Confirm the logs show the app listening on port 10000 without a missing-configuration error.

Optional integrations are intentionally not connected yet:
- `OPENAI_API_KEY`: required for live model responses; configure a staging-specific key and confirm billing/quota first.
- Twilio credentials/webhook: add only when testing WhatsApp/SMS in a controlled staging account.
- Payment provider credentials: intentionally absent; payments remain disabled.

## Security and acceptance checks

- Confirm Supabase security and health advisors report no findings.
- Confirm no production data exists in staging.
- Test sign-up/login/logout/password recovery on a real mobile browser.
- Test profile visibility, Command Centre navigation, voice cancellation, and keyboard/touch input.
- Test tenant and organisation separation with at least two test accounts.
- Test marketplace, Deal Room messaging, upload/download permissions, business workspace and action approvals.
- Do not merge or deploy to production until all P0 journeys, security review, backup/rollback and migration reconciliation pass.

## Operational note

Render free services may sleep when idle. This staging service is for functional validation, not production uptime or load testing.
