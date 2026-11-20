# JR PHEEF Android Companion

This is an initial native Android application shell, not JR PHEEF OS and not a replacement for the existing web/PWA product.

## Current scope
- Native Android entry point and JR-branded landing screen.
- Opens the existing JR PHEEF web service using the device's default browser.
- Does not store passwords, API keys or Supabase secrets.
- Does not claim offline AI, device management, launcher replacement or OS-level privileges.

## Build
Open this directory in a recent Android Studio installation with JDK 17 and Android SDK 35 installed, then sync Gradle and run the app on an emulator or supported test device.

A Gradle wrapper is not included in this initial scaffold. Generate/pin it using the Gradle version selected by the Android build environment before CI release.

## Configuration
The current service URL is a build-time default in `app/build.gradle.kts`. Change it only after confirming the canonical production URL and test/staging URLs. Do not put secrets in build configuration.

## Next engineering steps
- Add deep-link routing and secure authentication handoff.
- Define device enrollment and revocation APIs before implementing persistent device identity.
- Add accessibility, lifecycle, offline and network-error tests.
- Add CI builds, app signing and release provenance.
