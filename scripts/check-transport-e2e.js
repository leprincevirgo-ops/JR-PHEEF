"use strict";
const assert=require("node:assert/strict");
const base=(process.env.BASE_URL||"https://jr-pheef-rebuild-staging.onrender.com").replace(/\/$/,"");
async function get(path,options){return fetch(base+path,{redirect:"follow",...options});}
async function main(){
 const health=await get("/health");assert.equal(health.status,200,"staging health must be HTTP 200");const h=await health.json();assert.equal(h.ok,true);
 const home=await get("/");assert.equal(home.status,200);const html=await home.text();assert.match(html,/transport-ui\.js/i);assert.match(html,/id="home"/i);
 const asset=await get("/transport-ui.js");assert.equal(asset.status,200);assert.match(await asset.text(),/JR Smart Fare Intelligence/);
 const config=await get("/api/transport/config");assert.equal(config.status,200);const c=await config.json();assert.equal(c.ok,true);assert.equal(c.pricing.payments_enabled,false);assert.equal(c.pricing.live_maps,false);
 for(const path of ["/api/transport/provider","/api/transport/documents","/api/transport/requests/mine","/api/transport/admin/providers","/api/transport/admin/documents"]){
  const response=await get(path);assert.equal(response.status,401,path+" must reject anonymous access");
 }
 const quote=await get("/api/transport/fare-estimate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({service_kind:"passenger",pickup:"CBD",destination:"Westlands",distance_km:5,duration_minutes:15})});
 assert.equal(quote.status,401,"fare estimation must require a signed-in requester");
 console.log("PASS: staging health, transport UI/config, anonymous access controls and disabled live integrations.");
}
main().catch(e=>{console.error("FAIL transport staging smoke:",e.message);process.exitCode=1;});
