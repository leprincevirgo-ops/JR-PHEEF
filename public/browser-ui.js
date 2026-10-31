(function(){
"use strict";
const $=id=>document.getElementById(id);
let history=[],index=-1;
function parseAddress(raw){
 const value=String(raw||"").trim();if(!value)return {kind:"empty"};
 let candidate=value;
 if(/^(localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?([/?#].*)?$/i.test(value)&&!/^https?:\/\//i.test(value))candidate="https://"+value;
 try{
  const u=new URL(candidate);
  if(!["http:","https:"].includes(u.protocol)||u.username||u.password)return {kind:"invalid"};
  return {kind:"url",url:u.href};
 }catch{return {kind:"search",query:value};}
}
function status(message){const n=$("jpBrowserStatus");if(n)n.textContent=message;}
function buttons(){const b=$("jpBrowserBack"),f=$("jpBrowserForward");if(b)b.disabled=index<=0;if(f)f.disabled=index<0||index>=history.length-1;}
function load(url,add=true){
 const frame=$("jpBrowserFrame"),address=$("jpBrowserAddress"),options=$("jpBrowserSearchOptions");
 if(!frame||!address)return;
 if(add){history=history.slice(0,index+1);history.push(url);index=history.length-1;}
 address.value=url;frame.hidden=false;if(options)options.hidden=true;frame.src=url;
 status("Opening "+new URL(url).hostname+". If the website blocks embedded viewing, choose Open externally.");
 buttons();
}
function showSearch(query){
 const frame=$("jpBrowserFrame"),options=$("jpBrowserSearchOptions");
 if(frame){frame.hidden=true;frame.removeAttribute("src");}
 if(options)options.hidden=false;
 const q=$("jpBrowserQuery");if(q)q.textContent=query;
 const web=$("jpBrowserWebSearch");if(web)web.onclick=()=>load("https://www.bing.com/search?q="+encodeURIComponent(query));
 const internal=$("jpBrowserJrSearch");if(internal)internal.onclick=()=>{
  if(typeof window.show==="function")window.show("find");
  const input=$("searchQ");if(input){input.value=query;if(typeof window.searchListings==="function")window.searchListings();}
 };
 status("Choose where to search. JR PHEEF does not silently send your search to an external search engine.");
}
function navigate(raw){
 const parsed=parseAddress(raw);
 if(parsed.kind==="url"){load(parsed.url);return;}
 if(parsed.kind==="search"){showSearch(parsed.query);return;}
 status(parsed.kind==="empty"?"Enter a website address or something you want to find.":"That address is not supported. Use a normal HTTP or HTTPS website.");
}
function mount(){
 const app=$("app"),home=$("home");if(!app||!home||$("browser"))return;
 const tile=document.createElement("button");tile.type="button";tile.className="jp-dash-tile";
 tile.innerHTML='<span class="jp-dash-icon" aria-hidden="true">◎</span><span><span class="jp-dash-title">JR PHEEF BROWSER</span><br><span class="jp-dash-sub">Explore the web from one connected space</span></span>';
 tile.addEventListener("click",()=>window.show&&window.show("browser"));home.querySelector(".jp-dashboard-grid")?.append(tile);
 const page=document.createElement("section");page.id="browser";page.className="page hidden";page.setAttribute("aria-label","JR PHEEF Browser");
 page.innerHTML='<div class="jp-section-head"><div><div class="jp-kicker">JR PHEEF · UNIVERSAL BROWSER</div><h2>Your window to the web</h2><p class="muted">Search within JR PHEEF, explore the wider web, or enter a website address. You choose where your search goes.</p></div></div><div class="card"><form class="jp-browser-toolbar" id="jpBrowserForm"><input id="jpBrowserAddress" type="text" inputmode="url" autocomplete="url" placeholder="What are you looking for? Or enter a website…" aria-label="Search or website address"><button class="primary" type="submit">GO</button><button class="dark" type="button" id="jpBrowserExternal">OPEN EXTERNALLY ↗</button></form><div class="jp-browser-controls"><button class="dark" type="button" id="jpBrowserBack" disabled>← Back</button><button class="dark" type="button" id="jpBrowserForward" disabled>Forward →</button><button class="dark" type="button" id="jpBrowserReload">↻ Reload</button><span id="jpBrowserStatus" class="jp-browser-status" aria-live="polite">JR PHEEF Browser ready. Search or enter a website address.</span></div><div id="jpBrowserSearchOptions" class="jp-browser-search-options" hidden><div class="jp-browser-search-card"><span class="jp-kicker">YOUR SEARCH</span><h3 id="jpBrowserQuery"></h3><p class="muted">Choose how JR PHEEF should help you find it.</p><button class="primary" type="button" id="jpBrowserJrSearch">SEARCH JR PHEEF</button><button class="dark" type="button" id="jpBrowserWebSearch">SEARCH THE WEB</button></div></div><iframe id="jpBrowserFrame" class="jp-browser-frame" title="JR PHEEF external website" sandbox="allow-forms allow-scripts allow-popups" referrerpolicy="no-referrer" loading="lazy" hidden></iframe><p class="jp-browser-note">External websites may block embedded viewing. Open externally is available when needed. JR PHEEF does not read passwords or private content from other websites.</p></div>';
 app.append(page);
 $("jpBrowserForm").addEventListener("submit",e=>{e.preventDefault();navigate($("jpBrowserAddress").value);});
 $("jpBrowserExternal").addEventListener("click",()=>{const p=parseAddress($("jpBrowserAddress").value);if(p.kind==="url")window.open(p.url,"_blank","noopener,noreferrer");else if(p.kind==="search")window.open("https://www.bing.com/search?q="+encodeURIComponent(p.query),"_blank","noopener,noreferrer");else status("Enter a website or search term first.");});
 $("jpBrowserBack").addEventListener("click",()=>{if(index>0){index--;load(history[index],false);}});
 $("jpBrowserForward").addEventListener("click",()=>{if(index<history.length-1){index++;load(history[index],false);}});
 $("jpBrowserReload").addEventListener("click",()=>{const f=$("jpBrowserFrame");if(f&&!f.hidden&&f.src)f.src=f.src;});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();