# JR PHEEF — Market Testing Release Gate

This release is a **limited testing release**, not a declaration that all planned businesses are production-ready.

## Release scope
- JR PHEEF core web application and current authenticated member experience.
- JP Identity screen and optional local-only Cosmic Signature preview.
- Read-only architecture/navigation for JR PHEEF, FAMILY, DGBO, and connected ecosystems.
- Existing features only where current server-side authorization and operational integrations have been verified.

## Explicitly not represented as live
- FAMILY is not represented as a licensed bank. Real accounts, deposits, credit, transfers, cards, investments, and payment processing require suitable licensing and/or regulated partners, provider integration, reconciliation, support and end-to-end tests.
- M-Pesa/Daraja must remain OFF unless separately approved and tested. No live financial transactions are part of this release gate.
- Delivery coordination is not considered live until a real delivery provider, dispatch lifecycle, status tracking, pricing, support and cancellation/refund handling are verified.
- JP registry, immutable founder assignment, cross-business single identity and multi-century archive are not complete just because the JP Identity screen exists.
- DGBO investor/funding flows are not active unless separately reviewed and approved.
- Any mock/sample data must be clearly labelled and must never be shown as real balances or real transactions.

## Required pre-release checks
1. GitHub Actions must pass on the release candidate.
2. Render deployment for the exact release commit must be live/succeeded.
3. Read-only npm run test:e2e must pass against the deployed URL.
4. /health must identify JR PHEEF and report the app version.
5. /api/me must safely return anonymous state without exposing member data.
6. All listed private endpoints must reject anonymous access.
7. JP Identity and its CSS/JS assets must load; the page must not assign a number or claim JP-01 belongs to the signed-in user unless the backend record proves it.
8. Login, logout, session restoration, duplicate-account handling and correct dashboard routing must be manually tested with approved test accounts.
9. Cross-account isolation must be tested: one account cannot read or change another account's profile, ecosystem, files, messages, finance records or business workspace.
10. Check Supabase security and performance advisors; review findings before widening access.
11. Confirm backups, rollback procedure, error monitoring, support contact, privacy notice, terms, and a way to report defects.
12. Only use test accounts and non-production test data during market testing; no real payment, lending, investment, or delivery promises.

## Market-test exit criteria
Record the exact commit and deployment ID, smoke-test result, known defects, supported browsers/devices, test cohort, incident contact, data-retention approach, and rollback decision. If authentication, privacy isolation, or deployment health fails, stop testing and roll back/fix before inviting more users.
