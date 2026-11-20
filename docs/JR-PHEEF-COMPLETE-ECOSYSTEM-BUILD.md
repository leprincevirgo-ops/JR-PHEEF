# JR PHEEF — Complete Ecosystem Build Specification

**Status:** Consolidated product and engineering specification. This document records the complete intended product; it does not claim every capability is already implemented or externally connected.

## Product principle

JR PHEEF is a JR-first, expandable digital ecosystem spanning a web/PWA experience, mobile applications, connected services, enterprise workspaces, and a long-term AOSP-based device programme. It must remain one coherent experience with capabilities discoverable through natural conversation and contextual interfaces—not a pile of disconnected mini-apps.

Do not reintroduce the retired slogan “Find. Match. Trade.” Public brand name: **JR PHEEF**.

## System map

- **JR CORE:** identity-aware orchestration, context, retrieval, reasoning, capability registry, policy checks, tool execution, observability and learning.
- **JR COMMAND INTELLIGENCE:** the founder's single executive conversational interface, with a live but source-labelled operating picture.
- **JR WORLD WATCH:** monitors public and explicitly connected data; verifies timestamps and provenance; detects changes; relates events to approved company goals; prepares forecasts and alerts.
- **JR LINK:** integrated communication, contacts, messages, presence, notifications, deal conversations and approved external-channel bridges.
- **JR SERVICES:** a country-aware registry of lawful services, providers, requirements, prices, availability, delivery method and quality signals.
- **JR COMPANY BUILDER:** helps users research, plan, configure and operate business workspaces. It must distinguish an idea, a workspace, a legally registered entity and a trading business.
- **JR ENTERPRISE MANAGEMENT:** operating system for JR PHEEF itself and separate DGBO, FAMILY and future venture workspaces.
- **JR ECONOMY & INCENTIVES:** tracks platform revenue, expenses, budgets, funded credits, referrals, commissions and approved rewards.
- **JR GROWTH INTELLIGENCE:** plans, creates, approves, distributes and measures JR, DGBO, FAMILY and user-business marketing.
- **JR PHYSICAL WORLD INTELLIGENCE:** connects authorized sensors, maps, weather, logistics, agriculture, energy, infrastructure and emergency information to accountable human operators.
- **JR OS & DEVICES:** staged Android companion, managed launcher, AOSP reference image and later OEM/ODM device family.
- **Trust & Governance Plane:** identity, consent, least privilege, privacy, safety, audit, human approvals, incident response and continuity.

## Universal service registry

The registry must be expandable rather than a fixed menu. Seed service families include commerce and trade; work and careers; property and spaces; mobility and logistics; finance and money access; education and knowledge; health and wellbeing; home and daily living; food and agriculture; travel and hospitality; government and civic; industry and manufacturing; technology and digital; communication and media; creativity and entertainment; legal and professional; environment and energy; safety and security; international services; community and family; and future categories.

Every service record must capture: unique service identity; category; plain-language description; countries/regions; provider and verification status; direct or partner delivery; eligibility and qualifications; pricing and terms; availability freshness; payment method; service-level expectations; licensing/compliance requirements; safety risks; complaint/appeal path; and source provenance. Discovery does not imply provider verification, availability or permission to perform regulated work.

## World intelligence and evidence discipline

