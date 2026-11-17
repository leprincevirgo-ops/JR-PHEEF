# JR PHEEF Feature Preservation and Verification Register

This register prevents scope loss during the complete rebuild. A source file, SQL table, UI component, or regression script proves only that an artefact exists; it does not prove that a user journey works in production.

Legend:
- **Source present**: related implementation files exist in the current main branch.
- **Schema present**: related database tables/migrations exist.
- **Needs E2E**: complete deployed journey has not been verified in this rebuild audit.
- **Planned / gated**: requires provider, legal, billing, hardware, partner, or further product work.

## A. Core experience and identity

| Requirement | Existing evidence | Rebuild treatment | Verification |
|---|---|---|---|
| JR is first entry point; natural-language-first experience | public/index.html, conversation-first-access.js, natural-interaction.js, jr-core.js, universe-home.js | Improve as the primary shell | Needs E2E |
| HOME, WORLDS, JR, COMMAND CENTRE | mobile shell, workspace shell, navigation checks | Preserve exact intent; refine adaptive navigation | Needs real-device E2E |
| Responsive mobile and desktop environments | mobile-phone-shell.js, screen-studio.js, immersive-world-home.js, desktop checks | Preserve and improve distinct responsive layouts | Needs device/browser E2E |
| Profile, verification, privacy, profile photo controls | members schema, jp-identity-ui.js, Command Centre modules, migrations | Preserve; finish upload/privacy journey | Needs E2E |
| One person, multiple roles and organisations | members, jr_organizations, jr_org_members, business workspace tables | Formalise identity/tenant model | Needs schema and cross-tenant tests |
| JP identifier and JP-01 founder identity | jp identity modules and existing project decisions | Preserve as stable internal identifier; no public exposure or guessed account binding | Needs authority verification |
| Sign-up, password login, recovery, sessions | server.js, sessions, password_resets, auth preference migrations | Rebuild securely and verify on actual mobile browsers | P0 E2E |
| Voice/text, multilingual conversation, stop listening | JR UI and speech interaction modules | Preserve; improve cancellation, language handling and fallback | Needs device/browser E2E |

## B. Worlds, intelligence and memory

| Requirement | Existing evidence | Rebuild treatment | Verification |
|---|---|---|---|
| Adaptive world routing from open-ended requests | human-environment, universal interaction, intent and capability files | Central World Engine and intent planner | Needs E2E |
| Native, personal, business and connected worlds | world/workspace modules, jr_world_progress, business workspaces | Formal world registry, versions and tenancy | Needs schema/API/UI |
| User-created personal and business worlds | projects, business workspaces, world modules | Governed world builder and preview/activation lifecycle | Needs E2E |
| Universal capability registry | jr-pheef-capabilities.json and JR core modules | Versioned capability manifests and policy enforcement | Needs E2E |
| Continuous knowledge/capability expansion | knowledge articles, lab experiments, projects and docs | Separate knowledge, capability and software-release lifecycles | Provider/build pipeline gated |
| Personal, working, world, business, learning and relationship memory | jr_member_state, jr_world_progress, jr_growth_journal, jr_capability_permissions, jr_memory_items | Separate stores/policies, consent, retention and export/delete | Needs privacy/E2E |
| JR Teacher, research, creativity and learning | knowledge/library/lab and AI routes | Preserve as discoverable capabilities behind JR | AI provider currently requires billing verification |
| User action proposals and approval | jr_action_proposals, jr_security_events, execution governance migrations | Enforce proposal/approval/execution separation | Needs E2E and threat testing |
| AI manager and delegated business autonomy | business OS, daily plans, agent tables/settings/actions | Policy-bound agents, owner approval, spending limits and audit | Needs E2E |

## C. Marketplace, communication and community

| Requirement | Existing evidence | Rebuild treatment | Verification |
|---|---|---|---|
| Buyer/seller combined identity and listings | jr_listings, market routes and UI | Preserve and improve matching/discovery | Needs E2E |
| Matching and Deal Rooms | jr_deal_rooms, jr_deal_messages | Preserve; use agreed KSh 30/30 and Pro/Prime KSh 20 only after commercial approval | Payments gated |
| Chat, contacts, JP Connect, status and notifications | jr_conversations, participants, messages, status, contacts and notifications modules | Improve delivery, unread, presence, privacy and media | Needs two-account E2E |
| Social posts, follows, likes, comments and groups | social tables and command-centre social modules | Preserve with moderation/reporting/privacy | Needs E2E |
| Advertising with camera/gallery/media upload | ad_campaigns, media routes and UI | Preserve; enforce rights, consent, moderation and spend controls | Needs E2E |
| Opportunity discovery: jobs, services, projects and business | jr_opportunities and related routes | Expand taxonomy and verified source/status labels | Needs E2E |
| Rooms Near Me | room_listings and UI/routes | Preserve; pricing and availability accuracy checks | Needs E2E |
| FixedItConnect and service matching | marketplace/service discovery patterns | Preserve as a discoverable service capability | Needs product/API mapping |

