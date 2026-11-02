# JR PHEEF — Universal Human & Real-World Ecosystem Architecture
Version: 2.0 · 2 November 2026
Status: Foundational target architecture; implementation is progressive and must be verified per capability.
Product name: JR PHEEF

## North star
JR PHEEF is an intelligent digital-to-real-world coordination environment. A person enters through one simple command surface, expresses an intention naturally, and JR assembles the relevant workspace, information, tools, people, organisations, services, resources and actions. The product is not defined by a fixed collection of app tabs. Its capabilities remain discoverable, but the interface brings forward what is relevant to the person's current intention.

**One human. One entry point. One intelligent environment. Connections across digital, human and physical worlds.**

Build JR for the world that exists today, architect it for the world that is emerging, and keep it adaptable for worlds humanity has not yet imagined.

## Experience contract
- Welcome surface: one universal search/command input, voice, camera entry, and a truthful network-connectivity indicator. Account and accessibility controls remain available without crowding the primary surface.
- A command such as “JR, open Command Centre” opens the named workspace directly when the destination is known and the user is authorised.
- Other intentions are handed to JR's reasoning/coordination experience; the system must distinguish questions, plans, recommendations, requests and actions.
- Every workspace has the same persistent command surface. The user can ask JR to change context without hunting through menus.
- Workspaces are assembled around the current goal and can contain relevant information, tools, documents, people, organisations, products, services, resources, tasks, progress and evidence.
- Existing categories, modules and routes remain available through natural-language commands, contextual discovery and optional exploration. They are not deleted simply because they are not permanently visible.
- Back/home, keyboard, touch, voice, screen-reader and alternative interaction paths remain usable. No essential action may depend only on speech, sight or hearing.
- A camera selection is not an upload or an analysed image until a supported upload/vision workflow confirms that action. Browser online/offline status is not a Wi-Fi hardware control.

## Interaction and coordination lifecycle
1. Understand the user's intended outcome and the context.
2. Resolve known destinations directly; otherwise clarify ambiguity only when necessary.
3. Decompose the outcome into work, dependencies, resources, participants, locations, timing and constraints.
4. Discover relevant JR capabilities and external providers.
5. Compare evidence, availability, cost, trust and coverage.
6. Present a coherent, task-specific workspace.
7. Obtain explicit approval for consequential actions.
8. Coordinate authorised participants and services.
9. Monitor, reconcile and verify results.
10. Preserve relevant user-authorised continuity and learn from permitted feedback.

A visible progress state must distinguish: discovered, proposed, awaiting approval, authorised, in progress, completed, failed, unavailable and externally confirmed.

## Three connected worlds
### Digital world
Software, information, applications, AI capabilities, APIs, data, media, cloud infrastructure and digital services.

### Human world
Individuals, families, communities, professionals, employees, employers, customers, suppliers, investors, creators, educators, institutions and public bodies.

### Physical world
Places, buildings, land, products, materials, machines, vehicles, infrastructure, farms, factories, energy, water, transport, logistics, healthcare facilities and real-world activities.

JR connects these worlds through authorised and meaningful relationships. It does not imply that a physical resource is available, a person has agreed, a provider is integrated or an action is complete without evidence.

## Identity and registration model
Registration is ecosystem entry, not enrolment in each application.
- **Human identity:** one central member account for a person. Initial registration is minimal; use supported phone/email/passkey authentication, verification and a display name. Collect optional profile and preference details progressively and only when useful.
- **Entity identity:** separate records for businesses, organisations, communities, services, products, places, devices/systems and registered AI capabilities.
- **Relationship and role:** a human may own, administer, work for, represent, supply, serve, study with or participate in an entity. Each relationship has explicit scope, status, provenance and permissions.
- **Verification:** authentication, legal identity, professional qualification, business registration, product authenticity, provider reliability and transaction confirmation are separate claims with their own evidence and expiry.
- **JP identifiers:** ordinary members receive their own unique member identifier. JP-01 remains a distinct protected ecosystem designation and must never be auto-assigned to members or treated as an access token.
- **Progressive onboarding:** a person may join as an individual and later add a business, team, project, professional role or organisation without creating another personal account. Higher-risk activities trigger purpose-specific verification.
- **Guest discovery:** public information and safe exploration may be available before registration. Private, personal, transactional or restricted actions require the appropriate identity and permissions.

