# JR PHEEF OS and Device Test Matrix

| Area | Test | Pass condition |
|---|---|---|
| Build | Reproducible Android debug assembly | Gradle build succeeds from clean checkout |
| Launch | Cold start and resume | No crash; no stale or blank startup screen |
| Navigation | Touch, keyboard and accessibility focus | All primary destinations are reachable |
| Authentication | Sign-in, sign-out, expiry and account switch | Session state is correct; private state is cleared on sign-out |
| Device identity | Enroll, list and revoke | Only account owner can manage their devices |
| API isolation | Two independent test accounts | No cross-account data access |
| Offline | Disconnect during read and queued safe write | Honest offline state; no unsafe action is dispatched |
| Recovery | Reinstall, lost device and credential rotation | Revoked credentials cannot reconnect |
| Privacy | Camera, microphone, location and file permissions | Access is explicit, visible and revocable |
| Updates | Interrupted update and rollback | Device recovers to a verified working image |
| Performance | Cold launch, memory and battery | Meets thresholds defined for selected hardware |
| Accessibility | TalkBack, font scaling, contrast and reduced motion | Critical flows remain operable |

Use disposable test accounts and synthetic data. Do not use production customer records or live money movement. Every test records device model, OS build, app version, test date, result and issue reference.
