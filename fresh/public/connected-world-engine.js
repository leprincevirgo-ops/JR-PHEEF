"use strict";
(()=>{
 const API="/api/discovery/feed";
 const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const resources=[
  {title:"Khan Academy · Personal finance",type:"Learning",detail:"Free lessons covering budgeting, saving, credit and financial decisions.",url:"https://www.khanacademy.org/college-careers-more/personal-finance"},
  {title:"Consumer Financial Protection Bureau",type:"Money skills",detail:"Practical guides for managing money, borrowing and protecting yourself.",url:"https://www.consumerfinance.gov/consumer-tools/"},
  {title:"UNICEF Parenting",type:"Family learning",detail:"Evidence-informed resources for parenting, child development and family wellbeing.",url:"https://www.unicef.org/parenting"},
  {title:"NASA learning resources",type:"Science",detail:"Explore space, Earth science, missions and educational material.",url:"https://www.nasa.gov/learning-resources/"}
 ];
 const integrations=[
  ["Maps & routing","Maps, distance and route estimates","Mapping APIs","Directory only"],
  ["Weather & environment","Weather observations and severe-weather alerts","Weather and official warning APIs","Directory only"],
  ["Vehicle telemetry","Authorised vehicle position, status and diagnostics","Vehicle/telematics providers","Not connected"],
  ["Driver & fleet systems","Provider identity, availability and fleet operations","Verified transport partners","Not connected"],
  ["Parcel tracking","Shipment milestones and proof-of-delivery events","Carrier APIs","Not connected"],
  ["Smart buildings","Authorised building, energy and maintenance sensors","IoT gateways and device APIs","Not connected"],
  ["Payments","Regulated payment initiation and reconciliation","Licensed payment providers","Disabled"]
 ];
 function card(title,copy,meta,url){const a=document.createElement(url?"a":"article");a.className="cwe-card";if(url){a.href=url;a.target="_blank";a.rel="noopener noreferrer";}const h=document.createElement("strong");h.textContent=title;const p=document.createElement("p");p.textContent=copy;const small=document.createElement("small");small.textContent=meta||"";a.append(h,p,small);return a;}
 function section(title,subtitle){const s=document.createElement("section");s.className="cwe-section";const h=document.createElement("div");h.className="cwe-heading";const t=document.createElement("h3");t.textContent=title;const p=document.createElement("p");p.textContent=subtitle;h.append(t,p);const grid=document.createElement("div");grid.className="cwe-grid";s.append(h,grid);return {section:s,grid};}
 async function loadFeed(world="general"){
  const box=section("Signals from the wider world","Recent headlines from public RSS sources. Open the original publisher for full reporting.");
  const state=document.createElement("p");state.className="cwe-state";state.textContent="Connecting to public sources…";box.section.append(state);
  try{
   const response=await fetch(API+"?world="+encodeURIComponent(world),{headers:{Accept:"application/json"},cache:"no-store"});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Sources are temporarily unavailable.");
   box.grid.replaceChildren();
   (data.items||[]).slice(0,8).forEach(item=>box.grid.append(card(item.title,item.summary,item.source+" · "+(item.published||"Recent"),item.url)));
   state.textContent=data.items?.length?("Updated "+new Date(data.updatedAt).toLocaleString()+" · "+(data.cached?"cached source snapshot":"source refresh")):"No fresh items were returned. Try again later.";
  }catch(error){state.textContent="Live public feeds are temporarily unavailable. Curated learning and integration directories remain available."; }
  const refresh=document.createElement("button");refresh.type="button";refresh.className="cwe-refresh";refresh.textContent="Refresh sources";refresh.addEventListener("click",()=>{state.textContent="Refreshing…";box.section.remove();loadFeed(world).then(next=>box.section.after(next));});
  box.section.append(refresh);return box.section;
 }
 function addDirectory(parent,title,subtitle,items){
  const box=section(title,subtitle);items.forEach(x=>box.grid.append(card(x[0],x[1],x[2],x[3])));parent.append(box.section);
 }
 function mount(){
  const home=document.getElementById("view-home");
  if(home&&!home.querySelector(".cwe-home")){
   const wrap=document.createElement("div");wrap.className="cwe-home";
   const intro=document.createElement("div");intro.className="cwe-banner";intro.innerHTML="<span>JR CONNECTED WORLD</span><h2>Useful information. Connected services. One place.</h2><p>JR organises public information and authorised integrations into the worlds where they are useful.</p>";
   wrap.append(intro);home.querySelector(".capability-grid")?.after(wrap);
   loadFeed("general").then(s=>wrap.append(s));
   addDirectory(wrap,"Integration gateway","A transparent directory of capabilities JR can connect when approved providers and secure credentials are configured.",integrations.map(x=>[x[0],x[1],x[2]+" · "+x[3]]));
  }
  const family=document.getElementById("view-family");
  const learn=family?.querySelector('[data-diamond-section="learn"]');
  if(learn&&!learn.querySelector(".cwe-family-resources")){const wrap=document.createElement("div");wrap.className="cwe-family-resources";addDirectory(wrap,"Learning library","Curated external learning destinations. Content opens at its original publisher.",resources.map(x=>[x.title,x.detail,x.type,x.url]));learn.append(wrap);}
  const move=document.getElementById("view-turbex");
  const content=move?.querySelector(".transport-content");
  if(content&&!content.querySelector(".cwe-move")){const wrap=document.createElement("div");wrap.className="cwe-move";const live=section("Connected mobility information","Public transport and infrastructure information will appear here as approved live data providers are connected.");wrap.append(live.section);loadFeed("transport").then(s=>live.section.after(s));addDirectory(wrap,"JR MOVE integration gateway","These are integration categories, not live transport providers or active bookings.",integrations.filter(x=>/Maps|Weather|Vehicle|Driver|Parcel/.test(x[0])).map(x=>[x[0],x[1],x[2]+" · "+x[3]]));content.append(wrap);}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
 window.addEventListener("jr:member-signed-in",mount);
})();