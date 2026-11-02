# JR PHEEF daily business plans

The daily business-plan endpoint is already implemented in `routes/operations.js`. This workflow calls it once per day at 05:30 East Africa Time (02:30 UTC), and can also be started manually from GitHub Actions.

## One-time secure setup

The scheduler uses one shared secret. Generate a long random value (at least 32 bytes) and store the same value in both places:

1. **GitHub:** Repository → Settings → Secrets and variables → Actions → New repository secret. Name it `DAILY_PLAN_CRON_SECRET`.
2. **Render:** JR PHEEF web service → Environment → add `DAILY_PLAN_CRON_SECRET` with the exact same value. Save the change and allow the service to redeploy.

Do not commit the secret, put it in this file, or paste it into source code.

Until both values match, the scheduled workflow safely skips when the GitHub secret is absent; if the GitHub secret exists but the Render value is missing or different, the protected endpoint returns 404 and the job fails.

## What gets delivered

- The endpoint selects up to 500 business workspaces where `daily_plan_enabled = true`.
- Each workspace receives at most one saved plan per Africa/Nairobi calendar date.
- A JR PHEEF notification is created for the business owner when a new plan is saved.
- The AI planner uses the business profile and has a safe template fallback if the AI provider is unavailable.
- Plans are recommendations. Purchases, price changes, supplier orders and customer contact still require business-owner approval.

## Run manually

After the two secrets are configured, open GitHub Actions → **JR PHEEF daily business plans** → Run workflow. Check the job output for the number of workspaces processed, plans created, reused and failed.

## Current data limitation

The current daily planner uses each workspace's business name, sector, location and goals. It does not yet read live POS sales or stock records. Those integrations must be completed and validated before JR can describe a plan as based on actual trading performance.
