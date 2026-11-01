"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const js=fs.readFileSync("public/founder-command.js","utf8"),css=fs.readFileSync("public/founder-command.css","utf8"),html=fs.readFileSync("public/index.html","utf8");
for(const s of ["is_owner!==true","/api/me","PRIVATE FOUNDER ACCESS","Founder Command Structure","JR PHEEF","DGBO","FAMILY","Chief of Staff Agent","IP Research & Records Agent","Payments & Provider Liaison Agent","No agent may transfer ownership","ROLE DESIGNED · NOT CONNECTED"])assert.ok(js.includes(s),"Missing founder-control requirement: "+s);
assert.ok(css.includes("@media(max-width:580px)"),"Mobile layout missing");
assert.ok(html.includes("/founder-command.js")&&html.includes("/founder-command.css"),"Founder command assets missing");
console.log("Private founder command structure checks passed.");
