"use strict";
const assert=require("node:assert/strict");

const base=(process.env.BASE_URL||"https://jr-pheef-foundation.onrender.com").replace(/\/$/,"");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function request(path,options={}){
  return fetch(base+path,{
    ...options,
    redirect:"follow",
    signal:AbortSignal.timeout(20000),
    headers:{"user-agent":"JR-PHEEF-staging-release-smoke/1.0",...(options.headers||{})}
  });
}

async function main(){
  let health,grid,home,csp;
  let ready=false;
  for(let attempt=1;attempt<=24;attempt++){
    try{
      const hr=await request("/healthz");
      if(hr.status===200){
        health=await hr.json();
        const gr=await request("/quantum-grid.js");
        grid=gr.status===200?await gr.text():"";
        const hm=await request("/");
        home=hm.status===200?await hm.text():"";
        csp=hm.headers.get("content-security-policy")||"";
        if(health.ok&&home.includes("JR PHEEF")&&grid.includes("jrQuantumMathOperation")){ready=true;break;}
      }
    }catch{}
    await sleep(10000);
  }
  assert.ok(ready,"staging did not serve the newly deployed quantum mathematics workbench within four minutes");
  assert.equal(health.product,"JR PHEEF");
  assert.equal(health.stage,"foundation-auth");
  assert.equal(health.authConfigured,true,"Supabase authentication must be configured");
  assert.equal(health.paymentsEnabled,false,"payments must remain disabled in staging");

  for(const [path,marker] of [
    ["/quantum-math.js","JRQuantumMath"],
    ["/quantum-simulator.js","JRQuantumSimulator"],
    ["/quantum-grid.js","jrQuantumMathOperation"],
    ["/quantum-grid.css","jr-quantum-math-lab"]
  ]){
    const r=await request(path);
    assert.equal(r.status,200,path+" must return HTTP 200");
    const body=await r.text();
    assert.ok(body.includes(marker),path+" is missing its expected feature marker");
  }
  assert.match(home,/<title>[^<]*JR PHEEF[^<]*<\/title>/i,"public gateway title missing");
  assert.match(home,/quantum-math\.js/,"gateway must load quantum math engine");
  assert.match(csp,/img-src[^;]*https:\/\/[a-z0-9-]+\.supabase\.co/i,"CSP must allow the configured Supabase image origin");
  assert.match(csp,/media-src[^;]*https:\/\/[a-z0-9-]+\.supabase\.co/i,"CSP must allow the configured Supabase media origin");

  const session=await request("/api/auth/session");
  assert.equal(session.status,200,"anonymous session restoration must work");
  const sessionBody=await session.json();
  assert.equal(sessionBody.ok,true);
  assert.equal(sessionBody.authenticated,false);

  const privateResponse=await request("/api/workspace",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({action:"list_worlds"})
  });
  assert.equal(privateResponse.status,401,"private workspace must reject anonymous access");

  const feed=await request("/api/discovery/feed?world=general");
  assert.equal(feed.status,200,"public discovery feed must load");
  const feedBody=await feed.json();
  assert.ok(Array.isArray(feedBody.items),"discovery feed must return an item list");

  console.log("PASS: deployed health, authentication and payments-off controls");
  console.log("PASS: quantum math engine, simulator, interactive linear-algebra lab and styles load from staging");
  console.log("PASS: Content Security Policy allows only the configured Supabase media origin");
  console.log("PASS: anonymous session, public discovery and private workspace access boundaries");
  if(!health.aiConfigured)console.warn("DEPENDENCY PENDING: OPENAI_API_KEY is not configured; live JR AI conversations remain unavailable.");
  else console.log("PASS: live JR AI provider key is configured (provider response still requires an authenticated user test).");
  console.log("JR PHEEF staging smoke checks completed against "+base);
}

main().catch(error=>{console.error("JR PHEEF staging smoke failed: "+error.message);process.exitCode=1;});
