# JR PHEEF Device API Contract

**Status:** Proposed contract; no production endpoints or database tables are claimed to exist.

## Design rules
- All device APIs are authenticated, versioned and schema-validated.
- Authorization is evaluated for every resource and action; account identity alone never grants access to a tenant's data.
- Device credentials are distinct from user sessions and can be revoked independently.
- Short-lived access tokens; rotating refresh credentials; replay detection; rate limits.
- Idempotency keys for retryable writes and operations with external effects.
- No service-role keys, provider secrets or signing keys in client apps.
- Backward-compatible evolution; documented error codes and correlation IDs.
- Minimize personal data and avoid collecting hardware identifiers unless justified.

## Proposed resource surface
| Method | Resource | Purpose |
|---|---|---|
| POST | `/api/v1/devices/enroll` | Enroll a device after authenticated user confirmation |
| GET | `/api/v1/devices` | List devices belonging to the authenticated account |
| GET | `/api/v1/devices/:id` | Read permitted device metadata |
| POST | `/api/v1/devices/:id/revoke` | Revoke device credential and related refresh sessions |
| POST | `/api/v1/devices/:id/heartbeat` | Submit minimal health/version state |
| POST | `/api/v1/devices/:id/sync` | Exchange authorized sync cursor and changes |
| GET | `/api/v1/devices/:id/policy` | Fetch non-secret device policy and capability flags |

These routes are design placeholders. Do not implement them until existing identity/session code, Supabase schema, RLS and API conventions have been audited.

## Enrollment flow
1. User signs in through the existing supported authentication flow.
2. Server issues a short-lived, one-time enrollment challenge.
3. App creates a hardware-backed key pair where supported; private key remains on device.
4. Server verifies challenge and user confirmation, then records device public key and metadata.
5. Device receives a narrowly scoped, revocable credential.
6. User can view and revoke enrolled devices from account security settings.

Do not use IMEI, advertising ID, serial number or persistent hardware fingerprint as the sole device identity.

## Suggested device record (logical model only)
- id: random UUID
- owner_id: account/member foreign key
- display_name: user-editable label
- platform: android | ios | desktop | web
- app_version and os_version
- public_key_thumbprint
- enrolled_at, last_seen_at, revoked_at
- security_state: unknown | supported | at_risk | revoked
- metadata: allowlisted, non-sensitive fields only

RLS and server-side owner checks must prevent cross-account access. Avoid storing raw private keys, access tokens or unnecessary hardware identifiers.

## Standard error envelope
```json
{
  "error": {
    "code": "DEVICE_NOT_AUTHORIZED",
    "message": "This device is not authorized for this action.",
    "request_id": "opaque-correlation-id"
  }
}
```

Do not return internal stack traces, SQL details, secret names or account-existence hints.

## Contract tests
- unauthenticated request denied;
- user A cannot list/read/revoke user B's devices;
- revoked device cannot refresh or sync;
- replayed enrollment challenge rejected;
- expired challenge rejected;
- invalid signature rejected;
- duplicate idempotent request does not duplicate side effects;
- sync returns only explicitly authorized data;
- old supported client version handles additive response fields.
