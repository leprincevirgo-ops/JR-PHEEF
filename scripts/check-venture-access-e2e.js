"use strict";
const assert = require("node:assert/strict");
const base = String(process.env.BASE_URL || "https://jr-pheef-rebuild-staging.onrender.com").replace(/\/$/, "");
async function check(path, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual"
  });
  assert.equal(response.status, 401, path + " must require an authenticated JR PHEEF session");
  const payload = await response.json().catch(() => ({}));
  assert.equal(payload.error, "LOGIN_REQUIRED", path + " should return the standard login-required response");
}
(async () => {
  const health = await fetch(base + "/health", { redirect: "manual" });
  assert.equal(health.status, 200, "staging health endpoint must respond");
  const info = await health.json();
  assert.equal(info.ok, true, "staging health must be healthy");
  await check("/api/ventures");
  await check("/api/ventures/dgbo/registration");
  await check("/api/my-venture-memberships");
  await check("/api/ventures/dgbo/apply", "POST", { role_key: "business_partner", application_data: { experience: "test" }, consent: true });
  await check("/api/founder/venture-memberships");
  console.log("PASS: venture access endpoints are mounted, staging is healthy, and all membership routes reject unauthenticated requests.");
})().catch(error => { console.error(error); process.exitCode = 1; });
