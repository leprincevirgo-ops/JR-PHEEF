# JR PHEEF two-way interoperability architecture

**Status: architecture and discovery surface only.** The public API gateway, developer keys, OAuth application registration, SDKs, webhook delivery, device cloud registry and production integrations are not active in this release.

## Goal

Enable technology in both directions:

- **Into JR PHEEF:** a person, device, application, organisation or machine can submit an authorised request, event or capability.
- **Out of JR PHEEF:** JR can discover compatible capabilities and coordinate permitted actions or services, returning a verifiable result.

## Integration classes

1. Browser-native capabilities: camera, microphone, notifications, file picker, share, Bluetooth, USB and serial where supported by the browser and operating system.
2. User-connected applications: OAuth-authorised services with revocable scopes.
3. Partner APIs: verified organisations with contracts, credentials, rate limits and audit.
4. Device manufacturers / IoT: device identity, secure pairing, capability descriptions, telemetry and command channels.
5. Human and physical services: providers, operators and organisations coordinated through consented workflows.

## Proposed protocol

- HTTPS REST for request/response operations.
- OAuth 2.1 Authorization Code + PKCE for user-delegated access.
- Short-lived scoped tokens; no passwords from other services are collected.
- Signed webhooks with timestamp, nonce and replay protection.
- JSON capability manifest with stable identifiers and versioning.
- Device identity separate from member identity; pairing and revocation are explicit.
- Idempotency keys for retryable actions.
- Audit events for consent, access, commands, results and revocation.

## Proposed request envelope

```json
{
  "schema_version": "1.0",
  "request_id": "unique-id",
  "source": {"type": "device|application|organisation", "id": "registered-source"},
  "actor": {"member_id": "authenticated-member"},
  "intent": "describe-the-request",
  "capabilities": ["requested.capability"],
  "data": {},
  "consent_reference": "active-consent-id",
  "expires_at": "ISO-8601 timestamp"
}
```

## Required security boundaries

- Never trust a device-supplied member ID without server-side authentication.
- Never accept arbitrary callback URLs or unverified webhook destinations.
- Bind permissions to member, device, provider, scope and purpose.
- Require fresh user approval for money movement, purchases, messages to others, access control, vehicles, medical decisions or other consequential actions.
- Use rate limits, replay protection, anomaly monitoring and revocation.
- Keep DGBO, FAMILY and JR PHEEF records isolated by organisation and purpose.
- Do not expose founder-only controls or internal orchestration endpoints to public integrations.
- No background microphone, camera, location or device discovery.

## Build sequence

1. Capability catalogue and public manifest (current release).
2. Authenticated device registry and consent ledger.
3. OAuth client registration and scoped token service.
4. API gateway, request validation, idempotency and audit.
5. Signed webhook subscriptions and delivery/retry.
6. Developer portal, sandbox, SDKs and conformance tests.
7. Manufacturer/IoT pilots and approved production integrations.

Each step must be security-reviewed and tested before its status changes from planned to connected.
