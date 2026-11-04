"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const portal = fs.readFileSync("public/developers/index.html", "utf8");
const spec = fs.readFileSync("public/openapi/jr-partner-events.yaml", "utf8");
const manifest = JSON.parse(fs.readFileSync("public/jr-pheef-capabilities.json", "utf8"));
const routes = fs.readFileSync("routes/human-environment.js", "utf8");
for (const route of ["/api/jr/integrations", "/api/jr/integrations/events", "/api/jr/integrations/:id", "/api/inbound/jr/events"]) {
  assert.ok(routes.includes(route), "Server implements " + route);
}
for (const route of ["/api/jr/integrations", "/api/jr/integrations/events", "/api/jr/integrations/{id}", "/api/inbound/jr/events"]) {
  assert.ok(spec.includes(route), "OpenAPI documents " + route);
}
for (const phrase of ["Create your secure connection", "Your connections", "Your event inbox", "Revoke access", "displayed once", "credentials:"same-origin""]) {
  assert.ok(portal.includes(phrase), "Portal includes " + phrase);
}
assert.equal(manifest.developer_portal, "/developers/");
assert.equal(manifest.api_spec, "/openapi/jr-partner-events.yaml");
assert.match(manifest.integration_status, /NOT ACTIVE/);
assert.match(routes, /requireMember\(req, res\)/);
assert.match(routes, /crypto\.createHash\("sha256"\)/);
assert.match(routes, /executed_action: false/);
assert.match(routes, /PARTNER_EVENT_TYPES/);
assert.match(routes, /SAFE_EVENT_FIELDS/);
console.log("JR Developer Gateway checks passed: route contract, scoped credential controls, member UI, inbox and truthful capability manifest.");
