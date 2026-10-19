# DGBO × JR PHEEF × FAMILY ecosystem

## Product contract

- JR PHEEF is the member-facing opportunity and commerce entry point.
- DGBO is the parent-company governance and oversight layer.
- FAMILY is a separate financial-access venture. It is not a JR PHEEF wallet or DGBO wallet.
- Shared identity and navigation do not merge legal entities, ownership, customer funds, or accounting.
- Financial services remain labelled planned until a verified, authorised provider and end-to-end integration exist.
- Lending, investment execution, cash withdrawals, and payment claims must not be presented as live without approvals, provider integration, and tests.

## Initial deployment

1. Review `supabase/migrations/20261019_dgbo_family_ecosystem.sql` against the current Supabase schema.
2. Run the migration in Supabase SQL Editor. It creates new, separate tables and seeds the venture/service catalogue; it does not alter existing JR PHEEF tables.
3. Keep `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` server-side only.
4. Set the first owner account's role/account_type through a secure, reviewed database operation. Do not expose a public endpoint to grant owner access.
5. Test register/login/session restore, existing listings, points redemption, the WhatsApp webhook, and the new ecosystem endpoints before deployment.
6. Verify Render logs and the `/health` endpoint after deploying the branch.

## Governance and security

- Owner routes must use the existing authenticated JR PHEEF session and verify an owner role on every request.
- Finance entries are records, not a bank ledger or proof of available cash. Reconcile entries to bank/provider statements.
- Cross-company transfers require a documented reason, approval and corresponding records on both sides.
- Use a database transaction/RPC for any multi-step money or points mutation.
- Never store passwords, API secrets, card data, M-Pesa PINs or investment credentials in audit logs.
- Audit sensitive actions. Apply least privilege and avoid exposing finance/approval records to ordinary members.
- Customer money must remain distinguishable from company revenue and company assets.

## Legacy governance

- Current ownership intention: founder 60%, future partners/investors 40%; actual issued shares and rights must be confirmed in corporate records.
- Descendants may inherit shares according to valid legal documents and Kenyan law; executive roles are earned through competence.
- Formalise succession with Kenyan legal/tax advice and appropriate company documents.
