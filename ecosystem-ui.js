/* JR PHEEF + DGBO + FAMILY ecosystem UI. Load after extras-ui.js:
   <script src="/ecosystem-ui.js"></script>
   Fills the ECOSYSTEM page with live data, FAMILY goals and the owner's DGBO panel. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => escapeHtml(v);
  const KSH = n => "KSh " + Number(n || 0).toLocaleString("en-KE");
  const when = d => (d ? new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "");
  const SCOPE_TEXT = { profile: "Basic profile (name and JP number)", contact: "Contact details (phone and email)", activity: "Activity summary (counts only)" };
  let inited = false, state = null;

  async function call(url, method, body) {
    const o = { method: method || "GET", credentials: "include" };
    if (body !== undefined) { o.headers = { "Content-Type": "application/json" }; o.body = JSON.stringify(body); }
    try { return await (await fetch(url, o)).json(); }
    catch (e) { return { ok: false, error: "Network error. Please try again." }; }
  }

  function inject() {
    const page = $("ecosystem");
    const cards = [...page.children];
    if (cards[0]) cards[0].classList.add("hidden");                 // old static intro
    if (cards.length > 1) cards[cards.length - 1].classList.add("hidden"); // old static status list
    page.insertAdjacentHTML("afterbegin", `<div id="ecoLive"><div class="card"><p class="muted">Loading your ecosystem…</p></div></div>`);
  }

  const prev = window.show;
  window.show = function (id) { prev(id); if (inited && id === "ecosystem") load(); };

  async function load() {
    const [eco, mine] = await Promise.all([call("/api/ecosystem"), call("/api/ecosystem/me")]);
    if (!eco.ok) { $("ecoLive").innerHTML = `<div class="card">${esc(eco.error || "Could not load.")}</div>`; return; }
    state = { eco, mine: mine.ok ? mine : null };
    const fam = eco.links.family && eco.links.family.status !== "left" ? eco.links.family : null;
    let html = renderOverview(eco, state.mine, fam);
    if (fam) html += await renderFamily(fam); else html += renderJoin();
    if (eco.is_owner) html += `<div id="dgboPanel"><div class="card"><p class="muted">Loading DGBO…</p></div></div>`;
    $("ecoLive").innerHTML = html;
    if (eco.is_owner) loadDgbo();
  }

  /* ---------- overview ---------- */
  function renderOverview(eco, mine, fam) {
    const badge = v => `<span class="badge">${esc(v.status === "active" ? "ACTIVE" : v.status === "paused" ? "PAUSED" : "COMING SOON")}</span>${v.regulated ? ' <span class="badge">LICENCE REQUIRED</span>' : ""}`;
    const tiles = eco.ventures.map(v => `<div class="listing"><b>${esc(v.name)}</b><br>${badge(v)}<p class="muted">${esc(v.description || "")}</p></div>`).join("");
    const jr = mine && mine.jr_pheef, f = mine && mine.family;
    return `
<div class="card"><p style="letter-spacing:2px;color:#42f5ff;font-size:11px;font-weight:bold">ONE ECOSYSTEM · ONE IDENTITY</p><h2>DGBO · JR PHEEF · FAMILY</h2>
 <p class="muted">One account runs everything. Each venture only sees what you choose to share, and you can change that at any time.</p><div class="grid">${tiles}</div></div>
${mine ? `<div class="card"><h3>My whole picture</h3><div class="grid">
 <div class="listing"><b>JR PHEEF</b><p>${jr.active_listings} active listings · ${jr.open_deals} open deals · ${jr.unread_alerts} unread alerts</p><p class="muted">Plan: ${esc(jr.plan)} · ${jr.points} points</p></div>
 <div class="listing"><b>FAMILY</b>${f.joined ? `<p>${f.goals} goals · ${KSH(f.saved)} saved of ${KSH(f.target)}</p><p class="muted">${f.requests} finance request(s) · ${esc(f.status)}</p>` : `<p class="muted">Not joined yet.</p>`}</div></div></div>` : ""}`;
  }

  /* ---------- join FAMILY ---------- */
  function renderJoin() {
    return `<div class="card"><h3>Join FAMILY</h3>
 <p class="muted">Financial Access to Money for Investments &amp; Loving Yourself. Today FAMILY offers <b>savings goals</b> you track yourself and <b>finance requests</b> that the team can refer to licensed partners. <b>FAMILY does not hold your money and does not lend.</b></p>
 <p><b>What FAMILY may see:</b></p>
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" checked disabled style="width:auto;margin:0"> ${SCOPE_TEXT.profile} (needed)</label>
 <label style="display:flex;gap:8px;align-items:center"><input id="scContact" type="checkbox" style="width:auto;margin:0"> ${SCOPE_TEXT.contact}</label>
 <label style="display:flex;gap:8px;align-items:center"><input id="scActivity" type="checkbox" style="width:auto;margin:0"> ${SCOPE_TEXT.activity}</label>
 <button class="primary" onclick="ecoJoin()">JOIN FAMILY</button><p id="ecoMsg" class="muted" aria-live="polite"></p></div>`;
  }
  window.ecoJoin = async function () {
    const scopes = ["profile"]; if ($("scContact").checked) scopes.push("contact"); if ($("scActivity").checked) scopes.push("activity");
    const d = await call("/api/ecosystem/join", "POST", { venture: "family", scopes });
    if (!d.ok) { $("ecoMsg").textContent = d.error || "Could not join."; return; }
    alert(d.message); load();
  };

  /* ---------- FAMILY member area ---------- */
  async function renderFamily(link) {
    const [goals, reqs] = await Promise.all([call("/api/family/goals"), call("/api/family/applications")]);
    const has = s => (link.consent_scopes || []).includes(s);
    const goalHtml = goals.ok ? ((goals.goals || []).map(g => {
      const pct = Math.min(100, Math.round(Number(g.saved_amount) / Number(g.target_amount) * 100));
      return `<div class="listing"><b>${esc(g.title)}</b> <span class="badge">${esc(g.status)}</span><br>${KSH(g.saved_amount)} of ${KSH(g.target_amount)} · ${pct}%${g.target_date ? " · by " + esc(g.target_date) : ""}
        <div style="height:8px;background:#063653;border-radius:6px;margin:8px 0"><div style="height:8px;width:${pct}%;background:#42f5ff;border-radius:6px"></div></div>
        <button onclick="goalSaved('${esc(g.id)}',${Number(g.saved_amount)})">UPDATE SAVED</button><button class="danger" onclick="goalDelete('${esc(g.id)}')">DELETE</button></div>`;
    }).join("") || "<p class='muted'>No goals yet. Add your first one below.</p>") : esc(goals.error || "");
    const reqHtml = reqs.ok ? ((reqs.requests || []).map(r => `<div class="listing"><b>${esc(r.kind)}</b> · ${KSH(r.amount)} <span class="badge">${esc(r.status)}</span><br>${esc(r.purpose)}${r.partner_note ? `<br><span class="muted">Note: ${esc(r.partner_note)}</span>` : ""}<br><span class="muted">${esc(when(r.created_at))}</span></div>`).join("") || "<p class='muted'>No requests yet.</p>") : "";
    return `
<div class="card"><h3>FAMILY ${link.status === "waitlist" ? '<span class="badge">WAITING LIST</span>' : '<span class="badge">ACTIVE</span>'}</h3>
 <p class="muted">${link.status === "waitlist" ? "Financial services open only after licensing. Savings goals work today." : "Welcome to FAMILY."} FAMILY does not hold money or lend.</p>
 <h4>What FAMILY may see</h4>
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" checked disabled style="width:auto;margin:0"> ${SCOPE_TEXT.profile} (needed)</label>
 <label style="display:flex;gap:8px;align-items:center"><input id="scContact" type="checkbox" ${has("contact") ? "checked" : ""} style="width:auto;margin:0"> ${SCOPE_TEXT.contact}</label>
 <label style="display:flex;gap:8px;align-items:center"><input id="scActivity" type="checkbox" ${has("activity") ? "checked" : ""} style="width:auto;margin:0"> ${SCOPE_TEXT.activity}</label>
 <button class="primary" onclick="ecoConsent()">SAVE SHARING CHOICES</button><button class="danger" onclick="ecoLeave()">LEAVE FAMILY</button><p id="ecoMsg" class="muted" aria-live="polite"></p></div>
<div class="card"><h3>My savings goals</h3><p class="muted">You track your own progress here. No money moves through JR PHEEF.</p>${goalHtml}
 <input id="gTitle" maxlength="120" placeholder="Goal (e.g. School fees, Stock for my shop)"><input id="gTarget" type="number" min="1" placeholder="Target amount (KSh)">
 <input id="gSaved" type="number" min="0" placeholder="Already saved (KSh, optional)"><input id="gDate" type="date" aria-label="Target date">
 <button class="primary" onclick="goalAdd()">ADD GOAL</button><p id="gMsg" class="muted" aria-live="polite"></p></div>
<div class="card"><h3>Finance requests</h3>
 <p class="muted">Tell us what you need. Requests are recorded and the team may refer you to a licensed partner. Nothing is approved or paid out through JR PHEEF.</p>${reqHtml}
 <select id="rKind"><option value="loan">Loan</option><option value="investment">Investment</option><option value="savings">Savings</option></select>
 <input id="rAmount" type="number" min="100" placeholder="Amount (KSh)"><textarea id="rPurpose" rows="3" maxlength="500" placeholder="What is it for? (no phone numbers or links)"></textarea>
 <button class="primary" onclick="reqSend()">SEND REQUEST</button><p id="rMsg" class="muted" aria-live="polite"></p></div>`;
  }
  window.ecoConsent = async function () {
    const scopes = ["profile"]; if ($("scContact").checked) scopes.push("contact"); if ($("scActivity").checked) scopes.push("activity");
    const d = await call("/api/ecosystem/consent", "PATCH", { venture: "family", scopes });
    $("ecoMsg").textContent = d.ok ? "Sharing choices saved." : (d.error || "Could not save.");
  };
  window.ecoLeave = async function () {
    if (!confirm("Leave FAMILY? Sharing stops immediately.")) return;
    const del = confirm("Also delete your goals and any requests that have not been referred?\nOK = delete them, Cancel = keep them.");
    const d = await call("/api/ecosystem/leave", "POST", { venture: "family", delete_data: del });
    alert(d.ok ? d.message : (d.error || "Could not leave.")); load();
  };
  window.goalAdd = async function () {
    const d = await call("/api/family/goals", "POST", { title: $("gTitle").value, target_amount: Number($("gTarget").value), saved_amount: $("gSaved").value === "" ? 0 : Number($("gSaved").value), target_date: $("gDate").value || undefined });
    if (!d.ok) { $("gMsg").textContent = d.error || "Could not add the goal."; return; } load();
  };
  window.goalSaved = async function (id, cur) {
    const v = prompt("How much have you saved so far (KSh)?", String(cur)); if (v === null) return;
    const d = await call("/api/family/goals/" + encodeURIComponent(id), "PATCH", { saved_amount: Number(v) });
    if (!d.ok) alert(d.error || "Could not update."); load();
  };
  window.goalDelete = async function (id) {
    if (!confirm("Delete this goal?")) return;
    const d = await call("/api/family/goals/" + encodeURIComponent(id), "DELETE"); if (!d.ok) alert(d.error || "Failed."); load();
  };
  window.reqSend = async function () {
    const d = await call("/api/family/applications", "POST", { kind: $("rKind").value, amount: Number($("rAmount").value), purpose: $("rPurpose").value });
    if (!d.ok) { $("rMsg").textContent = d.error || "Could not send."; return; }
    alert(d.message); load();
  };

  /* ---------- DGBO owner panel ---------- */
  async function loadDgbo() {
    const [ov, dec, apps] = await Promise.all([call("/api/dgbo/overview"), call("/api/dgbo/decisions"), call("/api/dgbo/family/applications")]);
    const host = $("dgboPanel"); if (!host) return;
    if (!ov.ok) { host.innerHTML = `<div class="card">${esc(ov.error || "")}</div>`; return; }
    const t = (n, l) => `<div class="listing"><div class="big">${n}</div>${l}</div>`;
    const j = ov.jr_pheef, f = ov.family;
    host.innerHTML = `
<div class="card"><p style="letter-spacing:2px;color:#42f5ff;font-size:11px;font-weight:bold">DGBO · OWNER ONLY</p><h2>Group overview</h2>
 <div class="grid">${t(j.members, "JR PHEEF members")}${t(j.active_listings, "Active listings")}${t(j.open_deals + " / " + j.completed_deals, "Deals open / done")}${t(KSH(j.revenue_ksh), "Payments received")}${t(j.approved_riders + " (+" + j.rider_applications + ")", "Riders (waiting)")}${t(f.waitlist + " / " + f.active, "FAMILY waiting / active")}${t(f.goals, "FAMILY goals")}${t(f.requests_waiting + " / " + f.requests_referred, "Requests new / referred")}${t(ov.dgbo.decisions_waiting, "Decisions waiting")}</div>
 <button class="dark" onclick="load_dgbo()">REFRESH</button></div>
<div class="card"><h3>Ventures</h3>${ov.ventures.filter(v => v.slug !== "dgbo").map(v => `<div class="listing"><b>${esc(v.name)}</b> <span class="badge">${esc(v.status)}</span>${v.regulated ? ' <span class="badge">regulated</span>' : ""}<br>
  ${v.regulated ? `<span class="muted">Licence reference: ${esc(v.licence_ref || "none")}. A regulated venture cannot be activated without one.</span><br><input id="lic-${esc(v.slug)}" placeholder="Licence reference" value="${esc(v.licence_ref || "")}"><button onclick="ventureSet('${esc(v.slug)}',true)">SAVE LICENCE</button>` : ""}
  <button class="primary" onclick="ventureSet('${esc(v.slug)}',false,'active')">ACTIVATE</button><button class="dark" onclick="ventureSet('${esc(v.slug)}',false,'paused')">PAUSE</button></div>`).join("")}
 <p id="ventureMsg" class="muted"></p></div>
<div class="card"><h3>Decisions</h3>${dec.ok ? ((dec.decisions || []).map(d => `<div class="listing"><b>${esc(d.title)}</b> <span class="badge">${esc(d.status)}</span>${d.venture ? ' <span class="badge">' + esc(d.venture) + "</span>" : ""}<br>${esc(d.details || "")}<br><span class="muted">${esc(when(d.created_at))}</span>
  ${d.status === "proposed" ? `<br><button class="primary" onclick="decide('${esc(d.id)}','approved')">APPROVE</button><button class="danger" onclick="decide('${esc(d.id)}','rejected')">REJECT</button>` : ""}</div>`).join("") || "<p class='muted'>No decisions logged.</p>") : ""}
 <input id="dcTitle" maxlength="160" placeholder="Decision or proposal title"><textarea id="dcDetails" rows="2" placeholder="Details (optional)"></textarea>
 <select id="dcVenture"><option value="">Group level</option><option value="jr-pheef">JR PHEEF</option><option value="family">FAMILY</option></select>
 <button class="primary" onclick="decisionAdd()">LOG PROPOSAL</button></div>
<div class="card"><h3>FAMILY requests waiting</h3>${apps.ok ? ((apps.requests || []).map(r => `<div class="listing"><b>${esc(r.kind)} · ${KSH(r.amount)}</b><br>${esc(r.purpose)}<br>
  <span class="muted">${esc(r.applicant.name)}${r.applicant.jp_number ? " · " + esc(r.applicant.jp_number) : ""}${r.applicant.phone ? " · " + esc(r.applicant.phone) : ""}${r.applicant.email ? " · " + esc(r.applicant.email) : ""}${r.applicant.contact_consented ? "" : " · contact not shared"} · ${esc(when(r.created_at))}</span><br>
  <button class="primary" onclick="reqMove('${esc(r.id)}','referred')">REFERRED TO PARTNER</button><button class="dark" onclick="reqMove('${esc(r.id)}','closed')">CLOSE</button></div>`).join("") || "<p class='muted'>Nothing waiting.</p>") : ""}</div>`;
  }
  window.load_dgbo = loadDgbo;
  window.ventureSet = async function (slug, licenceOnly, status) {
    const body = {}; const lic = $("lic-" + slug);
    if (lic) body.licence_ref = lic.value.trim();
    if (!licenceOnly && status) body.status = status;
    const d = await call("/api/dgbo/ventures/" + encodeURIComponent(slug), "PATCH", body);
    if (!d.ok) { alert(d.error || "Could not update."); return; } loadDgbo();
  };
  window.decisionAdd = async function () {
    const d = await call("/api/dgbo/decisions", "POST", { title: $("dcTitle").value, details: $("dcDetails").value, venture: $("dcVenture").value || undefined });
    if (!d.ok) { alert(d.error || "Could not log."); return; } loadDgbo();
  };
  window.decide = async function (id, status) {
    if (!confirm("Mark this decision as " + status + "?")) return;
    const d = await call("/api/dgbo/decisions/" + encodeURIComponent(id), "PATCH", { status }); if (!d.ok) alert(d.error || "Failed."); loadDgbo();
  };
  window.reqMove = async function (id, status) {
    const note = prompt(status === "referred" ? "Which licensed partner was the member referred to? (shown to the member)" : "Short note for the member (optional)", ""); if (note === null) return;
    const d = await call("/api/dgbo/family/applications/" + encodeURIComponent(id), "PATCH", { status, partner_note: note }); if (!d.ok) alert(d.error || "Failed."); loadDgbo();
  };

  const starter = setInterval(() => {
    if (inited || !$("ecosystem") || !$("app") || $("app").classList.contains("hidden") || typeof me === "undefined" || !me) return;
    inited = true; clearInterval(starter); inject();
  }, 700);
})();
