# JR PHEEF foundation — staging authentication

## Staging resources
- Web: https://jr-pheef-foundation.onrender.com
- Health: https://jr-pheef-foundation.onrender.com/healthz
- Supabase project: vtwkjtxvyixoujkhravo
- Supabase URL: https://vtwkjtxvyixoujkhravo.supabase.co

## Render environment
Configured on the isolated JR PHEEF Foundation service:
- NODE_ENV=production
- SUPABASE_URL points to the staging project
- SUPABASE_PUBLISHABLE_KEY is the staging publishable key
- PAYMENTS_ENABLED=false

Never put a service-role or secret key in browser code. The Render server and Supabase Edge Function use server-side credentials only.

## Supabase Auth dashboard action
In the staging project only, open Authentication → URL Configuration:
1. Set Site URL to https://jr-pheef-foundation.onrender.com
2. Add https://jr-pheef-foundation.onrender.com/** to Redirect URLs.
3. Keep email confirmations enabled.
4. Ensure the signup email template redirects to the Site URL (or uses the configured redirect URL).

Dashboard: https://supabase.com/dashboard/project/vtwkjtxvyixoujkhravo/auth/url-configuration

The Supabase management tools available in this workspace do not expose Auth URL configuration writes, so this is a one-time dashboard setting. Do not alter production Auth settings.

## Implemented
- Email/password signup and login endpoints.
- Required full name, phone, birth year and 18+ validation at signup.
- Secure HttpOnly, Secure, SameSite=Lax session cookies.
- Session inspection, refresh and logout.
- Email confirmation token handoff.
- Rate-limited auth endpoints and origin checks.
- Member provisioning Edge Function; JWT verification remains enabled.
- Service-role access stays server-side.
- Payments remain disabled.

## Verification limits
Render startup runs `npm test` before starting. The six automated tests cover UI wiring, signup fields, auth routes, secure cookies, credential separation and health endpoint.
A live test account signup/login has not been performed as part of deployment verification. Do not claim real-user authentication is fully accepted until the staging URL configuration is set and a test mailbox completes signup, confirmation, login, refresh and logout.
