const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("public/index.html", "utf8");
const path = require("node:path");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];

if (scripts.length === 0) {
  console.error("FAIL: no inline script found in public/index.html");
  process.exit(1);
}

let failures = 0;
scripts.forEach((match, index) => {
  try {
    new vm.Script(match[1], { filename: "public/index.html:inline-script-" + (index + 1) });
    console.log("PASS: inline script " + (index + 1) + " parses");
  } catch (error) {
    failures++;
    console.error("FAIL: inline script " + (index + 1) + ": " + error.message);
  }
});

const required = [
  'id="assistant"',
  'id="jpconnect"',
  'id="social"',
  'id="economy"',
  'id="vault"',
  'id="devices"',
  'id="voice"',
  'id="scifi"',
  'id="fixedit"',
  'function findFixedItServices()',
  'function fixedItConnectRequest(memberId)',
  'REPAIR SERVICES',
  'function buildSciFiBrief()',
  'function sendSciFiToAI()',
  'SPACE &amp; SATELLITE CONCEPTS',
  'async function askJRAI()',
  'id="family"',
  'id="referrals"',
];
for (const marker of required) {
  if (html.includes(marker)) console.log("PASS: expected feature marker " + marker);
  else { failures++; console.error("FAIL: missing feature marker " + marker); }
}
// Functions in external assets must be checked in the asset, not in HTML.
const requiredAssetMarkers = {
  "public/family-ui.js": [
    "window.createFamilyGoal",
    "window.submitFamilyRequest",
    "window.copyReferralInvite",
    "window.loadFamily",
    "/api/family/goals",
    "/api/family/applications"
  ]
};
for (const [file, markers] of Object.entries(requiredAssetMarkers)) {
  if (!fs.existsSync(file)) { failures++; console.error("FAIL: required feature asset missing " + file); continue; }
  const source = fs.readFileSync(file, "utf8");
  for (const marker of markers) {
    if (source.includes(marker)) console.log("PASS: asset marker " + file + " :: " + marker);
    else { failures++; console.error("FAIL: missing asset marker " + file + " :: " + marker); }
  }
}
// Every local JavaScript asset referenced by the page must exist and parse.
const assets = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js)(?:\?[^"']*)?["'][^>]*>/gi)]
  .map(m => m[1])
  .filter(src => src.startsWith("/") && !src.startsWith("//"));
for (const src of assets) {
  const file = path.join("public", src.replace(/^\/+/, ""));
  if (!fs.existsSync(file)) {
    failures++;
    console.error("FAIL: referenced frontend asset missing " + file);
    continue;
  }
  try {
    new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
    console.log("PASS: referenced frontend asset exists and parses " + file);
  } catch (error) {
    failures++;
    console.error("FAIL: frontend syntax " + file + ": " + error.message);
  }
}
if (failures) process.exit(1);
console.log("All inline-script, feature-marker, and referenced-asset checks passed.");
