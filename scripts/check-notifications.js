"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const js=fs.readFileSync("public/notifications-ui.js","utf8"),css=fs.readFileSync("public/notifications.css","utf8"),html=fs.readFileSync("public/index.html","utf8");
for(const x of ["/api/notifications","/api/notifications/read-all","jrNotificationsReady","speechSynthesis","jr-pheef-voice-notifications-v1","credentials:\"include\"","MARK ALL READ"])assert.ok(js.includes(x),"missing notification feature "+x);
assert.ok(js.includes("textContent")&&js.includes("createElement"),"notifications must render safely");
assert.ok(css.includes(".jp-notification-panel")&&css.includes("@media(max-width:620px)"),"notification panel must be responsive");
assert.ok(html.includes("/notifications-ui.js")&&html.includes("/notifications.css"),"notification assets not loaded");
console.log("JR PHEEF notification centre checks passed.");
