# JR PHEEF — Unified Production Baseline

**Last verified:** 2026-11-25  
**Purpose:** One authoritative implementation and release reference for the JR PHEEF ecosystem.

## 1. Canonical product and source of truth

JR PHEEF is one integrated digital ecosystem, not several competing applications.

- **Canonical repository:** `leprincevirgo-ops/JR-PHEEF`
- **Canonical production branch:** `main`
- **Production web service:** Render service `srv-d8um6f6q1p3s73euum50`, URL `https://jr-pheef-marketplace.onrender.com`
- **Production database:** Supabase project `tzyrlwshwkbnkbhjnpev` (JR PHEEF)
- **Production entry point:** `npm start` runs the test suite and then `node fresh/server.js`
- **Production client:** `fresh/public/`
- **Production server:** `fresh/server.js`
- **Workspace data/API:** Supabase Edge Function `jr-workspace-api` and related server-side functions.

The Render production service is configured to deploy from `main`. The repository-root `server.js` is not the production entry point; the production start script runs `fresh/server.js`. Changes intended for members must land in `main` and pass release checks before they are considered production. Other branches are work areas only. Foundation, Rebuild and Staging are not separate JR PHEEF products.

Do not merge old rebuild branches wholesale. The inspected ecosystem foundation pull request was 121 commits behind production and conflicted; the rebuild candidate was also heavily diverged. Selectively port reviewed features into the current architecture, preserving current production fixes and data.

## 2. Product experience

### Four primary member destinations

The mobile member workspace has exactly four primary destinations, in this order:

1. **HOME** — personal starting point, discovery and useful next actions.
2. **WORLDS** — enter, discover and create worlds within the same ecosystem.
3. **JR** — the central intelligence and natural text/voice conversation.
4. **COMMAND CENTER** — profile, verification, contacts, JR LINK conversations, status, updates, accessibility and account controls.

The four destinations must remain visible as a persistent mobile bottom dock after sign-in, with touch-safe sizing, safe-area padding and clear selected state. The public discovery gateway appears before account registration; the authenticated member tabs are shown after a valid session. Do not mistake the public sign-in screen for the logged-in member workspace.

### One product, multiple company worlds

- **JR PHEEF** is the public gateway and shared coordination experience.
- **DGBO** is the parent business-development, opportunity research, governance and venture-stewardship environment.
- **FAMILY** is a distinct financial-access and family-wellbeing venture.
- Each company world has its own identity, visual language, content, services, permissions and records while remaining inside JR PHEEF.
- **JR LINK** is the communication layer inside JR PHEEF.
- **JR MOVE** is the transport and delivery service environment inside JR PHEEF, not a separate competing platform.

Shared identity does not mean unrestricted sharing of company data. Each venture needs its own access scopes, records, approvals, audit trail and legal/compliance controls.

## 3. Commercial and governance rules

- No listing fees and no matching fees.
- Future monetisation may use optional subscriptions, clearly labelled advertising/promotions, justified and disclosed completed-service commissions, business tools and enterprise/institutional services.
- Never promise financial returns.
- Do not activate deposits, lending, investment transactions, stored-value accounts or banking services without authorised regulated providers, licensing, controls and clear disclosures.
- Campaign planning remains draft-only until reviewed. No autonomous publishing, contacting users or spending advertising budgets.
- Founder-only opportunity intelligence, ownership, strategy, partner negotiations and private controls must never be exposed to ordinary members.
- JP-01 is a founder identity, not a permission bypass. Founder actions require verified account identity and server-side role checks.

## 4. Current implementation inventory

The following are present in the canonical source and have automated source-level coverage:

- Public JR PHEEF discovery gateway and account-entry flow.
- Email/password authentication routes for signup, confirmation, resend, login, session establishment and password recovery.
- Authenticated member workspace and server-side AI conversation endpoint.
- Four-tab workspace shell and mobile navigation styling.
- Worlds list/create/enter/update workflows.
- Branded DGBO and FAMILY company-world experiences.
- JR LINK communication panels, messaging and member communication UI.
- Profile, contacts, status, updates and accessibility controls.
- Private founder overview, opportunity dossiers, venture stages, capability registry and review workflows.
- Partner integration credentials, scoped access, revocation and inbound event gateway.
- JR MOVE transport UI and supporting data structures.
- Business operating intelligence and point-of-sale support structures.
- FAMILY financial-access and ledger foundations, currently pre-launch.
- Progressive Web App install and offline shell.

**Source presence and automated tests do not prove every live service workflow is production-ready.** Real account-to-account, provider, payment, device and cross-device workflows must pass end-to-end checks before being advertised as live.

## 5. Verified production checks (2026-11-25)

- Production Render service is on `main`.
- Latest observed production deployment is live at `https://jr-pheef-marketplace.onrender.com`.
- Runtime reported `authConfigured: true`, production `authOrigin` set to the live service, `aiConfigured: true`, and `paymentsEnabled: false`.
- The startup test suite reported **178 tests, 178 passed, 0 failed**.
- Production database has **117 public tables**; the audit query found **0 public tables without Row Level Security (RLS)**.
- Supabase security advisor currently reports one warning: leaked-password protection is disabled. No other security advisor finding was returned in that check.
- Supabase performance advisor returned unused-index informational notices. Do not drop indexes solely because they are currently unused; assess actual query plans and workload first.

## 6. Known gaps — do not mark complete prematurely

1. **Email confirmation:** production redirect origin is configured in application code. A fresh confirmation email must be tested end-to-end after verifying the Supabase Confirm Signup template. A template committed to GitHub does not automatically update the template stored in Supabase.
2. **Leaked-password protection:** enable Supabase Auth leaked-password protection if available on the project's plan.
3. **JR LINK:** perform a real two-member conversation, delivery/read state and reconnect test. Voice/video calls and end-to-end encryption are not claimed complete.
4. **JR MOVE:** provider onboarding, live dispatch, fare acceptance, trip tracking, completion and settlement require real provider and device tests.
5. **FAMILY:** authorised provider integrations and all regulated financial activity remain gated; the schema alone is not a bank.
6. **Payments:** runtime currently reports payments disabled. Do not accept or simulate real payment settlement.
7. **Company worlds:** current pages are the in-platform visual company-world layer. Separate legal registrations, domains, independent back offices and external operating integrations are not implied.
8. **Advertising:** reviewed drafts and submissions are not proof of live ad network integration, verified impressions or campaign spend.
9. **Android companion:** a development scaffold exists on a divergent feature branch; it is not yet a verified production Android release.
10. **Disaster recovery:** backups, restore drills, regional recovery and invisible failover need independent tested runbooks before resilience is claimed.

## 7. Release and implementation discipline

Every change must:

1. Start from current `main`, not an old branch snapshot.
2. Preserve one JR PHEEF identity, one shared member experience and clear venture boundaries.
3. Keep secrets server-side; never expose Supabase secret/service-role credentials to browser code.
4. Apply least-privilege authorization and ownership checks on every sensitive action.
5. Keep Row Level Security enabled on all exposed user-data tables.
6. Include automated tests for the changed workflow and regression tests for navigation, authentication and privacy.
7. Run the full `npm test` suite before production release.
8. Deploy to the canonical Render service only after checks pass; verify the deployed commit and runtime health.
9. Treat staging as a separate test environment and never point it at production data or credentials.
10. Record incomplete integrations honestly and never present a scaffold, mock or schema as a live service.

This register is the canonical status snapshot, not a claim that every future capability is already built. Update it as features pass implementation and end-to-end acceptance tests.
