# JR PHEEF end-to-end smoke testing

## Public deployment smoke checks

Run against the deployed site using Node.js 20 or newer:

```sh
npm install
BASE_URL=https://jr-pheef-marketplace.onrender.com npm run test:e2e
```

The smoke test is read-only. It checks:
- the homepage returns HTTP 200 and serves the JR PHEEF HTML document;
- `/health` returns HTTP 200 and reports `ok: true`, the expected app identity, and a version.

Set `BASE_URL` to the new public URL after a branding/domain change. The current URL remains the default until a replacement URL is confirmed live.

## Required human browser checks before release

The public smoke test cannot safely validate private account flows without test credentials. Use a dedicated test account and verify:

1. Register or sign in; confirm the user reaches their own dashboard.
2. Refresh and open a second page; confirm session behavior is consistent.
3. Sign out; confirm protected screens return to the sign-in state.
4. Verify a second test account cannot read or change the first account's private data.
5. Create and edit a test social post; verify likes/follows persist and respect access controls.
6. Open JR TEACHER and verify its core page and interactions.
7. Test every visible voice input with browser microphone permission granted and denied; confirm keyboard input remains available.
8. Check JR AI using a valid configured provider key; verify rate-limit or provider errors are presented clearly.
9. Check DGBO/Ecosystem links, file upload limits, and account recovery flows.
10. Inspect browser console and Render logs for uncaught errors.

Never use real customer data or real payments for these tests. Use sandbox payment credentials and a disposable test account. Do not mark the project production-ready until these checks and the Supabase security findings have been reviewed.
