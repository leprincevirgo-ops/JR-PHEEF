"use strict";
const assert=require("node:assert/strict");

const base=(process.env.BASE_URL||"https://jr-pheef-foundation.onrender.com").replace(/\/$/,"");
const timeoutMs=20000;

async function get(path,options={}){
  const response=await fetch(base+path,{...options,signal:AbortSignal.timeout(timeoutMs),headers:{"user-agent":"JR-PHEEF-staging-smoke/1.0",...(options.headers||{})}});
  return response;
}

async function main(){
  const healthResponse=await get("/healthz");
  assert.equal(healthResponse.status,200,"staging health endpoint must return HTTP 200");
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.product,"JR PHEEF");
  assert.equal(health.stage,"foundation-auth");
  assert.equal(health.authConfigured,true,"Supabase authentication must be configured");
  assert.equal(health.paymentsEnabled,false,"payments must remain disabled in this staging test");

  const homeResponse=await get("/");
  assert.equal(homeResponse.status,200,"public gateway must load");
  const html=await homeResponse.text();
  for(const asset of ["quantum-math.js","quantum-simulator.js","quantum-grid.js"]){
    assert.ok(html.includes("/"+asset), "public workspace must reference "+asset);
  }

  for(const [path,marker] of [
    ["/quantum-math.js","JRQuantumMath"],
    ["/quantum-simulator.js","JRQuantumSimulator"],
    ["/quantum-grid.js","QuantumGrid"]
  ]){
    const response=await get(path);
    assert.equal(response.status,200,path+" must be served by staging");
    const source=await response.text();
    assert.ok(source.length>100,path+" must not be empty");
    assert.ok(source.includes(marker),path+" must expose its expected browser module");
  }

  const privateResponse=await get("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"list_worlds"})});
  assert.equal(privateResponse.status,401,"anonymous workspace access must remain protected");

  console.log("PASS: staging health, authentication configuration and payments-off gate");
  console.log("PASS: public gateway references all three quantum assets");
  console.log("PASS: quantum mathematics, simulator and Workbench assets load from live staging");
  console.log("PASS: private workspace rejects anonymous access");
  console.log("All JR PHEEF quantum staging smoke checks passed against "+base);
}

main().catch(error=>{console.error("JR PHEEF staging smoke failed: "+error.message);process.exitCode=1;});
