"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const server=fs.readFileSync("fresh/server.js","utf8");

test("production liveness remains independent of external providers",()=>{
  const start=server.indexOf('app.get("/healthz"');
  const end=server.indexOf('app.get("/readyz"',start);
  assert.ok(start>=0&&end>start,"liveness endpoint must exist before readiness diagnostics");
  const liveness=server.slice(start,end);
  assert.match(liveness,/res\.status\(200\)/);
  assert.doesNotMatch(liveness,/fetch\(|SUPABASE_URL\+|AbortSignal/);
});

test("readiness diagnostics verify identity and data API without exposing secrets",()=>{
  const start=server.indexOf('app.get("/readyz"');
  const end=server.indexOf('app.post("/api/auth/signup"',start);
  assert.ok(start>=0&&end>start,"readiness endpoint must be registered");
  const route=server.slice(start,end);
  assert.match(route,/\/auth\/v1\/health/);
  assert.match(route,/\/rest\/v1\//);
  assert.match(route,/AbortSignal\.timeout\(3500\)/);
  assert.match(route,/Promise\.allSettled/);
  assert.match(route,/identityOk&&dataApiOk/);
  assert.match(route,/res\.status\(ready\?200:503\)/);
  assert.match(route,/dependencies:\{identity:identityOk\?"available":"unavailable",dataApi:dataApiOk\?"available":"unavailable"\}/);
  assert.doesNotMatch(route,/access_token|service_role|SUPABASE_SECRET_KEY|SUPABASE_KEY\s*[,}]/);
});

test("readiness failures are diagnostic only and do not restart the app",()=>{
  const start=server.indexOf('app.get("/readyz"');
  const end=server.indexOf('app.post("/api/auth/signup"',start);
  const route=server.slice(start,end);
  assert.match(route,/return res\.status\(503\)/);
  assert.match(route,/catch|Promise\.allSettled/);
  assert.match(route,/body\?\.cancel\(\)/);
});
