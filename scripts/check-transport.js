"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const route=fs.readFileSync(require("node:path").join(__dirname,"..","routes","transport.js"),"utf8");
const ui=fs.readFileSync(require("node:path").join(__dirname,"..","public","transport-ui.js"),"utf8");
const server=fs.readFileSync(require("node:path").join(__dirname,"..","server.js"),"utf8");
new vm.Script(route,{filename:"routes/transport.js"});
new vm.Script(ui,{filename:"public/transport-ui.js"});
for(const endpoint of [
 "/api/transport/config","/api/transport/provider","/api/transport/provider",
 "/api/transport/vehicles","/api/transport/vehicles/:id/link-driver",
 "/api/transport/vehicle-access/:id/respond","/api/transport/fare-estimate",
 "/api/transport/book-from-quote","/api/transport/requests/mine",
 "/api/transport/admin/providers","/api/transport/admin/providers/:id"
]){
 if(!route.includes(endpoint))throw new Error("Missing transport endpoint: "+endpoint);
}
for(const required of ["Cheapest suitable","Fastest estimated","JR recommends","provider_estimated_earnings_ksh","pending_driver_consent","pending_review","live_provider_availability"]){
 if(!route.includes(required))throw new Error("Missing transport safety/pricing feature: "+required);
}
if(!server.includes('require("./routes/transport")(routeCtx)'))throw new Error("Transport route is not mounted.");
if(!ui.includes('OPEN TRANSPORT CENTRE')||!ui.includes("COMPARE JR FARES"))throw new Error("Transport user interface is not linked.");
console.log("PASS: transport route and browser UI parse; provider, consent, fare and request features are present.");
