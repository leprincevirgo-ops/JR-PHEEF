#!/usr/bin/env node
"use strict";

// Read-only release smoke checks. No accounts, listings, deals, or payments are created.
// Usage: BASE_URL=https://your-host.example npm run test:e2e

const assert = require("node:assert/strict");

const base = (process.env.BASE_URL || "https://jr-pheef-marketplace.onrender.com").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 45000);
const attempts = Number(process.env.SMOKE_ATTEMPTS || 2);

async function request(path) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(base + path, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "JR-PHEEF-release-smoke/2.0" }
      });
      if (response.status >= 500 && attempt < attempts) {
        await response.arrayBuffer().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("Request failed after retries");
}

async function expectProtected(path) {
  const response = await request(path);
  assert.equal(response.status, 401, path + " must reject unauthenticated access with HTTP 401; got " + response.status);
  const body = await response.json();
  assert.equal(body.ok, false, path + " should return an error payload");
}

async function main() {
  let failures = 0;
  let passed = 0;
  async function check(name, fn) {
    try {
      await fn();
      passed++;
      console.log("PASS " + name);
    } catch (error) {
      failures++;
      console.error("FAIL " + name + ": " + error.message);
    }
  }

  await check("homepage returns JR PHEEF HTML", async () => {
    const response = await request("/");
    assert.equal(response.status, 200, "expected HTTP 200, got " + response.status);
    assert.match(response.headers.get("content-type") || "", /text\/html/i);
    const html = await response.text();
    assert.match(html, /<title>\s*JR PHEEF\s*<\/title>/i, "page title missing");
    assert.match(html, /<html[\s>]/i, "HTML document root missing");
    assert.match(html, /id="auth"/i, "sign-in entry point missing");
    assert.match(html, /id="home"/i, "member home entry point missing");
    assert.match(html, /id="jpidentity"/i, "JP Identity workspace missing");
    assert.match(html, /JP IDENTITY/i, "JP Identity navigation missing");
    assert.match(html, /Cosmic Signature/i, "Cosmic Signature preview missing");
  });

  await check("health endpoint reports service identity and version", async () => {
    const response = await request("/health");
    assert.equal(response.status, 200, "expected HTTP 200, got " + response.status);
    const body = await response.json();
    assert.equal(body.ok, true, "health payload did not report ok=true");
    assert.equal(body.app, "JR PHEEF", "unexpected app identity");
    assert.ok(body.version, "version missing from health payload");
    assert.ok(["OFF", "ENABLED"].includes(body.daraja), "Daraja state missing");
    if (process.env.REQUIRE_PAYMENTS_OFF === "true") {
      assert.equal(body.daraja, "OFF", "release safety gate: M-Pesa must remain OFF until explicitly approved");
    }
  });

  for (const asset of [
    "/market-ui.js", "/extras-ui.js", "/ecosystem-ui.js",
    "/family-ui.js", "/family-bank-ui.js", "/jr-ui.js", "/continuity-ui.js",
    "/jp-identity.css", "/jp-identity-ui.js"
  ]) {
    await check("frontend asset loads: " + asset, async () => {
      const response = await request(asset);
      assert.equal(response.status, 200, "expected HTTP 200, got " + response.status);
      assert.match(response.headers.get("content-type") || "", /javascript|ecmascript|text\/plain|text\/css/i);
      const source = await response.text();
      assert.ok(source.length > 100, "asset is unexpectedly empty");
    });
  }

  // Session restoration is intentionally public: an anonymous browser must be
  // able to ask whether a session exists without being treated as logged in.
  await check("session restoration safely reports anonymous state", async () => {
    const response = await request("/api/me");
    assert.equal(response.status, 200, "expected HTTP 200 for session restoration");
    const body = await response.json();
    assert.equal(body.ok, true, "session restoration should succeed");
    assert.equal(body.logged_in, false, "anonymous session must not be logged in");
    assert.equal(Object.prototype.hasOwnProperty.call(body, "member"), false,
      "anonymous response must not expose member data");
  });

  for (const endpoint of [
    "/api/listings/mine",
    "/api/opportunities",
    "/api/opportunities/mine",
    "/api/deals",
    "/api/notifications",
    "/api/ecosystem",
    "/api/family/goals",
    "/api/family/bank",
    "/api/jr/settings",
    "/api/payments/status",
    "/api/continuity",
    "/api/business/workspaces",
    "/api/business/test-business-id/daily-plan"
  ]) {
    await check("private endpoint blocks anonymous access: " + endpoint, () => expectProtected(endpoint));
  }

  if (failures) {
    console.error("\n" + passed + " passed, " + failures + " failed against " + base);
    process.exitCode = 1;
    return;
  }
  console.log("\nAll " + passed + " read-only release smoke checks passed against " + base);
}

main().catch(error => {
  console.error("Smoke test could not complete: " + error.message);
  process.exitCode = 1;
});
