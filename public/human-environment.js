(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pages={personal:"profile",learning:"teacher",creative:"lab",work:"projects",business:"businessgrowth",opportunities:"find",relationships:"messages",community:"social",family:"family",civic:"accessgov",exploration:"explore",health:"explore",culture:"explore"};
let loading=false,lastMember=null;
async function api(url,method,body){
 const r=await fetch(url,{method:method||"GET",credentials:"include",headers:body===undefined?{}:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 return r.json().catch(()=>({ok:false,error:"Invalid server response."}));
}
function stageLabel(s){return ({discovering:"Discovering",learning:"Learning",practising:"Practising",building:"Building",contributing:"Contributing",paused:"Paused"})[s]||"Discovering";}
function render(data){
 const host=$("jrJourneyWorlds"),journal=$("jrJourneyJournal"),status=$("jrJourneyStatus");
 if(!host)return;
 const worlds=data.worlds||[];
 host.innerHTML=worlds.map(w=>{
  const p=w.progress||{},stage=p.stage||"discovering",position=p.last_position||{};
  const page=position.page||w.page||pages[w.key]||"explore";
  return '<button type="button" class="jr-journey-world" data-world="'+esc(w.key)+'" data-page="'+esc(page)+'"><span class="jr-journey-world-top"><b>'+esc(w.title)+'</b><small>'+esc(stageLabel(stage))+'</small></span><span>'+esc(w.description)+'</span><i><em style="width:'+Math.max(0,Math.min(100,Number((p.progress&&p.progress.completion_percent))||0))+'%"></em></i><small>Continue exploring →</small></button>';
 }).join("");
 host.querySelectorAll("[data-world]").forEach(button=>button.addEventListener("click",()=>openWorld(button.dataset.world,button.dataset.page)));
 if(journal){
  journal.innerHTML=(data.journal||[]).slice(0,5).map(e=>'<article class="jr-journey-event"><span>'+esc(e.title)+'</span><small>'+esc(e.world_key||"JR PHEEF")+' · '+esc(new Date(e.created_at).toLocaleString())+'</small></article>').join("")||'<p class="jr-journey-empty">Your journey will begin appearing here as you explore, learn, create and achieve things.</p>';
 }
 if(status)status.textContent="Your worlds and private progress are ready.";
}
async function load(){
 if(loading)return;loading=true;
 const status=$("jrJourneyStatus");
 try{
  const me=await api("/api/me");
  if(!me.logged_in){if(status)status.textContent="Sign in to keep your journey connected across devices.";loading=false;return;}
  const member=String(me.member.id||"");
  if(lastMember&&lastMember!==member)lastMember=null;
  lastMember=member;
  const data=await api("/api/universe/state");
  if(data.ok)render(data);else if(status)status.textContent=data.error||"Your journey is temporarily unavailable.";
 }catch(e){if(status)status.textContent="Connection unavailable. Your current page can still be used.";}
 loading=false;
}
async function openWorld(key,page){
 const status=$("jrJourneyStatus");
 if(status)status.textContent="Opening your "+key+" world…";
 try{await api("/api/universe/interaction","POST",{world_key:key,source_page:"home"});}catch{}
 if(typeof window.show==="function")window.show(page||pages[key]||"explore");
}
function recordUniversalStart(){
 const form=$("jpUniversalForm"),field=$("jpUniversalRequest");
 if(!form||!field||form.dataset.jrJourneyBound)return;
 form.dataset.jrJourneyBound="1";
 form.addEventListener("submit",()=>{
  if(!field.value.trim())return;
  api("/api/universe/interaction","POST",{source_page:"home"}).catch(()=>{});
 },{passive:true});
}
function mount(){
 if(!$("jrJourneyWorlds"))return;
 recordUniversalStart();
 const oldOpen=window.openApp;
 if(typeof oldOpen==="function"&&!oldOpen.__jrJourneyWrapped){
  const wrapped=async function(){const result=await oldOpen.apply(this,arguments);load();return result;};
  wrapped.__jrJourneyWrapped=true;window.openApp=wrapped;
 }
 const oldShow=window.show;
 if(typeof oldShow==="function"&&!oldShow.__jrJourneyWrapped){
  const wrapped=function(id){const result=oldShow.apply(this,arguments);if(id==="home")load();return result;};
  wrapped.__jrJourneyWrapped=true;window.show=wrapped;
 }
 load();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
window.jrLoadHumanEnvironment=load;
})();
