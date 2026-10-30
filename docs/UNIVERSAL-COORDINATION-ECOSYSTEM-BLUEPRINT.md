# JR PHEEF — Universal Coordination Ecosystem Blueprint

## Founding product principle
JR PHEEF brings the scattered digital capabilities people use into one coordinated environment. It is not merely an app directory, marketplace, browser, or social network. It is a coordinator that helps people discover resources, connect participants, create things, organise work, transact through authorised providers, and grow opportunities.

**Product promise:** Discover anything. Access everything. Connect everyone. Create opportunities. Coordinate activities. Build without boundaries.

## Architecture: one core, modular capabilities, governed environments

### JR PHEEF CORE
The shared platform foundation:
- Identity and JP identifiers; authentication and session management.
- Authorisation, consent, delegated permissions and revocation.
- Navigation, workspace shell, design system and accessibility.
- Search and discovery orchestration.
- Integration registry, event contracts and audit trail.
- Notifications, preferences, storage abstractions and observability.
- Intelligence gateway with provider/model abstraction and safety controls.

### User-facing capabilities
1. HOME / PERSONAL DESKTOP — dashboard, widgets, shortcuts, workspaces and appearance.
2. BROWSER — general web access; initially a safe web surface, ultimately a dedicated Chromium-based desktop/mobile browser product.
3. SEARCH — federated search across JR PHEEF and approved external sources.
4. DISCOVER — visual destinations for categories, nouns, photographs, videos, places, knowledge, products and services.
5. APP HUB — user-organised external app/web shortcuts and launch catalogue; deeper native launching requires Android/desktop companion capabilities.
6. APP MARKET — reviewed first-party and third-party mini-apps, connectors and services.
7. CONNECT — messaging, groups, presence, notifications, media, voice/video and vetted end-to-end encryption.
8. INTELLIGENCE — research, planning, specialist assistance and user-approved workflow orchestration.
9. BUSINESS / CREATION STUDIO — business setup guidance, storefronts, brands, websites, apps, products and services.
10. OPPORTUNITIES — jobs, projects, contracts, partnerships, tenders, investment introductions and community opportunities.
11. COMMERCE — catalogues, advertising, bookings, orders and transactions through approved integrations.
12. CLOUD / PERSONAL VAULT — files, photos, documents, sharing, backup and sync.
13. KNOWLEDGE & LEARNING — courses, books, research, tutorials and learning paths.
14. SERVICES & MAP — local/global service discovery, places, providers, bookings and logistics.
15. PROJECTS — goals, tasks, budgets, people, milestones, documents and progress.
16. FINANCIAL COORDINATION — budgeting, invoices, accounting links and financial education; regulated services only via licensed partners.
17. COMMUNITY — groups, civic initiatives, volunteering and development projects.
18. AUTOMATION — approved workflow execution, schedules, triggers and connected devices.
19. GOVERNANCE & CONTINUITY — authority, succession, recovery, decisions, policies and audit.

### Connected environments
- DGBO: governance, oversight, business development, intelligence, command centre, control room, control system, investor coordination and private IDEA VAULT.
- FAMILY: private family coordination, goals and financial-access requests; not a bank or lender unless licensed partners and approvals are in place.
- User-created environments: personal, business, education, community and project workspaces.

DGBO, FAMILY and JR PHEEF share only the minimum identity and integration services required. Data, roles, permissions and audit scopes remain separated by default. Cross-environment access must be explicit, scoped, revocable and logged.

## Universal discovery model
A category or recognised subject resolves to a reusable destination template, not a manually authored page. A destination may contain:
- Images and galleries with source, licence and attribution metadata.
- Videos from authorised providers, embeds or approved uploads.
- Editorial/knowledge summaries and related topics.
- Products, services, places, providers and opportunities.
- Clearly labelled sponsored placements, separated from organic ranking.
- Save, collect, share, compare, contact and coordinate actions.
- Related subject links forming a governed knowledge graph.

Search and recommendation ranking must not secretly favour advertisers. Personalisation is opt-in/controllable; sponsored content is always labelled. Respect provider terms, copyright, embedding restrictions and regional availability.

## Integration and app model
Every external service has an explicit status: native, first-party module, connected API, web app, installed-app deep link, shortcut, unavailable. Never represent a shortcut as an integration. Use OAuth/authorised APIs and least-privilege scopes; never collect third-party passwords. External apps remain independently usable. Native app launch requires supported OS-level deep links or companion apps and cannot be guaranteed by an ordinary web page.

