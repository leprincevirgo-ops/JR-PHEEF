const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("public/index.html", "utf8");
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
  'function buildSciFiBrief()',
  'function sendSciFiToAI()',
  'Space & Satellite Concepts',
  'async function askJRAI()'
];
for (const marker of required) {
  if (html.includes(marker)) console.log("PASS: expected feature marker " + marker);
  else { failures++; console.error("FAIL: missing feature marker " + marker); }
}
if (failures) process.exit(1);
console.log("All inline-script and feature-marker checks passed.");
