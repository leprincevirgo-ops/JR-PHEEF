"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const html=fs.readFileSync("public/index.html","utf8");
const worker=fs.readFileSync("public/service-worker.js","utf8");
const install=fs.readFileSync("public/install-prompt.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const workspaceShell=fs.readFileSync("public/workspace-shell.js","utf8");
const mobileShell=fs.readFileSync("public/mobile-phone-shell.js","utf8");
const conversationEntry=fs.readFileSync("public/conversation-first-access.js","utf8");

// The entry shell must parse on older Android WebViews (Chrome 67-era).
assert.doesNotMatch(html, /\?\.|\?\?|\.replaceAll\(/,
  "entry HTML must not contain unsupported optional chaining, nullish coalescing or replaceAll syntax");
for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  const type=(match[0].match(/type=["']([^"']+)/i)||[])[1]||"text/javascript";
  if (/javascript|ecmascript/i.test(type)) new vm.Script(match[1], {filename:"inline JR PHEEF script"});
}
assert.doesNotMatch(workspaceShell+mobileShell+conversationEntry, /\?\.|\?\?|\.replaceAll\(/,
  "core mobile navigation must avoid syntax unsupported by older Android WebViews");
assert.match(html,/<button id="loginSubmit" class="primary" type="button">LOGIN<\/button>/,
  "login must have a stable, non-submit button target");
assert.doesNotMatch(html,/<button[^>]*onclick="login\(\)"/,
  "login must not depend on an inline onclick handler");
assert.match(html,/const loginSubmitButton=\$\("loginSubmit"\);[\s\S]*?loginSubmitButton\.addEventListener\("click"/,
  "login click listener must be explicitly bound");
assert.match(html,/\["loginIdentifier","loginPassword"\]\.forEach/,
  "Enter key must submit sign-in from either credential field");
assert.match(html,/button\.textContent="SIGNING IN…"/,
  "login must provide immediate visible feedback");
assert.match(html,/button\.removeAttribute\("aria-busy"\)/,
  "login must clear its busy state after completion");
assert.match(html,/id="loginMsg" role="status" aria-live="polite"/,
  "login status must be announced accessibly");
assert.match(html,/workspace-shell\.js\?v=command5/,
  "workspace shell URL must be cache-busted");
assert.match(html,/install-prompt\.js\?v=login-overlay2/,"login-safe install prompt must be cache-busted");
assert.match(install,/const authVisible=/,"install prompt must detect when the sign-in screen is visible");
assert.match(install,/authVisible\(\)\|\|banner/,"install prompt must not cover the sign-in screen");
assert.match(worker,/const VERSION="jr-shell-v17"/,
  "service worker must activate a fresh cache generation");
assert.ok(pkg.scripts.test.includes("scripts/check-login-entry.js"),
  "focused login regression check must run in npm test");
console.log("PASS: explicit mobile sign-in click binding, keyboard activation, visible state, accessibility and PWA cache refresh.");
