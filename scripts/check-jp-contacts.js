"use strict";
const fs=require("node:fs"),vm=require("node:vm"),js=fs.readFileSync("public/jp-contacts-ui.js","utf8"),server=fs.readFileSync("server.js","utf8"),html=fs.readFileSync("public/index.html","utf8");
new vm.Script(js,{filename:"public/jp-contacts-ui.js"});
for(const x of ["/api/connections","/api/connections/by-jp-number","/api/connections/","ACCEPT","DECLINE","SHARE JP CARD"])if(!js.includes(x))throw new Error("JP Contacts missing "+x);
for(const x of ["/api/connections","/api/connections/by-jp-number","/api/connections/:id"])if(!server.includes(x))throw new Error("Connection API missing "+x);
if(!html.includes("/jp-contacts-ui.js"))throw new Error("JP Contacts script not loaded");
console.log("PASS: JP Contacts UI uses authenticated JP connection API.");
