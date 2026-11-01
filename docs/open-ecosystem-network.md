# JR PHEEF Open Ecosystem Network

## Product purpose
JR PHEEF is both an integration consumer and an integration platform. It can coordinate users with external services, while external organisations and developers can expose approved capabilities through JR PHEEF.

## First-release workspaces
- **Connections**: discovery of official external services. A directory listing is not a connected integration.
- **Partner Centre**: intended organisation onboarding, capability registration, verification, security review, testing, publication and ongoing operations.
- **Developer Centre**: intended API documentation, SDKs, sandbox, webhooks, identity scopes, conformance tests and publishing lifecycle.

The Partner Centre and Developer Centre currently provide product information only. Registration, credential issuance, partner verification, sandbox provisioning, API gateway access and production partner connections are not implemented.

## Integration lifecycle
1. Discover provider and capability.
2. Confirm legal entity, authorised representative and service ownership.
3. Define the capability contract: actions, regions, availability, pricing, data categories, failure modes and support commitments.
4. Review privacy, security, legal/regulatory requirements and user consent.
5. Provision least-privilege sandbox credentials.
6. Run conformance, abuse, reliability and end-to-end tests.
7. Approve publication and clearly label the integration state.
8. Monitor uptime, versioning, incidents, disputes, consent and revocation.

## Shared gateway design
A single JR PHEEF Integration Gateway should mediate partner connections rather than creating point-to-point integrations throughout every workspace. It should provide:
- Provider registry and versioned capability contracts.
- OAuth 2.0 / OpenID Connect where appropriate; short-lived scoped credentials and secret rotation.
- Signed webhooks, replay protection, idempotency keys, retry policy and dead-letter handling.
- Rate limits, quotas, timeouts, circuit breakers and provider health monitoring.
- Consent and data-minimisation enforcement at every request.
- Audit records for access, actions, approvals and revocation.
- Sandbox/production separation and environment-specific credentials.
- Country, currency, language, jurisdiction and data-residency metadata.

## Required integration states
Use explicit states, never imply a connection from a directory listing:
- PLANNED
- UNDER REVIEW
- APPROVAL REQUIRED
- IN DEVELOPMENT
- CONNECTED SANDBOX
- CONNECTED PRODUCTION
- TESTED AND VERIFIED
- EXTERNAL ONLY
- UNAVAILABLE
- BLOCKED

## Initial integration candidates
Safaricom Daraja / M-PESA, Airtel Money, Stripe, PayPal, Shopify, Google Maps Platform, OpenStreetMap and Twilio are candidates for research and staged integration. They are not asserted to be connected by this foundation. Provider eligibility, API availability, supported countries, fees, licences and commercial terms must be verified before implementation.

## Security and human-control requirements
- No API secret or private token in browser code, public files or client storage.
- No production transaction, purchase, booking, payment, message or disclosure without the required user authorisation.
- Payment, banking, health, identity and other regulated functions require suitable licences or authorised providers.
- Partner access is scoped, revocable and audited.
- A partner cannot read unrelated user data or invoke unrelated JR PHEEF capabilities.
- User-facing surfaces distinguish native JR functions, connected providers, external destinations and unavailable capabilities.

## Immediate next implementation stages
1. Establish a provider/capability registry with explicit states and ownership.
2. Build authenticated partner organisation onboarding and verification.
3. Implement a server-side integration gateway with secret management and consent checks.
4. Add sandbox credentials, webhook signing and conformance tests.
5. Integrate one low-risk provider end-to-end, then add payment and other regulated integrations only after legal and security review.
