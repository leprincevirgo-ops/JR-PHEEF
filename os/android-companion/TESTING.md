# Android Companion — Validation Checklist

## Automated
- GitHub Actions installs JDK 17 and Android SDK platform 35.
- Gradle assembles a debug APK.
- Build failure blocks the companion scaffold from being considered build-verified.

## Manual emulator/device checks
1. Install and launch from a clean state.
2. Verify the JR PHEEF name and primary action are visible and accessible.
3. Tap Open JR PHEEF; confirm the default browser receives the configured URL.
4. Test with no browser handler, no network, slow network and server error.
5. Rotate screen, background/resume and process recreation.
6. Test large text, TalkBack and keyboard navigation.
7. Confirm no password, access token or provider secret is persisted by the companion shell.
8. Confirm back navigation returns safely to the companion.
9. Verify the configured service URL before any external APK distribution.

## Current limitations
The companion is a native launch shell only. It does not yet provide in-app authentication, device enrollment, local AI, offline task execution, a default-home launcher role, device policy management or AOSP functionality.
