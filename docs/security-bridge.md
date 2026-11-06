# JR PHEEF Security Bridge

Status: architecture baseline and first database hardening change. This document distinguishes deployed controls from planned controls; it is not a security certification.

## Security objectives

Protect member identity, private conversations, business workspaces, money movement, connected devices, AI actions, partner integrations and physical-world operations. Use zero-trust principles: authenticate every request, authorize every resource, grant least privilege, log sensitive events and assume external content may be malicious.

## Current controls verified in the repository/database

- Node server uses a server-only Supabase secret/service-role credential and deliberately refuses to fall back to a public anon key for trusted server operations. Keep this credential only in Render secret environment variables; never commit it or expose it to browser code.
- Session cookie is HttpOnly, Secure, SameSite=Lax; session token is generated from cryptographic randomness and only its SHA-256 hash is stored in the sessions table.
- Authenticated member lookup checks session expiry and account blocked/suspended/disabled status.
- Login and registration have request-rate checks in the Node process. These are per-instance and in-memory; they are not a substitute for distributed edge/WAF limits.
- Security-sensitive member/session tables have RLS enabled and deny anon/authenticated direct Data API access.
- Private security-event, partner-connection and partner-event tables have RLS deny policies for client roles.
- The security advisor returned no lints during this review.
- Added immutable-history triggers to public.jr_security_events: UPDATE, DELETE and TRUNCATE are blocked. Added indexes for member/time and event-type/time queries.

## Required security bridge architecture

### Identity and devices
1. Add MFA (prefer passkeys/WebAuthn plus TOTP recovery) before production use of sensitive features.
2. Register trusted devices with revocable device sessions, risk-based step-up authentication and alerts for new devices.
3. Add "log out this device", "log out all devices", lost-device recovery and credential-change session revocation.
4. Use short-lived sessions for privileged operations; enforce absolute and idle expiry in addition to cookie expiry.
5. Never use member-editable profile metadata as an authorization claim.

### Authorization and data
1. Keep every exposed-schema table under RLS. Test each table's intended public, member, business-staff and founder access model.
2. Use owner/tenant predicates for every read and write; authenticated status alone is not authorization.
3. Keep service-role/secret keys server-side only. Rotate keys after any suspected exposure.
4. Review views, RPCs, storage buckets, functions and grants for RLS bypasses; prefer SECURITY INVOKER.
5. Encrypt sensitive data in transit and at rest; field-level encryption for particularly sensitive identity/payment details where appropriate.
6. Use backups with restore drills, point-in-time recovery where available, and separate backup access.

### Application and API
1. Enforce a strict allowlist of production origins; do not trust arbitrary Host/Origin values or permissive CORS.
2. Add a distributed rate limiter/WAF at the edge for login, registration, password reset, uploads, search and AI endpoints.
3. Add CSRF protection for cookie-authenticated state-changing routes, request size limits, strict content security policy, safe output encoding and dependency scanning.
4. Validate webhook signatures and timestamps; reject replayed webhook events with idempotency keys.
5. Store uploads in private buckets, inspect file type/content, scan for malware and issue short-lived signed URLs.
6. Redact secrets, tokens, passwords and sensitive payloads from logs.

### AI and integrations
1. Treat prompts, documents, messages, web pages and partner payloads as untrusted input; never let them override system policy.
2. Give each AI tool a narrowly scoped capability token; separate read, propose and execute permissions.
3. Require explicit, fresh user approval for money transfers, purchases, account changes, device access, public posting and physical dispatch.
4. Apply limits, idempotency, approval expiry and a human escalation path to high-impact actions.
5. Never let an AI agent read environment secrets or grant itself permissions.

### Physical-world safety
For transport, delivery, healthcare, property and infrastructure integrations, verify operators, licences, insurance, identity and service eligibility. Use human emergency escalation and auditable dispatch approvals. Do not let AI autonomously make safety-critical decisions.

### Detection and recovery
- Centralize authentication, authorization, admin, payment, device and integration security events.
- Alert on unusual login patterns, privilege changes, mass data access, failed MFA, repeated denials and unusual exports.
- Provide incident containment: revoke sessions/tokens, disable an integration, freeze risky workflows and preserve evidence.
- Run scheduled vulnerability scans, dependency updates, penetration tests and disaster-recovery exercises.

## Founder / JP-01 protection

JP-01 is an identity reference, not an authentication factor. Founder access must use separate MFA/passkeys, role-based authorization, step-up confirmation for critical changes, and immutable audit records. A founder session must not bypass member privacy or business separation.

## Deployment gates

Do not describe JR PHEEF as "unhackable" or fully secured. Before a public production security sign-off:
- complete route-by-route authorization and IDOR tests;
- test RLS policies with anon, authenticated, member A, member B, business staff and founder roles;
- deploy MFA and recovery;
- deploy distributed edge rate limits and strict origin/CSRF controls;
- review storage, views, RPCs, webhooks and secrets;
- run an independent penetration test and fix findings;
- verify backups and restore procedures.

## Change log

- 2026-11-06: Added append-only protection to jr_security_events (UPDATE/DELETE/TRUNCATE blocked) and indexes for audit queries. Supabase security advisor returned no lints after the change.