World Watch sources are classified as:
1. public sources (official notices, public datasets, research, news and weather);
2. connected systems (only APIs/accounts explicitly authorised);
3. physical-world feeds (licensed satellite/geospatial datasets, user-approved sensors and device telemetry);
4. enterprise sources (company data scoped to that company's permissions);
5. JR analysis (derived insights, simulations and forecasts).

Every insight must show source, observation time, last-updated time, geographic scope, confidence and whether it is observed, verified, estimated or predicted. Conflicting or stale data must be surfaced. JR cannot see every event, access arbitrary devices, guarantee earthquake prediction or conduct covert surveillance.

Operational cycle: Observe → Verify → Understand → Connect → Simulate → Recommend → Authorise → Execute → Verify outcome → Learn.

## One JR, separate companies

JR is the shared intelligence interface. It does not collapse the companies into one legal entity or pool their money.

- **DGBO:** parent enterprise governance, opportunity research, portfolio strategy, business intelligence and venture oversight.
- **JR PHEEF:** technology platform, services network, communications, AI orchestration, customer and provider operations.
- **FAMILY:** financial access, saving/investment participation and related services, only through lawful, appropriately licensed structures and partners.

Each company needs its own workspace, books, bank/payment accounts, contracts, customer records, permissions, staff, compliance duties and audit trail. Cross-company intelligence sharing is purpose-limited and authorised.

## Company Builder and enterprise departments

A user can create a proposed business workspace and receive help with validation, business model, market research, brand, budgets, premises, suppliers, staffing, inventory, customer support, sales and reporting. A workspace is not incorporation, a licence, a bank account or proof of trading.

JR PHEEF's internal operating departments: Executive Office; Finance; Operations; Technology & Security; Research & Innovation; Sales & Marketing; People & Culture; Customer Experience; Legal & Compliance; Risk; Quality; Audit & Institutional Memory. Specialist AI roles advise and perform pre-authorised routine work; humans remain accountable.

## Economy and self-sustainability

Potential earned revenue: transaction/matching fees when activated; subscriptions; business tools; provider plans; enterprise contracts; integration/API services; licensing; clearly disclosed advertising; and partner referrals. All prices and fees must be explicit before commitment.

Track hosting, AI inference, storage, communications, maps, payment processing, security, support, staffing, legal/compliance, marketing, taxes, refunds and reserves. Spend only from collected, available funds within approved budgets. Never represent unearned revenue as cash or promise investment returns.

Incentives must be funded, disclosed and auditable. Distinguish promotional credits, discounts, referral bonuses, wages, commissions, refunds and investment returns. No rewards merely for joining unless a funded, lawful promotion explicitly says so. Apply anti-fraud controls, eligibility, caps, expiry rules, dispute handling and tax/accounting review.

## Growth Intelligence and self-advertising

JR Growth Intelligence should:
- research suitable audiences, markets and business segments using lawful/public or consented signals;
- generate campaign plans, copy, images, short videos, landing-page variants and localised language;
- prepare channel-specific content for social networks, search, email, partner and community channels;
- schedule and publish only through authorised accounts and APIs, with approval gates appropriate to the risk;
- label paid placements and sponsorships; respect platform rules, IP, privacy, opt-outs and advertising law;
- prohibit spam, fake accounts, fake engagement, deceptive claims, impersonation and unauthorised scraping;
- track campaign spend, reach, qualified visits, registrations, activation, retention, conversion, complaints and acquisition cost;
- recommend budget shifts; automatically operate only inside founder-approved caps and campaign policies.

Growth must support JR PHEEF, DGBO, FAMILY and opted-in user businesses with separate brands, permissions, budgets and reporting. Revenue reinvestment is subject to operating costs, reserves, taxes and founder-approved budgets.

## Founder authority, delegated autonomy and safety

Founder governance covers ownership, strategic direction, executive permissions, risk appetite and constitutional changes. No AI agent, employee, integration or third party may grant itself broader authority or bypass safeguards.

Autonomy levels:
1. Observe and report.
2. Analyse and recommend.
3. Execute low-risk, reversible, pre-authorised actions within budgets and rate limits.
4. Obtain explicit human approval for consequential actions.

Human approval and independent controls are mandatory for money movement, regulated activity, contracts, employment decisions, ownership/governance changes, public campaigns outside approved rules, sensitive personal-data disclosure, physical actuation and actions affecting safety or rights. Dangerous actions may be automatically paused by safety controls even if previously authorised. Emergency stop, credential revocation, immutable audit and recovery paths must not depend on a single account. No hidden founder backdoor or unrestricted AI kill/control capability.

## Physical-world applications

Potential deployments include supply-chain visibility; transport and delivery coordination; farm and food logistics; infrastructure maintenance; energy optimisation; environmental monitoring; emergency preparedness; and access to health, education and civic services. Physical actuation requires certified hardware, human supervision, local safety interlocks, legal permission, fail-safe behaviour and independent testing. JR can inform and coordinate; it must not claim guaranteed prediction or replace qualified operators.

## OS and device strategy

Preserve the current Express/Supabase/PWA platform. Use versioned APIs and separate device credentials. Start with a native companion and accessible PWA; evaluate a managed launcher; then build an AOSP-based image for a supported reference device with vendor BSP; only then consider OEM/ODM hardware. AOSP does not include Google Mobile Services or Play licensing automatically. Hardware procurement, radio certification, security updates, repairability and after-sales support are release gates.

## Security, privacy and reliability

- No secret keys in browsers, mobile apps or source control.
- Password hashing, secure cookies, session rotation/revocation, rate limits, MFA/passkeys for privileged actions.
- Tenant isolation and server-side authorisation on every company/member resource.
- RLS and least-privilege database grants; migrations reviewed and backed up.
- Explicit mic/camera/location/file permissions and visible activity indicators.
- Data minimisation, purpose limitation, retention, export and deletion procedures.
- Signed releases, dependency review, vulnerability management, backup/restore drills, staged rollout and rollback.
- Accessibility for keyboard, screen readers, large text, reduced motion and multilingual use.
- Test abuse, fraud, prompt injection, cross-tenant access, replay, CSRF, XSS, SSRF, upload validation and payment idempotency.

## Implementation status vocabulary

Every feature must be labelled one of:
- **Specified:** described and accepted in product architecture.
- **Implemented:** code exists.
- **Tested:** automated/manual acceptance tests passed.
- **Connected:** required external account/API/device is authorised and working.
- **Released:** deployed to the intended environment and verified.

A green unit test does not prove a third-party integration or production capability. A draft pull request is not a production release.

## Completion acceptance

The platform is not production-complete until the critical paths pass on real devices: registration/login/recovery; identity and profile controls; search/listings and match; messages/deal room; business workspace creation and tenant isolation; DGBO/FAMILY separation; JR command with scoped tools; notifications; referrals and funded incentive accounting; growth campaign approval and analytics; provider verification; payment sandbox then authorised live payments; privacy/export/deletion; security review; accessibility; backups and restore; monitoring; load tests; deployment smoke tests; and documented support/incident procedures.

The current repository and service must be inspected before schema changes or feature additions. Keep unfinished capabilities visible as unavailable or planned rather than faking them.
