"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("fresh/public/index.html","utf8");
const css=fs.readFileSync("fresh/public/styles.css","utf8");
const app=fs.readFileSync("fresh/public/app.js","utf8");
const worker=fs.readFileSync("fresh/public/service-worker.js","utf8");
test("JR PHEEF retains exactly four primary member destinations in the approved order",()=>{
 const tabs=[...html.matchAll(/class="workspace-tab(?: selected)?" data-view="(home|worlds|jr|command)"/g)].map(match=>match[1]);
 assert.deepEqual(tabs,["home","worlds","jr","command"]);
 assert.match(html,/<nav class="workspace-nav" aria-label="JR PHEEF navigation">/);
});
test("the four tabs stay fixed, tappable and safe-area aware on mobile",()=>{
 assert.match(css,/#workspace \.workspace-nav\s*\{[\s\S]*?position:fixed!important/);
 assert.match(css,/bottom:0!important/);
 assert.match(css,/z-index:10010!important/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
 assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
});
test("member sign-in opens the selected workspace and tab clicks change destinations",()=>{
 assert.match(app,/function showWorkspace\(view="home",options=\{\}\)/);
 assert.match(app,/document\.querySelectorAll\("\.workspace-tab"\)\.forEach\(button=>button\.addEventListener\("click",\(\)=>showWorkspace\(button\.dataset\.view\)\)\)/);
 assert.match(app,/showWorkspace\(requestedWorld\)/);
 assert.match(app,/workspace\.hidden=true/);
});
test("installed JR PHEEF shell caches every local stylesheet and script at its exact current URL",()=>{
 assert.match(worker,/const CACHE_NAME="jr-pheef-shell-v4"/);
 const refs=[...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(match=>match[1]).filter(ref=>/\.(?:css|js|webmanifest|svg)(?:\?|$)/.test(ref));
 for(const ref of new Set(refs))assert.ok(worker.includes('"'+ref+'"'),"Missing from app shell cache: "+ref);
 assert.match(worker,/url\.pathname\.startsWith\("\/api\/"\)/);
 assert.match(worker,/url\.pathname==="\/healthz"/);
});

test("WORLDS and JR have reloadable deep routes, and company worlds stay under WORLDS",()=>{
 assert.ok(app.includes('"/worlds":"worlds"'));
 assert.ok(app.includes('"/jr":"jr"'));
 assert.ok(app.includes('worlds:"/worlds"'));
 assert.ok(app.includes('jr:"/jr"'));
 assert.match(app,/\["dgbo","family","turbex"\]\.includes\(view\)\?"worlds":view/);
 assert.match(app,/button\.setAttribute\("aria-current","page"\)/);
 assert.match(html,/data-view="home" aria-current="page"/);
});
test("navigation history distinguishes company-world URLs and restores deep links",()=>{
 const navigation=fs.readFileSync("fresh/public/navigation.js","utf8");
 assert.match(navigation,/last\?\.url===state\.url/);
 assert.match(navigation,/history\.replaceState\(\{jrWorld:state\.view\}/);
 assert.match(navigation,/window\.dispatchEvent\(new Event\("popstate"\)\)/);
});
