(function(){
"use strict";
const app=document.getElementById("app");
if(!app||document.getElementById("jrBrowserPage"))return;
const nav=app.querySelector(".nav");
if(!nav)return;
const page=document.createElement("section");
page.id="jrBrowserPage";page.className="page hidden";
page.innerHTML=`
 <div class="jr-browser-heading"><div><p class="jp-kicker">JR PHEEF · EXPLORE THE WEB</p><h1>JR PHEEF Browser</h1><p class="muted">Search for information or open a website. Some websites block embedded viewing; use Open externally when needed.</p></div></div>
 <div class="card jr-browser-card">
  <form id="jrBrowserForm" class="jr-browser-toolbar">
   <input id="jrBrowserAddress" type="text" inputmode="url" autocomplete="url" placeholder="Search the web or enter a website address" aria-label="Search or website address" maxlength="2048">
   <button class="primary" type="submit">GO</button>
   <button class="dark" type="button" id="jrBrowserExternal">OPEN EXTERNALLY ↗</button>
  </form>
  <div class="jr-browser-controls">
   <button class="dark" type="button" id="jrBrowserBack" aria-label="Browser back" title="Back">‹</button>
   <button class="dark" type="button" id="jrBrowserForward" aria-label="Browser forward" title="Forward">›</button>
   <button class="dark" type="button" id="jrBrowserReload" aria-label="Reload" title="Reload">↻</button>
   <span id="jrBrowserStatus" class="muted" role="status" aria-live="polite">Ready. Enter a search or website address.</span>
  </div>
  <iframe id="jrBrowserFrame" class="jr-browser-frame" title="JR PHEEF Browser content" referrerpolicy="no-referrer" sandbox="allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>
  <p class="jr-browser-note">Security: JR PHEEF does not inspect passwords or private website content. Embedded pages run in a restricted frame. Websites that disallow embedding must be opened in a separate browser tab. Browser history is kept only for this page session.</p>
 </div>`;
app.appendChild(page);
const navButton=document.createElement("button");
navButton.type="button";navButton.textContent="BROWSER";navButton.setAttribute("aria-label","Open JR PHEEF Browser");
navButton.addEventListener("click",()=>window.show("jrBrowserPage"));
nav.appendChild(navButton);
const $=id=>document.getElementById(id);
const visits=[];let visitIndex=-1;
function resolve(raw){
 const value=String(raw||"").trim();if(!value)return "";
 if(/^https?:\/\//i.test(value)){const u=new URL(value);if(!["http:","https:"].includes(u.protocol))throw new Error("Only HTTP and HTTPS addresses are supported.");return u.href;}
 if(/^[\w.-]+\.[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(value)){const u=new URL("https://"+value);return u.href;}
 return "https://html.duckduckgo.com/html/?q="+encodeURIComponent(value);
}
function buttons(){
 $("jrBrowserBack").disabled=visitIndex<=0;
 $("jrBrowserForward").disabled=visitIndex<0||visitIndex>=visits.length-1;
}
function navigate(url,record){
 if(!url)return;
 try{
  const safe=resolve(url);const parsed=new URL(safe);
  if(!["http:","https:"].includes(parsed.protocol))throw new Error("Unsupported address scheme.");
  if(record){visits.splice(visitIndex+1);visits.push(safe);visitIndex=visits.length-1;}
  $("jrBrowserAddress").value=safe;
  $("jrBrowserFrame").src=safe;
  $("jrBrowserStatus").textContent="Loading "+parsed.hostname+". If the site blocks embedding, choose Open externally.";
  buttons();
 }catch(error){$("jrBrowserStatus").textContent=error.message||"That address could not be opened.";}
}
$("jrBrowserForm").addEventListener("submit",event=>{event.preventDefault();navigate($("jrBrowserAddress").value,true);});
$("jrBrowserExternal").addEventListener("click",()=>{
 try{const url=resolve($("jrBrowserAddress").value);if(url)window.open(url,"_blank","noopener,noreferrer");}
 catch(error){$("jrBrowserStatus").textContent=error.message;}
});
$("jrBrowserBack").addEventListener("click",()=>{if(visitIndex>0){visitIndex--;navigate(visits[visitIndex],false);}});
$("jrBrowserForward").addEventListener("click",()=>{if(visitIndex<visits.length-1){visitIndex++;navigate(visits[visitIndex],false);}});
$("jrBrowserReload").addEventListener("click",()=>{const frame=$("jrBrowserFrame");if(frame.src)frame.src=frame.src;});
$("jrBrowserFrame").addEventListener("load",()=>{$("jrBrowserStatus").textContent="Page loaded or attempted. If the content is blank, the website may block embedded browsing.";});
const originalShow=window.show;
const pageHistory=[];let pageIndex=-1;let replaying=false;
function updatePageButtons(){
 const back=nav.querySelector(".jp-nav-arrow[aria-label='Go back']");
 const forward=nav.querySelector(".jp-nav-arrow[aria-label='Go forward']");
 if(back)back.disabled=pageIndex<=0;
 if(forward)forward.disabled=pageIndex<0||pageIndex>=pageHistory.length-1;
}
window.jpPheefGoBack=function(){if(pageIndex>0){pageIndex--;replaying=true;window.show(pageHistory[pageIndex]);replaying=false;updatePageButtons();}};
window.jpPheefGoForward=function(){if(pageIndex<pageHistory.length-1){pageIndex++;replaying=true;window.show(pageHistory[pageIndex]);replaying=false;updatePageButtons();}};
if(typeof originalShow==="function"){
 window.show=function(id){
  if(!replaying&&pageHistory[pageIndex]!==id){pageHistory.splice(pageIndex+1);pageHistory.push(id);pageIndex=pageHistory.length-1;}
  const result=originalShow.apply(this,arguments);
  document.body.dataset.jpSection=id;
  updatePageButtons();
  return result;
 };
}
buttons();updatePageButtons();
})();