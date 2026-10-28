# JR PHEEF — Connected Ecosystem Integration Map

**Status:** Design and implementation baseline. A component is only "live" after its backend, permissions, integrations, and end-to-end tests are verified.

## Product identity
- Public product/platform name: **JR PHEEF**.
- Do not introduce "marketplace" as the public product name.
- JR PHEEF is the coordinating platform, not a replacement for the businesses and ecosystems it connects.

## Service boundaries

### JR PHEEF Core
Owns platform identity and sessions, user-owned ecosystem workspaces, discovery, coordination, communication, service navigation, integration permissions, auditability, and user-facing status.

### FAMILY
Intended to become an independent financial-services business serving customers inside and outside JR PHEEF. Its own business window must remain distinct. Until appropriately licensed and connected to regulated partners, do not describe it as a live bank and do not represent tracked goals or requests as actual balances, accounts, transfers, loans, or investments.

### DGBO
Business development and governance environment. Business records, IDEA VAULT concepts, investor coordination, and governance remain under DGBO's own authorization and controls. Investor introductions/funding functions require legal and regulatory review.

### Delivery and logistics
A JR PHEEF-coordinated service that may connect merchants, customers, courier partners, pickup points, delivery tracking, and payment status. This is not live until providers, pricing, dispatch, status webhooks, customer support, and payment integration are implemented and tested. Digital delivery is distinct from physical logistics.

### User-created ecosystems
Users can create personal, professional, business, community, or other workspaces on top of shared JR PHEEF capabilities. Each workspace needs an owner, purpose, membership, resource ownership, permissions, and revocation/exit rules. A user profile identifies who a person is; an ecosystem describes what they manage and who they collaborate with.

## JP Number standard (proposed)
A JP identifier is a stable identifier, not an authentication secret and not authorization.

- **Personal JP:** stable identity reference for a person.
- **Business JP:** organization reference.
- **Ecosystem JP:** workspace reference.
- **Service JP:** registered service reference.
- **Transaction JP:** reference to a transaction record, never a substitute for an authoritative ledger.
- **Cosmic Signature:** optional, user-controlled symbolic/numerology view based on a birth date. It is not identity verification, not scientifically predictive, and must not affect access, eligibility, trust, finance, or ranking.

### Identity and historical continuity
- Never assign a retired personal JP to another person.
- Keep identifiers separate from account credentials and financial account numbers.
- JP-01 is a proposed founder identity only if explicitly provisioned and verified; it must not be hard-coded as the signed-in user's identity.
- Historical records must distinguish verified facts, disputed claims, and unknown information.
- Long-term archive plans need independent backups, format migration, integrity verification, access governance, and succession/recovery exercises.
- Privacy rights and lawful retention still apply; permanence of an identifier does not imply public access to personal records.

## Shared integration contract
1. Use stable internal primary keys and unique external identifiers.
2. Authenticate every request and authorize every action server-side.
3. Default deny; least privilege; explicit consent for cross-environment sharing.
4. Do not infer permission from a shared JP number.
5. Keep audit records for sensitive changes and financial or governance actions.
6. Give each connected business its own workspace, data boundary, terms, support and operational status.
7. Make external service availability and integration state visible; do not claim an integration is live without a successful end-to-end test.
8. Separate proposed, in-development, integrated, and verified-live states in the UI.
9. Do not store birth date, birth time, or birthplace for Cosmic Signature unless the user separately consents and there is a justified feature need; a local preview is preferred.
10. No payment, transfer, investment, loan, delivery dispatch, investor contact, or irreversible action without explicit confirmation and a working authorized integration.

## Current repository scope and known gaps
- The current app has a JR PHEEF shell, an ecosystem overview, a FAMILY preparation workspace, DGBO architecture references, JP connections, and existing member sessions.
- A JP Identity screen is being added as a navigation/experience layer. It reads the current signed-in JP number through the existing session endpoint and calculates an optional Cosmic Signature locally.
- The new screen does not create JP registry records, create financial accounts, connect payment rails, or establish the identity of JP-01.
- The database has an existing members table and existing JP-number usage. Do not alter the identifier format or backfill numbers without auditing current uniqueness, constraints, allocation logic, and all clients.
- Prior auth/dashboard reports remain a priority: account already exists/incorrect details and successful sign-in failing to reach the correct user's dashboard must be tested using non-production test accounts and cross-account isolation tests.

## Implementation sequence
1. Validate current login, session restore, logout, dashboard routing, and cross-account isolation.
2. Validate current JP-number allocation and uniqueness; then formalize registry tables/migrations and immutable allocation rules.
3. Define workspace/business identifiers and membership/permissions.
4. Build cross-environment integration contracts, audit logs, revocation, and status reporting.
5. Build FAMILY using regulated financial partners and appropriate authorization; do not represent mock records as money.
6. Build delivery partner abstraction and end-to-end order/dispatch/tracking tests.
7. Add historical archive and succession/recovery procedures.
8. Run CI, security advisors, app-level authorization tests, and production smoke tests before promoting a release.

## Rollout states
- **Design:** agreed target, not implemented.
- **UI preview:** visible interface without full backend capability.
- **Integrated:** backend and provider connected in a non-production environment.
- **Verified live:** end-to-end test passed, monitoring and support are in place.
