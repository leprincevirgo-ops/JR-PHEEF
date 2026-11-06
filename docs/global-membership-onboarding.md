# JR PHEEF Global Membership and Country Detection

## Membership principle
Joining should feel like opening a trusted digital account, not applying for a government permit. Ask only for the information needed to create a secure account. Add stronger checks only when a member enters a higher-risk service.

## Stage 1 — Basic member account
- Full name or chosen display name according to the service's identity policy.
- Phone number or email, at least one reachable sign-in/recovery channel.
- Password, with stronger authentication available.
- Country, preferred language, time zone, display currency and measurement units.
- Clear privacy notice, terms, age requirements and consent controls.
- One JP identity for the member across supported JR PHEEF worlds.

The country and language fields are preferences and routing information. They are not proof of nationality, residence, identity or legal eligibility.

## Stage 2 — Contact verification
Verify email or phone using a one-time code or secure verification link. Do not display a verified badge until the server confirms the relevant check. A contact-verification badge must not be described as government identity verification.

## Stage 3 — Progressive verification
Ask for additional evidence only when a member needs a feature that justifies it:
- Individual identity verification for regulated payments or high-risk financial activity.
- Business verification for shops, suppliers, employers, advertisers and institutions.
- Licences, insurance or permits for regulated or safety-critical services.
- Additional age assurance for age-restricted experiences.
- Payment-provider KYC/KYB handled by the relevant licensed provider where possible.

Collect the minimum evidence required, explain why it is needed, limit staff access, protect it, and define retention and appeal processes. Never make a general public profile expose identity documents.

## Country suggestion
The current sign-up implementation uses browser language/locale and device time zone to suggest a country code. It also suggests a currency for a set of common country codes. The member can edit the values before registration and later in profile settings.

These are hints only:
- A device language can differ from the member's physical location.
- A time zone can be manually changed or shared by multiple countries.
- A phone calling code is not proof of residence.
- A VPN, roaming SIM or travel can make IP-based estimates misleading.

Do not silently treat these hints as a verified location. Do not request precise GPS for ordinary registration.

A future IP-country provider can offer a coarse country suggestion if it is configured, privacy-reviewed and protected against spoofed forwarding headers. If that signal is introduced, disclose it, treat it as approximate, and let members correct it. Use precise location only when a feature genuinely needs it and the member grants permission.

## Global launch readiness
Country selection does not activate a market. Before offering services in a country, JR PHEEF must review local privacy and consumer rules, age requirements, payment and payout support, taxes, advertising rules, regulated sectors, local moderation and escalation, data transfers, language quality, customer support and service-provider availability.

## Implementation status
Implemented in the registration flow:
- Country code, locale, time zone, display currency and measurement preferences.
- Device-language and time-zone suggestions with member confirmation/editing.
- Server-side format validation and storage in the members record.

Not implemented by this change:
- IP geolocation provider, identity-document checks, email/SMS one-time verification, age assurance, KYC/KYB, or country-specific legal/payment activation.
