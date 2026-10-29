# JR PHEEF: Optional Authentication and SIM-Independent Access

## Decisions
- Face unlock is optional and must never be required to use JR PHEEF.
- The founder's account must have face unlock disabled. Do not identify the founder account by a guessed email, phone, display name, or row order. Apply the founder exception only after the account is safely identified and authorized.
- Phone-number login is optional. Members can disable phone login and use another enabled method.
- Phone number collection/contact details and phone-number login are separate controls. Disabling phone login must not erase a member's stored phone number or break existing listings, account recovery, notifications, or JP identity.
- SIM cards are not required for ordinary sign-in when an enabled non-SMS authentication method is available.
- Offline Mode and JR Access/Wi-Fi remain optional product features and are separate from authentication.

## Security model
- Keep password login and existing session-cookie security working during migration.
- Face unlock must use platform WebAuthn/passkey or native biometric APIs where supported; a web page must never collect or store face images or raw biometric data.
- Browser support varies. When the device/browser does not support a platform authenticator, explain this and offer password login.
- A passkey is not necessarily face recognition: the device may use a fingerprint, PIN, or another local screen-lock method. Label the option accurately as device biometric/passkey unlock unless actual biometric capability can be confirmed by the platform.
- Require re-authentication for sensitive account/security changes. Provide recovery codes or a verified alternative recovery route.
- Never store passwords, passkey private keys, biometric templates, or recovery secrets in localStorage.
- Settings must be enforced server-side; hiding a login option in the interface is not access control.
- Rate-limit login attempts and avoid account enumeration in error messages.

## Data and API design
Create a private per-member authentication-preferences record, keyed by the existing member ID:
- `member_id` (primary key and foreign key to members)
- `phone_login_enabled` (boolean, default true during a compatibility period)
- `device_unlock_enabled` (boolean, default false)
- `updated_at` timestamp
- audit metadata for security-setting changes where the existing audit model supports it

Proposed authenticated API:
- `GET /api/security/preferences` returns only the current member's preferences and available authentication capabilities.
- `PATCH /api/security/preferences` validates explicit booleans, requires re-authentication for security-sensitive changes, records an audit event, and updates only the current member.
- The login route must enforce `phone_login_enabled` server-side for phone identifiers while allowing other enabled identifiers. Existing members without a preference row should retain current behavior until they have explicitly changed settings.

## Rollout sequence
1. Add migration and preference API with strict ownership checks.
2. Add an accessible Security & Sign-in settings screen and explain the difference between phone contact and phone login.
3. Integrate WebAuthn/passkeys as an optional device-unlock method; do not advertise face-only support when the platform cannot guarantee it.
4. Apply the founder-account exception only after authorized account identification; do not hard-code personal contact details into the repository.
5. Test legacy login, email login, phone login enabled/disabled, account recovery, session revocation, multiple accounts, unsupported browsers, and cross-account access.
6. Deploy progressively and verify production behavior before calling the feature complete.

## Acceptance tests
- Existing members can still sign in after the migration.
- A member can disable phone-number login without losing their stored number or JP identity.
- Phone login disabled is enforced by the server, not only by the UI.
- Email/password login continues to work when enabled.
- Face/device unlock defaults off and can be enabled only by the member.
- The founder's account cannot enable device unlock through normal settings.
- Unsupported browsers can still use a secure fallback.
- One member cannot read or change another member's preferences.
- No payment rails are activated by this work.
