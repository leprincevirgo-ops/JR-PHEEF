"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const server = fs.readFileSync("fresh/server.js", "utf8");
const workspace = fs.readFileSync("supabase/functions/jr-workspace-api/index.ts", "utf8");
const gateway = fs.readFileSync("supabase/functions/jr-partner-event-gateway/index.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20261103084659_jr_partner_event_gateway.sql", "utf8");

test("partner integration member routes require a verified JR session and never cache credentials", () => {
  assert.match(server, /app\.get\("\/api\/jr\/integrations",rateLimit,sameOrigin/);
  assert.match(server, /app\.post\("\/api\/jr\/integrations",rateLimit,sameOrigin/);
  assert.match(server, /app\.get\("\/api\/jr\/integrations\/events",rateLimit,sameOrigin/);
  assert.match(server, /app\.delete\("\/api\/jr\/integrations\/:id",rateLimit,sameOrigin/);
  assert.match(server, /user\.email_confirmed_at/);
  assert.match(server, /Cache-Control","no-store"/);
});

test("partner credentials are generated once, hashed, scoped and member-owned", () => {
  assert.match(workspace, /action==="create_integration"/);
  assert.match(workspace, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(workspace, /token_hash:tokenHash/);
  assert.match(workspace, /scopes:\["events:write"\]/);
  assert.match(workspace, /action==="list_integrations"/);
  assert.match(workspace, /action==="revoke_integration"/);
  assert.match(workspace, /member_id=eq\."\+mid/);
  assert.match(workspace, /activeConnections\|\|\[\]\)\.length>=10/);
});

test("inbound partner gateway validates bearer credentials, limits payloads and only stores allowlisted events", () => {
  assert.match(server, /app\.post\("\/api\/inbound\/jr\/events",rateLimit/);
  assert.match(server, /Bearer\\s\+jr_live_/);
  assert.match(gateway, /jr_live_\[a-f0-9\]\{64\}/);
  assert.match(gateway, /\.eq\("token_hash", tokenHash\)/);
  assert.match(gateway, /\.includes\("events:write"\)/);
  assert.match(gateway, /count \|\| 0\) >= 60/);
  assert.match(gateway, /12_000/);
  assert.match(gateway, /365 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(gateway, /24 \* 60 \* 60 \* 1000/);
  assert.match(gateway, /allowedTypes\.has\(eventType\)/);
  assert.match(gateway, /allowedDataKeys\.has\(key\)/);
  assert.match(gateway, /23505/);
  assert.match(gateway, /No action was executed/);
  assert.match(migration, /unique \(connection_id, external_event_id\)/);
  assert.match(migration, /deny_client_jr_partner_connections/);
  assert.match(migration, /deny_client_jr_partner_events/);
});
