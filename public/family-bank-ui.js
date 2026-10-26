/* FAMILY banking readiness workspace: no money movement is enabled. */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function call(url,options){
    const r=await fetch(url,Object.assign({credentials:"same-origin",headers:{"Content-Type":"application/json"}},options||{}));
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok) throw new Error(d.error||d.message||"Request failed.");
    return d;
  }
  function set(id,v){const n=$(id);if(n)n.textContent=v;}
  window.loadFamilyBank=async function(){
    const host=$("familyBankRequests"); if(!host)return;
    set("familyBankMsg","Loading FAMILY services…");
    try{
      const d=await call("/api/family/bank");
      set("familyBankStatus","PRE-LAUNCH · "+String(d.profile.status||"prelaunch").toUpperCase());
      set("familyBankKyc","Identity status: "+String(d.profile.kyc_status||"not_started").replace(/_/g," "));
      host.innerHTML=(d.requests||[]).length?(d.requests||[]).map(r=>'<article class="listing"><b>'+esc(String(r.request_type).replace(/_/g," "))+'</b><p>'+esc(r.details.topic||r.details.message||"Service request")+'</p><p class="muted">Status: '+esc(r.status)+' · '+esc(new Date(r.created_at).toLocaleDateString())+'</p></article>').join(""):'<p class="muted">No FAMILY banking enquiries yet.</p>';
      set("familyBankMsg",d.notice+" Only educational support and licensed-partner referrals are available in this preparation stage.");
    }catch(e){set("familyBankMsg",e.message+" Sign in and try again.");}
  };
  window.submitFamilyBankRequest=async function(){
    const type=$("familyBankType").value,topic=($("familyBankTopic").value||"").trim(),message=($("familyBankDetails").value||"").trim();
    if(!topic&&!message){set("familyBankMsg","Enter a topic or short message first.");return;}
    set("familyBankMsg","Recording your request…");
    try{
      await call("/api/family/bank/requests",{method:"POST",body:JSON.stringify({request_type:type,details:{topic,message,region:"Kenya"}})});
      $("familyBankTopic").value="";$("familyBankDetails").value="";
      set("familyBankMsg","Request recorded. This is not an account opening, credit approval, or money transfer.");
      await window.loadFamilyBank();
    }catch(e){set("familyBankMsg",e.message);}
  };
  document.addEventListener("DOMContentLoaded",function(){
    const b=document.querySelector('[onclick*="loadFamilyBank"]');
    if(b)b.addEventListener("click",()=>window.loadFamilyBank());
  });
})();