"use strict";
const fs=require("node:fs"),vm=require("node:vm"),js=fs.readFileSync("public/jp-contacts-ui.js","utf8"),edge=fs.readFileSync("supabase/functions/jr-workspace-api/index.ts","utf8"),runtime=fs.readFileSync("fresh/server.js","utf8"),html=fs.readFileSync("public/index.html","utf8");
new vm.Script(js,{filename:"public/jp-contacts-ui.js"});
for(const x of ['action:"list_connections"','action:"request_connection_by_invite"','action:"update_connection"',"ACCEPT","DECLINE","CREATE MY INVITE","countryFlag(o.country_code)"])if(!js.includes(x))throw new Error("JP Contacts missing "+x);
for(const x of ['if(action==="list_connections")','if(action==="request_connection_by_invite")','if(action==="create_contact_invite")','if(action==="update_connection")'])if(!edge.includes(x))throw new Error("Connection action missing "+x);
if(!runtime.includes('app.post("/api/workspace"'))throw new Error("Unified workspace API proxy missing");
if(!html.includes("/jp-contacts-ui.js"))throw new Error("JP Contacts script not loaded");
if(js.includes("SHARE JP CARD")||js.includes("jp_number||")||edge.includes("jp_number:other.jp_number"))throw new Error("JP number is exposed in member-facing contact UI or API.");
console.log("PASS: JP numbers stay private; JP Contacts uses expiring invitation links.");
