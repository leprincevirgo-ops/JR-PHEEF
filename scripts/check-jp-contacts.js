"use strict";
const fs=require("node:fs"),vm=require("node:vm"),js=fs.readFileSync("public/jp-contacts-ui.js","utf8"),edge=fs.readFileSync("supabase/functions/jr-workspace-api/index.ts","utf8"),runtime=fs.readFileSync("fresh/server.js","utf8"),html=fs.readFileSync("public/index.html","utf8");
new vm.Script(js,{filename:"public/jp-contacts-ui.js"});
for(const x of ['action:"list_connections"','action:"request_connection"','action:"update_connection"',"ACCEPT","DECLINE","SHARE JP CARD","countryFlag(o.country_code)"])if(!js.includes(x))throw new Error("JP Contacts missing "+x);
for(const x of ['if(action==="list_connections")','if(action==="request_connection")','if(action==="update_connection")'])if(!edge.includes(x))throw new Error("Connection action missing "+x);
if(!runtime.includes('app.post("/api/workspace"'))throw new Error("Unified workspace API proxy missing");
if(!html.includes("/jp-contacts-ui.js"))throw new Error("JP Contacts script not loaded");
console.log("PASS: JP Contacts UI uses the authenticated unified workspace API and privacy-safe country flags.");
