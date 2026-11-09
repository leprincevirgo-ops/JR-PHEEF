"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const html=fs.readFileSync("public/index.html","utf8");
const source=fs.readFileSync("public/entry-interactions.js","utf8");
new vm.Script(source,{filename:"public/entry-interactions.js"});
assert.match(html,/entry-interactions\.js\?v=2/,"reliable entry interaction layer must load before app modules");
for(const action of ["continue","login","register","create-account","back-to-login"]){
 assert.match(html,new RegExp('data-jr-entry-action="'+action+'"'),"missing entry action: "+action);
}
assert.match(source,/document\.addEventListener\("click"[\s\S]*?\},true\)/,"entry actions must use document-level capture delegation");
assert.match(source,/invoke\("login"/,"login action must call the existing authenticated login flow");
assert.match(source,/invoke\("register"/,"account creation must call the existing registration flow");
assert.match(source,/focusField\("loginIdentifier"\)/,"continue action must focus the actual sign-in field");
assert.match(source,/event\.stopImmediatePropagation/,"entry handler must prevent duplicate legacy handlers");
assert.match(source,/addEventListener\("keydown"/,"mobile keyboard Enter activation must be supported");
console.log("PASS: mobile entry actions are delegated, keyboard accessible and reuse existing JR PHEEF authentication APIs.");
