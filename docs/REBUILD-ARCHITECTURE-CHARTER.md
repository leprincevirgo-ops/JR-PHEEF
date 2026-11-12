# JR PHEEF Rebuild Architecture Charter

Status: approved design baseline; implementation in progress
Target: complete architectural rebuild while preserving and improving the full JR PHEEF vision
Production policy: the existing production service, database, storage and user records remain untouched until replacement acceptance gates pass.

## 1. Product constitution

JR PHEEF is an expandable, universal intelligent operating ecosystem. A user can describe an outcome in natural language without needing to know which module or category handles it. JR interprets the request, discovers capabilities, coordinates tools and worlds, and executes only within verified permissions and available integrations.

The system must:
- Preserve the full previously agreed JR PHEEF, DGBO and FAMILY vision.
- Present JR as the primary entry point; avoid forcing users through rigid feature menus.
- Support mobile-first and full desktop/tablet experiences.
- Support multiple languages and voice/text interaction.
- Support one person identity across personal, marketplace, professional and business roles.
- Support native, personal, business and externally connected worlds.
- Allow users to create personal and business worlds through controlled templates and workflows.
- Support business creation and AI-assisted daily operations, with owners retaining final authority.
- Be continuously expandable through a capability registry, integration gateway and governed development lifecycle.
- Keep DGBO governance and founder controls separate from normal user experiences.
- Keep DGBO, JR PHEEF, FAMILY and future ventures distinct in identity, records, financial accounting and permissions.

## 2. System architecture

Use a modular monolith as the initial deployment architecture, with strict module boundaries and service contracts. Extract independent services only when scaling, reliability or team ownership justifies it.

### Experience layer
Responsive web/PWA experience, mobile-first navigation, desktop workspace, accessibility, themes, profile and Command Centre. Primary navigation remains HOME, WORLDS, JR and COMMAND CENTRE. JR remains the conversational centre.

### Intelligence orchestration layer
- Conversation and intent understanding
- Context selection and memory retrieval
- Capability discovery and planning
- Tool execution orchestration
- Personalisation and learning support
- Business intelligence and delegated AI management
- Creation intelligence for new worlds, workflows and applications
- Provider-independent AI gateway with cost, timeout, fallback and usage controls

The model is not an authority source. Every action must be validated by deterministic server-side policies.

### World and capability layer
World registry, world builder, world versioning, capability registry, capability manifests, workflow engine, user-created personal worlds, organisation-owned business worlds and connected external worlds.

A world is a governed environment containing configuration, capabilities, data boundaries, members, workflows and audit history. World configuration must be separated from tenant data.

### Domain modules
Identity and profiles; organisation and membership; marketplace and listings; matching and deal rooms; chat, contacts and status; advertising and media; projects and downloads; delivery and mobility; Rooms Near Me; ACCESS GOV; POWER SALE; FAMILY services; business operating system/POS/inventory; learning and research; device continuity; external integrations.

### Platform foundation
PostgreSQL/Supabase data layer; private object storage; authentication/session service; notification service; payment ledger and provider adapters; search; audit and security events; background jobs; observability; backups and recovery.

### Integration gateway
Provider adapters with scoped credentials, signed webhooks, idempotency, rate limits, explicit scopes, event validation and audit trails. External integrations never receive unrestricted database access.

### Governance and trust
Authentication, authorisation, tenant isolation, consent, policy evaluation, spending limits, approvals, immutable audit history, risk controls, data export/deletion and regulatory controls.

## 3. Identity, tenancy and access

One person has one platform identity. A person may be a buyer, seller, employee, contractor, service provider, learner, business owner or organisation administrator without creating duplicate accounts.

Organisations have independent identities. Membership and role grants connect people to organisations. Permissions are explicit, scoped to a resource/action, revocable and auditable. A user's authority in one organisation does not grant authority in another.

JP identifiers are stable platform identifiers and must remain separate from phone numbers, email addresses and authentication secrets.

Personal data, each organisation's records, each world and each integration credential must have enforceable boundaries. Cross-world retrieval requires an explicit policy decision and purpose.

## 4. Memory and learning

Keep separate logical stores for:
- Working memory: current task/session context with short retention.
- Personal memory: user-controlled, non-sensitive preferences and continuity.
- World memory: information scoped to a personal or business world.
- Business knowledge: organisation-owned operating information.
- Learning progress: learner-authorised progress and preferences.
- Relationship context: limited to authorised relationship and communication use.

Memory ingestion must classify purpose, sensitivity, owner, source, consent, retention and allowed AI use. Never store passwords, raw tokens, payment secrets or inferred sensitive personal data as conversational memory. Users can inspect, correct, restrict, export and request deletion, subject to lawful retention obligations. Private user data must never become another user's memory.

## 5. Delegated business autonomy

AI managers can monitor, prepare, recommend and perform pre-authorised routine operations within explicit limits. Owners retain final authority over ownership, major expenditure, hiring/firing, significant contracts, regulated activity and other reserved decisions.

