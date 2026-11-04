/* JR PHEEF Core — one connected surface for the six capability engines. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons={living_intelligence:"✦",world_engine:"◎",business_os:"▦",continuity:"↔",creator_media:"◉",identity_trust:"⌘"};
const labels={ready:"READY",configured_unverified:"CONFIGURED · VERIFY ON USE",fallback_only:"LIMITED · AI PROVIDER NEEDED",unavailable:"CHECK REQUIRED",upload_configured_unverified:"MEDIA UPLOAD · VERIFY ON USE",storage_configuration_needed:"STORAGE CONFIGURATION NEEDED",identity_incomplete:"IDENTITY SETUP NEEDED"};
let loading=false,last=null;
function go(page){if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(page);else if(typeof window.show==="function")window.show(page);}
function ensure(){
 const home=$("home");if(!home||$("jrCoreSurface"))return;
 const section=document.createElement("section");section.id="jrCoreSurface";section.className="jr-core-surface";
 section.innerHTML='<div class="jr-core-heading"><div><span class="jp-kicker">ONE INTELLIGENCE · SIX CONNECTED ENGINES</span><h2>JR Core</h2><p>One JR PHEEF environment. Your worlds, work, continuity, creativity and identity move together.</p></div><button type="button" id="jrCoreRefresh" class="dark">Refresh status</button></div><div id="jrCoreCards" class="jr-core-grid" aria-live="polite"><p class="muted">Checking your connected JR capabilities…</p></div><div class="jr-core-boundary" id="jrCoreBoundary">JR checks capability availability and permissions. Payments and public broadcasting remain unavailable until their integrations are activated and verified.</div>';
 home.append(section);
 $("jrCoreRefresh").addEventListener("click",load);
 section.addEventListener("click",event=>{const button=event.target.closest("[data-jr-core-open]");if(button)go(button.dataset.jrCoreOpen);});
}
function render(data){
 last=data;const host=$("jrCoreCards");if(!host)return;
 host.replaceChildren();
 (data.capabilities||[]).forEach(cap=>{
  const article=document.createElement("article");article.className="jr-core-card";
  const top=document.createElement("div");top.className="jr-core-card-top";
  const icon=document.createElement("span");icon.className="jr-core-icon";icon.textContent=icons[cap.key]||"◉";
  const badge=document.createElement("span");badge.className="jr-core-status "+(cap.status==="ready"||cap.status==="upload_configured_unverified"?"is-ready":cap.status==="unavailable"||cap.status==="storage_configuration_needed"||cap.status==="identity_incomplete"?"needs-work":"is-limited");badge.textContent=labels[cap.status]||String(cap.status||"STATUS UNKNOWN").replace(/_/g," ").toUpperCase();
  top.append(icon,badge);
  const title=document.createElement("h3");title.textContent=cap.title;
  const detail=document.createElement("p");detail.textContent=cap.detail;
  const metric=document.createElement("small");metric.className="jr-core-metric";
  if(cap.metric_label)metric.textContent=String(cap.metric||0)+" · "+cap.metric_label;
  else if(cap.jp_identity_present)metric.textContent="JP identity active · "+String(cap.pending_approvals||0)+" pending approvals";
  else if(cap.live_broadcast)metric.textContent="Public broadcast: "+cap.live_broadcast.replace(/_/g," ")+(cap.streaming_credentials_present?" · provider credentials present":"");
  const open=document.createElement("button");open.type="button";open.className="jr-core-open";open.textContent="OPEN WORKSPACE →";open.dataset.jrCoreOpen=cap.page;
  article.append(top,title,detail,metric,open);host.append(article);
 });
 const boundary=$("jrCoreBoundary");
 if(boundary)boundary.textContent="Updated "+new Date(data.generated_at).toLocaleTimeString()+". Provider quota is not assumed from API-key presence. Approval records do not execute actions. Payments: "+data.boundaries.payments.replace(/_/g," ")+". Live broadcast: "+data.boundaries.public_live_broadcast.replace(/_/g," ")+".";
}
async function load(){
 ensure();if(loading)return;loading=true;
 const host=$("jrCoreCards");if(host&&!last)host.textContent="Checking your connected JR capabilities…";
 try{const r=await fetch("/api/jr/core/status",{credentials:"include",cache:"no-store"});const data=await r.json().catch(()=>({ok:false}));
  if(!r.ok||!data.ok){if(host)host.textContent=data.error||"Sign in to see your JR Core status.";return;}
  render(data);
 }catch{if(host)host.textContent="JR Core status is temporarily unavailable. Your existing workspaces remain available.";}
 finally{loading=false;}
}
function bind(){
 ensure();
 const oldShow=window.show;
 if(typeof oldShow==="function"&&!oldShow.__jrCoreWrapped){const wrapped=function(id){const result=oldShow.apply(this,arguments);if(id==="home")load();return result;};wrapped.__jrCoreWrapped=true;window.show=wrapped;}
 document.addEventListener("jr:login",load);
 document.addEventListener("jr:workspacechange",event=>{if(event.detail?.id==="home")load();});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&$("home")&&!$("home").classList.contains("hidden"))load();});
 if($("home")&&!$("home").classList.contains("hidden"))load();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
window.jrCore={refresh:load,open:go};
})();