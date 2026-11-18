"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const js=fs.readFileSync("public/mobile-phone-shell.js","utf8");
const css=fs.readFileSync("public/mobile-phone-shell.css","utf8");
const html=fs.readFileSync("public/index.html","utf8");
for(const token of ["jpMobileDock","morehub","workhub","command","jr-accessibility-launcher","jr:workspacechange"])assert(js.includes(token),"mobile shell missing "+token);
for(const token of ["jp-mobile-dock","jp-global-search","jp-action-rail","env(safe-area-inset-bottom)","max-width:900px","touch-action:manipulation"])assert(css.includes(token),"mobile styles missing "+token);
assert(html.includes("/mobile-phone-shell.css"),"mobile shell stylesheet not linked");
assert(html.includes("/mobile-phone-shell.js"),"mobile shell script not linked");
assert(html.includes("jp-primary-nav"),"existing desktop navigation remains");
assert.match(js,/document\.body\.append\(dock\)/,"mobile dock must mount outside app stacking contexts");
assert.doesNotMatch(js,/app\.append\(dock\)/,"mobile dock must not mount inside #app");

// Execute the real shell in a tiny DOM harness; do not settle for source-text checks.
class FakeElement{
  constructor(tag){
    this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.attributes={};this.dataset={};this.style={};this.listeners={};this.textContent="";
    this._classNames=new Set();
    this.classList={
      toggle:(name,force)=>{const next=typeof force==="boolean"?force:!this._classNames.has(name);if(next)this._classNames.add(name);else this._classNames.delete(name);return next;},
      contains:name=>this._classNames.has(name)
    };
  }
  set className(value){this._classNames=new Set(String(value||"").split(/\s+/).filter(Boolean));}
  get className(){return Array.from(this._classNames).join(" ");}
  append(...nodes){for(const node of nodes){this.children.push(node);node.parentNode=this;}}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return Object.prototype.hasOwnProperty.call(this.attributes,name)?this.attributes[name]:null;}
  removeAttribute(name){delete this.attributes[name];}
  addEventListener(name,fn){(this.listeners[name]||(this.listeners[name]=[])).push(fn);}
  querySelectorAll(selector){
    const out=[];
    const visit=node=>{for(const child of node.children){if(selector==="[data-mobile-destination]"&&child.dataset.mobileDestination)out.push(child);visit(child);}};
    visit(this);return out;
  }
}
const body=new FakeElement("body"),app=new FakeElement("main"),header=new FakeElement("header"),actions=new FakeElement("div");
app.id="app";header.className="jp-global-header";actions.className="jp-header-actions";body.append(header,actions,app);
const document={
  readyState:"complete",body,_listeners:{},
  createElement:tag=>new FakeElement(tag),
  getElementById(id){
    let found=null;
    const walk=node=>{if(node.id===id)found=node;for(const child of node.children)if(!found)walk(child);};
    walk(body);return found;
  },
  querySelector(selector){if(selector===".jp-global-header")return header;if(selector===".jp-header-actions")return actions;return null;},
  addEventListener(name,fn){(this._listeners[name]||(this._listeners[name]=[])).push(fn);}
};
let navigated=null;
const window={matchMedia:()=>({matches:true}),addEventListener(){},jrWorkspaceNavigate:id=>{navigated=id;}};
vm.runInNewContext(js,{document,window,Set,String});
const dock=document.getElementById("jpMobileDock");
assert.ok(dock,"mobile dock must be created");
assert.equal(dock.parentNode,body,"mobile dock must be a direct child of document.body");
assert.ok(!app.children.includes(dock),"mobile dock must not be trapped inside #app");
assert.equal(dock.style.pointerEvents,"auto","dock must receive pointer input");
assert.equal(dock.style.touchAction,"manipulation","dock must allow native touch interaction");
const buttons=dock.querySelectorAll("[data-mobile-destination]");
assert.equal(buttons.length,4,"all four primary mobile destinations must render");
const worlds=buttons.find(button=>button.dataset.mobileDestination==="worlds");
worlds.listeners.click[0]();
assert.equal(navigated,"worlds","tapping Worlds must invoke JR workspace navigation");
document._listeners["jr:workspacechange"][0]({detail:{id:"projects"}});
assert.ok(worlds.classList.contains("is-active"),"workspace changes must update the active mobile destination");
console.log("PASS: mobile shell mounts outside #app, receives pointer/touch input, navigates on tap and tracks active workspaces.");
