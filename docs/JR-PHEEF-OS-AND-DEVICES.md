# JR PHEEF OS & Devices — Engineering Programme

**Status:** Approved product direction; architecture and preparation work in progress. This document is not evidence of a completed OS, hardware prototype, certification, or production release.

## Product decision

JR PHEEF will evolve toward a JR-first digital environment spanning existing phones, a customized AOSP operating system, and a family of JR PHEEF-branded devices. The initial path is software-first: preserve the current web application and backend, build a mobile companion/launcher experience, prove reliability, then evaluate AOSP and hardware.

## Non-negotiable continuity rule

- Do not replace, reset, or destabilize the current production application, database, authentication, or integrations.
- Build device work in isolated directories and feature branches.
- Use documented, versioned APIs; do not couple the OS to internal Express implementation details.
- No production deployment, schema migration, purchase, manufacturing commitment, or paid infrastructure change without its own review and authorization.
- Mark every capability as proposed, implemented, tested, or released based on evidence.

## System context

1. **Device hardware:** SoC, RAM, storage, display, camera, audio, battery, sensors, modem and radios.
2. **Platform OS:** AOSP/Linux foundation, Android framework, HAL/vendor layer, secure boot, verified updates and recovery.
3. **JR device services:** enrollment, device posture, secure storage, synchronization, notifications, update coordination and local capability broker.
4. **JR intelligence runtime:** local and cloud model routing, planning, retrieval, policy checks and tool execution.
5. **JR experience:** JR-first home, voice/text interaction, accessible navigation and user-controlled settings.
6. **JR services:** JR LINK, commerce, business, education, travel, delivery and other authorized service modules.
7. **Trust plane:** identity, consent, least privilege, audit, abuse controls, privacy and incident response.

Cross-cutting requirements: offline resilience, accessibility, interoperability, observability, data portability, service continuity and clear user control.

## Platform strategy

- Phase 1: responsive web/PWA and Android companion on existing devices.
- Phase 2: managed Android launcher/kiosk mode on supported devices, with user consent and recovery access.
- Phase 3: AOSP-based system image on a documented reference device with vendor cooperation.
- Phase 4: ODM/OEM-designed JR PHEEF phone after feasibility, security, support and commercial gates.
- Future: tablet, desktop, watch, TV and connected hub, each with device-specific software and shared identity/services.

AOSP is the preferred initial OS base. A custom kernel is not justified for the first product. Google Mobile Services and Play distribution are separate compatibility/licensing workstreams; do not imply they are included in AOSP.

## Proposed phone reference targets (not procurement commitments)

- 6.5–6.8 inch display; FHD+; 90 Hz preferred if power/cost allow.
- Supported 64-bit ARM SoC with documented vendor BSP, modem support and hardware-backed key storage.
- 8 GB RAM target; 128–256 GB storage target.
- Approximately 5,000 mAh battery; USB-C.
- LTE minimum; 5G preferred subject to bands, cost and market support.
- Wi-Fi, Bluetooth, GNSS; NFC where commercially useful.
- Main camera, front camera, fingerprint sensor, accelerometer, gyroscope, proximity and ambient-light sensors.
- Secure boot, hardware-backed Keystore/TEE, file-based encryption, verified updates and recovery.
- Maintainable vendor firmware and a written security-update support commitment.

Final selection requires a bill of materials, thermal/power review, radio-band matrix for target countries, repairability review, supplier diligence and sample testing.

## Security model

- Hardware root of trust; locked bootloader in production; verified boot and signed OTA packages.
- File-based encryption and hardware-backed keys; secrets never shipped in source or client builds.
- Per-user and per-device identity, revocable credentials, MFA/passkeys for sensitive accounts, step-up approval.
- Android app sandbox, SELinux enforcing, minimal permissions and no hidden founder bypass.
- Explicit, visible microphone/camera/location access; user-selected files; scoped storage.
- Local/cloud data classification, retention, export and deletion policies.
- AI tools use scoped capabilities; separate propose/read/execute permissions; confirmation for purchases, payments, messages, public posts, device control and other consequential actions.
- Signed updates, staged rollout, rollback/recovery and security incident process.
- Independent penetration testing and privacy review before commercial release.

## Cloud/device boundary

Device clients call a versioned API gateway. Device enrollment creates a revocable device credential; it does not grant broad access to member or company data. Synchronization is encrypted, conflict-aware and limited to authorized data. Offline actions are queued only when safe and use idempotency keys when reconciled. Emergency calling and core OS recovery must not depend on JR cloud availability.

## API contract requirements

- Version all public mobile/device endpoints under a stable namespace such as `/api/v1/device`.
- Use short-lived access sessions, refresh rotation, revocation and device binding.
- Never expose Supabase service-role keys, Twilio credentials, signing keys or other server secrets to clients.
- Define schemas, errors, rate limits, idempotency, pagination and audit behavior.
- Use backward-compatible changes and contract tests.
- Existing endpoints are not presumed safe for mobile reuse until inspected and documented.

## Release gates

1. Repository and deployment baseline recorded.
2. Mobile client builds reproducibly and has accessibility/security checks.
3. Auth, session revocation, data isolation and device enrollment pass tests.
4. Offline and reconnect behavior is verified.
5. AOSP reference image boots on supported hardware and passes device tests.
6. Security review, update/recovery drill and compatibility checks pass.
7. Regulatory, radio, battery, consumer and market certifications are complete before sale.
8. Manufacturing and after-sales support are contractually sustainable.

## Current work status

- Existing repository inspected; the current project already contains a PWA manifest, service worker, mobile shell assets and extensive test scripts.
- Existing app has a large established Node/Express codebase and must be preserved.
- This branch introduces isolated OS/device documentation and an initial native Android companion scaffold.
- No AOSP source tree, custom system image, hardware prototype, certification or device deployment is included in this change.
