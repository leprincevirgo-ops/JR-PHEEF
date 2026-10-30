# JR PHEEF — Canonical Project Journey & Completion Register

Last consolidated: 2026-10-30

This document is the working source of truth for decisions recovered from the JR PHEEF, DGBO ecosystem and FAMILY conversations, together with verified repository/deployment observations. It does not claim that planned capabilities are already operational.

## 1. Product identity and purpose

- The product name is **JR PHEEF** everywhere in product UI, documentation, integrations and release material.
- JR PHEEF is a coordinator platform: a person should be able to initiate, discover, arrange and coordinate activities, people, services, tools and workflows from their current location to another place, locally or remotely.
- The “supermarket concept” means a broad, organized environment where people can discover and coordinate many kinds of needs and services. It is not merely an online grocery store or a conventional listing marketplace.
- Explore must extend beyond text search: discover places, cities, photographs, wallpapers, knowledge, experiences and topics.
- The long-term ambition is a complete, market-ready ecosystem. Readiness must be earned through tested features, operational controls, privacy, security, legal compliance, support and deployment evidence.

## 2. Connected ecosystem and decision rights

### JR PHEEF
The user-facing coordination, discovery and service-access platform. It provides the shared experience, identity-aware navigation, coordination workflows and integrations.

### DGBO
The governance, business-development and oversight environment. It retains its own leadership, business records, decision processes, investor/opportunity work and private IDEA VAULT. It does not become subordinate data storage for general JR PHEEF users.

### FAMILY
The private family coordination and financial-access environment. Family relationships, schedules, plans and records are private by default. Regulated financial products are not represented as live banking services unless licensed partners, approvals, operational controls and real integrations are in place.

### Shared operating pattern
Each environment may use:
- Intelligence — analysis, recommendations and decision support.
- Command Centre — coordination and task initiation.
- Control Room — status, monitoring and incident visibility.
- Control System — enforceable permissions, approvals and policy.

The environments coordinate through explicit, auditable interfaces. Shared identity does not mean shared unrestricted data. Access must be least-privilege, scoped, revocable and logged.

## 3. Founder identity, JP identities and succession

- **JP-01** is the intended canonical founder/ecosystem identity across JR PHEEF, DGBO and FAMILY.
- JP-01 is a stable identity, not a permission bypass. Roles and access are separately assigned per environment.
- JP-01 must never be reassigned. Other people and organisations receive unique JP identities.
- Identity assignment must be linked to the founder account only after verified ownership/identity checks. A conversation preference is not proof of database ownership.
- Identity types include Personal JP, Business JP, Ecosystem JP, Service JP and Transaction JP.
- Succession/continuity is a core requirement: founder continuity, ownership and administrative succession, emergency recovery, critical-service continuity and digital asset continuity.
- Transfers require explicit authorization, identity verification, separation of duties, audit evidence, anti-takeover safeguards and recovery controls. No hidden backdoor and no AI-only transfer of ownership.
- Cosmic Signature, date-of-birth numerology or similar entertainment concepts must never be used for authentication, trust, eligibility or ranking.

## 4. Official JR PHEEF discovery categories

Entertainment; Tools; Photography; Business; Shopping; Education; Religion; Finance; Fashion; Travel; Food; Books; Health; Parenting; Reference; Communication; Productivity; Scientific Research; Security; Data & Analytics; Popular; Creativity; Development Tools; New & Noteworthy; Small Business; Business & Operations; Social; Download; Sports; Job; News; Music/Video; Other.

Categories are navigation and discovery groupings. They do not imply that every underlying service is already integrated or licensed.

## 5. Experience and interface requirements

- A coordinated command-centre dashboard with clear destinations and a useful Explore experience.
- Back and forward navigation that tracks JR PHEEF destinations consistently.
- JR PHEEF Browser experience with address/search, history, reload and safe external fallback. It is not described as a full Chromium browser; many sites block iframe embedding.
- Dedicated Settings hub for profile/account, security/sign-in, appearance, privacy/data, app preferences and support.
- Profile management, including secure profile photo upload, preview and replacement.
- Themes, wallpapers and per-environment visual identity, including user-uploaded wallpaper with clear storage/privacy behaviour.
- Responsive mobile-first behaviour, accessibility, readable contrast and reduced-motion support.
- Consistent JR PHEEF branding; avoid legacy marketplace-only framing.

## 6. JR PHEEF CONNECT

