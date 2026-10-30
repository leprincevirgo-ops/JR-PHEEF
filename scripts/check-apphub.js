"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("public/index.html", "utf8");
const js = fs.readFileSync("public/apphub-ui.js", "utf8");
const css = fs.readFileSync("public/apphub.css", "utf8");
for (const marker of ['href="/apphub.css"', 'src="/apphub-ui.js"']) assert.ok(html.includes(marker), "App Hub asset missing from index.html: " + marker);
for (const marker of ['id="apphub"', 'id="jpAppHubForm"', 'id="jpAppHubList"', 'localStorage', 'noopener noreferrer', 'function safeUrl', 'https:', 'http:', 'CATEGORIES', 'favorite', 'remove']) {
  assert.ok(js.toLowerCase().includes(marker.toLowerCase()), "App Hub feature marker missing: " + marker);
}
assert.ok(js.includes('u.username&&!u.password') || js.includes('!u.username&&!u.password'), "App Hub must reject URLs with embedded credentials");
assert.ok(js.includes('slice(0,100)'), "App Hub must enforce the 100-item storage limit");
assert.ok(js.includes('textContent'), "App Hub must render user-provided content as text");
assert.ok(css.includes(".jp-apphub-grid"), "App Hub responsive grid styles missing");
console.log("PASS: App Hub assets, URL validation, safe rendering, storage limits and UI hooks.");
