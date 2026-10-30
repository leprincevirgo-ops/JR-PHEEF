#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const source = fs.readFileSync("public/themes.js", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
for (const id of ["jrpreferences", "jrprivacy", "jrhelp"]) {
  assert.ok(source.includes('id:"' + id + '"'), "settings destination missing: " + id);
  assert.ok(source.includes('"' + id + '"'), "settings route registry missing: " + id);
}
for (const key of ["jr-pheef-app-hub-v1", "jr-pheef-discover-saved-v1", "jr-pheef-visual-settings-v1"]) {
  assert.ok(source.includes(key), "local data control missing for " + key);
}
assert.ok(source.includes("indexedDB.deleteDatabase"), "custom wallpaper local data clear is missing");
assert.ok(source.includes("publicly retrievable media URL"), "profile photo privacy disclosure is missing");
assert.ok(source.includes("Account-level data requests require a verified support process"), "account deletion/export limitation must be disclosed");
assert.ok(html.includes('/themes.js'), "settings module must be loaded by the application");
console.log("JR PHEEF Settings checks passed.");
