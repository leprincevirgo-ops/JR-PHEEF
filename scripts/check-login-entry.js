"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const html=fs.readFileSync("public/index.html","utf8");
const worker=fs.readFileSync("public/service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.match(html,/<button id="loginSubmit" class="primary" type="button">LOGIN<\/button>/,
  "login must have a stable, non-submit button target");
assert.doesNotMatch(html,/<button[^>]*onclick="login\(\)"/,
  "login must not depend on an inline onclick handler");
assert.match(html,/\$\("loginSubmit"\)\?\.addEventListener\("click",\(\)=>\{void login\(\);\}\)/,
  "login click listener must be explicitly bound");
assert.match(html,/\["loginIdentifier","loginPassword"\]\.forEach/,
  "Enter key must submit sign-in from either credential field");
assert.match(html,/button\.textContent="SIGNING IN…"/,
  "login must provide immediate visible feedback");
assert.match(html,/button\.removeAttribute\("aria-busy"\)/,
  "login must clear its busy state after completion");
assert.match(html,/id="loginMsg" role="status" aria-live="polite"/,
  "login status must be announced accessibly");
assert.match(html,/workspace-shell\.js\?v=command4/,
  "workspace shell URL must be cache-busted");
assert.match(worker,/const VERSION="jr-shell-v15"/,
  "service worker must activate a fresh cache generation");
assert.ok(pkg.scripts.test.includes("scripts/check-login-entry.js"),
  "focused login regression check must run in npm test");
console.log("PASS: explicit mobile sign-in click binding, keyboard activation, visible state, accessibility and PWA cache refresh.");
