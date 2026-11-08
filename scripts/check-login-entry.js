"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const html=fs.readFileSync("public/index.html","utf8");
const worker=fs.readFileSync("public/service-worker.js","utf8");
const install=fs.readFileSync("public/install-prompt.js","utf8");
const installCss=fs.readFileSync("public/install-prompt.css","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const workspaceShell=fs.readFileSync("public/workspace-shell.js","utf8");
const mobileShell=fs.readFileSync("public/mobile-phone-shell.js","utf8");
const founderCommand=fs.readFileSync("private/founder-command.js","utf8");
const conversationEntry=fs.readFileSync("public/conversation-first-access.js","utf8");
const frontendScripts=[
 "market-ui.js","messages-ui.js","extras-ui.js","ecosystem-ui.js","family-ui.js","family-bank-ui.js","jr-ui.js",
 "continuity-ui.js","jp-contacts-ui.js","jp-identity-ui.js","opportunities-ui.js","themes.js","explore-ui.js",
 "discover-ui.js","browser-ui.js","apphub-ui.js","preferences-sync.js","command-center.js","notifications-ui.js",
 "lab-ui.js","projects-ui.js","coordination-studio.js","workspace-shell.js","command-centre-social.js","open-ecosystem.js",
 "universal-interaction.js","human-environment-ui.js","jr-core.js","accessibility.js","universe-home.js","founder-loader.js",
 "device-bridge.js","mobile-phone-shell.js","jr-everywhere.js","screen-studio.js","immersive-world-home.js","conversation-first-access.js",
 "human-environment.js","intent-first-experience.js","pwa-register.js","install-prompt.js","natural-interaction.js","personal-command-centre.js"
];
for(const file of frontendScripts){
 const source=fs.readFileSync("public/"+file,"utf8");
 assert.doesNotMatch(source,/\?\.|\?\?/,"Unsupported modern syntax in "+file);
 new vm.Script(source,{filename:"public/"+file});
}
assert.match(html,/if\(!String\.prototype\.replaceAll\)/,"String.replaceAll compatibility helper missing");
assert.match(html,/if\(window\.Element&&!Element\.prototype\.replaceChildren\)/,"Element.replaceChildren compatibility helper missing");

assert.doesNotMatch(founderCommand, /\?\.|\?\?|\.replaceAll\(/, "Founder command must remain compatible with older Android WebViews");
new vm.Script(founderCommand,{filename:"private/founder-command.js"});
// The entry shell must parse on older Android WebViews (Chrome 67-era).
assert.doesNotMatch(html, /\?\.|\?\?|\.replaceAll\(/,
  "entry HTML must not contain unsupported optional chaining, nullish coalescing or replaceAll syntax");
for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  const type=(match[0].match(/type=["']([^"']+)/i)||[])[1]||"text/javascript";
  if (/javascript|ecmascript/i.test(type)) new vm.Script(match[1], {filename:"inline JR PHEEF script"});
}
// All shipped frontend scripts are parsed and checked against the Android 8 syntax baseline.
const authPosition=html.indexOf('<section id="auth">'),appPosition=html.indexOf("<main>");
assert.ok(authPosition>=0&&appPosition>authPosition,"sign-in must remain before the app shell in the document");
assert.match(html,/#auth:not\(\.hidden\)\{[\s\S]*?position:relative!important;[\s\S]*?pointer-events:auto!important/,"visible sign-in must stay in normal document flow and preserve native touch handling");
assert.doesNotMatch(html,/#auth:not\(\.hidden\)\{position:fixed!important/,"sign-in must not use a fixed full-screen overlay that can break native input focus");
assert.match(html,/body\.jr-auth-pending>main\{[\s\S]*?pointer-events:none!important\}/,"the app shell must not intercept touches while signed out");
assert.match(html,/if\(!session\|\|!session\.ok\|\|!session\.logged_in\|\|!session\.member\)\{[\s\S]*?document\.body\.classList\.add\("jr-auth-pending"\)/,"failed session restoration must restore the sign-in interaction state");
assert.match(html,/autocomplete="username"/,"login identifier must expose native username autofill");
assert.match(html,/autocomplete="current-password"/,"password must expose native password autofill");
assert.match(html,/<a id="jrOpenChrome" class="jr-open-external" href="https:\/\/jr-pheef-marketplace\.onrender\.com\/" target="_blank" rel="noopener noreferrer"/,"entry page must provide a separate-window escape link for in-app browsers");
assert.ok(html.includes("intent://jr-pheef-marketplace.onrender.com/")&&html.includes("package=com.android.chrome")&&html.includes("S.browser_fallback_url="),"Android users must have a direct Chrome launch with a safe browser fallback");
assert.match(html,/<a id="jrOpenChromeDirect" class="jr-open-external" href="intent:\/\/jr-pheef-marketplace\.onrender\.com\//,"Chrome launch must work as a native link without JavaScript click handling");
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
assert.match(html,/install-prompt\.js\?v=login-safe3/,"login-safe install prompt must be cache-busted");
assert.match(install,/const authVisible=/,"install prompt must detect when the sign-in screen is visible");
assert.match(install,/authVisible\(\)\|\|banner/,"install prompt must not cover the sign-in screen");
assert.match(install,/if\(!deferredPrompt\|\|standalone\(\)\|\|authVisible\(\)\|\|banner\|\|dismissed\(\)\)return/,"install banner must wait for a real browser installability event");
assert.match(installCss,/@media\(max-width:900px\)\{#jrInstallPrompt\{bottom:calc\(76px \+ env\(safe-area-inset-bottom\)\)!important;z-index:1100!important/,"mobile install banner must sit above, not over, the navigation dock");
assert.match(worker,/const VERSION="jr-shell-v21"/,
  "service worker must activate a fresh cache generation");
assert.ok(pkg.scripts.test.includes("scripts/check-login-entry.js"),
  "focused login regression check must run in npm test");
console.log("PASS: explicit mobile sign-in click binding, keyboard activation, visible state, accessibility and PWA cache refresh.");