## Universal connectivity model
Every meaningful entity can be discovered and connected to another entity when the relationship is relevant and permitted. Relationship types include follows, messages, introductions, employment, ownership, representation, supply, purchase, delivery, booking, service provision, learning, collaboration, investment interest, location, device control and data sharing.
Connectivity supports one-to-one, one-to-many, many-to-one and many-to-many interactions. It includes discovery, communication, collaboration, exchange, coordination, transactions, monitoring, dispute handling and closure.
The relationship graph is not a public directory of private data. Visibility, contact permissions, consent, blocking, revocation, legal basis, data minimisation and audit apply at every edge.

## Universal capability layers
1. Intent understanding and coordination.
2. Human identity, authentication, sessions and access governance.
3. Entity registry, role assignments and relationship graph.
4. Search, discovery, matching, provenance and trust.
5. Contextual workspace assembly and personal command centre.
6. Communication, social, groups, calls and community safety.
7. Commerce, product/service catalogues, orders and fulfilment.
8. Payments and regulated financial-provider connections.
9. Knowledge, education, research, analytics and creation.
10. External browser, APIs, partner integrations and service directory.
11. Physical-world coordination: locations, transport, logistics, buildings, agriculture, industry and devices.
12. Personal data vault, records, consent, export and deletion.
13. Notifications, continuity, accessibility, offline resilience and recovery.
14. Audit, risk, safety, moderation, disputes, emergency and humanitarian partner coordination.
15. Internationalisation: language, currency, timezone, jurisdiction, tax, customs, data residency and regional service coverage.

## Command Centres
A Command Centre is a role-aware operational environment, not a static grid of links. It assembles the overview, operations, management, intelligence, communications, opportunities, action queue, controls, evidence and reports that the current user is authorised to access. Founder, member, business owner, organisation administrator and DGBO/FAMILY roles receive different scopes. Live metrics must come from verified data sources; absent sources are labelled unavailable rather than simulated.

## Business and organisation participation
A business has its own entity identity, profile, locations, products/services, team relationships, permissions, records and workspace. Its owner uses their human identity to act within assigned permissions. A clothing shop may coordinate product catalogue, stock, customers, suppliers, payments, advertising, delivery and analytics. A school, hospital, farm, transport company or public service follows the same entity pattern with domain-specific safeguards. The business remains independently owned; ecosystem participation does not transfer ownership to JR PHEEF.

## External integrations and real-world execution
A provider is marked connected only after authorised credentials/scopes, successful API operation, error handling, audit and end-to-end tests are verified. A directory link is external-only, not an integration. Human, physical and regulated actions require actual provider participation, availability, legal authority and appropriate explicit approval. No AI silently pays, purchases, books, hires, signs, transfers ownership, shares sensitive records or makes binding commitments.

## Safety and governance
- Least privilege, deny-by-default access, RLS, server-side authorisation, scoped tokens and audit trails.
- Separate personal, business, DGBO and FAMILY data boundaries.
- Public pseudonymity can coexist with restricted verified ownership records and audited access.
- No biometric collection or face-unlock claim without a complete reviewed authentication, recovery and device-removal design.
- FAMILY is not a licensed bank; DGBO does not guarantee IP protection or investment.
- Emergency coordination complements, never replaces, local emergency services.
- AI outputs expose evidence, assumptions and uncertainty; no coercive matching or manipulative engagement.
- User data remains user-controlled with consent, retention, export and deletion pathways.

## Implementation and migration discipline
The architecture is a target, not a statement that all capabilities exist today. Implement additively:
1. Intent-first entry and stable navigation over existing routes.
2. Identity/entity/role/relationship schema with RLS and non-breaking migration from existing members and business workspaces.
3. Registry APIs and member-facing progressive onboarding.
4. Contextual workspace assembly and role-aware Command Centres.
5. Universal Connect discovery and consent-based interactions.
6. Verified digital and physical-world provider integrations.
7. Global scale, resilience, trust and independent testing.

Do not destructively replace existing member, business, messaging, listing or FAMILY data. Preserve existing IDs and foreign keys. Backfill new relationships only when source data is unambiguous; otherwise leave them unlinked for later verification. Migrations must be additive, reversible where practical, tested on a non-production environment, and accompanied by RLS/security-advisor review. No production schema/data change is authorised by this architecture document alone.

## Delivery status vocabulary
- LIVE · TESTED
- IMPLEMENTED · NOT END-TO-END VERIFIED
- PARTIAL
- EXTERNAL ONLY
- PLANNED
- BLOCKED
Never imply a button, route, card, AI role or provider listing is a complete integration.
