# JR PHEEF — active production runtime

**Status verified: 2026-11-25**

The `fresh/` directory is the active web application runtime used by the canonical production Render service. It is a historical directory name, not a separate product or a staging-only application.

- Canonical repository: `leprincevirgo-ops/JR-PHEEF`
- Canonical branch: `main`
- Production entry point: `fresh/server.js`
- Production browser application: `fresh/public/`
- Package start command: `npm test && node fresh/server.js`
- Production service: `https://jr-pheef-marketplace.onrender.com`
- Production Supabase project: `tzyrlwshwkbnkbhjnpev`

## Product experience

JR PHEEF is one integrated ecosystem. The authenticated mobile workspace has four primary destinations:

1. HOME — personal starting point and discovery.
2. WORLDS — create, discover and enter worlds inside JR PHEEF.
3. JR — the central natural-language text and voice assistant.
4. COMMAND CENTER — profile, contacts, JR LINK conversations, status, updates, accessibility and account controls.

The public discovery gateway is available before registration. The four member tabs appear after a valid account session.

Company and service environments stay inside this product:

- DGBO — parent business-development, opportunity research, governance and venture stewardship.
- FAMILY — distinct financial-access and family-wellbeing venture.
- JR LINK — integrated communications layer.
- JR MOVE — transport, delivery and logistics environment.

Each company retains its own identity, records, permissions and responsibilities. Shared identity does not grant unrestricted access to another company's data.

## Implemented runtime areas

The active application includes public discovery, email/password authentication and session handling, member workspaces, JR AI conversation, Worlds creation and entry, branded DGBO and FAMILY company worlds, profile and Command Center interfaces, JR LINK communication workflows, founder-only controls, opportunity and venture management, partner integration gateway, business operating intelligence and JR MOVE service discovery/planning.

The presence of a page, API action or database table is not proof that every associated live service is production-ready. In particular:

- JR LINK still needs real multi-member delivery/reconnect acceptance testing; voice/video and end-to-end encryption are not claimed complete.
- JR MOVE live provider dispatch, booking, tracking and settlement are not yet active.
- FAMILY regulated financial services remain gated behind authorised providers and applicable approvals.
- Advertising workflows remain review-controlled; campaign drafts do not autonomously publish or spend.
- Payments are disabled in the current production runtime (`paymentsEnabled: false`).
- Company worlds are in-platform visual environments; they do not automatically establish separate legal registrations, domains or independent back offices.

No listing fees or matching fees are charged or should be reintroduced. Future monetisation must use approved optional subscriptions, clearly labelled promotion, justified and disclosed completed-service commissions, business tools or institutional services.

## Development and release rules

- Make member-facing changes against current `main`.
- Keep one canonical production application and one coherent member experience.
- Use staging branches and staging databases only for isolated validation. Never point staging at production credentials or production member data.
- Do not merge heavily diverged rebuild branches wholesale. Port reviewed, compatible changes into the current runtime.
- Keep all Supabase secret/service-role credentials on the server. Never expose them to browser code.
- Keep Row Level Security enabled on every exposed user-data table and enforce ownership/role checks on sensitive operations.
- Run `npm test` before release. Production `npm start` already runs the test suite before starting the server.
- Verify the deployed commit, startup logs, runtime flags and real end-to-end workflows before calling a feature live.

## Local run

```sh
npm install
npm start
```

The service listens on the configured `PORT` (Render currently supplies port 10000). The health endpoint is `/healthz`; readiness is `/readyz`.

For the unified architecture, implementation status and remaining acceptance gates, see `docs/UNIFIED-PRODUCTION-BASELINE.md`.