## Economic coordination loop
DISCOVER → CONNECT → CREATE → COORDINATE → TRANSACT → GROW.
The ecosystem can help create businesses, find suppliers and workers, coordinate delivery, advertise, book services and manage workflows. Payments, custody, lending, insurance, investment execution and other regulated activities require licensed providers, legal review and explicit user approval.

## Trust, privacy and security requirements
- Default deny; least privilege; explicit consent; revocable delegated access.
- Strong authentication, secure sessions, CSRF/origin protections, rate limits and account recovery.
- RLS on exposed Supabase schemas; owner/tenant predicates on every data operation.
- Server-side secrets only; no service-role or secret keys in browsers.
- File type/signature/size checks, private storage by default and short-lived signed URLs for private files.
- Audit consequential actions; never let AI transfer ownership, approve regulated activity or bypass controls.
- Separate public pseudonym, JP identity, authenticated account and legal ownership evidence.
- JP-01 is immutable and never reassigned; never expose it publicly or treat it as a permission bypass.
- Founder privacy must include provider metadata review; the current public GitHub repository exposes repository ownership metadata. No provider-account or visibility changes without an approved migration.
- Succession requires verified authority, independent checks, cooling-off/recovery safeguards and immutable audit records.

## Release and implementation stages

### Stage 0 — protect and verify the existing product
- Preserve working login/session, profile, Explore, appearance, Browser, Connect, opportunities and existing DGBO/FAMILY structures.
- Add automated route/script checks and real authenticated end-to-end journeys.
- Resolve auth/dashboard, profile photo privacy and settings placeholders.
- Confirm backup, rollback, error monitoring, dependency risk and release process.
- Establish staging and production separation before high-risk schema work.

### Stage 1 — coherent user shell
- Unified navigation, settings, global history, responsive dashboard and workspace model.
- App Hub web shortcuts and personal collections.
- Browser/search/discover cross-navigation.
- Consistent status labels for implemented, connected, shortcut, planned and unavailable.

### Stage 2 — universal discovery
- Taxonomy and subject registry; destination templates; source/rights metadata.
- Search adapters; image/video provider adapters; related-topic graph.
- Ads inventory, consent, targeting controls, frequency caps and sponsored labels.
- Saved collections and personal discovery history.

### Stage 3 — coordination and economy
- Project builder, provider profiles, business workspaces and opportunity workflows.
- Connect presence/unread/notifications/media, then voice/video via providers.
- Commerce and booking integrations with clear pricing, refunds and dispute rules.
- Service verification and provider safety processes.

### Stage 4 — ecosystem and developer platform
- DGBO/FAMILY controlled integration, governance and succession workflow.
- Integration directory, API scopes, developer sandbox, review and revocation.
- Automation engine with approval gates and audit.
- Cross-device sync and supported native app-launch companions.

### Stage 5 — scale and global operations
- Multi-region resilience, performance budgets, observability, abuse response, support, legal compliance and disaster recovery.
- Native Android and desktop browser/launcher only when product scope, security and operating costs are approved.

## Definition of done
A feature is not complete merely because a screen exists. Completion requires:
1. User story and permission model.
2. Data model and migration where needed.
3. Server-side validation and secure API.
4. Accessible responsive UI and error/loading/empty states.
5. Automated tests and security checks.
6. Deployed environment verification.
7. End-to-end test of the complete user journey and tenant boundaries.
8. Documentation, support and rollback notes.

## Current verified baseline (30 October 2026)
- GitHub: `leprincevirgo-ops/JR-PHEEF`, default branch `main`, repository visibility public.
- Render: live service on Free plan, auto-deploy from `main`; latest confirmed live commit `97b9fca33f0a55b469932aeea7ed6f33fea09381`.
- Supabase project: `tzyrlwshwkbnkbhjnpev`, ACTIVE_HEALTHY; security advisor returned no lints.
- Performance advisor: two unindexed foreign keys (created_by on jr_conversations; sender_id on jr_messages) and 66 unused-index notices. Do not drop indexes without workload evidence.
- Existing browser is a sandboxed iframe/search surface, not Chromium.
- Existing appearance and custom wallpaper preferences are browser-local; not cross-device synced.
- App Hub native launching, universal visual/video engine, provider integrations, full settings, succession workflow and complete cross-environment integration are not yet verified as implemented.
- Login, profile upload and two-account messaging need real deployed end-to-end tests.
- Render Free plan and current service/domain should not be upgraded or changed without explicit approval.

## Working rule
Build incrementally on the existing repository. Never overwrite the product with a speculative rewrite, silently incur paid costs, expose secrets, invent provider integrations, or claim tests/deployments that did not run.