## D. Business, logistics and commerce

| Requirement | Existing evidence | Rebuild treatment | Verification |
|---|---|---|---|
| Business creation and business worlds | jr_business_workspaces, dgbo_businesses, business-os routes | Improve organisation provisioning and operating system | Needs E2E |
| POS, products, sales, stock, receipts and stock moves | pos_products, pos_sales, pos_sale_items, pos_stock_moves, pos_counters | Preserve; strengthen ledger, permissions and reconciliation | Needs E2E |
| Daily business growth planner | jr_business_daily_plans and runner script | Preserve; verify scheduled delivery dependency and AI/template distinction | Scheduler/billing gated |
| Suppliers, employees, departments, customers and operations | business OS architecture docs and workspace modules | Build complete modular operating workflows | Partly planned |
| JR PHEEF Delivery, riders, movers, transport and tracking | jr_riders, jr_delivery_requests, errands/events, delivery routes | Preserve; provider maps/tracking/booking integrations gated | Needs provider E2E |
| POWER SALE | powersale route/module | Preserve and verify eligibility, settlement and reporting | Needs E2E |
| Business system import/export and API gateway | jr_business_import_jobs, partner connections/events | Preserve; secure scoped adapters, dry-run and audit | Needs partner E2E |
| Cross-platform integrations | partner connections/events | Build only through supported authorised APIs/deep links | Provider/approval gated |
| Device-to-device transfer and continuity | device bridge, continuity and device tables/modules | Preserve; encrypted transfer, device revocation and sync conflict rules | Needs device E2E |
| Browser, App Hub, Explore and Downloads | browser/apphub/discover/explore/downloads modules | Preserve with honest distinction between shortcuts, integrations and native apps | Needs E2E |

## E. DGBO, FAMILY and governance

| Requirement | Existing evidence | Rebuild treatment | Verification |
|---|---|---|---|
| DGBO parent-company governance and separate business-research revenue destination | dgbo_decisions, dgbo_businesses, ecosystem docs | Separate company identity, ledger and owner-only controls | Needs authority/ledger review |
| FAMILY as distinct venture and financial-access purpose | ventures, family goals/applications, family bank tables/routes/UI | Preserve separate identity; do not relabel as a JR or DGBO wallet | Regulated partner/legal gates |
| AI Manager across DGBO/JR/future ventures | agent settings/actions, business plans, governance records | Separate agents and authority by organisation | Needs E2E |
| Founder controls private from ordinary users | private/founder-command.js, founder checks | Isolated private admin surface with strong verification | Needs authenticated role tests |
| Ownership, succession and intergenerational governance | architecture and journey docs | Preserve succession concepts with dual-control and recovery safeguards | Requires legal design |
| Separate brands, themes and user-customisable environments | themes.js and appearance modules | Preserve company-specific design tokens and personal themes | Needs real-device E2E |

## F. Commercial rules and launch constraints

| Requirement | Treatment |
|---|---|
| Free first month; PRO KSh 99/month; PRIME KSh 149/month | Preserve as product assumptions; confirm taxes, billing periods and entitlement logic before activation |
| Match fee KSh 30 buyer + KSh 30 seller; Pro/Prime KSh 20 | Preserve as agreed pricing assumption; payments remain gated |
| Withdrawal minimum KSh 200 and proposed 50% cash / 50% JR credits; retained split 20% owner revenue / 30% user credits | Requires explicit accounting/legal review; implement only with balanced ledger, clear disclosure and approved provider |
| 1,000 active users/day modelling | Use for capacity and cost planning, not as a usage or revenue claim |
| Start with zero capital and prioritise JR PHEEF | Prioritise free/low-cost architecture; no paid resources without approval |
| M-Pesa and other live payment rails | Not live until credentials, callback security, reconciliation, test-mode and production approval are verified |
| AI API provider | Previous logs indicated credit exhaustion; provider billing/quota must be checked before claiming live model functionality |

## G. Safety and global scope

- Global-ready identity and organisation model, localisation, currencies, time zones and regional availability.
- Trust engine distinguishes identity, qualification/authority and transaction evidence.
- Scam/fraud reporting, moderation, review and appeals; algorithmic risk flags are not proof.
- Privacy by default, consent, data minimisation, retention, export and deletion.
- Regulated financial activity only through appropriately licensed providers and approved jurisdictions.
- Device, airport, aviation, satellite, industrial and safety-critical capabilities require approved interfaces and must never interfere with certified systems.
- External apps are represented accurately as native, API-connected, web app, deep link, shortcut or unavailable.
- Advertising is labelled and does not secretly influence organic ranking.

## H. Rebuild verification rules

For every row, track separate states:
1. Designed
2. Source implemented
3. Schema/migration implemented
4. Automated tests passed
5. Deployed to isolated staging
6. Authenticated end-to-end journey passed
7. Security/privacy review passed
8. Production approved

No row is labelled complete merely because code or a regression script exists. No production data is reset or replaced during rebuild. The existing main branch and production service remain recoverable until cutover approval.