Target direction: private and group messaging with reliable delivery, online/offline presence, in-app notifications, unread counts, image/document sharing, voice notes and voice/video calls. End-to-end encryption must use a vetted protocol/library and reviewed key lifecycle; do not invent cryptography.

Verified on 2026-10-30: private/group messaging API and authenticated server-sent live-update stream are merged to main and deployed. The live-update stream is not proof that presence, push notifications, media, voice/video or end-to-end encryption are complete. A real two-account authenticated conversation test remains outstanding.

## 7. Recovered journey and key decisions

- 2026-10-18: User reaffirmed the product name JR PHEEF and requested a complete project, sketch/roadmap, cost understanding and self-directed build.
- 2026-10-18: User clarified JR PHEEF is the coordinator of activities from anywhere to the user's location or elsewhere; corrected a too-literal interpretation of the supermarket example.
- 2026-10-19: User clarified the ecosystem responsibilities: DGBO as parent/overseer, JR PHEEF as opportunity and coordination engine, FAMILY as financial-access engine. Succession must be addressed before the ecosystem is connected as one.
- 2026-10-28: User expanded Explore to include photos/wallpapers and discovery of cities, places, worlds and other topics.
- 2026-10-28: DGBO IDEA VAULT direction: private-by-default idea storage, ownership/version/access records, business development and investor preparation/introduction, with controlled JR PHEEF connections.
- 2026-10-30: User reaffirmed the expectation that the assistant should coordinate and carry the build forward rather than continually assigning small development tasks.
- 2026-10-30: JP-01 was reaffirmed as the user's intended shared founder identity across all three environments.

This is a consolidated record of relevant decisions, not a verbatim export or modification of previous ChatGPT conversations. Previous chat transcripts remain in their original conversations.

## 8. Verified implementation snapshot (2026-10-30)

### Repository and deployment
- Repository: leprincevirgo-ops/JR-PHEEF
- Main branch at consolidation: 49ebb11f04153e9262b1c76e2a690057177372e0
- Render service: srv-d8um6f6q1p3s73euum50
- Latest observed Render deployment: dep-dbia08nb9u1s73dt6rh0, status LIVE, built from commit 49ebb11f04153e9262b1c76e2a690057177372e0.
- Supabase project: tzyrlwshwkbnkbhjnpev (eu-west-1).

### Implemented / verified at source or deployment level
- Login/session repair merged and deployed. The UI confirms the session with /api/me before exposing the private dashboard. Full real-browser sign-in across account states still needs end-to-end validation.
- JR PHEEF CONNECT private/group messaging and authenticated SSE live updates merged and deployed.
- Appearance system exists on main: theme presets, per-section styling, wallpapers, upload controls, contrast/compact/reduced-motion settings.
- Settings hub is dynamically added by the appearance module and links to profile, security and appearance controls.
- Profile UI has avatar preview and an upload handler. The backend endpoint and full authenticated upload round trip still require explicit verification.
- Existing app has ecosystem, FAMILY, JP identity and continuity UI modules. Their presence is not proof that all workflows or cross-environment permissions are fully operational.
- Supabase security advisor returned zero lint findings at this check.
- Supabase performance advisor returned two unindexed foreign-key findings (jr_conversations.created_by and jr_messages.sender_id) and 66 unused-index notices. Do not drop indexes based only on “unused” notices; inspect query plans and workload first.
- Render service remains on the Free plan. Do not incur paid upgrades without explicit approval.
- Payments safety gate remains enabled; do not describe payments as live.
- The current member table has one row; do not inspect personal account or financial records just to progress this work.

