# JR PHEEF Device Offline and Synchronization Design

**Status:** Design baseline. Offline availability is feature-specific, never a blanket guarantee.

## Operating modes
- Connected: normal online services and synchronization.
- Degraded: cached read-only data and queued safe operations.
- Offline: local features only; remote actions are unavailable.
- Recovery: restore credentials, configuration and synchronized data after device loss or reinstall.

## Data classes
1. Public reference data: may be cached with expiry.
2. User-selected personal content: encrypted local storage, user-controlled retention.
3. Private messages/business records: cache only when justified, encrypted and account-scoped.
4. Credentials/secrets: protected platform storage; never ordinary preferences or logs.
5. Financial/regulated records: follow product/provider retention and security requirements; do not cache sensitive payment credentials.

## Sync model
- Server-authoritative records carry version/updated-at metadata.
- Client maintains a durable cursor and pending-operation queue.
- Every queued write has a unique idempotency key and explicit pending/succeeded/failed/conflict state.
- Retry with bounded exponential backoff and jitter.
- Reconcile after reconnect; never silently overwrite concurrent edits.
- Show users when information is stale or a change has not synchronized.
- Expire queued actions that require fresh consent or time-sensitive authorization.

## Never execute offline
- Payments, transfers, refunds or purchases.
- Sending messages or public posts without current authorization.
- Identity/role changes, device revocation or security-setting changes.
- Dispatching transport/delivery or controlling safety-critical equipment.
- Any action whose legal or operational validity depends on live verification.

## Resilience
- API responses, authentication pages and private data are not cached by the service worker.
- Cache only same-origin static assets and safe public shell resources.
- On logout, account switch or revocation, clear private local state and invalidate account-scoped caches.
- Protect local database with platform encryption; avoid logging message contents, tokens or private records.
- Test low storage, interrupted sync, clock skew, duplicate requests, expired sessions and device loss.
