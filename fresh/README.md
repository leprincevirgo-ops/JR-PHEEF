# JR PHEEF — fresh foundation

JR is the central intelligence and personality. JR PHEEF is the connected world JR operates in.

This staging slice includes an immersive public JR PHEEF discovery front door with live source-attributed general and aviation updates; responsive registration and sign-in entry; email/password authentication routes with email confirmation, secure session cookies and member provisioning; authenticated member workspaces; Worlds discovery and creation; separate DGBO and FAMILY company environments; JR MOVE transport workflows; JR LINK messaging, groups, channels and status media; profile photo upload and visibility controls; a protected founder overview; and a server-side partner enquiry path.

Public routes: `/` is the public discovery experience; `/app` opens account entry; `/jr-pheef` returns to the public JR PHEEF experience; `/jr-move` opens the public JR MOVE experience. The public discovery feed is served by `GET /api/discovery/feed?world=general|transport`; it displays attributed public source metadata and links to publishers, never full articles. Transport updates use IATA and FAA RSS sources. The page keeps registration hidden until a visitor chooses to join or sign in.

JR provides an authenticated open-ended AI conversation through `/api/ai/chat` when `OPENAI_API_KEY` is configured; `/healthz` reports whether the provider is configured. Member conversations persist in the member-scoped JR conversation store, and saved memories enter AI context only when the member explicitly consents. Browser speech input and output are available where supported. The private Founder–JR Intelligence Partnership adds an owner-verified conversation, shared approved project context, persistent history and voice/text controls; it is not exposed to ordinary members.

Platform account registration is separate from formal company registration, DGBO partnership, FAMILY membership and access to regulated financial products. Corporate registration identifiers and licences must only be published after verification. Payments, deposits, lending, investment transactions and production integrations remain disabled in staging.

Run with `npm install && npm start`; open port 10000 and `/healthz`.

Architecture sequence: secure identity/session; JR conversation runtime; adaptive/user-created Worlds; Command Center; business, delivery, FAMILY, finance, studio, connect, security and partner integrations. Keep all secrets server-side. Staging must never point to production.
