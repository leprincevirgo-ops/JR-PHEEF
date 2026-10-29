/* JR PHEEF Opportunity Posting workspace. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  async function api(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" }
    }, options || {}));
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || "Request failed.");
    return data;
  }
  function say(id, text) { const el=$(id); if(el) el.textContent=text; }
  function card(op, mine) {
    const status = op.verification_status === "verified" ? "VERIFIED CHECK" :
      op.verification_status === "pending" ? "VERIFICATION PENDING" : "UNVERIFIED";
    const statusClass = op.verification_status === "verified" ? "badge" : "badge";
    return '<article class="listing"><span class="' + statusClass + '">' + esc(status) + '</span>' +
      '<h3>' + esc(op.title) + '</h3><p>' + esc(op.description) + '</p>' +
      '<p class="muted">' + esc((op.availability_status || "available_now").replaceAll("_"," ")) +
      ' · ' + esc((op.audience_scope || "local_and_international").replaceAll("_"," ")) +
      (op.location ? ' · ' + esc(op.location) : "") + '</p>' +
      (op.offer_details ? '<p><b>Offered:</b> ' + esc(op.offer_details) + '</p>' : '') +
      (op.requirements ? '<p><b>Needed:</b> ' + esc(op.requirements) + '</p>' : '') +
      (op.commercial_terms ? '<p><b>Terms:</b> ' + esc(op.commercial_terms) + '</p>' : '') +
      '<p class="muted">JR PHEEF does not guarantee the claims or outcome of this opportunity.</p>' +
      (mine ? '<button class="dark" onclick="closeOpportunity(\'' + esc(op.id) + '\')">CLOSE OPPORTUNITY</button>' :
      '<button class="primary" onclick="expressOpportunityInterest(\'' + esc(op.id) + '\')">EXPRESS INTEREST</button>') +
      '</article>';
  }
  window.loadOpportunities = async function () {
    const host=$("opportunityFeed"); if(!host) return;
    host.textContent="Loading opportunities…";
    try {
      const d=await api("/api/opportunities");
      host.innerHTML=(d.opportunities||[]).map(op=>card(op,false)).join("") ||
        '<p class="muted">No published opportunities yet. Check again later.</p>';
    } catch(e) { host.textContent=e.message; }
  };
  window.loadMyOpportunities = async function () {
    const host=$("myOpportunityFeed"); if(!host) return;
    host.textContent="Loading your posts…";
    try {
      const d=await api("/api/opportunities/mine");
      host.innerHTML=(d.opportunities||[]).map(op=>card(op,true)).join("") ||
        '<p class="muted">You have not posted any opportunities yet.</p>';
    } catch(e) { host.textContent=e.message; }
  };
  window.postOpportunity = async function () {
    const button=document.querySelector('#opportunities button[onclick="postOpportunity()"]');
    if(button) button.disabled=true;
    say("opPostMessage","Publishing opportunity…");
    try {
      const deadline=$("opDeadline").value;
      const regions=$("opRegions").value.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean);
      const payload={
        title:$("opTitle").value, description:$("opDescription").value,
        opportunity_type:"business_opportunity",
        availability_status:$("opAvailability").value,
        audience_scope:$("opAudience").value,
        country_code:$("opCountry").value.trim().toUpperCase(),
        location:$("opLocation").value,
        eligible_regions:regions,
        offer_details:$("opOffer").value,
        requirements:$("opRequirements").value,
        commercial_terms:$("opTerms").value,
        currency_code:$("opCurrency").value.trim().toUpperCase(),
        deadline_at:deadline ? new Date(deadline).toISOString() : null
      };
      const d=await api("/api/opportunities",{method:"POST",body:JSON.stringify(payload)});
      say("opPostMessage",d.message || "Opportunity published.");
      ["opTitle","opDescription","opLocation","opRegions","opOffer","opRequirements","opTerms","opCountry","opCurrency","opDeadline"].forEach(id=>{const e=$(id);if(e)e.value="";});
      await Promise.all([window.loadOpportunities(),window.loadMyOpportunities()]);
    } catch(e) { say("opPostMessage",e.message); }
    finally { if(button) button.disabled=false; }
  };
  window.expressOpportunityInterest = async function (id) {
    try {
      const d=await api("/api/opportunities/"+encodeURIComponent(id)+"/interest",{
        method:"POST",body:JSON.stringify({message:"I am interested in learning more about this opportunity."})
      });
      window.alert(d.message || "Interest recorded.");
    } catch(e) { window.alert(e.message); }
  };
  window.closeOpportunity = async function (id) {
    if(!window.confirm("Close this opportunity? It will no longer appear in the active feed.")) return;
    try {
      await api("/api/opportunities/"+encodeURIComponent(id),{
        method:"PATCH",body:JSON.stringify({publication_status:"closed"})
      });
      await Promise.all([window.loadOpportunities(),window.loadMyOpportunities()]);
    } catch(e) { window.alert(e.message); }
  };
})();
