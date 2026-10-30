(function(){
"use strict";
const MODULES=[
 ["home","Home dashboard","Your personal JR PHEEF starting point","⌂"],
 ["ecosystem","DGBO ecosystem","Governance, ventures and ecosystem coordination","◈"],
 ["find","Discover & marketplace","Search listings, products, services and opportunities","⌕"],
 ["discover","Universal Discover","Explore subjects, categories, web, images, video and places","✧"],
 ["explore","Explore","Visual discovery and inspiration","◎"],
 ["apphub","App Hub","Organise and open your other apps","▦"],
 ["browser","JR PHEEF Browser","Search the web and open websites","↗"],
 ["create","Create listing","Publish a product, service or offer","＋"],
 ["opportunities","Opportunities","Find, post and coordinate opportunities","◇"],
 ["messages","Messages","Private and group conversations","✉"],
 ["jpconnect","JP Connect","Find and connect with JP identities","⌁"],
 ["social","Social","Community posts and connections","◉"],
 ["assistant","AI assistant","Research, plan and coordinate with AI","✦"],
 ["projects","Projects","Organise work, tasks and milestones","▤"],
 ["family","Family","Private family coordination space","⌂"],
 ["vault","My files","Your documents and stored files","▣"],
 ["library","Library","Knowledge and learning resources","▧"],
 ["lab","Lab & research","Experiments, research and ideas","⚗"],
 ["command","Command centre","Ecosystem oversight and operations","⌘"],
 ["themes","Appearance studio","Themes, wallpapers and display preferences","🎨"],
 ["jrsettings","Settings","Account, privacy, preferences and help","⚙"]
];
const APP_KEY="jr-pheef-app-hub-v1";
const $=id=>document.getElementById(id);
let overlay,input,list,status,results=[],active=-1;
function safeUrl(raw){try{const u=new URL(String(raw||""));return ["http:","https:"].includes(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function readApps(){try{const a=JSON.parse(localStorage.getItem(APP_KEY)||"[]");return Array.isArray(a)?a.filter(x=>x&&typeof x.name==="string"&&safeUrl(x.url)&&x.favorite===true).slice(0,100):[]}catch{return []}}
function openModule(id){close();if(typeof window.show==="function")window.show(id);else{const p=$(id);if(p){document.querySelectorAll("#app .page").forEach(x=>x.classList.add("hidden"));p.classList.remove("hidden")}}}
function openApp(url){const safe=safeUrl(url);if(!safe)return;close();window.open(safe,"_blank","noopener,noreferrer")}
function mount(){
 const app=$("app"),header=document.querySelector("body > header"),nav=app?.querySelector(".nav");
 if(!app||!header||!nav||$("jpCommandPalette"))return;
 const headerActions=el("div","jp-command-header-actions");
 const search=el("button","jp-command-open","⌕  SEARCH JR PHEEF");search.type="button";search.setAttribute("aria-haspopup","dialog");search.setAttribute("aria-controls","jpCommandPalette");search.addEventListener("click",open);
 headerActions.append(search);
 const settings=el("button","jp-command-settings","⚙");settings.type="button";settings.title="Settings";settings.setAttribute("aria-label","Open Settings");settings.addEventListener("click",()=>openModule("jrsettings"));headerActions.append(settings);header.append(headerActions);
 const quick=el("div","jp-quick-launch");quick.setAttribute("aria-label","Quick launch");
 [["discover","DISCOVER"],["apphub","APP HUB"],["browser","BROWSER"],["explore","EXPLORE"],["messages","MESSAGES"],["projects","PROJECTS"]].forEach(([id,label])=>{const b=el("button","",label);b.type="button";b.addEventListener("click",()=>openModule(id));quick.append(b)});
 nav.insertAdjacentElement("afterend",quick);
 overlay=el("div","jp-command-overlay");overlay.id="jpCommandPalette";overlay.hidden=true;
 const dialog=el("section","jp-command-dialog");dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-labelledby","jpCommandTitle");
 const top=el("div","jp-command-top");const title=el("div","");title.append(el("div","jp-kicker","JR PHEEF · UNIVERSAL LAUNCHER"),el("h2","","What would you like to do?"));title.id="jpCommandTitle";const esc=el("button","jp-command-close","ESC");esc.type="button";esc.addEventListener("click",close);top.append(title,esc);
 input=el("input","jp-command-input");input.type="search";input.placeholder="Search any JR PHEEF module or your favourite apps…";input.setAttribute("aria-label","Search JR PHEEF modules and favourite apps");input.setAttribute("autocomplete","off");
 status=el("p","jp-command-hint","Type to search · ↑ ↓ to navigate · Enter to open · Esc to close · Ctrl/⌘ K to launch");
 list=el("div","jp-command-results");list.id="jpCommandResults";list.setAttribute("role","listbox");input.setAttribute("aria-controls",list.id);
 dialog.append(top,input,status,list);overlay.append(dialog);document.body.append(overlay);
 input.addEventListener("input",()=>render(input.value));input.addEventListener("keydown",onKeys);
 overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
 document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open();}if(e.key==="Escape"&&!overlay.hidden)close();});
 render("");
}
function open(){if(!overlay)return;overlay.hidden=false;input.value="";render("");setTimeout(()=>input.focus(),0)}
function close(){if(!overlay)return;overlay.hidden=true;active=-1}
function render(query){
 const q=String(query||"").trim().toLowerCase();results=[];
 const moduleMatches=MODULES.filter(x=>!q||(x[1]+" "+x[2]+" "+x[0]).toLowerCase().includes(q)).map(x=>({kind:"module",id:x[0],title:x[1],detail:x[2],icon:x[3]}));
 const appMatches=readApps().filter(x=>!q||(x.name+" "+x.category+" "+x.url).toLowerCase().includes(q)).map(x=>({kind:"app",url:x.url,title:x.name,detail:x.category+" · Favourite app",icon:"↗"}));
 results=[...moduleMatches,...appMatches].slice(0,30);active=results.length?0:-1;list.replaceChildren();
 if(!results.length){list.append(el("p","jp-command-empty","No matching module or favourite app. Try another search, or add a shortcut in App Hub."));status.textContent="No results";return}
 results.forEach((item,i)=>{const b=el("button","jp-command-result"+(i===active?" is-active":""));b.type="button";b.setAttribute("role","option");b.setAttribute("aria-selected",String(i===active));b.append(el("span","jp-command-result-icon",item.icon),el("span","jp-command-result-copy",item.title),el("span","jp-command-result-detail",item.detail));b.addEventListener("click",()=>activate(i));b.addEventListener("mouseenter",()=>setActive(i));list.append(b)});
 status.textContent=results.length+" destinations · "+moduleMatches.length+" JR PHEEF modules · "+appMatches.length+" favourite apps";
}
function setActive(i){active=i;[...list.children].forEach((n,k)=>{n.classList.toggle("is-active",k===i);n.setAttribute("aria-selected",String(k===i))})}
function activate(i){const item=results[i];if(!item)return;item.kind==="module"?openModule(item.id):openApp(item.url)}
function onKeys(e){if(e.key==="ArrowDown"){e.preventDefault();if(results.length)setActive((active+1)%results.length)}else if(e.key==="ArrowUp"){e.preventDefault();if(results.length)setActive((active-1+results.length)%results.length)}else if(e.key==="Enter"){e.preventDefault();activate(active)}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