Each action policy defines:
- Actor and organisation scope
- Allowed action and resource
- Financial and operational limits
- Whether prior approval is required
- Expiry/revocation conditions
- Evidence and audit requirements
- Rollback/compensation strategy where possible

An approval record is not proof of execution. Execution handlers independently re-check permissions and provider outcomes.

## 6. Financial architecture

Separate provider transactions, internal ledger entries, subscriptions, match fees, credits, rewards, withdrawals and company revenue. Use append-only double-entry accounting for money movement, idempotency keys, reconciliation and clear pending/settled/failed states. Never promise returns. Credits are not represented as cash. M-Pesa or other provider activation requires credentials, callbacks, reconciliation, compliance and explicit launch approval.

Previously discussed commercial assumptions to preserve for product modelling (not yet activated payment policy): KSh 30 buyer + KSh 30 seller matching fee; Pro/Prime matching rate KSh 20; first month free; PRO KSh 99/month; PRIME KSh 149/month; withdrawal minimum KSh 200 with the discussed cash/credit split. These values require a final commercial, legal and accounting review before production collection.

## 7. Security baseline

- Secure, modern authentication and session revocation.
- Strong password hashing, recovery controls and rate limiting.
- Least-privilege service credentials; no service-role or secret key in browser code.
- Row-level security on exposed tables; explicit ownership/tenant predicates.
- Private storage by default; signed, short-lived access where required.
- Server-side validation for all privileged actions.
- CSRF/origin controls compatible with supported browser and PWA contexts.
- Content security and safe file upload validation.
- Secrets never committed to source control or emitted in logs.
- Immutable security/audit events for consequential actions.
- Dependency pinning, lockfiles, vulnerability checks and supply-chain review.
- Backups, restore drills, incident response and emergency disable controls.
- AI prompt injection and untrusted tool output treated as data, never authority.

## 8. Build and migration strategy

1. Preserve production and capture a baseline of code, schema, migrations, storage, environment variable names, integrations and deployed behaviour.
2. Map all existing features to this charter; mark each as retain, improve, replace, defer with reason, or blocked by external dependency. No silent feature removal.
3. Build the new application in this dedicated branch and isolated development environment.
4. Implement foundation modules first: identity, tenancy, permissions, audit, world registry, capability registry and AI gateway.
5. Add domain modules incrementally using stable contracts.
6. Create migration/compatibility adapters for existing data; do not copy production secrets or mutate live user data during development.
7. Run automated unit, integration, security, accessibility and end-to-end tests.
8. Test on real Android, iOS, desktop and tablet browsers, including login, logout, password recovery, navigation, voice stop behaviour and interrupted network conditions.
9. Deploy to a separately named preview/staging service and isolated database/storage.
10. Run acceptance and data-reconciliation checks. Production cutover requires explicit review of the deployment plan, backups, rollback and user impact.

## 9. Quality gates

A feature is not complete because its UI exists or a source-level check passes. It must have:
- Defined user journey and acceptance criteria
- Server-side permission tests
- Data ownership and tenant-isolation tests
- Error, retry and idempotency behaviour
- Accessibility and responsive behaviour
- Observability and audit coverage
- Automated tests and real browser/device verification
- Documentation and operational ownership

Release gates: no critical security findings; no cross-tenant data leakage; all P0 journeys pass; backup and rollback verified; no false claims about provider or payment completion.

## 10. Initial P0 acceptance journeys

1. Register, verify, log in, remain signed in, log out and recover account.
2. Open JR as the first entry point and submit arbitrary natural-language requests.
3. Stop voice capture reliably; switch between text and voice.
4. Navigate HOME, WORLDS, JR and COMMAND CENTRE on small mobile screens without overlays blocking controls.
5. View/edit profile and privacy/verification controls.
6. Create and manage a personal world with scoped data.
7. Create an organisation, invite a member and verify role boundaries.
8. Create a business world and delegate a harmless routine task.
9. Create a listing, search, match, open a deal room and exchange messages.
10. Upload/download private files with correct access controls.
11. Create a delivery request and verify status transitions without pretending a provider booking exists.
12. Inspect memory, change consent and verify data isolation.
13. Create an action proposal, approve it and verify execution is separately authorised and audited.
14. Verify founder/governance surfaces are inaccessible to ordinary accounts.

## 11. Current repository and platform baseline

The rebuild branch is based on the existing repository main commit. The existing codebase already contains substantial features, modules, SQL migrations and regression checks. Treat these as source material and compatibility requirements, not as proof that every feature works end-to-end.

The current production database contains existing user, business, marketplace, FAMILY, messaging, continuity, memory, security and integration records. Preserve them. Never reset or drop production tables as part of this rebuild.

## 12. Outstanding dependencies

- Confirm the Render workspace before reading or changing Render resources.
- Confirm which existing Render service is production and whether a separate staging service may be created.
- Confirm isolated development database strategy and any potential costs before provisioning.
- Confirm AI provider and billing/credit availability.
- Payment provider activation and legal/compliance review remain gated.
- Real-device acceptance requires browser/device access and user participation where authentication or device permissions are needed.
