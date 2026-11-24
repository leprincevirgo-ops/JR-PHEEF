"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const root=path.join(__dirname,"../public");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const js=fs.readFileSync(path.join(root,"diamond-company-worlds.js"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const css=fs.readFileSync(path.join(root,"diamond-company-worlds.css"),"utf8");
const server=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");

test("DGBO and FAMILY immersive company environments are loaded by the foundation app",()=>{
 assert.match(html,/diamond-company-worlds\.css/);
 assert.match(html,/diamond-company-worlds\.js/);
 assert.match(js,/view-dgbo/);
 assert.match(js,/view-family/);
 assert.match(js,/data-diamond-nav/);
});

test("company environments provide separate internal navigation and contained scrolling",()=>{
 assert.match(js,/data-diamond-section/);
 assert.match(js,/scrollIntoView/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/overscroll-behavior:contain/);
 assert.match(css,/position:sticky/);
});

test("company relationship language preserves planned legal status",()=>{
 assert.match(js,/Planned group company/);
 assert.match(js,/Legal incorporation, ownership records and operating status must be updated only when formally completed/);
 assert.match(js,/FAMILY does not currently accept deposits/);
});

test("company images are restricted to the explicitly trusted image host",()=>{
 assert.match(js,/https:\/\/images\.unsplash\.com/);
 assert.match(server,/img-src 'self' data: blob: https:\/\/images\.unsplash\.com/);
});

test("company environment browser script passes Node syntax validation",()=>{
 const result=spawnSync(process.execPath,["--check",path.join(root,"diamond-company-worlds.js")],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr||result.stdout);
});

test("JR LINK scrolls within its own workspace and does not move the whole document on tab changes",()=>{
 const layout=fs.readFileSync(path.join(root,"command-layout.js"),"utf8");
 assert.match(layout,/connect\.scrollTo\(\{top:0/);
 assert.doesNotMatch(layout,/window\.scrollTo\(\{top:Math\.max\(0,y\)/);
 assert.match(css,/\.jr-connect-workspace\{[^}]*overflow-y:auto/s);
 assert.match(css,/\.jr-connect-tabs\{[^}]*position:sticky/s);
});

test("DGBO and FAMILY membership applications use authenticated server actions and explicit consent",()=>{
 assert.match(app,/window\.jrWorkspaceAction=async\(action,payload=\{\}\)/);
 assert.match(js,/data-venture-apply="dgbo"/);
 assert.match(js,/data-venture-apply="family"/);
 assert.match(js,/get_venture_registration/);
 assert.match(js,/apply_venture_membership/);
 assert.match(js,/consent:consent\.checked/);
 assert.match(js,/template\.notice/);
 assert.match(js,/refreshMemberships/);
 assert.match(js,/if\(event&&!event\.detail\)\{clearMemberships\(\);return;\}/);
 assert.match(css,/diamond-application-dialog/);
});
