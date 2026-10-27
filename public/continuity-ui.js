"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const call = async (url, method, body) => {
    try { const r = await fetch(url, {method:method||"GET",credentials:"include",headers:body===undefined?{}:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)}); return await r.json().catch(()=>({ok:false,error:"Invalid server response."})); }
    catch { return {ok:false,error:"Connection unavailable. Your local checkpoint is retained on this device."}; }
  };
  let saving=false, restoring=false, timer=null, ready=false;
  const key=()=> "jr-pheef:continuity:"+String(window.me?.id||"anonymous");
  const pageNow=()=>[...document.querySelectorAll("#app .page")].find(p=>!p.classList.contains("hidden"))?.id||"home";
  const localSave=s=>{try{localStorage.setItem(key(),JSON.stringify(s));}catch{}};
  const localRead=()=>{try{return JSON.parse(localStorage.getItem(key())||"null");}catch{return null;}};
  async function saveNow(){
    if(!window.me?.id||restoring||saving)return;
    const state={page:pageNow(),scroll_y:Math.max(0,Math.round(window.scrollY||0)),saved_at:new Date().toISOString()};
    localSave(state); if(!navigator.onLine)return; saving=true;
    try{const r=await call("/api/continuity","PUT",state);if(!r.ok)console.warn("JR continuity sync deferred:",r.error||"unavailable");}finally{saving=false;}
  }
  function schedule(){if(restoring||!window.me?.id)return;clearTimeout(timer);timer=setTimeout(saveNow,450);}
  function ensurePage(){
    if(!$("app")||$("businessgrowth"))return;
    const page=document.createElement("section"); page.id="businessgrowth"; page.className="page hidden";
    page.innerHTML=[
      '<div class="card"><p class="muted">JR PHEEF · BUSINESS OPERATIONS</p><h2>MY BUSINESS GROWTH</h2>',
      '<p class="muted">Register a business workspace, then create a practical daily operating plan. JR uses the profile you provide; connect reliable sales, stock and cost data later for more specific recommendations.</p>',
      '<label for="bgName">Business name</label><input id="bgName" maxlength="160" placeholder="e.g. MAATHAIS Supermarket">',
      '<label for="bgSector">Business type</label><select id="bgSector"><option value="supermarket">Supermarket / grocery</option><option value="retail">Retail / shop</option><option value="service">Services / professional</option><option value="transport">Transport / delivery</option><option value="other">Other business</option></select>',
      '<label for="bgLocation">Location</label><input id="bgLocation" maxlength="160" placeholder="e.g. Nairobi CBD">',
      '<label for="bgGoals">What do you want to improve?</label><textarea id="bgGoals" maxlength="1000" rows="2" placeholder="Sales, stock, customer service, costs, operations, expansion…"></textarea>',
      '<button class="primary" id="bgCreate" onclick="jrCreateBusiness()">SAVE BUSINESS</button><p id="bgMsg" class="muted" aria-live="polite"></p></div>',
      '<div class="card"><h3>Your business workspaces</h3><select id="bgSelect" onchange="jrLoadDailyPlan()"><option value="">Choose a business</option></select>',
      '<button class="primary" onclick="jrMakeDailyPlan()">CREATE TODAY\\'S PLAN</button><button class="dark" onclick="jrLoadBusinesses()">REFRESH BUSINESSES</button><p id="bgPlanMsg" class="muted" aria-live="polite"></p></div>',
      '<div id="bgPlan" class="card"><p class="muted">Choose a business to view today\\'s plan.</p></div>',
      '<div class="card"><p class="muted">Plans are recommendations, not guarantees. Review purchases, price changes, customer messages and other consequential actions before execution. Automatic daily delivery requires a scheduler to be configured.</p></div>'
    ].join("");
    $("app").appendChild(page);
    const nav=$("app").querySelector(".nav");
    if(nav&&!$("navBusinessGrowth")){const b=document.createElement("button");b.id="navBusinessGrowth";b.className="dark";b.textContent="MY BUSINESS";b.addEventListener("click",()=>window.show("businessgrowth"));nav.appendChild(b);}
  }
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  const selected=()=> $("bgSelect")?.value||"";
  window.jrLoadBusinesses=async function(){
    const select=$("bgSelect"),msg=$("bgMsg");if(!select)return;const prior=select.value;
    const d=await call("/api/business/workspaces");
    if(!d.ok){if(msg)msg.textContent=d.error||"Could not load businesses.";return;}
    select.innerHTML='<option value="">Choose a business</option>'+(d.businesses||[]).map(b=>'<option value="'+esc(b.id)+'">'+esc(b.business_name)+' · '+esc(b.location||b.sector||"Business")+'</option>').join("");
    if((d.businesses||[]).some(b=>b.id===prior))select.value=prior;
    if(!(d.businesses||[]).length&&msg)msg.textContent="Add your first business above to receive a personalized daily plan.";
    if(select.value)await window.jrLoadDailyPlan();
  };
  window.jrCreateBusiness=async function(){
    const button=$("bgCreate"),msg=$("bgMsg"),business_name=$("bgName").value.trim();
    if(business_name.length<2){msg.textContent="Enter the business name.";return;}
    button.disabled=true;msg.textContent="Saving business workspace…";
    const d=await call("/api/business/workspaces","POST",{business_name,sector:$("bgSector").value,location:$("bgLocation").value.trim(),goals:$("bgGoals").value.trim()});
    button.disabled=false;if(!d.ok){msg.textContent=d.error||"Could not save the business.";return;}
    msg.textContent="Business saved. Create today's plan when ready."; $("bgName").value="";$("bgGoals").value="";
    await window.jrLoadBusinesses();if($("bgSelect"))$("bgSelect").value=d.business.id;await window.jrLoadDailyPlan();
  };
  window.jrMakeDailyPlan=async function(){
    const id=selected(),msg=$("bgPlanMsg");if(!id){msg.textContent="Choose a business first.";return;}
    msg.textContent="Preparing today's plan…";
    const d=await call("/api/business/"+encodeURIComponent(id)+"/daily-plan","POST",{});
    if(!d.ok){msg.textContent=d.error||"Could not prepare the plan.";return;}
    msg.textContent=d.reused?"Today's saved plan is ready.":"Today's plan is ready. A notification was added to JR PHEEF alerts.";renderPlan(d.daily_plan);
  };
  window.jrLoadDailyPlan=async function(){
    const id=selected();if(!id){if($("bgPlan"))$("bgPlan").innerHTML='<p class="muted">Choose a business to view today\\'s plan.</p>';return;}
    const d=await call("/api/business/"+encodeURIComponent(id)+"/daily-plan");
    if(!d.ok){$("bgPlanMsg").textContent=d.error||"Could not load plan.";return;}
    if(d.daily_plan)renderPlan(d.daily_plan);else $("bgPlan").innerHTML='<h3>Today\\'s plan</h3><p class="muted">No plan saved for today. Select CREATE TODAY\\'S PLAN to prepare one.</p>';
  };
  function renderPlan(row){
    const p=row?.plan||{},host=$("bgPlan");if(!host)return;
    host.innerHTML='<p class="muted">'+esc(p.date||row.plan_date)+' · '+esc(String(row.source||p.source||"template").toUpperCase())+'</p><h2>'+esc(p.headline||("Daily plan for "+(p.business_name||"your business")))+'</h2><p>'+esc(p.summary||"")+'</p><h3>Today\\'s priorities</h3>'+
      (p.priorities||[]).map(t=>'<article class="listing"><b>'+esc(t.title)+'</b><p class="muted">'+esc(t.detail)+'</p><p class="muted">'+esc(t.evidence||"")+'</p><p>Status: '+esc(t.status||"pending")+'</p><button class="'+(t.status==="completed"?"dark":"primary")+'" onclick="jrSetDailyTask(\\''+esc(row.business_id)+'\\',\\''+esc(t.id)+'\\',\\''+(t.status==="completed"?"pending":"completed")+'\\')">'+(t.status==="completed"?"MARK PENDING":"MARK COMPLETE")+'</button></article>').join("")+
      '<h3>Numbers to watch</h3><ul>'+(p.numbers_to_watch||[]).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><h3>Risks and assumptions</h3><ul>'+(p.risks||[]).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
  }
  window.jrSetDailyTask=async function(businessId,taskId,status){
    const d=await call("/api/business/"+encodeURIComponent(businessId)+"/daily-plan/tasks/"+encodeURIComponent(taskId),"PATCH",{status});
    if(!d.ok){$("bgPlanMsg").textContent=d.error||"Could not update task.";return;}renderPlan(d.daily_plan);
  };
  async function restore(){
    if(!window.me?.id)return;restoring=true;let state=localRead();
    if(navigator.onLine){const r=await call("/api/continuity");if(r.ok&&r.state?.page){state=r.state;localSave(state);}}
    if(state?.page&&$(state.page)?.classList.contains("page")){try{window.show(state.page);}catch{};requestAnimationFrame(()=>window.scrollTo(0,Math.max(0,Number(state.scroll_y)||0)));}
    restoring=false;ready=true;schedule();
  }
  const oldShow=window.show;
  if(typeof oldShow==="function")window.show=function(id){const r=oldShow.apply(this,arguments);if(id==="businessgrowth")window.jrLoadBusinesses();schedule();return r;};
  const oldOpen=window.openApp;
  if(typeof oldOpen==="function")window.openApp=async function(){const r=await oldOpen.apply(this,arguments);ensurePage();await restore();return r;};
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("pagehide",()=>{if(window.me?.id)localSave({page:pageNow(),scroll_y:Math.max(0,Math.round(window.scrollY||0)),saved_at:new Date().toISOString()});});
  window.addEventListener("online",()=>{if(ready)schedule();});
  document.addEventListener("DOMContentLoaded",ensurePage);
})();