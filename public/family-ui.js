/* FAMILY member workspace and honest referral centre. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  let currentMember = null;
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const money = value => "KSh " + Number(value || 0).toLocaleString("en-KE", {maximumFractionDigits:2});
  async function apiCall(url, options) {
    const response = await fetch(url, Object.assign({credentials:"same-origin", headers:{"Content-Type":"application/json"}}, options || {}));
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || data.message || "The request could not be completed.");
    return data;
  }
  function setText(id, value) { const node=$(id); if(node) node.textContent=value; }
  function message(id, value) { setText(id, value); }
  function goalCard(goal) {
    const target=Number(goal.target_amount||0), saved=Number(goal.saved_amount||0);
    const percent=target>0?Math.max(0,Math.min(100,Math.round(saved/target*100))):0;
    return '<article class="listing"><b>'+esc(goal.title)+'</b><p>'+money(saved)+' saved of '+money(target)+' · '+percent+'%</p><div style="height:8px;background:#16344c;border-radius:8px;overflow:hidden"><div style="height:8px;width:'+percent+'%;background:linear-gradient(90deg,#168dff,#42f5ff)"></div></div><p class="muted">Status: '+esc(goal.status||"active")+(goal.target_date?' · Target: '+esc(goal.target_date):'')+'</p><label>Update saved amount (tracker only)</label><input id="familySaved-'+esc(goal.id)+'" type="number" min="0" step="1" value="'+saved+'"><button onclick="updateFamilyGoal(\''+esc(goal.id)+'\')">UPDATE</button> <button class="dark" onclick="deleteFamilyGoal(\''+esc(goal.id)+'\')">DELETE GOAL</button></article>';
  }
  async function ensureFamilyJoined() {
    const data=await apiCall("/api/ecosystem");
    const link=(data.links||{}).family;
    if(link && link.status!=="left") return true;
    const host=$("familyGoalsList");
    if(host) host.innerHTML='<div class="listing"><b>Join FAMILY to begin</b><p class="muted">FAMILY is a separate member workspace. Joining shares your basic profile (name and JP number) with FAMILY; no contact or activity sharing is selected.</p><button class="primary" onclick="joinFamily()">JOIN FAMILY</button></div>';
    return false;
  }
  window.joinFamily=async function(){
    message("familyGoalMsg","Joining FAMILY…");
    try {
      const data=await apiCall("/api/ecosystem/join",{method:"POST",body:JSON.stringify({venture:"family",scopes:["profile"]})});
      message("familyGoalMsg",data.message||"FAMILY access updated.");
      await window.loadFamily();
    } catch(e){message("familyGoalMsg",e.message);}
  };
  window.loadFamily=async function(){
    try {
      if(!await ensureFamilyJoined()) return;
      const [goals,requests,summary]=await Promise.all([
        apiCall("/api/family/goals"),apiCall("/api/family/applications"),apiCall("/api/ecosystem/me")
      ]);
      const gs=goals.goals||[], rs=requests.requests||[], fam=summary.family||{};
      setText("familyGoalCount",gs.length);
      setText("familySavedTotal",money(gs.reduce((sum,g)=>sum+Number(g.saved_amount||0),0)));
      setText("familyRequestCount",rs.length);
      const gh=$("familyGoalsList");
      if(gh) gh.innerHTML=gs.map(goalCard).join("")||'<p class="muted">No goals yet. Add your first goal above.</p>';
      const rh=$("familyRequestsList");
      if(rh) rh.innerHTML='<h3>MY RECORDED REQUESTS</h3>'+(rs.map(r=>'<article class="listing"><b>'+esc(String(r.kind||"request").toUpperCase())+' · '+money(r.amount)+'</b><p>'+esc(r.purpose)+'</p><p class="muted">Status: '+esc(r.status)+' · '+esc(String(r.created_at||"").slice(0,10))+'</p>'+(r.partner_note?'<p>'+esc(r.partner_note)+'</p>':'')+'</article>').join("")||'<p class="muted">No requests recorded.</p>');
    } catch(e) { message("familyGoalMsg",e.message+" If you have not joined FAMILY, use the JOIN FAMILY button on this page."); }
  };
  window.createFamilyGoal=async function(){
    const title=$("familyGoalTitle").value.trim(), target=Number($("familyGoalTarget").value), saved=Number($("familyGoalSaved").value||0), date=$("familyGoalDate").value;
    message("familyGoalMsg","Saving goal…");
    try {
      await apiCall("/api/family/goals",{method:"POST",body:JSON.stringify({title,target_amount:target,saved_amount:saved,target_date:date||null})});
      $("familyGoalTitle").value=""; $("familyGoalTarget").value=""; $("familyGoalSaved").value="0"; $("familyGoalDate").value="";
      message("familyGoalMsg","Goal saved. This is a personal tracker, not money held by FAMILY.");
      await window.loadFamily();
    } catch(e){message("familyGoalMsg",e.message);}
  };
  window.updateFamilyGoal=async function(id){
    const field=$("familySaved-"+id);
    try {await apiCall("/api/family/goals/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({saved_amount:Number(field.value)})}); await window.loadFamily();}
    catch(e){message("familyGoalMsg",e.message);}
  };
  window.deleteFamilyGoal=async function(id){
    if(!confirm("Delete this savings goal tracker?")) return;
    try {await apiCall("/api/family/goals/"+encodeURIComponent(id),{method:"DELETE"}); await window.loadFamily();}
    catch(e){message("familyGoalMsg",e.message);}
  };
  window.submitFamilyRequest=async function(){
    const kind=$("familyRequestKind").value, amount=Number($("familyRequestAmount").value), purpose=$("familyRequestPurpose").value.trim();
    message("familyRequestMsg","Recording request…");
    try {
      const data=await apiCall("/api/family/applications",{method:"POST",body:JSON.stringify({kind,amount,purpose})});
      $("familyRequestAmount").value=""; $("familyRequestPurpose").value="";
      message("familyRequestMsg",data.message||"Request recorded. It is not an approval or offer of funding.");
      await window.loadFamily();
    } catch(e){message("familyRequestMsg",e.message);}
  };
  window.loadReferralCenter=async function(){
    try {
      const data=await apiCall("/api/me"), member=data.member||{}; currentMember=member;
      setText("referralJpNumber",member.jp_number||"Not available");
      setText("referralCode",member.referral_code||"No referral code assigned yet");
      const button=document.querySelector('#referrals button.primary');
      if(button) button.disabled=!member.referral_code;
      setText("referralMsg",member.referral_code?"You can share your code. Trackable referral links and rewards are not active until the referral backend is implemented.":"A unique referral code has not been assigned to this account yet.");
    } catch(e){setText("referralJpNumber","Sign in required");setText("referralCode","Unavailable");setText("referralMsg",e.message);}
  };
  function inviteText(){
    const code=(currentMember&&currentMember.referral_code)||"";
    return "Join me on JR PHEEF — Find. Match. Trade. "+(code?"My invite code: "+code:"");
  }
  window.copyReferralInvite=async function(){
    try {await navigator.clipboard.writeText(inviteText());setText("referralMsg","Invitation message copied.");}
    catch(e){setText("referralMsg","Copy is unavailable in this browser. Select and copy the invitation text: "+inviteText());}
  };
  window.shareReferralInvite=async function(){
    const text=inviteText();
    if(navigator.share){try{await navigator.share({title:"Join JR PHEEF",text});setText("referralMsg","Share sheet opened.");}catch(e){if(e.name!=="AbortError")setText("referralMsg","Sharing was not completed.");}}
    else window.copyReferralInvite();
  };
})();