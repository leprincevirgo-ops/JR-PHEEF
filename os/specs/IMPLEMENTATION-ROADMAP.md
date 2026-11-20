# JR PHEEF OS — Implementation Roadmap

**Status:** Execution plan. Dates are intentionally not promised; stage exit criteria govern progression.

1. **Preserve and audit current platform:** record main commit, deployment, PWA assets, API routes, database migrations, test scripts and current known issues.
   - Exit: reproducible baseline and no destructive changes.
2. **Mobile client foundation:** native Android shell, app signing plan, deep links, secure session handoff and accessible navigation.
   - Exit: builds and opens the existing JR service; no credentials hardcoded.
3. **Device identity and API contracts:** device registry, enrollment, revocation, session rotation, API versioning and contract tests.
   - Exit: two test accounts and multiple devices prove isolation and revocation.
4. **Managed launcher feasibility:** assess Android dedicated-device/lock-task APIs, default home role, accessibility and recovery. Require explicit owner/admin provisioning.
   - Exit: pilot device can enter/exit managed JR mode safely.
5. **AOSP reference platform:** choose supported hardware with BSP/vendor cooperation; establish build host, source manifest, reproducible build and signed image.
   - Exit: image boots and passes hardware/security validation.
6. **Physical prototype:** ODM/OEM samples, thermal/battery/radio/camera testing, OTA, repairability and certifications.
   - Exit: pilot acceptance and legal/compliance approvals.
7. **Commercial release:** support operations, warranty, update commitments, supply chain and controlled rollout.
   - Exit: independent release review and operational readiness.

Do not skip a stage because a calendar date passes.
