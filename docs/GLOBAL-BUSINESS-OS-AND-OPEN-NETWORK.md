# JR PHEEF — Global Business OS and Open Network

## Product decision
JR PHEEF is global by design from the first release. It is not Kenya-first. Every individual, company, institution, partner, developer and future business created by the founder uses the same worldwide platform, with local settings for country, jurisdiction, language, currency, time zone, tax rules and provider availability.

## Universal business provisioning
Every business created through JR PHEEF receives its own isolated workspace. This applies to DGBO ventures, current and future founder-owned businesses, and businesses created by any JR PHEEF member. A business can be a supermarket, salon, barber, restaurant, shop, logistics operator, farm, manufacturer, professional practice, school, hotel, creative studio or another lawful activity.

The workspace is industry-adaptive rather than a hard-coded app per industry. JR configures relevant departments, workflows, documents, records, staff roles, operating plans, inventory/services, customer relationships and integrations from the business profile. Owners can add or remove modules as their business changes.

## Founder ecosystem provisioning
- DGBO: parent-company workspace, governance, portfolio oversight, shared services and approvals.
- JR PHEEF: platform company workspace, product operations, technology, partnerships, support, security and developer ecosystem.
- FAMILY: separate venture workspace, with strict data and financial separation from DGBO and JR PHEEF.
- Future ventures: provisioned as separate workspaces linked to DGBO's portfolio only through explicit ownership/management relationships.
- Other businesses: each receives a separate owner-controlled workspace; no cross-business data sharing by default.

These are workspace blueprints, not a claim that every venture is already legally incorporated or operational.

## Global-by-default model
- Global access and discovery; no country-first restriction.
- ISO country, currency and language metadata; IANA time zones.
- Jurisdiction-aware compliance packs and tax configuration, clearly marked as guidance until verified by qualified local professionals.
- Region-specific payment, identity, messaging, maps, logistics and data-residency providers, activated only where available and approved.
- Internationalisation, localisation and multi-currency accounting; preserve source currency and exchange-rate timestamps.
- Country availability is a provider capability, not a platform boundary.

## Existing-system import and export
The universal migration path must support:
1. File imports: CSV, XLSX, JSON, XML, supported database exports and documents.
2. Direct connectors: authorised OAuth/API connections, SFTP or approved partner transfer.
3. Data domains: people, customers, suppliers, employees, products, services, stock, sales, purchases, invoices, payments, bookings, documents, assets and projects.
4. Safe migration: source selection, ownership/authority confirmation, malware scanning, format detection, schema mapping, duplicate detection, validation, preview, explicit approval, staged import, reconciliation and rollback plan.
5. Export: user-selected records and documents in open portable formats, with metadata and audit logs.
6. No destructive takeover: imports never overwrite live records without preview and explicit approval; source systems remain intact unless owner separately authorises a change.

The initial API records an import intention only. It does not yet parse uploaded spreadsheets or transfer records. This distinction must remain visible until the complete pipeline is implemented.

## API and developer ecosystem
One shared server-side Integration Gateway serves the whole JR PHEEF platform. It provides versioned APIs, scoped credentials, OAuth where appropriate, webhook signing, idempotency, rate limits, quotas, retries, event logs, sandbox/production separation, revocation and partner health monitoring.

Developer Centre capabilities: registration, organisation verification, app creation, test credentials, API explorer, SDKs, webhooks, test events, logs, scopes, quotas, version migration and production access review.

Partner Centre capabilities: organisation verification, capability registration, regions served, supported currencies/languages, service terms, availability, pricing, data categories, security review, publication, incident management and revocation.

A directory entry is never described as an active integration. Statuses: planned, review, sandbox, production, verified, degraded, external-only, unavailable, suspended and revoked.

## Open-world connection model
JR connects people, businesses, goods, services, jobs, transport, delivery, institutions, applications, devices and other networks. A listing or capability may be native to JR, connected through a partner API, or an external destination. The user interface must identify which one it is.

## Security and governance
- Tenant isolation at business/workspace level.
- Explicit consent and purpose limitation for every import and share.
- Least-privilege role permissions and revocable partner credentials.
- No secret tokens in browser code or client storage.
- Audit access, export, import, sharing, approval, connection and revocation events.
- Human approval for money movement, payroll, purchases, contracts, official submissions, sensitive disclosure and other consequential external actions.
- No fake data, fake business activity or unverified provider status.
- Separate DGBO, JR PHEEF, FAMILY and future venture records; cross-venture sharing requires an explicit authorised relationship and scope.

## Implementation sequence
1. Global business workspace registry and tenant boundaries.
2. Industry-adaptive templates and business creation experience.
3. Secure upload/storage, CSV/JSON/XML/XLSX parsers and import preview/mapping.
4. Export and data portability tools.
5. Partner app registry, developer onboarding, scoped API gateway and sandbox.
6. Signed webhook delivery, retries, event logs and provider health.
7. Production integrations by provider, jurisdiction and verified commercial eligibility.
8. Industry operations packs, employee workspaces, document generation and daily plans.

## Initial code foundation
The first code foundation adds business workspace records, owner membership, global metadata and consented import-job records. It does not yet constitute a live spreadsheet migration engine, public API platform, developer key issuance service or production partner marketplace.
