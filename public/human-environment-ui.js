(function(){
"use strict";
const $=id=>document.getElementById(id);
const call=async(url,method,body)=>{
 try{const r=await fetch(url,{method:method||"GET",credentials:"include",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});return await r.json().catch(()=>({ok:false,error:"JR returned an unreadable response."}));}
 catch{return {ok:false,error:"Connection unavailable. Your saved JR progress remains on the server."};}
};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons={personal:"◉",learning:"✦",creative:"✧",work:"▤",business:"▦",opportunities:"⌕",relationships:"♧",community:"◎",family:"⌂",civic:"⌘",exploration:"✺",health:"♡",culture:"◈"};
const pages={personal:"profile",learning:"teacher",creative:"scifi",work:"projects",business:"businessgrowth",opportunities:"find",relationships:"connections",community:"social",family:"family",civic:"accessgov",exploration:"explore",health:"explore",culture:"explore"};
let busy=false,journey=null;
function ensurePanel(){
 const home=$("home");if(!home)return;
 const section=$("jrJourneyPanel")||home.querySelector(".jr-journey-section");if(!section)return;
 section.id="jrJourneyPanel";
 const heading=section.querySelector(".jr-journey-heading");
 if(heading&&!$("jrJourneyRefresh")){const refresh=document.createElement("button");refresh.type="button";refresh.className="dark";refresh.id="jrJourneyRefresh";refresh.textContent="Refresh";heading.append(refresh);refresh.addEventListener("click",load);}
 if(!$("jrJourneyCapabilities"))section.insertAdjacentHTML("beforeend",'<section class="jr-journey-bottom"><div><h3>Your recent moments</h3><div id="jrJourneyJournal"></div></div><div><h3>What JR can help coordinate</h3><div id="jrJourneyCapabilities" class="jr-journey-capabilities"></div><p class="jr-journey-note">Enabling a capability records your preference. External services and high-impact actions still need their own permissions and confirmation.</p></div></section>');
 if(!$("jrJourneyProposals"))section.insertAdjacentHTML("beforeend",'<section class="jr-journey-actions"><div><h3>Actions awaiting your decision</h3><p class="jr-journey-note">JR records your choice. Approval alone does not send, spend, book, purchase or control a device.</p><div id="jrJourneyProposals"><p class="muted">No action proposals yet.</p></div></div></section>');
 if(!$("jrJourneyMemories"))section.insertAdjacentHTML("beforeend",'<section class="jr-journey-memory"><div><h3>Your JR memory</h3><p class="jr-journey-note">Save only non-sensitive details you deliberately want JR to remember. Nothing is stored unless you submit it. AI reuse requires your explicit consent.</p></div><div class="jr-memory-editor"><select id="jrMemoryKind" aria-label="Memory category"><option value="preference">Preference</option><option value="goal">Goal</option><option value="project_context">Project context</option><option value="workflow">Workflow</option><option value="non_sensitive_fact">Other non-sensitive fact</option></select><textarea id="jrMemoryText" maxlength="1000" rows="2" placeholder="What would you like JR to remember?"></textarea><label class="jr-memory-consent"><input id="jrMemoryConsent" type="checkbox"> I agree JR may reuse this in future AI conversations.</label><button type="button" class="primary" id="jrMemorySave">SAVE TO MY MEMORY</button><p id="jrMemoryStatus" class="jr-journey-note" role="status" aria-live="polite"></p></div><div id="jrJourneyMemories"><p class="muted">No saved memories yet.</p></div></section>');
 if(!$("jrJourneyIntegrations"))section.insertAdjacentHTML("beforeend",'<section class="jr-journey-integrations"><div><h3>Connect your world to JR</h3><p class="jr-journey-note">Create a private, limited connection for a service you control. It can send JR updates into your private inbox; it cannot read your account or trigger actions.</p></div><form id="jrIntegrationForm" class="jr-integration-form"><input id="jrIntegrationName" maxlength="60" minlength="3" placeholder="Connection name (e.g. My stock system)" required><button type="submit" class="primary">CREATE CONNECTION</button></form><p id="jrIntegrationStatus" class="jr-journey-note" role="status" aria-live="polite"></p><div id="jrIntegrationToken" class="jr-integration-token" hidden></div><div id="jrJourneyIntegrations"><p class="muted">No partner connections yet.</p></div><h3>Connected service updates</h3><div id="jrPartnerEvents"><p class="muted">Updates from your connected services will appear here.</p></div></section>');
 if(!$("jrJourneyReply"))section.insertAdjacentHTML("beforeend",'<div id="jrJourneyReply" class="jr-journey-reply" hidden aria-live="polite"></div>');
}
function render(data){
 journey=data;
 const worlds=$("jrJourneyWorlds"),journal=$("jrJourneyJournal"),caps=$("jrJourneyCapabilities");
 if(worlds){
  const rows=data.worlds||[];
  worlds.innerHTML=rows.map(w=>'<button type="button" class="jr-journey-world" data-jr-world="'+esc(w.world_key)+'"><span class="jr-journey-world-icon">'+(icons[w.world_key]||"◉")+'</span><span class="jr-journey-world-copy"><b>'+esc(w.title||w.world_key)+'</b><small>'+esc(w.stage||"discovering")+' · Last active '+esc(new Date(w.last_interaction_at||Date.now()).toLocaleDateString())+'</small><small class="jr-world-continue">CONTINUE →</small></span></button>').join("")||'<article class="jr-journey-empty"><b>Your journey starts here.</b><span>Learn something, explore an idea, build a project or connect with someone. JR will remember your progress.</span></article>';
  worlds.querySelectorAll("[data-jr-world]").forEach(button=>button.addEventListener("click",async()=>{
   const key=button.dataset.jrWorld,world=(journey.worlds||[]).find(x=>x.world_key===key),page=world?.page||pages[key]||"explore";
   if(key!=="health")await call("/api/jr/environment/worlds/"+encodeURIComponent(key),"PATCH",{stage:world?.stage||"discovering",last_position:{page}});
   if(typeof window.show==="function")window.show(page);
  }));
 }
 if(journal)journal.innerHTML=(data.journal||[]).slice(0,6).map(e=>'<article class="jr-journey-entry"><b>'+esc(e.title)+'</b><small>'+esc(e.world_key||"personal")+' · '+esc(new Date(e.created_at).toLocaleString())+'</small></article>').join("")||'<p class="muted">No saved moments yet.</p>';
 const proposals=$("jrJourneyProposals");
 const memoryHost=$("jrJourneyMemories");
 if(memoryHost){
  const memories=data.memories||[];
  memoryHost.innerHTML=memories.map(m=>'<article class="jr-memory-card"><div><b>'+esc(m.memory_kind.replace(/_/g," "))+'</b><p>'+esc(m.memory_text)+'</p><small>'+(m.consent_ai_context?"AI context enabled":"AI context disabled")+'</small></div><div class="jr-memory-buttons"><button type="button" class="dark" data-memory-consent="'+esc(m.id)+'" data-consent="'+String(!!m.consent_ai_context)+'">'+(m.consent_ai_context?"Disable AI reuse":"Enable AI reuse")+'</button><button type="button" class="dark" data-memory-delete="'+esc(m.id)+'">Remove</button></div></article>').join("")||'<p class="muted">No saved memories yet.</p>';
  memoryHost.querySelectorAll("[data-memory-consent]").forEach(button=>button.addEventListener("click",async()=>{
   button.disabled=true;const result=await call("/api/jr/environment/memories/"+encodeURIComponent(button.dataset.memoryConsent),"PATCH",{consent_ai_context:button.dataset.consent!=="true"});
   if(result.ok)await load();else{button.disabled=false;button.textContent=result.error||"Try again";}
  }));
  memoryHost.querySelectorAll("[data-memory-delete]").forEach(button=>button.addEventListener("click",async()=>{
   button.disabled=true;const result=await call("/api/jr/environment/memories/"+encodeURIComponent(button.dataset.memoryDelete),"DELETE");
   if(result.ok)await load();else{button.disabled=false;button.textContent=result.error||"Try again";}
  }));
 }
 const integrations=$("jrJourneyIntegrations"),events=$("jrPartnerEvents");
 if(integrations){
  integrations.innerHTML=(data.partner_connections||[]).map(x=>'<article class="jr-integration-card"><div><b>'+esc(x.name)+'</b><small>'+esc((x.scopes||[]).join(", "))+' · '+(x.active?"Active":"Revoked")+'</small></div>'+(x.active?'<button type="button" class="dark" data-integration-revoke="'+esc(x.id)+'">Revoke</button>':'')+'</article>').join("")||'<p class="muted">No partner connections yet.</p>';
  integrations.querySelectorAll("[data-integration-revoke]").forEach(button=>button.addEventListener("click",async()=>{button.disabled=true;const result=await call("/api/jr/integrations/"+encodeURIComponent(button.dataset.integrationRevoke),"DELETE");if(result.ok)await load();else{button.disabled=false;button.textContent=result.error||"Try again";}}));
 }
 if(events){
  events.innerHTML=(data.partner_events||[]).map(e=>'<article class="jr-partner-event"><b>'+esc(e.title)+'</b><small>'+esc(e.event_type.replace(/_/g," "))+' · '+esc(new Date(e.received_at).toLocaleString())+'</small><p>'+esc(e.summary)+'</p></article>').join("")||'<p class="muted">No updates received yet.</p>';
 }
 if(proposals){
  const items=data.action_proposals||[];
  proposals.innerHTML=items.map(p=>{
   const pending=p.status==="pending";
   const state=p.status==="approved"?"Approved · not executed":p.status==="rejected"?"Rejected":p.status==="expired"?"Expired":p.status;
   return '<article class="jr-proposal-card"><div class="jr-proposal-meta"><b>'+esc(p.summary)+'</b><span>'+esc(String(p.risk_level||"").toUpperCase())+' RISK · '+esc(state)+'</span></div>'+(pending?'<div class="jr-proposal-buttons"><button type="button" class="primary" data-jr-proposal-decision="approve" data-proposal-id="'+esc(p.id)+'">Approve</button><button type="button" class="dark" data-jr-proposal-decision="reject" data-proposal-id="'+esc(p.id)+'">Reject</button></div>':'')+'</article>';
  }).join("")||'<p class="muted">No action proposals yet. When JR needs permission for a consequential action, it will appear here.</p>';
  proposals.querySelectorAll("[data-jr-proposal-decision]").forEach(button=>button.addEventListener("click",async()=>{
   button.disabled=true;
   const id=button.dataset.proposalId,decision=button.dataset.jrProposalDecision;
   const result=await call("/api/jr/actions/proposals/"+encodeURIComponent(id),"PATCH",{decision});
   if(result.ok)await load();else{button.disabled=false;button.textContent=result.error||"Try again";}
  }));
 }
 if(caps){
  caps.innerHTML=(data.capabilities||[]).map(c=>'<div class="jr-capability-row"><span>'+esc(c.description)+'</span><button type="button" class="jr-capability-toggle '+(c.enabled?"enabled":"")+'" data-capability="'+esc(c.key)+'" aria-pressed="'+String(!!c.enabled)+'">'+(c.enabled?"Enabled":"Enable")+'</button></div>').join("");
  caps.querySelectorAll("[data-capability]").forEach(button=>button.addEventListener("click",async()=>{
   const cap=(data.capabilities||[]).find(x=>x.key===button.dataset.capability);if(!cap)return;
   button.disabled=true;
   const result=await call("/api/jr/environment/capabilities/"+encodeURIComponent(cap.key),"PUT",{enabled:!cap.enabled,scope:cap.scope||{}});
   if(result.ok)await load();else{button.disabled=false;button.textContent=result.error||"Try again";}
  }));
 }
}
async function load(){
 ensurePanel();
 const d=await call("/api/jr/environment");
 if(d.ok){const [memories,connections,events]=await Promise.all([call("/api/jr/environment/memories"),call("/api/jr/integrations"),call("/api/jr/integrations/events")]);d.memories=memories.ok?memories.memories||[]:[];d.partner_connections=connections.ok?connections.connections||[]:[];d.partner_events=events.ok?events.events||[]:[];render(d);}
 else if(d.error!=="LOGIN_REQUIRED"&&$("jrJourneyWorlds"))$("jrJourneyWorlds").textContent=d.error||"Your journey could not be loaded.";
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
 if(status)status.textContent=result.checkpoint_saved===false?"This health-related interaction was not added to your saved journey.":"Your progress checkpoint has been saved to your JR journey.";
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
 const memorySave=$("jrMemorySave");
 if(memorySave&&!memorySave.dataset.bound){memorySave.dataset.bound="1";memorySave.addEventListener("click",async()=>{
  const value=$("jrMemoryText")?.value.trim()||"",kind=$("jrMemoryKind")?.value||"preference",consent=$("jrMemoryConsent")?.checked===true,status=$("jrMemoryStatus");
  if(value.length<3){if(status)status.textContent="Write a little more about what JR should remember.";return;}
  if(!consent){if(status)status.textContent="Please confirm whether JR may reuse this memory in future AI conversations.";return;}
  memorySave.disabled=true;if(status)status.textContent="Saving your memory…";
  const result=await call("/api/jr/environment/memories","POST",{memory_kind:kind,memory_text:value,consent_ai_context:true});
  memorySave.disabled=false;if(!result.ok){if(status)status.textContent=result.error||"Could not save this memory.";return;}
  $("jrMemoryText").value="";$("jrMemoryConsent").checked=false;if(status)status.textContent="Saved. You can disable AI reuse or remove this memory at any time.";await load();
 });}
 const integrationForm=$("jrIntegrationForm");
 if(integrationForm&&!integrationForm.dataset.bound){integrationForm.dataset.bound="1";integrationForm.addEventListener("submit",async event=>{
  event.preventDefault();const name=$("jrIntegrationName")?.value.trim()||"",status=$("jrIntegrationStatus"),button=integrationForm.querySelector("button[type=submit]");
  if(!name)return;button.disabled=true;if(status)status.textContent="Creating a limited connection…";
  const result=await call("/api/jr/integrations","POST",{name});button.disabled=false;
  if(!result.ok){if(status)status.textContent=result.error||"Connection could not be created.";return;}
  $("jrIntegrationName").value="";const tokenHost=$("jrIntegrationToken");tokenHost.hidden=false;tokenHost.replaceChildren();
  const note=document.createElement("p");note.textContent="Copy this secret now. JR will not display it again.";
  const code=document.createElement("code");code.textContent=result.token;code.className="jr-integration-secret";
  const copy=document.createElement("button");copy.type="button";copy.className="dark";copy.textContent="COPY SECRET";copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(result.token);copy.textContent="COPIED";}catch{copy.textContent="Select and copy the secret above."; }});
  tokenHost.append(note,code,copy);if(status)status.textContent="Connection created. Only inbound events:write permission was granted.";await load();
 });}
 const form=$("jpUniversalForm");if(form&&!form.dataset.jrEnvironmentBound){form.dataset.jrEnvironmentBound="1";form.addEventListener("submit",submit,true);}
 call("/api/me").then(d=>{if(d.logged_in)load();});
 document.addEventListener("jr:login",load);
 const oldShow=window.show;
 if(typeof oldShow==="function"&&!oldShow.__jrEnvironmentWrapped){const wrapped=function(id){const result=oldShow.apply(this,arguments);if(id==="home")load();return result;};wrapped.__jrEnvironmentWrapped=true;window.show=wrapped;}
 const oldOpen=window.openApp;
 if(typeof oldOpen==="function"&&!oldOpen.__jrEnvironmentWrapped){const wrapped=async function(){const result=await oldOpen.apply(this,arguments);await load();return result;};wrapped.__jrEnvironmentWrapped=true;window.openApp=wrapped;}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
window.jrHumanEnvironment={refresh:load};
})();
