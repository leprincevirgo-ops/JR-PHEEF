# JR PHEEF partner event gateway

JR currently exposes a **limited inbound event gateway**, not a general-purpose API or an outbound automation API.

## Create a connection

A signed-in member creates a connection in the JR journey panel. The API returns a bearer secret once:

`POST /api/jr/integrations`

```json
{ "name": "My stock system" }
```

The response contains `token` once. Store it in the connected service's secret manager. JR stores only its SHA-256 hash. The only scope is `events:write`. A member can revoke the credential in JR.

## Send an event

`POST /api/inbound/jr/events`

Headers:

```
Authorization: Bearer jr_live_<one-time-secret>
Content-Type: application/json
```

Body:

```json
{
  "event_type": "inventory_update",
  "title": "Stock count updated",
  "summary": "Product ABC has 12 units recorded.",
  "external_event_id": "inventory-count-2026-11-03-001",
  "occurred_at": "2026-11-03T08:00:00Z",
  "event_data": {
    "category": "stock",
    "quantity": 12,
    "unit": "items",
    "status": "counted"
  }
}
```

Accepted event types: `status_update`, `task_update`, `inventory_update`, `delivery_update`, `message_received`, `calendar_update`, `other`.

Only these optional `event_data` keys are retained: `status`, `category`, `quantity`, `unit`, `location_label`, `description`. Values are limited and coerced to short strings. Events are deduplicated by connection plus `external_event_id`.

## Member inbox and revocation

- `GET /api/jr/integrations` — list your connections.
- `GET /api/jr/integrations/events` — read your private event inbox.
- `DELETE /api/jr/integrations/:id` — revoke your own connection.

These member endpoints require a JR login session.

## Security boundaries

- Partner credentials are shown once and stored as hashes, never in plaintext.
- Each credential belongs to one JR member and can only submit event records.
- Revocation immediately disables future requests using that credential.
- Event submission never triggers payment, messaging, booking, device control or other external action.
- No partner can read member data through this token.
- Rate limiting, strict event type allowlists, small payload fields, deduplication and security audit events are applied.
- Use HTTPS and store the bearer token only in a secret manager. Do not put it in browser code, mobile app bundles, URLs or logs.

This gateway is a safe first integration seam. OAuth provider authorization, outbound execution adapters, signed partner webhooks and live service workflows remain separate engineering and authorization layers.
