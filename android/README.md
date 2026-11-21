# JR PHEEF Android preview

This project builds a lightweight Android WebView shell for the live JR PHEEF web/PWA application.

- App id: `com.dime.jrpheef.debug` for the debug build
- Minimum Android version: Android 6.0 (API 23), including Android 8.1
- Runtime URL: `https://jr-pheef-marketplace.onrender.com`
- JavaScript and DOM storage are enabled for the web application.
- Microphone and camera permissions are requested only when the web app asks for them.
- File selection delegates to Android's system chooser.
- HTTPS-only; third-party cookies and mixed content are disabled.

The GitHub Actions workflow builds `app-debug.apk` and uploads it as a 30-day artifact.

**Build type:** debug-signed preview APK for direct installation/testing. It is not a Play Store release-signed package.
