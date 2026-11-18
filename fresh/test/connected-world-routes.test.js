"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const root=path.join(__dirname,"../public");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const server=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
test("each connected world has a stable shareable route",()=>{
 for(const [route,world] of [["/worlds/dgbo","dgbo"],["/worlds/family","family"],["/worlds/jr-move","turbex"],["/worlds/jr-link","command"]]){
  assert.ok(app.includes('"'+route+'":"'+world+'"'),route+" must resolve to "+world);
 }
});
test("deep links preserve the requested world through sign-in and browser history",()=>{
 assert.match(app,/showWorkspace\(requestedWorld\)/);
 assert.match(app,/window\.addEventListener\("popstate"/);
 assert.match(app,/options\.fromRoute/);
});
test("JR LINK deep link opens the communication feed tab",()=>{
 assert.match(app,/requestedLink&&requestedWorld==="command"/);
 assert.match(app,/data-connect-tab="feed"/);
});
test("world routes use the existing single-page application fallback",()=>{
 assert.match(server,/express\.static\(path\.join\(__dirname,"public"\)/);
 assert.match(server,/res\.sendFile\(path\.join\(__dirname,"public","index\.html"\)\)/);
});
test("route-enabled app script passes syntax validation",()=>{
 const result=spawnSync(process.execPath,["--check",path.join(root,"app.js")],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr||result.stdout);
});
test("transport script contains no malformed unused image URL",()=>{
 const js=fs.readFileSync(path.join(root,"transport-world.js"),"utf8");
 assert.doesNotMatch(js,/photo- delivery/);
 const result=spawnSync(process.execPath,["--check",path.join(root,"transport-world.js")],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr||result.stdout);
});
