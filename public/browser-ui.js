(function(){
"use strict";
const $=id=>document.getElementById(id);
let history=[],index=-1;
function resolve(raw){
 const value=String(raw||"").trim();if(!value)return null;
 let candidate;
 if(/^https?:\/\//i.test(value))candidate=value;
 else if(/^(localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?([/?#].*)?$/i.test(value))candidate="https://"+value;
 else candidate="https://www.google.com/search?q="+encodeURIComponent(value);
 try{const u=new URL(candidate);if(!["http:","https:"].includes(u.protocol)||u.username||u.password) return null;return u.href;}catch{return null;}
}
function status(message){const n=$("jpBrowserStatus");if(n)n.textContent=message;}
function load(url,add=true){
 const frame=$("jpBrowserFrame"),address=$("jpBrowserAddress");if(!frame||!address)return;
 if(add){history=history.slice(0,index+1);history.push(url);index=history.length-1;}
 address.value=url;frame.src=url;status("Loading "+new URL(url).hostname+". Some sites block embedded viewing; use Open externally if needed.");buttons();
}
function buttons(){const b=$("jpBrowserBack"),f=$("jpBrowserForward");if(b)b.disabled=index<=0;if(f)f.disabled=index<0||index>=history.length-1;}
function mount(){
 const app=$("app"),home=$("home");if(!app||!home||$("browser"))return;
 const tile=document.createElement("button");tile.type="button";tile.className="jp-dash-tile";tile.innerHTML='<span class="jp-dash-icon" aria-hidden="true">◎</span><span><span class="jp-dash-title">JR PHEEF BROWSER</span><br><span class="jp-dash-sub">Search and open websites</span></span>';tile.addEventListener("click",()=>window.show&&window.show("browser"));home.querySelector(".jp-dashboard-grid")?.append(tile);
 const page=document.createElement("section");page.id="browser";page.className="page hidden";page.setAttribute("aria-label","JR PHEEF Browser");
 page.innerHTML='<div class="jp-section-head"><div><div class="jp-kicker">JR PHEEF · WEB TOOL</div><h2>JR PHEEF Browser</h2><p class="muted">Search the web or open a website. Many sites prevent embedded viewing; external opening is always available.</p></div></div><div class="card"><form class="jp-browser-toolbar" id="jpBrowserForm"><input id="jpBrowserAddress" type="text" inputmode="url" autocomplete="url" placeholder="Search or enter a website address" aria-label="Search or website address"><button class="primary" type="submit">GO</button><button class="dark" type="button" id="jpBrowserExternal">OPEN EXTERNALLY ↗</button></form><div class="jp-browser-controls"><button class="dark" type="button" id="jpBrowserBack" disabled>← Back</button><button class="dark" type="button" id="jpBrowserForward" disabled>Forward →</button><button class="dark" type="button" id="jpBrowserReload">↻ Reload</button><span id="jpBrowserStatus" class="jp-browser-status" aria-live="polite">Browser ready. Enter a website or search term.</span></div><iframe id="jpBrowserFrame" class="jp-browser-frame" title="JR PHEEF external website" sandbox="allow-forms allow-scripts allow-popups" referrerpolicy="no-referrer" loading="lazy"></iframe><p class="jp-browser-note">The embedded website is isolated in a sandbox. JR PHEEF does not read passwords or private content from external sites. Only HTTP and HTTPS addresses are supported. If a site blocks embedding, open it externally.</p></div>';
 app.append(page);
 $("jpBrowserForm").addEventListener("submit",e=>{e.preventDefault();const url=resolve($("jpBrowserAddress").value);if(!url){status("Enter a valid website or search term.");return;}load(url);});
 $("jpBrowserExternal").addEventListener("click",()=>{const url=resolve($("jpBrowserAddress").value);if(!url){status("Enter a valid website or search term.");return;}window.open(url,"_blank","noopener,noreferrer");});
 $("jpBrowserBack").addEventListener("click",()=>{if(index>0){index--;load(history[index],false);}});
 $("jpBrowserForward").addEventListener("click",()=>{if(index<history.length-1){index++;load(history[index],false);}});
 $("jpBrowserReload").addEventListener("click",()=>{const f=$("jpBrowserFrame");if(f.src)f.src=f.src;});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();