"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..","public");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const manifest=fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8");
const worker=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const pwa=fs.readFileSync(path.join(root,"pwa.js"),"utf8");
test("JR PHEEF is installable as an application from the same public domain",()=>{
 const data=JSON.parse(manifest);
 assert.equal(data.name,"JR PHEEF");
 assert.doesNotMatch(data.name,/Find\. Match\. Trade\./i);
 assert.equal(data.start_url,"/");
 assert.equal(data.scope,"/");
 assert.equal(data.display,"standalone");
 assert.ok(data.icons.some(icon=>icon.src==="/jr-pheef-icon.svg"));
 assert.match(html,/<link rel="manifest" href="\/manifest\.webmanifest">/);
 assert.match(html,/id="installAppButton"/);
 assert.match(html,/pwa\.js\?v=jr-pwa-20261118-v1/);
});
test("the offline shell never caches private API, account or health responses",()=>{
 assert.match(worker,/url\.pathname\.startsWith\("\/api\/"\)/);
 assert.match(worker,/url\.pathname==="\/healthz"/);
 assert.match(worker,/request\.method!=="GET"/);
 assert.match(worker,/request\.mode==="navigate"/);
 assert.match(worker,/caches\.match\("\/"\)/);
 assert.match(worker,/self\.clients\.claim\(\)/);
});
test("install prompt and service worker code parse correctly",()=>{
 assert.doesNotThrow(()=>new vm.Script(worker,{filename:"service-worker.js"}));
 assert.doesNotThrow(()=>new vm.Script(pwa,{filename:"pwa.js"}));
 assert.match(pwa,/beforeinstallprompt/);
 assert.match(pwa,/appinstalled/);
});

test("the offline shell caches the exact current navigation and connected workspace assets",()=>{
 assert.match(worker,/CACHE_NAME="jr-pheef-shell-v13"/);
 assert.match(worker,/styles\.css\?v=jr-primary-top-navigation-20261125-v1/);
 assert.match(worker,/living-interface\.css\?v=jr-top-navigation-20261125-v1/);
 assert.match(worker,/founder-partner\.js\?v=founder-jr-20261124-v1/);
 assert.match(worker,/living-interface\.js\?v=20261119-space-living-v1/);
 assert.match(worker,/app\.js\?v=jr-primary-navigation-20261125-v2/);
 assert.match(worker,/navigation\.js\?v=jr-arrow-navigation-20261112-v6/);
 assert.match(worker,/agent-universe\.css\?v=6/);
 assert.match(worker,/agent-universe\.js\?v=8/);
});
