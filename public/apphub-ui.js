(function(){
"use strict";
const KEY="jr-pheef-app-hub-v1";
const CATEGORIES=["Social & Communication","Business & Finance","Entertainment & Streaming","Education & Research","Shopping","Photography & Creativity","Productivity","Travel & Navigation","Development Tools","Health & Fitness","Security","Other"];
const $=id=>document.getElementById(id);
let apps=[];
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");apps=Array.isArray(v)?v.filter(x=>x&&typeof x.name==="string"&&x.name.trim()&&typeof x.url==="string"&&safeUrl(x.url)&&CATEGORIES.includes(x.category)).slice(0,100).map(x=>({...x,url:safeUrl(x.url),name:x.name.trim().slice(0,60),favorite:x.favorite===true})):[]}catch(e){apps=[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(apps));return true}catch(e){return false}}
function safeUrl(raw){try{const u=new URL(String(raw||"").trim());return (u.protocol==="https:"||u.protocol==="http:")&&!u.username&&!u.password?u.href:null}catch(e){return null}}
function node(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function mount(){
 const app=$("app"),home=$("home");if(!app||!home||$("apphub"))return;
 const tile=node("button","jp-dash-tile");tile.type="button";tile.append(node("span","jp-dash-icon","▦"));const title=node("span");title.append(node("span","jp-dash-title","JR PHEEF APP HUB"),document.createElement("br"),node("span","jp-dash-sub","Organise and open your other apps"));tile.append(title);tile.addEventListener("click",()=>window.show&&window.show("apphub"));home.querySelector(".jp-dashboard-grid")?.append(tile);
 const page=node("section","page hidden");page.id="apphub";page.setAttribute("aria-label","JR PHEEF App Hub");
 const head=node("div","jp-section-head");const intro=node("div");intro.append(node("div","jp-kicker","JR PHEEF · YOUR APPLICATIONS"),node("h2","","App Hub"),node("p","muted","Organise the web apps and services you already use. Shortcuts open the original service; they do not imply an integration."));head.append(intro);page.append(head);
 const form=node("form","card jp-apphub-form");form.id="jpAppHubForm";form.append(node("h3","","Add an application"));
 const name=document.createElement("input");name.id="jpAppName";name.required=true;name.maxLength=60;name.placeholder="Application name";name.setAttribute("aria-label","Application name");
 const url=document.createElement("input");url.id="jpAppUrl";url.required=true;url.type="url";url.placeholder="https://example.com";url.setAttribute("aria-label","Application website");
 const cat=document.createElement("select");cat.id="jpAppCategory";cat.setAttribute("aria-label","Application category");CATEGORIES.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;cat.append(o)});
 const add=node("button","primary","ADD TO MY APP HUB");add.type="submit";form.append(name,url,cat,add);
 const tools=node("div","card jp-apphub-tools");const search=document.createElement("input");search.id="jpAppSearch";search.type="search";search.placeholder="Find an app in your library";search.setAttribute("aria-label","Search your applications");const filter=document.createElement("select");filter.id="jpAppFilter";filter.setAttribute("aria-label","Filter applications");["All categories",...CATEGORIES].forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;filter.append(o)});tools.append(search,filter);
 const status=node("p","muted");status.id="jpAppHubStatus";status.setAttribute("aria-live","polite");const list=node("div","jp-apphub-grid");list.id="jpAppHubList";page.append(form,tools,status,list);
 const note=node("p","muted","Your App Hub list is currently saved in this browser only. Cross-device sync and native Android/desktop app launching are not enabled in this web release.");note.id="jpAppHubNote";page.append(note);app.append(page);
 form.addEventListener("submit",e=>{e.preventDefault();const n=name.value.trim(),u=safeUrl(url.value);if(!n||!u){status.textContent="Enter an application name and a valid HTTP or HTTPS website address.";return}if(apps.length>=100){status.textContent="Your App Hub has reached its 100-application limit.";return}const id=window.crypto&&typeof window.crypto.randomUUID==="function"?window.crypto.randomUUID():String(Date.now())+"-"+Math.random().toString(36).slice(2);apps.push({id,name:n,url:u,category:cat.value,favorite:false,createdAt:new Date().toISOString()});if(!save()){apps.pop();status.textContent="This browser could not save the application. Check available local storage.";return}name.value="";url.value="";status.textContent="Application added to your App Hub.";render()});
 search.addEventListener("input",render);filter.addEventListener("change",render);read();render();
}
function render(){
 const host=$("jpAppHubList");if(!host)return;host.replaceChildren();
 const q=($("jpAppSearch")?.value||"").trim().toLowerCase(),c=$("jpAppFilter")?.value||"All categories";
 const shown=apps.filter(a=>(c==="All categories"||a.category===c)&&(!q||(a.name+" "+a.category+" "+a.url).toLowerCase().includes(q))).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name));
 if(!shown.length){host.append(node("div","card jp-apphub-empty",apps.length?"No applications match this search. Add or select another category.":"Your App Hub is empty. Add a website or web application above to get started."));return}
 shown.forEach(a=>{
  const card=node("article","card jp-apphub-card"),top=node("div","jp-apphub-card-top"),mark=node("span","jp-apphub-mark",a.name.slice(0,1).toUpperCase());top.append(mark);
  const meta=node("div","jp-apphub-meta");meta.append(node("strong","",a.name),node("span","muted",a.category),node("span","jp-apphub-url",new URL(a.url).hostname));top.append(meta);card.append(top);
  const actions=node("div","jp-apphub-actions"),open=node("a","primary","OPEN APP ↗");open.href=a.url;open.target="_blank";open.rel="noopener noreferrer";open.setAttribute("aria-label","Open "+a.name+" in a new tab");actions.append(open);
  const fav=node("button","dark",a.favorite?"★ SAVED":"☆ FAVOURITE");fav.type="button";fav.addEventListener("click",()=>{a.favorite=!a.favorite;save();render()});
  const edit=node("button","dark","EDIT");edit.type="button";edit.addEventListener("click",()=>{const n=prompt("Application name",a.name);if(n===null)return;const u=prompt("Application website (HTTP or HTTPS)",a.url);if(u===null)return;const valid=safeUrl(u);if(!n.trim()||!valid){$("jpAppHubStatus").textContent="No change made. Enter a name and valid HTTP/HTTPS address.";return}a.name=n.trim().slice(0,60);a.url=valid;save();render()});
  const del=node("button","dark","REMOVE");del.type="button";del.addEventListener("click",()=>{if(!confirm("Remove "+a.name+" from your App Hub? This does not uninstall or delete the original application."))return;apps=apps.filter(x=>x.id!==a.id);save();render()});
  actions.append(fav,edit,del);card.append(actions);host.append(card);
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
