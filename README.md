# JR PHEEF

**Find. Match. Trade.**

JR PHEEF is a multi-category opportunity and coordination platform. Its official product name is JR PHEEF. The canonical GitHub repository is `leprincevirgo-ops/JR-PHEEF`.

## Product rules

- Use **JR PHEEF** as the product name everywhere. DGBO may be credited as the parent company (“Powered by DGBO”). FAMILY remains a separate future venture.
- The category hub contains exactly 33 official categories. See [Product Identity and Categories](docs/JR_PHEEF_PRODUCT_IDENTITY_AND_CATEGORIES.md).
- Blue-led visual identity with aqua/cyan accents.
- A category or interface section is not evidence that all services inside it are live.
- Do not claim payment, lending, investment, delivery tracking or external integrations are live until configured and end-to-end tested.

## Current architecture

- Node.js / Express server: `server.js`
- Browser UI: `public/index.html`
- Supabase database and storage through server-side `@supabase/supabase-js`
- Twilio webhook endpoint: `POST /api/webhook/whatsapp`
- Health endpoint: `GET /health`
- Ecosystem design and deployment notes: [DGBO/FAMILY ecosystem](docs/DGBO_FAMILY_ECOSYSTEM.md)

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm start
```

Configure server environment variables before starting:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose to browser code)
- `TWILIO_AUTH_TOKEN` and `TWILIO_WEBHOOK_URL` when using the WhatsApp webhook
- `PORT` is optional; the server defaults to port 10000

The server intentionally exits if Supabase URL/key configuration is missing. Do not commit credentials or customer data.

## Validation

GitHub Actions validates server syntax, inline browser JavaScript syntax, and the exact official category list. Dependency auditing runs separately. These checks are not a substitute for live database, account, storage, WhatsApp, permissions, payment or browser-device tests.

## Database and security

Before deploying a database migration, compare it with the actual Supabase schema and take a backup. The current Supabase security review has identified that `public.members` has row-level security disabled. Do not expose the database anon key with unrestricted access to this table. Enabling RLS must be paired with a deliberate access policy; the server currently uses privileged server-side access. Review and approve the policy design before changing production access.

## Deployment

Render currently points at the canonical JR PHEEF repository and the `main` branch. Deployments happen automatically on commits to `main`. Changes on the ecosystem branch are not live until they are reviewed, merged, and the Render deployment is verified.
