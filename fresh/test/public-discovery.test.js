"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"public/jr-public-discovery.css"),"utf8");
const js=fs.readFileSync(path.join(root,"public/jr-public-discovery.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"public/service-worker.js"),"utf8");
test("public discovery is the first-visit experience before account entry",()=>{
 const landing=html.indexOf('<section id="jr-public-discovery"');
 const auth=html.indexOf('<section id="auth">');
 assert.ok(landing>=0&&auth>landing);
 assert.match(html,/<title>JR PHEEF — Find\. Match\. Trade\.<\/title>/);
 assert.match(html,/jr-public-discovery\.css\?v=2/);
 assert.match(html,/jr-public-discovery\.js\?v=2/);
});
test("public world introductions cover DGBO, FAMILY, JR MOVE and JR LINK",()=>{
 for(const world of ["dgbo","family","move","link"])assert.match(html,new RegExp('data-world="'+world+'"'));
});
test("public entry calls the existing account views, not a replacement auth system",()=>{
 assert.match(html,/function showRegister\(\)/);
 assert.match(html,/function showLogin\(\)/);
 assert.match(js,/window\.showRegister\(\)/);
 assert.match(js,/window\.showLogin\(\)/);
 assert.match(html,/data-jpd-action="register"/);
 assert.match(html,/data-jpd-action="login"/);
});
test("discovery and authentication views are mutually exclusive and responsive",()=>{
 assert.match(css,/body\.jr-public-discovery-mode #auth\{display:none!important\}/);
 assert.match(css,/body\.jr-public-auth-mode #jr-public-discovery\{display:none!important\}/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(js,/MutationObserver/);
});
test("service worker refreshes cached public shell and claims new clients",()=>{
 assert.match(sw,/jr-shell-v22/);
 assert.match(sw,/self\.skipWaiting\(\)/);
 assert.match(sw,/self\.clients\.claim\(\)/);
});
