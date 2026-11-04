# JR PHEEF — Adaptive Growth, Universal Matching and Install Access

## Product principle
JR PHEEF is a continuously expanding human capability and connection environment. It must adapt as new industries, needs, technologies, regions, languages, accessibility requirements and forms of exchange emerge. New capabilities are introduced through a governed capability registry and natural-language interaction, not by exposing an ever-growing wall of tabs.

## Continuous capability growth
1. Observe unmet user needs and emerging legitimate categories across regions and communities.
2. Distinguish user requests, verified provider capabilities, generated suggestions and experimental features.
3. Propose a capability with purpose, target users, risks, evidence, data requirements, accessibility and operating cost.
4. Test in an isolated sandbox with synthetic/test data and human review.
5. Release gradually with explicit version, region, language and provider-availability labels.
6. Monitor reliability, usefulness, safety, fairness and cost; pause or roll back when standards are not met.
7. Let users request, correct, rate and appeal capability behaviour. Do not silently change a user's important workflows.

## Universal matching
Matching remains a core JR PHEEF capability across people, skills, learning, jobs, goods, services, businesses, suppliers, transport, delivery, rooms, institutions, projects and other lawful opportunities. Each match must consider intent, location or remote availability, time, price/budget, quality evidence, compatibility, accessibility, language, trust signals, permissions and user preferences. Explain why a match is suggested and allow users to adjust or reject it. Never fabricate stock, availability, credentials, ratings or identity verification. Distinguish organic relevance from paid placement and never let payment override safety or user intent.

## Human value and safeguards
JR should improve access to knowledge, work, livelihoods, services, education, creativity, community, accessibility and participation. It must support user agency rather than dependency, make data portable, honour consent, minimise collection, provide clear uncertainty and human appeal, and require confirmation before consequential external actions.

## Install access
JR PHEEF is a Progressive Web App (PWA) and can be installed from a supported browser as an app-style shortcut. This does not mean it is already published as a native Google Play or Apple App Store application. Native store publication, signed Android/iOS packages, store accounts, compliance reviews and release testing are separate work.

## Current install implementation
The app shell has a web manifest, service worker, offline shell fallback and branded SVG icon. A lightweight install invitation now uses the browser's native install prompt when available and provides platform-specific manual instructions otherwise. API responses and non-GET requests remain excluded from offline caching. Offline access is limited to cached shell/static assets; it does not imply offline transactions or live AI.
