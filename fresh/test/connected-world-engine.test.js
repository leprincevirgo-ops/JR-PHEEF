"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("connected-world engine exposes attributed public feeds and integration directory",()=>{
 const s=read("server.js"),j=read("public/connected-world-engine.js"),h=read("public/index.html");
 assert.match(s,/\/api\/discovery\/feed/);assert.match(s,/AbortSignal\.timeout/);assert.match(s,/WORLD_FEEDS/);
 assert.match(j,/Signals from the wider world/);assert.match(j,/Integration gateway/);assert.match(j,/Khan Academy/);assert.match(j,/UNICEF Parenting/);
 assert.match(h,/connected-world-engine\.js/);assert.match(h,/connected-world-engine\.css/);
});
test("connected-world content labels integrations honestly and keeps finance disabled",()=>{
 const j=read("public/connected-world-engine.js");
 for(const label of ["Directory only","Not connected","Disabled","not live transport providers or active bookings"])assert.ok(j.includes(label),label);
});
