"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("fresh/public/index.html","utf8");
const css=fs.readFileSync("fresh/public/styles.css","utf8");
const app=fs.readFileSync("fresh/public/app.js","utf8");

test("the four canonical JR PHEEF destinations remain in the primary navigation",()=>{
  const nav=html.match(/<nav class="workspace-nav" aria-label="JR PHEEF navigation">([\s\S]*?)<\/nav>/);
  assert.ok(nav,"primary workspace navigation exists");
  for(const [label,view] of [["HOME","home"],["WORLDS","worlds"],["JR","jr"],["COMMAND CENTER","command"]]){
    assert.match(nav[1],new RegExp('data-view="'+view+'"[^>]*>'+label+'<'));
  }
});

test("mobile primary navigation stays fixed, visible and clear of page content",()=>{
  assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?#workspace \.workspace-nav\{[\s\S]*?position:fixed!important/);
  assert.match(css,/#workspace \.workspace-nav\{[\s\S]*?z-index:10010!important/);
  assert.match(css,/#workspace \.workspace-nav\{[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
  assert.match(css,/#workspace\{padding-bottom:calc\(120px \+ env\(safe-area-inset-bottom,0px\)\)!important\}/);
});

test("each primary navigation destination opens its matching workspace",()=>{
  assert.match(app,/document\.querySelectorAll\("\.workspace-tab"\)\.forEach\(button=>button\.addEventListener\("click",\(\)=>showWorkspace\(button\.dataset\.view\)\)\)/);
  assert.match(app,/document\.querySelectorAll\("\.workspace-tab"\)\.forEach\(button=>button\.classList\.toggle\("selected",button\.dataset\.view===view\)\)/);
});
