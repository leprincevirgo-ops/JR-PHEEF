# JR PHEEF Device Build and Release Controls

**Status:** Required pipeline design; no signed release artifact is currently produced by this document.

## Source and dependency controls
- Protect the main branch and require review for OS/device code.
- Pin third-party actions and dependencies to reviewed immutable versions/SHAs for release workflows.
- Generate an SBOM for release candidates.
- Scan dependencies and source; review licenses.
- Store signing keys in an approved HSM/KMS or protected release environment, never in repository files or client builds.
- Separate debug and production signing identities.

## Build stages
1. Static checks and unit tests.
2. Android debug assembly for development.
3. Instrumented tests on supported emulator/device matrix.
4. Security and dependency scanning.
5. Reproducible release candidate build.
6. Signed artifact generation in protected CI.
7. Internal pilot rollout.
8. Staged production rollout with health monitoring and rollback.

## Release metadata
Every artifact records source commit, build workflow, toolchain, dependencies/SBOM, signer identity, version, target hardware and test results.

## OTA requirements for future AOSP devices
- Signed payloads and metadata.
- Verified Boot chain and rollback protection.
- A/B or equivalent recovery strategy where hardware supports it.
- Power-loss-safe installation.
- Canary rollout, pause/stop controls and health monitoring.
- Tested factory recovery and documented user data impact.

## Current companion CI
The initial Android companion workflow is a build check only. It is not an OS image builder, release signer, Play publisher or hardware certification workflow.
