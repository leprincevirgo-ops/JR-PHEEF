# JR PHEEF: Optional Authentication and SIM-Independent Access

## Decisions
- Face Unlock is optional and must never be required to use JR PHEEF.
- The founder's account must keep Face Unlock disabled until the founder account is reliably identified and the restriction is enforced server-side. Never guess by email, phone, display name, or row order.
- Phone-number login is optional. Members can disable it and use another enabled sign-in method.
- Phone contact details and phone-number login are separate controls. Disabling phone login must not erase the stored phone number or break listings, account recovery, notifications, or JP identity.
- SIM cards are not required for ordinary sign-in when an enabled non-SMS method is available.
- Offline Mode and JR Access/Wi-Fi are separate optional product features, not authentication methods.

## Security model
- Keep existing password login and session-cookie behavior compatible during migration.
- Face Unlock must rely on the device operating system's supported biometric/passkey APIs. JR PHEEF must never collect or store face images, facial templates, or raw biometric data.
- On the web, WebAuthn/passkeys prove possession of an authenticator; they do not tell the website that the user authenticated specifically with their face. A device may use face, fingerprint, PIN, or another local unlock method. Therefore label the option "Face Unlock (where supported)" and disclose that the device may offer its own fallback. Do not claim face-only verification unless a native platform API explicitly confirms it.
- Unsupported devices/browsers must retain a secure password or other enabled fallback.
- Require recent re-authentication for sensitive security changes and provide a verified recovery route.
- Never store passwords, passkey private keys, biometric templates, or recovery secrets in localStorage.
- Enforce settings server-side; hiding a control in the interface is not access control.
- Rate-limit authentication attempts and use generic public login errors to reduce account enumeration.

## Data and API design
Create a private per-member authentication-preferences record keyed by the existing member ID:
- `member_id` (primary key and foreign key to members)
- `phone_login_enabled` (boolean, default true for compatibility with existing members)
- `face_unlock_enabled` (boolean, default false; preference only, not proof of biometric capability)
- `updated_at` timestamp
- audit metadata for security-setting changes where the existing audit model supports it

Proposed authenticated API:
- `GET /api/security/preferences` returns only the current member's preferences and supported authentication capabilities.
- `PATCH /api/security/preferences` validates explicit booleans, requires recent re-authentication for sensitive changes, records an audit event, and updates only the current member.
- The login route enforces `phone_login_enabled` server-side for phone identifiers while allowing other enabled identifiers. Members without a preference row retain existing behavior until they explicitly change settings.

## Rollout sequence
1. Add the migration and preference API with strict ownership checks.
2. Add an accessible Security & Sign-in screen explaining phone contact versus phone login and the limits of Face Unlock support.
3. Integrate WebAuthn/passkeys only as an optional platform-authenticator method; use a native biometric API if strict face-specific confirmation is required.
4. Enforce the founder-account restriction only after authorized account identification; do not hard-code personal contact details.
5. Test legacy login, email login, phone login enabled/disabled, recovery, session revocation, duplicate-account handling, unsupported browsers, and cross-account access.
6. Deploy progressively and verify production behavior before calling the feature complete.

## Acceptance tests
- Existing members can still sign in after migration.
- Disabling phone login does not remove the stored number or JP identity.
- Phone login disabled is enforced by the server, not only the UI.
- Email/password login continues to work when enabled.
- Face Unlock preference defaults off and is never represented as guaranteed face-only authentication on web.
- The founder account cannot enable Face Unlock through normal settings until an authorized exception is explicitly changed.
- Unsupported browsers retain a secure fallback.
- One member cannot read or change another member's preferences.
- No payment rails are activated by this work.
