"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const html=fs.readFileSync("fresh/public/index.html","utf8");
const script=fs.readFileSync("fresh/public/worlds.js","utf8");
test("WORLDS is one interactive environment with Create and Enter choices",()=>{
 assert.match(html,/id="view-worlds"/);assert.match(html,/worlds\.js/);assert.match(script,/createWorldForm/);
 assert.match(script,/data-world-mode="enter"/);assert.match(script,/data-world-mode="create"/);
 assert.match(script,/Enter a World/);assert.match(script,/Create a World/);
 assert.doesNotMatch(html,/world-category-grid/);assert.doesNotMatch(script,/world-starter-section/);
});
test("world types are selected inside the single create flow",()=>{
 const types=["global","personal","family_personal","business","education","commerce","family_finance","creative","community"];
 for(const type of types)assert.match(html,new RegExp('option value="'+type+'"'));
 assert.match(script,/worldTemplates/);
});
test("Family World and FAMILY World use separate types and labels",()=>{
 assert.match(html,/value="family_personal"/);assert.match(html,/value="family_finance"/);
 assert.match(script,/family_personal/);assert.match(script,/family_finance/);
});
test("Family World and FAMILY World have distinct starter workflows",()=>{
 assert.match(script,/Family updates and announcements/);assert.match(script,/Financial education and saving guidance/);
 assert.match(script,/does not hold, move or invest money/);
});
test("WORLDS client module parses",()=>{assert.doesNotThrow(()=>new vm.Script(script));});
test("WORLDS connects list, create, read and status actions",()=>{
 for(const action of ["list_worlds","create_world","get_world","update_world"])assert.ok(script.includes('"'+action+'"'));
});
test("world entry and creation remain inside the same mode container",()=>{
 assert.match(script,/enterPanel\.append\(detail,listHeading/);assert.match(script,/createPanel\.append\(createSection\)/);
 assert.match(script,/setWorldMode\("enter"\)/);assert.match(script,/enterPanel\.append\(offerStudio\)/);
});
