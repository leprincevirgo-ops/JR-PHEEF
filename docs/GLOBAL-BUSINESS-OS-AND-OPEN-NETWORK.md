# JR PHEEF — Global Business OS and Open Network
JR PHEEF is global by design from day one. There is no Kenya-first boundary. Countries, currencies, languages, time zones, jurisdiction packs and local provider availability are configurable properties of a global platform.

## Universal business creation
Every business created by any member receives an isolated, adaptive workspace. Supported starting templates include general, retail, supermarket, salon/beauty, barber, hospitality, restaurant/food, healthcare, education, construction, real estate, transport/logistics, professional services, manufacturing, agriculture, technology, creative media, nonprofit and financial services. New lawful industries can be configured without creating a separate application.

A workspace can provision departments, employee roles, document sets, financial categories, customer/supplier records, service/product catalogues, operating routines, daily plans and integration slots. Templates are starting points and owners approve consequential decisions. DGBO, JR PHEEF, FAMILY and future ventures have separate workspaces; ownership links do not imply shared private data.

## Global operating model
Use ISO country/currency codes, IANA time zones, multilingual UX, multi-currency accounting with original-currency retention and exchange-rate timestamps, and jurisdiction-aware compliance guidance. Legal/tax outputs are guidance pending local professional verification. Provider availability and data-residency requirements are jurisdiction-specific, not platform access restrictions.

## Data portability and integration
Support CSV, XLSX, JSON, XML, database exports, documents and authorised API/OAuth/SFTP connectors. Domains include people, customers, employees, suppliers, products, services, inventory, sales, purchases, invoices, payments, bookings, documents, assets and projects. A safe import must scan, detect schema, map fields, identify duplicates, validate, preview, request explicit approval, stage writes, reconcile and provide a rollback plan. Export must be user-selected, portable and auditable. Never overwrite source systems or live JR records silently.

The current import endpoint only records a consented import intention. File parsing, storage, mapping, preview, staged import and export remain unimplemented.

## Developer and partner ecosystem
A versioned server-side Integration Gateway should offer scoped credentials, OAuth, signed webhooks, idempotency, quotas/rate limits, retries, event logs, sandbox/production separation, revocation and health monitoring. Developer Centre provides organisation/app registration, credentials, API explorer, SDKs, sandbox, logs and production review. Partner Centre provides verification, capabilities, regions, currencies, terms, data scopes, availability, security review and incident handling. A directory entry must never imply a live integration.

## Human value and governance
JR should expand access to learning, work, livelihoods, services, goods, creativity, community participation, accessibility and opportunity. It should not manipulate users, sell private data, promise returns, or replace human judgment. Preserve user control, explain uncertainty, distinguish verified facts from generated suggestions, support correction and appeal, and make export and exit possible. Require explicit approval for money movement, payroll, purchasing, contracts, official submissions, sensitive disclosures and consequential external actions.

## Existing code foundation
The implementation extends the existing jr_business_workspaces model rather than creating a parallel registry. It adds global metadata, workspace membership and import-job tracking with server-only data access. It is not yet a full migration engine or public developer API.
