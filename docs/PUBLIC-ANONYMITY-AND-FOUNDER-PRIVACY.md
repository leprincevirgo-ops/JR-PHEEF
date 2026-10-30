# JR PHEEF — Public Anonymity and Founder Privacy Standard

## Purpose

JR PHEEF's creator may remain publicly pseudonymous, following the model of a creator known by a public pseudonym rather than a disclosed legal identity. Public anonymity is a deliberate product and governance requirement.

## Public-facing rules

- Do not publish or display the creator's legal name, personal email, phone number, home/location details, date of birth, personal photographs, private social profiles, or other identifying details.
- Do not create a public founder biography, founder dashboard card, public ownership announcement, personal contact page, or marketing claim that links a private person to JR PHEEF.
- Do not include personal identity details in public app UI, release notes, screenshots, docs, sample data, API responses, metadata, filenames, analytics labels, or support examples.
- Use JR PHEEF as the product identity. If a public creator attribution is genuinely needed, use a neutral pseudonymous label such as "JR PHEEF creator" only after review; do not imply a verified legal identity.
- Never expose JP-01 publicly as a way to identify its holder. It is a protected internal ecosystem identifier and must not be rendered on public pages or public API responses.
- Do not use personal birth data, Cosmic Signature, numerology, or similar material for identity proof or ownership decisions.

## Private governance and security

Anonymity is not the same as absence of accountable ownership. Privileged ownership, legal obligations, recovery and succession records may be held privately by the authorised system and relevant professional service providers where required.

- Keep the verified legal identity, account recovery evidence and succession instruments in restricted, encrypted, audited systems with least-privilege access.
- Separate public pseudonym, internal JP identity, authenticated member account and legal ownership records. Never derive one from another without an authorised verification process.
- JP-01 is immutable and never reassigned. Environment-specific roles are separate and revocable.
- Ownership or succession changes require explicit authorization, independent verification, documented approval, cooling-off/recovery safeguards where appropriate, and immutable audit history. AI must not transfer ownership.
- Do not add a public founder route, public lookup endpoint, public founder directory, or unauthenticated endpoint that reveals owner/member details.
- Public API responses must use allow-listed fields and must not return private member fields or owner-only governance metadata.

## Platform metadata caveat

Public hosting, source-control and domain providers may expose account handles, repository ownership, commit attribution, DNS registration or billing metadata outside the JR PHEEF application. The application and project documentation must not disclose personal identity, but absolute pseudonymity cannot be guaranteed while provider accounts or repository ownership remain publicly attributable. Any migration to a dedicated pseudonymous organisation/account must preserve access controls, deployment integrations, auditability and recovery; do not change ownership or repository visibility without an approved migration plan.

## Review gate

Before a public release, inspect:
1. Public pages, metadata, screenshots and assets.
2. API responses and error messages.
3. Repository README/docs/release notes and commit metadata.
4. Domain/hosting/source-control account exposure.
5. Logs, analytics, crash reports and support tooling.
6. JP identity and succession flows for public leakage.

Record findings and remediate identifying disclosures before release. Never claim the creator is fully anonymous until provider-level exposure has also been reviewed.
