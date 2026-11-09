"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const html=fs.readFileSync("fresh/public/index.html","utf8");
const css=fs.readFileSync("fresh/public/styles.css","utf8");
const js=fs.readFileSync("fresh/public/intelligence.js","utf8");
test("JR intelligence module is loaded after worlds",()=>{assert.match(html,/worlds\.js[^>]*defer><\/script><script src="\/intelligence\.js/);});
test("FAMILY financial intent is checked before personal family intent",()=>{const finance=js.indexOf('type:"family_finance"');const personal=js.indexOf('type:"family_personal"');assert.ok(finance>=0&&personal>finance);assert.match(js,/family coordination/);const personalRoute=js.slice(personal,js.indexOf("},",personal));assert.doesNotMatch(personalRoute,/keys:\["family"/);});
test("Family World and FAMILY World remain separate",()=>{assert.match(js,/family_personal/);assert.match(js,/family_finance/);assert.match(js,/Family World/);assert.match(js,/FAMILY World/);});
test("JR can locate existing worlds and proposes creation for missing worlds",()=>{assert.match(js,/list_worlds/);assert.match(js,/status==="active"/);assert.match(js,/not created automatically/);});
test("JR exposes external research separately from internal world lookup",()=>{assert.match(js,/Also search outside JR PHEEF/);assert.match(js,/wider web/);});
test("JR detects multiple intents in one request",()=>{assert.match(js,/function detectIntents/);assert.match(js,/routes\.filter/);assert.match(js,/intents\.map/);});
test("JR does not read cross-world records without permission",()=>{assert.match(js,/will not read records across worlds without your permission/);});
test("camera and gallery media selection previews locally without claiming upload",()=>{assert.match(js,/capture="environment"/);assert.match(js,/jrGalleryFiles/);assert.match(js,/Nothing has been uploaded or published/);});
test("media preview enforces count and size limits",()=>{assert.match(js,/slice\(0,8\)/);assert.match(js,/20\*1024\*1024/);});
test("JR intent module parses",()=>{assert.doesNotThrow(()=>new vm.Script(js));});
test("solid colour styling is replaced by layered atmospheric background",()=>{assert.match(css,/radial-gradient\(ellipse at 12% 12%/);assert.match(css,/backdrop-filter:blur/);assert.match(css,/prefers-reduced-motion/);});
test("communication centre has responsive inbox styling and keyboard focus",()=>{assert.match(css,/#memberChatsPanel \.hub-chat-layout/);assert.match(css,/focus-visible/);assert.match(css,/@media\(max-width:680px\)/);});

test("signed-in JR workspace includes its own usable prompt form",()=>{
 assert.match(html,/id="workspacePromptForm"/);
 assert.match(html,/id="workspacePrompt"/);
 assert.match(js,/workspacePromptForm/);
 assert.match(js,/workspacePromptReply/);
});
