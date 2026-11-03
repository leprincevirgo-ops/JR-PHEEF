(function(){
"use strict";
const $=id=>document.getElementById(id);
const call=async(url,method,body)=>{
 try{const r=await fetch(url,{method:method||"GET",credentials:"include",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});return await r.json().catch(()=>({ok:false,error:"JR returned an unreadable response."}));}
 catch{return {ok:false,error:"Connection unavailable. Your saved JR progress remains on the server."};}
};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons={personal:"◉",learning:"✦",creative:"✧",work:"▤",business:"▦",opportunities:"⌕",relationships:"♧",community:"◎",family:"⌂",civic:"⌘",exploration:"✺",health:"♡",culture:"◈"};
let busy=false,journey=null;
function ensurePanel(){
 const home=$("home");if(!home||$("jrJourneyPanel"))return;
 const section=document.createElement("section");section.id="jrJourneyPanel";section.className="jr-journey-panel";
 section.innerHTML='<div class="jr-journey-heading"><div><span class="jr-journey-kicker">YOUR CONTINUING JOURNEY</span><h2>Every step builds on the last.</h2><p>JR keeps a private record of your progress so you can continue learning, creating, working and connecting.</p></div><button type="button" class="dark" id="jrJourneyRefresh">Refresh</button></div><div id="jrJourneyWorlds" class="jr-journey-worlds"><p class="muted">Your worlds will appear here when you begin interacting with JR.</p></div><div class="jr-journey-bottom"><div><h3>Your recent moments</h3><div id="jrJourneyJournal"><p class="muted">Your journey begins with your first interaction.</p></div></div><div><h3>What JR can help coordinate</h3><div id="jrJourneyCapabilities" class="jr-journey-capabilities"></div><p class="jr-journey-note">Some capabilities need a connected provider, your permission or a separate confirmation before JR can act.</p></div></div><div id="jrJourneyReply" class="jr-journey-reply" hidden aria-live="polite"></div>';
 const compose=home.querySelector(".jr-intent-console");if(compose)compose.insertAdjacentElement("afterend",section);else home.appendChild(section);
 $("jrJourneyRefresh").addEventListener("click",load);
}
function render(data){
 journey=data;
 const worlds=$("jrJourneyWorlds"),journal=$("jrJourneyJournal"),caps=$("jrJourneyCapabilities");
 if(worlds){
  const rows=data.worlds||[];
  worlds.innerHTML=rows.length?rows.slice(0,8).map(w=>'<article class="jr-journey-world"><span class="jr-journey-world-icon">'+(icons[w.world_key]||"◉")+'</span><div><b>'+esc((w.world_key||"").replace(/_/g," "))+'</b><small>'+esc(w.stage||"discovering")+' · Last active '+esc(new Date(w.last_interaction_at).toLocaleDateString())+'</small></div></article>').join(""):'<article class="jr-journey-empty"><b>Your journey starts here.</b><span>Learn something, explore an idea, build a project or connect with someone. JR will remember your progress.</span></article>';
 }
 if(journal)journal.innerHTML=(data.journal||[]).slice(0,5).map(e=>'<article class="jr-journey-entry"><b>'+esc(e.title)+'</b><small>'+esc(e.world_key||"personal")+' · '+esc(new Date(e.created_at).toLocaleString())+'</small></article>').join("")||'<p class="muted">No saved moments yet.</p>';
 if(caps)caps.innerHTML=(data.capabilities||[]).map(c=>'<span class="jr-capability-chip">'+esc(c.description)+'</span>').join("");
}
async function load(){
 ensurePanel();const d=await call("/api/jr/environment");if(d.ok)render(d);else if(d.error!=="LOGIN_REQUIRED"){$("jrJourneyWorlds").textContent=d.error||"Your journey could not be loaded.";}
}
function reply(text,world,page){
 const host=$("jrJourneyReply");if(!host)return;
 host.hidden=false;
 host.innerHTML='<div class="jr-journey-reply-head"><b>JR understood you</b><span>'+esc(world?.title||"Your journey")+'</span></div><p>'+esc(text)+'</p>'+(page?'<button type="button" class="primary" id="jrJourneyOpenSpace">OPEN '+esc((world?.title||"SPACE").toUpperCase())+'</button>':"");
 const open=$("jrJourneyOpenSpace");if(open)open.addEventListener("click",()=>{if(typeof window.show==="function")window.show(page);});
}
async function submit(event){
 const field=$("jpUniversalRequest");if(!field)return;
 const text=(field.value||"").trim();if(!text)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(busy)return;busy=true;
 const status=$("jpUniversalStatus");if(status)status.textContent="JR is understanding your intention and connecting it to your journey…";
 const result=await call("/api/jr/environment/interact","POST",{text});
 if(!result.ok){if(status)status.textContent=result.error||"JR could not understand that request.";busy=false;return;}
 if(status)status.textContent="Your progress has been saved to your JR journey.";
 let answer=result.response||"I’m ready to work through that with you.";
 const ai=await call("/api/ai/chat","POST",{mode:"universe",message:text});
 if(ai.ok)answer=ai.answer||ai.reply||answer;
 reply(answer,result.world,result.navigation?.page);
 field.value="";
 await load();
 busy=false;
}
function bind(){
 ensurePanel();
 const form=$("jpUniversalForm");if(form)form.addEventListener("submit",submit,true);
 const me=call("/api/me").then(d=>{if(d.logged_in)load();});
 document.addEventListener("jr:login",load);
 const show=window.show;
 if(typeof show==="function")window.show=function(id){const r=show.apply(this,arguments);if(id==="home")load();return r;};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
window.jrHumanEnvironment={refresh:load};
})();