### Open PR review
- PR #24 theme branch and PR #25 navigation/browser branch are stale relative to main and include overlapping theme code. Main already contains a theme engine, settings hub and navigation arrows via themes.js. Avoid blindly merging duplicates.
- Older open PRs (#20, #13, #10, #9, #4, #1) require selective diff review. Do not merge wholesale or resurrect stale architecture.

## 9. Completion register — next engineering work

### P0 — stabilize and prove the current product
1. Confirm main's current CI and release checks.
2. Validate the live website's public health, static assets, scripts and key API routes.
3. Run the repository's end-to-end smoke test and expand it for login/session, settings, profile upload, navigation, messaging and access boundaries.
4. Verify profile-photo upload route, file validation, private storage policy and safe rendering; repair gaps.
5. Verify Settings and Appearance are reachable on mobile and that each control actually persists.
6. Decide whether to port the unique Browser component from PR #25 after isolating it from duplicated theme CSS.
7. Review dependency advisories against the lockfile; patch only with compatible, tested updates.

### P1 — identity, permissions and continuity
1. Review existing JP identity schema and routes without reading private member rows.
2. Design immutable JP identity registry, identity types, environment memberships, role grants and audit events.
3. Confirm founder-account ownership before any JP-01 assignment. Until confirmed, keep the requirement documented but do not bind JP-01 to a guessed account.
4. Implement explicit succession nomination, approval, cooling-off/recovery, dual-control where appropriate, immutable audit history and tested recovery.
5. Enforce environment-level data boundaries in server routes and RLS.

### P1 — connected ecosystems
1. Map current DGBO, FAMILY and JR PHEEF routes/tables and classify data sensitivity.
2. Define narrow integration contracts and permission scopes for each cross-environment action.
3. Make IDEA VAULT private by default with version, owner, access and export/delete controls.
4. Keep FAMILY financial access in a regulated-partner boundary until the required approvals and integrations exist.
5. Provide a unified status view without merging private records.

### P1 — CONNECT
1. Add online/offline presence with privacy settings and expiry.
2. Add in-app notifications, unread counts and read state.
3. Add secure media upload and download with type/size limits, membership checks and expiring access.
4. Add voice notes.
5. Plan voice/video using established providers and consent controls.
6. Evaluate end-to-end encryption using a vetted protocol and threat model.

### P2 — Explore and coordination depth
1. Build Explore as a multi-domain discovery layer, not only marketplace search.
2. Add place/topic/photo discovery with source attribution, rights-aware image handling and user-controlled wallpaper saves.
3. Turn categories into consistent destination pages with clear availability/integration status.
4. Add coordination workflows: request, match, assign, schedule, track, complete, rate/report and dispute escalation.
5. Add operational observability, support workflows, incident response, backups and restore drills.

## 10. Release truth rules

- “In source” means code exists in the repository.
- “Merged” means the change is in main.
- “Deployed” means Render confirms the exact commit is live.
- “Tested” means a named automated or manual test actually ran and passed.
- “End-to-end verified” means the complete user journey was exercised against the deployed system, including relevant authorization boundaries.
- “Market ready” requires all release gates, security/privacy/legal/support/operational checks and real-world acceptance. Do not use this label prematurely.

## 11. Public anonymity and founder privacy

The creator's public identity must remain pseudonymous, following the model of a creator known by a pseudonym. Do not publish a legal name, personal contact details, photographs, date of birth, public founder biography or personal social profiles. JP-01 is a protected internal identifier and must not be exposed as a public founder lookup. Private legal ownership, recovery and succession evidence must remain restricted, encrypted, least-privilege and audited. See `docs/PUBLIC-ANONYMITY-AND-FOUNDER-PRIVACY.md`. Provider-level metadata such as source-control account handles, repository ownership, commits, domains and billing may remain externally visible; absolute anonymity must not be claimed until those surfaces are reviewed and any approved migration is completed.

## 12. Navigation decision

Back and forward are global history controls, not destination tabs. They belong in the application header, adjacent to the JR PHEEF brand/account controls. The navigation area is reserved for destinations and must not contain duplicate history arrows or duplicate Appearance destinations. Appearance is reached from the single Settings hub. The browser, if enabled, is a tool destination and must not masquerade as back/forward navigation.

## 13. Conversation continuity

Use this document as the canonical project journey in future JR PHEEF conversations. Append dated decisions and verified changes rather than silently rewriting history. Do not claim that the assistant can edit or merge old chat transcripts; the original chats remain unchanged. This record carries their relevant decisions forward into the engineering project.


## 14. Pull-request consolidation (2026-10-30)

- PR #20 closed as superseded: auth preferences and migration are already in main and applied; Face Unlock remains disabled pending a proper passkey implementation.
- PR #24 closed as superseded: theme and Settings system already exists on main.
- PR #10 closed as superseded: UI add-on files and asset checks already exist on main.
- PR #9 closed as superseded: command-centre dashboard work was previously incorporated.
- PR #13 remains under selective review for its unique Visual Explore experience and Control Centre styling; its extra Explore navigation tab must not be copied as-is.
- PR #25 remains under selective review for browser functionality; history controls are being placed in the header, not the destination navigation.
- PR #1 and #4 were closed without merging because their branches contain duplicated or stale architecture. Unique category validation, glossary, DGBO explainer and POS-preview requirements remain on the roadmap for focused implementation.
