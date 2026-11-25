# JR PHEEF Mobile Command Shell — Reference Design

**Status:** Product specification aligned to the founder's handwritten mobile sketch. This document is a design and implementation contract, not a claim that every control or integration is live.

## Design intent

JR PHEEF on a phone should feel like a compact personal command workspace, not a desktop website squeezed onto a small screen. Keep the existing JR PHEEF blue/aqua identity, the user's account and JP identity, and the separation between economic/business activity and social/community activity.

The supplied sketch is the reference for the following composition:
1. A compact top command bar with JR PHEEF identity, universal search, voice, clear/cancel, notifications, JR assistant/profile and window controls.
2. A contextual quick-action row for recent/open workspaces, business leads, create work, Connect and My Space.
3. Four clear destinations: Business, Social, Accessibility and Settings.
4. A More drawer with companies/information and approved external service shortcuts (Facebook, X, Instagram, WhatsApp, LinkedIn and others).
5. A share/invite area for sharing JR PHEEF, joining/interacting with the ecosystem, integration/API information and membership.

## Mobile information architecture

### Top command bar
- Brand/JP identity entry.
- Search field with explicit submit and clear controls; search suggestions must not submit unexpectedly.
- Voice input is an optional alternative to typing and only starts after a user gesture and browser permission.
- Notifications open the notification centre; unread count is real server-backed data, not decorative.
- JR Assistant opens the assistant workspace.
- Profile menu provides account, privacy, security and sign-out.
- On narrow screens, controls may collapse into an overflow menu. Do not add desktop-style minimize/maximize/close buttons to a native mobile viewport; provide those only in supported installed/PWA window contexts.

### Quick actions
- Recent workspaces / open tabs.
- Business leads.
- Create work (context-sensitive: listing, opportunity, project or post).
- Connect (people, businesses, partners and services).
- My Space (profile, files, saved items and personal workspace).
- Each action must route to an existing implemented workspace or show a clearly labelled unavailable/preview state. No dead buttons.

### Primary destinations
- **Business:** listings, opportunities, Deal Room, business workspace, projects, leads and operations.
- **Social:** feed, communities, JP connections, messages, status and calls when implemented.
- **Accessibility:** text size, contrast, captions, keyboard/screen-reader support, voice controls and reading assistance.
- **Settings:** account, security, privacy, notifications, language, appearance, device management, offline preferences and optional connectivity preferences.

Business and Social must remain distinct navigation contexts, with a visible way to switch between them. The same account can use both; their records, permissions and financial/reputation histories must not be conflated.

### More drawer
- Companies and ecosystem directory (DGBO, JR PHEEF, FAMILY and user-authorised workspaces).
- Information, help, policies and learning resources.
- External app shortcuts. These open official external destinations or supported share targets; they do not imply that the external company has integrated its API with JR PHEEF.
- Integration/API and membership information must distinguish proposal, preview, sandbox, integrated and verified-live states.

### Share and ecosystem entry
- Share JR PHEEF using native share sheet where supported, with copy-link fallback.
- Invite people with a user-controlled invitation link/code; never expose private member details.
- Explain joining and membership terms clearly. No hidden paid membership or automatic recurring charge.
- API/partner access is a separate verified partner/developer process with scopes, consent, credentials, audit and revocation.

## Interaction and accessibility rules
- Thumb-friendly targets (prefer at least 44 CSS px), safe-area insets, no horizontal page overflow, and no nested competing sticky bars.
- Bottom navigation on phone may use a compact five-slot layout; keep four core destinations accessible and put secondary destinations in one More menu. The four sketch destinations remain the main conceptual areas, while mobile implementation can combine Business/Social switch with a persistent home/workspace entry where needed.
- Maintain focus visibility, semantic labels, keyboard operation, screen-reader announcements and reduced-motion support.
- Respect system font scaling and browser zoom.
- Do not make voice the only way to search or interact.
- Do not rely on colour alone for active, warning or offline states.

## Offline, network and authentication
- Offline Mode and JR Access/Wi-Fi are optional.
- Phone-number login is optional; disabling it must not delete the contact number or JP identity. Existing password/email recovery must continue to work.
- Device/face unlock is optional for other members, but must remain disabled for the founder account. Use platform authentication/passkeys where supported; never capture or store face images/templates in the web app. A passkey may use PIN/fingerprint/face depending on the device, so do not promise face-only behavior.
- Offline support should clearly separate cached read-only content, local drafts, queued actions and synced server records. Resolve conflicts explicitly; never silently overwrite another device's work.
- JR Access can discover and connect to authorised Wi-Fi/hotspots only with operating-system permission and provider terms. JR PHEEF cannot create internet service without a network provider/backhaul.
- Cross-device sync requires authenticated ownership, encryption in transit, revocable sessions and clear device management.

## Integration truthfulness
- A shortcut to WhatsApp, Instagram, Facebook, X or LinkedIn is not an API integration.
- API integration requires approved provider access, scoped credentials, documented permissions, privacy review, error handling, monitoring and end-to-end tests.
- Show a visible status label for each connection: External link, Proposed, In development, Sandbox, Integrated or Verified live.
- Never request or store third-party account passwords.

## Implementation and stabilization sequence
1. Audit existing mobile shell files, navigation markup, page routing and existing mobile regression checks before changing UI.
2. Map every sketch control to its current route/action and label missing functions as unavailable rather than simulating success.
3. Consolidate top bar, quick actions, Business/Social switch, Accessibility, Settings and More drawer without duplicating existing navigation.
4. Verify one active workspace at a time, back navigation, browser history, focus management and Android viewport/safe-area behavior.
5. Add real server-backed settings and notification states only after their APIs and permissions are verified.
6. Integrate offline storage and sync as a separately tested capability; no sensitive records in unprotected local storage.
7. Add partner/API integrations one provider at a time with explicit consent and sandbox testing.
8. Run the existing mobile checks plus authenticated Android-sized end-to-end tests before release.

## Acceptance criteria
- At 320px, 360px, 390px and 430px widths, no horizontal document overflow or clipped primary actions.
- Search, voice, notifications, assistant, profile, quick actions, Business/Social switch, Accessibility, Settings, More and Share each perform their named action or display a truthful unavailable state.
- Business and Social content is clearly separated while retaining one member account.
- More drawer is keyboard/screen-reader accessible and dismisses safely.
- External shortcuts are clearly identified as external.
- Offline state, queued changes and sync completion are visibly distinct.
- Phone login can be switched off without deleting phone contact data; founder device unlock stays disabled.
- No payment rails are activated by this mobile-shell work.
- All existing mobile navigation and workspace checks pass, and authenticated user-flow tests pass before production promotion.
