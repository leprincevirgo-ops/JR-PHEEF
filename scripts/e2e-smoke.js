#!/usr/bin/env node
"use strict";

// Read-only release smoke checks. No accounts, listings, deals, or payments are created.
// Usage: BASE_URL=https://your-host.example npm run test:e2e

const assert = require("node:assert/strict");

const base = (process.env.BASE_URL || "https://jr-pheef-marketplace.onrender.com").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 45000);
const attempts = Number(process.env.SMOKE_ATTEMPTS || 2);

async function request(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(base + path, {
        ...options,
        method: options.method || "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { ...(options.headers || {}), "user-agent": "JR-PHEEF-release-smoke/2.0" }
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


async function freshSmoke(health) {
  let failures=0,passed=0;
  async function check(name,fn){
    try{await fn();passed++;console.log("PASS "+name);}
    catch(error){failures++;console.error("FAIL "+name+": "+error.message);}
  }
  await check("fresh foundation health and product identity",async()=>{
    assert.equal(health.ok,true);assert.equal(health.product,"JR PHEEF");assert.equal(health.stage,"foundation-auth");assert.equal(health.paymentsEnabled,false);
  });
  await check("authentication provider is configured",async()=>assert.equal(health.authConfigured,true,"Supabase auth is not configured"));
  await check("live JR AI provider is configured",async()=>assert.equal(health.aiConfigured,true,"OPENAI_API_KEY is not configured; live JR conversation is unavailable"));
  await check("JR public gateway loads",async()=>{
    const r=await request("/");assert.equal(r.status,200);assert.match(r.headers.get("content-type")||"",/text\/html/i);
    const h=await r.text();assert.match(h,/<title>[^<]*JR PHEEF[^<]*<\/title>/i);assert.match(h,/id="startWithJr"/);assert.match(h,/id="openSignup"/);assert.doesNotMatch(h,/Find\. Match\. Trade\./i);
  });
  await check("anonymous session restoration is safe",async()=>{
    const r=await request("/api/auth/session");assert.equal(r.status,200);const d=await r.json();assert.equal(d.ok,true);assert.equal(d.authenticated,false);
  });
  for(const asset of ["/styles.css","/cosmic.css","/app.js","/pwa.js","/living-interface.js","/public-discovery.js","/command-layout.js","/worlds.js","/intelligence.js","/navigation.js","/voice.js","/business.js","/diamond-company-worlds.css","/transport-world.css","/connected-world-engine.css"]){
    await check("frontend asset loads: "+asset,async()=>{const r=await request(asset);assert.equal(r.status,200);assert.ok((await r.text()).length>100);});
  }
  for(const route of ["/guide","/learn","/jr-pheef","/app","/jr-move"]){
    await check("public route loads: "+route,async()=>{const r=await request(route);assert.equal(r.status,200);assert.match(r.headers.get("content-type")||"",/text\/html/i);});
  }
  for(const world of ["general","transport"]){
    await check("public discovery feed loads: "+world,async()=>{const r=await request("/api/discovery/feed?world="+world);assert.equal(r.status,200);const d=await r.json();assert.ok(Array.isArray(d.items));});
  }
  await check("private workspace rejects anonymous writes",async()=>{
    const r=await request("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"list_worlds"})});assert.equal(r.status,401);
  });
  await check("founder overview rejects anonymous access",async()=>{const r=await request("/api/founder/overview");assert.equal(r.status,401);});
  await check("partner enquiry rejects anonymous access",async()=>{
    const r=await request("/api/partner-inquiry",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subject:"Smoke test"})});assert.equal(r.status,401);
  });
  await check("JR AI endpoint rejects anonymous access",async()=>{
    const r=await request("/api/ai/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:"smoke test"})});assert.equal(r.status,401);
  });
  await check("PWA install manifest and service worker are available",async()=>{
    const r=await request("/manifest.webmanifest");assert.equal(r.status,200);const d=await r.json();assert.equal(d.name,"JR PHEEF");assert.equal(d.display,"standalone");
    const sw=await request("/service-worker.js");assert.equal(sw.status,200);assert.match(await sw.text(),/jr-pheef/i);
  });
  if(failures){console.error("\n"+passed+" passed, "+failures+" failed against "+base);process.exitCode=1;return;}
  console.log("\nAll "+passed+" fresh JR PHEEF read-only release checks passed against "+base);
}

async function main() {
  const probe=await request("/healthz").catch(()=>null);
  if(probe&&probe.ok){const health=await probe.json().catch(()=>null);if(health&&health.stage==="foundation-auth"){await freshSmoke(health);return;}}
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
    assert.match(html, /href="\/themes\.css"/i, "Appearance Studio stylesheet is not linked");
    assert.match(html, /src="\/themes\.js"/i, "Appearance Studio script is not linked");
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
    "/command-centre-social.js", "/command-centre-social.css", "/messages-ui.js",
    "/jp-contacts-ui.js", "/jp-contacts-ui.css",
    "/family-ui.js", "/family-bank-ui.js", "/jr-ui.js", "/continuity-ui.js",
    "/jp-identity.css", "/jp-identity-ui.js", "/themes.css", "/themes.js",
    "/explore.css", "/explore-ui.js",
    "/discover.css", "/discover-ui.js",
    "/browser.css", "/browser-ui.js",
    "/apphub.css", "/apphub-ui.js",
    ...(process.env.REQUIRE_OPPORTUNITY_FEATURE === "true" ? ["/opportunities-ui.js"] : [])
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
  await check("private founder command script is hidden from anonymous users", async () => {
    const response = await request("/founder-command.js");
    assert.equal(response.status, 404, "founder command source must remain hidden from anonymous sessions");
  });

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
    "/api/connections",
    "/api/messages/conversations", "/api/messages/status",
    ...(process.env.REQUIRE_OPPORTUNITY_FEATURE === "true" ? ["/api/opportunities", "/api/opportunities/mine"] : []),
    "/api/deals",
    "/api/notifications",
    "/api/ecosystem",
    "/api/family/goals",
    "/api/family/bank",
    "/api/jr/settings",
    "/api/payments/status",
    "/api/continuity",
    "/api/business/workspaces",
    "/api/business/test-business-id/daily-plan",
    "/api/admin/overview",
    "/api/jr/environment", "/api/jr/environment/memories",
    ...(process.env.REQUIRE_PARTNER_GATEWAY === "true" ? ["/api/jr/integrations", "/api/jr/integrations/events"] : [])
  ]) {
    await check("private endpoint blocks anonymous access: " + endpoint, () => expectProtected(endpoint));
  }

  if (process.env.REQUIRE_PARTNER_GATEWAY === "true") {
    await check("partner event gateway rejects missing bearer credentials", async () => {
      const response = await request("/api/inbound/jr/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event_type: "other", title: "Smoke test", summary: "No credential should be rejected.", external_event_id: "smoke-no-token-001" }) });
      assert.equal(response.status, 401, "partner event gateway must reject missing credentials");
      const body = await response.json();
      assert.equal(body.ok, false);
    });
  
  
  }

  await check("JR command rejects anonymous POST requests", async () => {
    const response = await request("/api/jr/command", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "smoke test" }) });
    assert.equal(response.status, 401, "JR command must reject anonymous requests");
  });
  await check("JP-number connection endpoint rejects anonymous POST requests", async () => {
    const response = await request("/api/connections/by-jp-number", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jp_number: "JP-123456" }) });
    assert.equal(response.status, 401, "connection request must reject anonymous requests");
  });

  await check("PWA manifest and offline shell are available", async () => {
    const manifest = await request("/manifest.webmanifest");
    assert.equal(manifest.status, 200);
    const body = await manifest.json();
    assert.equal(body.name, "JR PHEEF");
    assert.equal(body.display, "standalone");
    const worker = await request("/service-worker.js");
    assert.equal(worker.status, 200);
    assert.match(await worker.text(), /jr-shell-v\d+/);
    const offline = await request("/offline.html");
    assert.equal(offline.status, 200);
    assert.match(await offline.text(), /temporarily offline/i);
  });

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
