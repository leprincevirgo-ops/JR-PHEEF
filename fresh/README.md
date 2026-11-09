# JR PHEEF — fresh foundation

JR is the central intelligence and personality. JR PHEEF is the connected world JR operates in.

This first slice provides a responsive JR-first landing page, working entry-panel interactions, an initial conversation surface, Express hosting and a health endpoint. Authentication, account creation, password reset, email verification, AI responses, messaging, payments and user data persistence are explicitly not active yet. The preview does not transmit or store credentials.

Run with `npm install && npm start`; open port 10000 and `/healthz`.

Architecture sequence: secure identity/session; JR conversation runtime; adaptive/user-created Worlds; Command Center; Business, Delivery, Family, Finance, Studio, Connect, Security and API capabilities; payments only after secure provider integration and review.

Keep all secrets server-side. Staging must never point to production.
