#!/usr/bin/env node
"use strict";

// Public smoke checks for the deployed JR PHEEF service.
// Usage: BASE_URL=https://your-host.example npm run test:e2e
// This intentionally does not create accounts or mutate production data.

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
        headers: { "user-agent": "JR-PHEEF-smoke-test/1.0" }
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

async function main() {
  let failures = 0;
  async function check(name, fn) {
    try {
      await fn();
      console.log("PASS " + name);
    } catch (error) {
      failures++;
      console.error("FAIL " + name + ": " + error.message);
    }
  }

  await check("homepage returns HTML", async () => {
    const response = await request("/");
    assert.equal(response.status, 200, "expected HTTP 200, got " + response.status);
    const type = response.headers.get("content-type") || "";
    assert.match(type, /text\/html/i, "expected HTML content type, got " + type);
    const html = await response.text();
    assert.match(html, /<title>\s*JR PHEEF\s*<\/title>/i, "JR PHEEF page title missing");
    assert.match(html, /<html[\s>]/i, "HTML document root missing");
  });

  await check("health endpoint reports healthy service", async () => {
    const response = await request("/health");
    assert.equal(response.status, 200, "expected HTTP 200, got " + response.status);
    const body = await response.json();
    assert.equal(body.ok, true, "health payload did not report ok=true");
    assert.equal(body.app, "JR PHEEF", "unexpected app identity");
    assert.ok(body.version, "version missing from health payload");
  });

  if (failures) {
    console.error("\n" + failures + " smoke check(s) failed against " + base);
    process.exitCode = 1;
    return;
  }
  console.log("\nAll public smoke checks passed against " + base);
}

main().catch(error => {
  console.error("Smoke test could not complete: " + error.message);
  process.exitCode = 1;
});
