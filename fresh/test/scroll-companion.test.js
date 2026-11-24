"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
test("scroll companion offers non-creature and no-companion choices",()=>{
 const js=fs.readFileSync(path.join(root,"public/scroll-companion.js"),"utf8");
 for(const style of ["flow","spider","orb","butterfly","classic","off"])assert.match(js,new RegExp('"'+style+'"'));
});
test("scroll companion maps gestures to existing navigation controls",()=>{
 const js=fs.readFileSync(path.join(root,"public/scroll-companion.js"),"utf8");
 for(const id of ["jrPageForward","jrPageBack","jrPageBottom","jrPageTop"])assert.ok(js.includes(id));
});
test("active entrypoint loads companion assets after navigation",()=>{
 const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
 assert.ok(html.indexOf("/navigation.js")<html.indexOf("/scroll-companion.js"));
 assert.ok(html.includes("/scroll-companion.css"));
});
