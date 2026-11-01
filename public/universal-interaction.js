/* JR PHEEF — Universal Interaction Layer.
 * Adds contextual actions without hijacking native links, controls or keyboard behaviour.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const state={panel:null,target:null,timer:null,start:null};
const ignored="button,input,textarea,select,option,label,[contenteditable=true],[role=button],[role=menuitem],video,audio,iframe,nav,header,footer";
const clean=s=>String(s||"").replace(/\\s+/g," ").trim().slice(0,500);
function describe(target){
 const node=target?.closest?.("[data-jr-entity],[data-jr-actionable],img,h1,h2,h3,h4,p,li,blockquote,figcaption,article,a");
 if(!node||node.closest(ignored)||node.closest("#jrUniversalInteraction"))return null;
 const page=node.closest("#app .page");
 if(!page)return null;
 const image=node.matches("img")?node:node.querySelector?.("img");
 const link=node.matches("a[href]")?node:node.closest("a[href]");
 const explicit=node.getAttribute("data-jr-entity")||node.getAttribute("data-jr-actionable")||"";
 const label=clean(node.getAttribute("data-jr-label")||node.getAttribute("aria-label")||node.getAttribute("alt")||node.innerText||node.textContent||image?.alt||"");
 if(!label&&!image)return null;
 return {node,label:label||"Image",kind:node.getAttribute("data-jr-type")||(image?"image":link?"link":explicit?"entity":"content"),url:link?.href||"",workspace:page.id,imageAlt:image?.alt||""};
}
function selectedContext(){
 const selection=window.getSelection?.();
 const text=clean(selection?.toString());
 if(text.length<2)return null;
 const anchor=selection.anchorNode?.parentElement;
 const page=anchor?.closest?.("#app .page");
 if(!page)return null;
 return {node:anchor,label:text,kind:"selected text",url:"",workspace:page.id};
}
function ensurePanel(){
 if(state.panel)return state.panel;
 const panel=document.createElement("section");
 panel.id="jrUniversalInteraction";panel.className="jr-ui-panel";panel.hidden=true;
 panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","false");panel.setAttribute("aria-labelledby","jrUiTitle");
 const head=document.createElement("div");head.className="jr-ui-head";
 const title=document.createElement("h2");title.id="jrUiTitle";title.textContent="Explore with JR";
 const close=document.createElement("button");close.type="button";close.className="jr-ui-close";close.textContent="Close";close.setAttribute("aria-label","Close contextual actions");close.addEventListener("click",hide);
 head.append(title,close);
 const summary=document.createElement("p");summary.id="jrUiSummary";summary.className="jr-ui-summary";
 const note=document.createElement("p");note.id="jrUiNote";note.className="jr-ui-note";
 const actions=document.createElement("div");actions.className="jr-ui-actions";
 panel.append(head,summary,actions,note);
 document.body.append(panel);state.panel=panel;return panel;
}
function hide(){if(!state.panel)return;state.panel.hidden=true;state.target=null;}
function go(id){if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(id);else if(typeof window.show==="function")window.show(id);}
function ask(prompt){const field=$("aiQuestion");if(field)field.value=prompt;go("assistant");requestAnimationFrame(()=>{const f=$("aiQuestion");if(f)f.focus();});hide();}
function search(query){go("browser");requestAnimationFrame(()=>{const field=$("jpBrowserAddress"),form=$("jpBrowserForm");if(field&&form){field.value=query;form.requestSubmit();}});hide();}
function addAction(parent,label,fn,primary){const b=document.createElement("button");b.type="button";b.className=primary?"primary":"dark";b.textContent=label;b.addEventListener("click",fn);parent.append(b);}
function show(context){
 if(!context)return;
 const panel=ensurePanel();state.target=context;
 $("jrUiSummary").textContent=context.kind.toUpperCase()+" · "+(context.label||"Selected item");
 const note=$("jrUiNote");
 note.textContent=context.kind==="image"?"JR can use the image's available description or caption. Full visual understanding requires a supported image-analysis action; this menu does not claim to identify the picture.":"Choose what you want to do. Ordinary links and controls keep their normal behaviour.";
 const actions=panel.querySelector(".jr-ui-actions");actions.replaceChildren();
 addAction(actions,"ASK JR",()=>ask("Help me understand and work with this "+context.kind+": "+context.label),true);
 addAction(actions,"LEARN",()=>search("Learn about: "+context.label));
 addAction(actions,"EXPLORE",()=>search("Explore: "+context.label));
 addAction(actions,"CREATE",()=>ask("Help me create or develop this: "+context.label));
 addAction(actions,"CONNECT",()=>{go("connections");hide();});
 if(context.url)addAction(actions,"OPEN IN JR BROWSER",()=>search(context.url));
 panel.hidden=false;
 const close=panel.querySelector(".jr-ui-close");close.focus();
}
function onTap(event){
 const t=event.target;
 if(t.closest?.(ignored)||t.closest?.("#jrUniversalInteraction"))return;
 if(t.matches?.("img")){if(t.closest("a[href]"))return;show(describe(t));return;}
 const explicit=t.closest?.("[data-jr-entity],[data-jr-actionable]");
 if(explicit){show(describe(explicit));return;}
}
function eligible(t){return !!(t&&t.closest&&!t.closest(ignored)&&t.closest("#app .page")&&!t.closest("#jrUniversalInteraction"));}
function mount(){
 if($("jrUniversalInteraction"))return;
 ensurePanel();
 document.addEventListener("click",onTap,true);
 document.addEventListener("dblclick",e=>{if(!eligible(e.target))return;const c=selectedContext()||describe(e.target);if(c)show(c);});
 document.addEventListener("contextmenu",e=>{if(!eligible(e.target))return;const c=selectedContext()||describe(e.target);if(c){e.preventDefault();show(c);}});
 document.addEventListener("pointerdown",e=>{
  if(e.pointerType!=="touch"||!eligible(e.target))return;
  clearTimeout(state.timer);state.start={x:e.clientX,y:e.clientY,target:e.target};
  state.timer=setTimeout(()=>{const c=selectedContext()||describe(state.start?.target);if(c)show(c);},550);
 },{passive:true});
 document.addEventListener("pointermove",e=>{if(!state.start)return;if(Math.hypot(e.clientX-state.start.x,e.clientY-state.start.y)>12){clearTimeout(state.timer);state.start=null;}},{passive:true});
 ["pointerup","pointercancel"].forEach(type=>document.addEventListener(type,()=>{clearTimeout(state.timer);state.start=null;},{passive:true}));
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!state.panel?.hidden)hide();});
 document.addEventListener("selectionchange",()=>{const s=window.getSelection?.();if(!s||!s.toString().trim())return;});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
window.jrOpenContextActions=show;
})();