"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const js=fs.readFileSync("private/founder-command.js","utf8"),css=fs.readFileSync("public/founder-command.css","utf8"),html=fs.readFileSync("public/index.html","utf8");
for(const s of ["is_owner!==true","/api/me","PRIVATE FOUNDER ACCESS","Founder Command Structure","JR PHEEF","DGBO","FAMILY","Chief of Staff Agent","IP Research & Records Agent","Payments & Provider Liaison Agent","No agent may transfer ownership","ROLE DESIGNED · NOT CONNECTED"])assert.ok(js.includes(s),"Missing founder-control requirement: "+s);
assert.ok(css.includes("@media(max-width:580px)"),"Mobile layout missing");
assert.ok(html.includes("/founder-loader.js")&&html.includes("/founder-command.css"),"Owner-only founder loader or styles missing");
const server=fs.readFileSync("server.js","utf8");
assert.ok(server.includes("app.get(\"/founder-command.js\"")&&server.includes("path.join(__dirname, \"private\", \"founder-command.js\")")&&server.includes("String(value || \"\").toLowerCase() === \"owner\""),"Founder script must be server-gated to owners.");
console.log("Private founder command structure checks passed.");
