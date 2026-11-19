"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const js=fs.readFileSync("fresh/public/living-interface.js","utf8"),css=fs.readFileSync("fresh/public/living-interface.css","utf8"),html=fs.readFileSync("fresh/public/index.html","utf8");
test("living interface enhancement parses",()=>assert.doesNotThrow(()=>new vm.Script(js)));
test("space palette and three experience modes are available",()=>{for(const token of ["--jr-space:#07152e","--jr-violet:#813bff","--jr-cyan:#00d9e8"])assert.ok(css.includes(token));for(const mode of ["living","focus","professional"])assert.ok(js.includes(mode))});
test("mobile navigation preserves the four primary destinations",()=>{for(const view of ["home","worlds","jr","command"])assert.ok(html.includes('data-view="'+view+'"'));assert.match(css,/grid-template-columns:repeat\(4/)});
test("back and return-to-top controls are accessible",()=>{assert.ok(js.includes("Go back"));assert.ok(js.includes("Return to top"));assert.ok(css.includes(".jr-page-tools"))});
test("reduced-motion preference is respected",()=>assert.ok(css.includes("prefers-reduced-motion:reduce")));
