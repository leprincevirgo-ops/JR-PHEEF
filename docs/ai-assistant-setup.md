# JR PHEEF AI Assistant — setup and verification

## What is implemented

- Authenticated server-side endpoint: POST /api/ai/chat.
- OpenAI Responses API integration using Node's built-in fetch; no provider secret is shipped to the browser.
- JR PHEEF Library retrieval for published knowledge_articles.
- Optional web research, enabled only when the member checks the web-research box.
- Specialist modes: Universe Assistant, Actuarial & Risk, Business & Operations, Research, Learning, Opportunity Matching, and AI Manager.
- Source links from retrieved Library notes and supported web citations.
- Per-member in-memory limits of 12 requests/minute and 50/day, plus login/registration IP rate limits.
- No chat transcript persistence in the database; the current conversation lives in the browser page until cleared or refreshed.
- No external actions, payments, file transfers, or messages are executed by the AI.

## Required Render environment

In the Render service's Environment settings, add:

- OPENAI_API_KEY: secret API key from the OpenAI Platform.
- OPENAI_MODEL: optional; defaults to gpt-6-astra in this implementation. Set it to a model enabled for the OpenAI project.

Do not place the API key in GitHub, public/index.html, a client-side variable, screenshots, or messages. After saving the variable, Render will redeploy. The /health response reports whether the key is configured, not whether the provider key has valid billing or model access.

OpenAI's current Responses API supports model responses, built-in web search, and function tools. The main chat request uses `store: false` to avoid provider-side response storage. This does not replace JR PHEEF's own consent, access-control, or retention responsibilities. JR PHEEF currently uses the Responses API and optional web search; it does not yet allow model-selected tools to perform actions in user accounts.

## Safety and limitations

- AI answers can be incorrect. Verify high-impact claims.
- Actuarial scenarios are estimates, not guaranteed outcomes or regulated insurance/financial advice.
- Web research is opt-in and may add latency and API cost.
- The current rate limiter is process-memory based and resets when the service restarts. Before broad public launch, move quotas to a shared persistent store and add monitoring.
- File vault upload/download is implemented separately; the AI does not yet read or summarize uploaded files.
- AI Manager produces plans and recommendations only. Human approval remains required for external actions.
- The existing access-pass billing has been retired from discovery endpoints. Browsing/listings are free; connection fees and M-Pesa payments are not active until mutual-match payment logic and end-to-end payment verification are implemented.

## Test

Run npm test.

This checks Node server syntax and parses the inline browser JavaScript. A successful syntax test does not replace authenticated end-to-end tests for two separate member accounts, private file upload/download/delete, connection permissions, RLS, and provider API configuration.


## Billing errors

The application can be correctly configured while provider requests still fail. Production logs have shown `credit_balance_exhausted`, which indicates the API organization has run out of prepaid credits. ChatGPT subscriptions and API billing are separate. Check the intended API organization's billing balance and spend limits; never paste the API key into chat or commit it to GitHub. After billing is corrected, retry a single request and verify the provider response. If a different quota code appears, follow that code's documented remedy instead of assuming more credits are always the answer.
