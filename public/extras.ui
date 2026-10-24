/* JR PHEEF extras UI: DELIVERY, POWER SALE, MEMBERSHIP (M-Pesa) and owner panels.
   Load AFTER market-ui.js:  <script src="/extras-ui.js"></script> */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => escapeHtml(v);
  const KSH = n => "KSh " + Number(n || 0).toLocaleString("en-KE");
  const when = d => (d ? new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "");
  const isOwner = () => !!(typeof me !== "undefined" && me && me.is_owner);
  let inited = false, payPoll = null;

  async function call(url, method, body) {
    const o = { method: method || "GET", credentials: "include" };
    if (body !== undefined) { o.headers = { "Content-Type": "application/json" }; o.body = JSON.stringify(body); }
    try { return await (await fetch(url, o)).json(); }
    catch (e) { return { ok: false, error: "Network error. Please try again." }; }
  }

  const PAGES = `
<div id="delivery" class="page hidden">
 <div class="card"><h2>DELIVERY</h2>
  <p class="muted">Ask a rider to move an item for you. Agree the price up front. You pay the rider directly when the item arrives; JR PHEEF does not take payment for deliveries.</p>
  <input id="dvPickup" maxlength="200" placeholder="Pickup place (area, building)">
  <input id="dvDest" maxlength="200" placeholder="Destination (area, building)">
  <textarea id="dvDesc" rows="2" maxlength="500" placeholder="What is being delivered? Size, weight, fragile?"></textarea>
  <input id="dvNotes" maxlength="300" placeholder="Pickup notes (optional): gate, floor, time">
  <input id="dvPrice" type="number" min="50" placeholder="Rider fee you offer (KSh)">
  <button class="primary" onclick="createDelivery()">REQUEST DELIVERY</button><p id="dvMsg" class="muted" aria-live="polite"></p></div>
 <div class="card"><h3>My delivery requests</h3><button class="dark" onclick="loadDelivery()">REFRESH</button><div id="dvMine"></div></div>
 <div class="card"><h3>Rider corner</h3><div id="dvRider"><p class="muted">Loading…</p></div></div>
</div>

<div id="powersale" class="page hidden">
 <div class="card"><h2>POWER SALE</h2>
  <p class="muted">Live discounts from JR PHEEF sellers. Prices return to normal when a sale ends. Selling something? Open MY LISTINGS and tap POWER SALE on a listing.</p>
  <button class="dark" onclick="show('powersale')">REFRESH</button><button onclick="show('mylistings')">RUN A POWER SALE</button>
  <p id="psMsg" class="muted" aria-live="polite"></p><div id="psList"></div></div>
</div>

<div id="membership" class="page hidden">
 <div class="card"><h2>MEMBERSHIP</h2><div id="memStatus"><p class="muted">Loading…</p></div></div>
 <div class="card" id="memBuy"><h3>Choose a plan</h3>
  <div class="grid">
   <div class="listing"><b>PRO</b><div class="big">KSh 99</div><p class="muted">per 30 days. Reduced connection fees and priority visibility.</p><button class="primary" onclick="payFor('membership_pro')">PAY WITH M-PESA</button></div>
   <div class="listing"><b>PRIME</b><div class="big">KSh 149</div><p class="muted">per 30 days. Everything in PRO plus premium business tools as they launch.</p><button class="primary" onclick="payFor('membership_prime')">PAY WITH M-PESA</button></div>
  </div>
  <input id="payPhone" placeholder="M-Pesa number (07XXXXXXXX), leave blank to use your profile number">
  <p id="payMsg" class="muted" aria-live="polite"></p></div>
 <div class="card"><h3>Payment history</h3><div id="payHistory"></div></div>
</div>`;

  const OWNER_CARDS = `
<div class="card" id="cmdRidersCard"><h3>Rider applications</h3><div id="cmdRiders"></div></div>
<div class="card" id="cmdPaymentsCard"><h3>Payments</h3><div id="cmdPayments"></div></div>`;

  function inject() {
    $("app").insertAdjacentHTML("beforeend", PAGES);
    const nav = document.querySelector("#app .nav");
    const first = nav.children[1] || null;
    [["DELIVERY", "delivery"], ["POWER SALE", "powersale"], ["MEMBERSHIP", "membership"]].forEach(([label, id]) => {
      const b = document.createElement("button"); b.textContent = label; b.onclick = () => show(id); nav.insertBefore(b, first);
    });
    if ($("command")) $("command").insertAdjacentHTML("beforeend", OWNER_CARDS);
  }

  const prevShow = window.show;
  window.show = function (id) {
    prevShow(id);
    if (!inited) return;
    if (payPoll && id !== "membership") { clearInterval(payPoll); payPoll = null; }
    if (id === "delivery") loadDelivery();
    if (id === "powersale") loadPowerSale();
    if (id === "membership") loadMembership();
    if (id === "command" && isOwner()) loadOwnerExtras();
  };

  /* ---------- DELIVERY ---------- */
  const STEP = { open: "Looking for a rider", accepted: "Rider on the way to pick up", picked_up: "On the way to you", delivered: "Delivered", cancelled: "Cancelled" };
  window.createDelivery = async function () {
    const d = await call("/api/delivery", "POST", {
      pickup: $("dvPickup").value, destination: $("dvDest").value, description: $("dvDesc").value,
      pickup_notes: $("dvNotes").value, price: Number($("dvPrice").value)
    });
    $("dvMsg").textContent = d.ok ? "Request posted. Riders can now accept it." : (d.error || "Could not post the request.");
    if (d.ok) { ["dvPickup", "dvDest", "dvDesc", "dvNotes", "dvPrice"].forEach(i => $(i).value = ""); loadDelivery(); }
  };
  window.loadDelivery = async function () {
    const [mine, rider] = await Promise.all([call("/api/delivery/mine"), call("/api/riders/me")]);
    $("dvMine").innerHTML = mine.ok ? ((mine.requested || []).map(x => `
      <div class="listing"><b>${esc(x.pickup)} → ${esc(x.destination)}</b> <span class="badge">${esc(STEP[x.status] || x.status)}</span><br>
      ${esc(x.description)}<br>Rider fee: <b>${KSH(x.price)}</b> · <span class="muted">${esc(when(x.created_at))}</span><br>
      ${x.rider ? `Rider: <b>${esc(x.rider.name)}</b>${x.rider.verified ? " ✔" : ""} · ${esc(String(x.rider.vehicle_type || "").replace("_", " "))} ${esc(x.rider.vehicle_number || "")}<br>` : ""}
      ${["open", "accepted"].includes(x.status) ? `<button class="danger" onclick="cancelDelivery('${esc(x.id)}')">CANCEL</button>` : ""}
      ${x.status === "delivered" ? `<span class="muted">Please pay the rider ${KSH(x.price)} directly.</span>` : ""}</div>`).join("") || "<p class='muted'>No delivery requests yet.</p>") : esc(mine.error || "");
    renderRider(rider, mine);
  };
  window.cancelDelivery = async function (id) {
    if (!confirm("Cancel this delivery?")) return;
    const d = await call("/api/delivery/" + encodeURIComponent(id) + "/cancel", "POST", {});
    if (!d.ok) alert(d.error || "Could not cancel."); loadDelivery();
  };

  async function renderRider(rider, mine) {
    const host = $("dvRider");
    if (!rider.ok) { host.innerHTML = esc(rider.error || ""); return; }
    const r = rider.rider;
    if (!r) {
      host.innerHTML = `<p class="muted">Earn by delivering for JR PHEEF members. Apply and wait for approval.</p>
        <select id="rdVehicle"><option value="motorbike">Motorbike</option><option value="bicycle">Bicycle</option><option value="car">Car</option><option value="pickup">Pickup</option><option value="van">Van</option><option value="truck">Truck</option><option value="on_foot">On foot</option></select>
        <input id="rdPlate" maxlength="20" placeholder="Vehicle registration (not needed for bicycle or on foot)">
        <input id="rdCompany" maxlength="80" placeholder="Business name (optional)">
        <input id="rdArea" maxlength="120" placeholder="Area you work in">
        <button class="primary" onclick="applyRider()">APPLY TO BE A RIDER</button><p id="rdMsg" class="muted"></p>`;
      return;
    }
    if (!r.approved) { host.innerHTML = `<p>Your rider application is <b>waiting for approval</b>. You will get an alert when it is reviewed.</p>`; return; }
    const open = await call("/api/delivery/open");
    const myJobs = (mine.assigned || []);
    host.innerHTML = `
      <p>You are <b>${r.online ? "ONLINE" : "offline"}</b>${r.verified ? " · verified ✔" : ""}. Area: ${esc(r.location || "")}</p>
      <button class="${r.online ? "dark" : "primary"}" onclick="setRiderOnline(${r.online ? "false" : "true"})">${r.online ? "GO OFFLINE" : "GO ONLINE"}</button>
      <h4>My jobs</h4>${myJobs.filter(j => ["accepted", "picked_up"].includes(j.status)).map(j => `
        <div class="listing"><b>${esc(j.pickup)} → ${esc(j.destination)}</b> <span class="badge">${esc(STEP[j.status])}</span><br>${esc(j.description)}<br>${j.pickup_notes ? "Notes: " + esc(j.pickup_notes) + "<br>" : ""}Fee: <b>${KSH(j.price)}</b><br>
        ${j.status === "accepted" ? `<button class="primary" onclick="riderStep('${esc(j.id)}','picked_up')">PICKED UP</button><button class="dark" onclick="riderRelease('${esc(j.id)}')">RELEASE JOB</button>` : `<button class="primary" onclick="riderStep('${esc(j.id)}','delivered')">DELIVERED</button>`}</div>`).join("") || "<p class='muted'>No active jobs.</p>"}
      <h4>Open requests</h4>${open.ok ? ((open.jobs || []).map(j => `
        <div class="listing"><b>${esc(j.pickup)} → ${esc(j.destination)}</b><br>${esc(j.description)}<br>Fee: <b>${KSH(j.price)}</b> · <span class="muted">${esc(when(j.created_at))}</span><br>
        <button class="primary" onclick="riderAccept('${esc(j.id)}')">ACCEPT</button></div>`).join("") || "<p class='muted'>No open requests right now.</p>") : esc(open.error || "")}`;
  }
  window.applyRider = async function () {
    const d = await call("/api/riders/apply", "POST", { vehicle_type: $("rdVehicle").value, vehicle_number: $("rdPlate").value, company_name: $("rdCompany").value, location: $("rdArea").value });
    $("rdMsg").textContent = d.ok ? d.message : (d.error || "Could not apply."); if (d.ok) loadDelivery();
  };
  window.setRiderOnline = async function (online) { const d = await call("/api/riders/online", "POST", { online }); if (!d.ok) alert(d.error || "Failed."); loadDelivery(); };
  window.riderAccept = async function (id) { const d = await call("/api/delivery/" + encodeURIComponent(id) + "/accept", "POST", {}); if (!d.ok) alert(d.error || "Could not accept."); loadDelivery(); };
  window.riderStep = async function (id, status) { const d = await call("/api/delivery/" + encodeURIComponent(id) + "/status", "POST", { status }); if (!d.ok) alert(d.error || "Failed."); loadDelivery(); };
  window.riderRelease = async function (id) { if (!confirm("Release this job back to other riders?")) return; const d = await call("/api/delivery/" + encodeURIComponent(id) + "/release", "POST", {}); if (!d.ok) alert(d.error || "Failed."); loadDelivery(); };

  /* ---------- POWER SALE ---------- */
  async function loadPowerSale() {
    const host = $("psList"), msg = $("psMsg"); msg.textContent = "Loading…";
    const d = await call("/api/powersale");
    if (!d.ok) { msg.textContent = d.error || "Could not load."; return; }
    msg.textContent = "";
    host.innerHTML = (d.deals || []).map(x => `<div class="listing">
      ${(x.photos || [])[0] ? `<img src="${esc(x.photos[0])}" alt="" loading="lazy" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:8px">` : ""}
      <b>${esc(x.item_name)}</b> <span class="badge">-${x.discount_pct}%</span> <span class="badge">${esc(x.promo_label || "Power Sale")}</span><br>
      <s class="muted">${KSH(x.original_price)}</s> <b class="big" style="font-size:22px">${KSH(x.price)}</b><br>
      📍 ${esc(x.location || "")} · by ${esc(x.seller_name)}${x.seller_verified ? " ✔" : ""}<br><span class="muted">Ends ${esc(when(x.promo_ends_at))}</span><br>
      ${x.is_mine ? '<span class="muted">Your listing</span>' : `<button class="primary" onclick="startDeal('${esc(x.id)}',${x.negotiable ? "true" : "false"},${Number(x.price)})">OPEN DEAL</button>`}</div>`).join("") || "<p class='muted'>No Power Sales running right now. Check back soon.</p>";
  }
  window.promoteListing = async function (id) {
    const price = prompt("Sale price in KSh (must be lower than the current price)"); if (price === null) return;
    const days = prompt("How many days should the sale run? (1 to 30)", "3"); if (days === null) return;
    const label = prompt("Short label (optional), e.g. Weekend deal", "Power Sale");
    const d = await call("/api/listings/" + encodeURIComponent(id) + "/promo", "POST", { sale_price: Number(price), days: Number(days), label: label || "" });
    alert(d.ok ? "Power Sale started." : (d.error || "Could not start the sale.")); show("mylistings");
  };
  window.endPromo = async function (id) {
    if (!confirm("End the Power Sale and restore the normal price?")) return;
    const d = await call("/api/listings/" + encodeURIComponent(id) + "/promo", "DELETE");
    if (!d.ok) alert(d.error || "Could not end the sale."); show("mylistings");
  };

  /* ---------- MEMBERSHIP / M-PESA ---------- */
  const PURPOSE = { membership_pro: "PRO membership", membership_prime: "PRIME membership", deal_fee: "Deal fee" };
  async function loadMembership() {
    const [st, hist] = await Promise.all([call("/api/payments/status"), call("/api/payments/mine")]);
    if (!st.ok) { $("memStatus").innerHTML = esc(st.error || ""); return; }
    $("memStatus").innerHTML = `<p>Your plan: <b>${esc(st.plan || "FREE")}</b>${st.membership ? " · active until " + esc(new Date(st.membership.expires_at).toLocaleDateString("en-KE")) : ""}</p>
      <p class="muted">Browsing and listing are always free. ${st.enabled ? "M-Pesa payments are active" + (st.environment === "sandbox" ? " (TEST mode: no real money moves)." : ".") : "M-Pesa payments are <b>not active yet</b>, so plans cannot be bought today."}</p>`;
    $("memBuy").classList.toggle("hidden", false);
    document.querySelectorAll("#memBuy button.primary").forEach(b => b.disabled = !st.enabled);
    $("payHistory").innerHTML = hist.ok ? ((hist.payments || []).map(p => `<div class="listing"><b>${esc(PURPOSE[p.purpose] || p.purpose)}</b> · ${KSH(p.amount)} <span class="badge">${esc(p.status)}</span><br><span class="muted">${esc(when(p.created_at))}${p.mpesa_receipt ? " · " + esc(p.mpesa_receipt) : ""}</span></div>`).join("") || "<p class='muted'>No payments yet.</p>") : esc(hist.error || "");
  }
  window.payFor = async function (product) {
    const msg = $("payMsg"); msg.textContent = "Sending request to your phone…";
    const d = await call("/api/payments/stk", "POST", { product, phone: $("payPhone").value.trim() || undefined });
    msg.textContent = d.ok ? d.message : (d.error || "Could not start the payment.");
    if (!d.ok || !d.payment_id) return;
    let tries = 0; if (payPoll) clearInterval(payPoll);
    payPoll = setInterval(async () => {
      tries++; const s = await call("/api/payments/" + encodeURIComponent(d.payment_id));
      if (s.ok && s.payment.status !== "pending") {
        clearInterval(payPoll); payPoll = null;
        msg.textContent = s.payment.status === "completed" ? "Payment received. Thank you!" : "Payment " + s.payment.status + ": " + (s.payment.result_desc || "not completed");
        loadMembership(); refresh();
      } else if (tries > 40) { clearInterval(payPoll); payPoll = null; msg.textContent = "Still waiting. If you approved it, it will appear in your history shortly."; }
    }, 3000);
  };

  /* ---------- owner extras ---------- */
  async function loadOwnerExtras() {
    const [r, p] = await Promise.all([call("/api/admin/riders"), call("/api/admin/payments")]);
    $("cmdRiders").innerHTML = r.ok ? ((r.riders || []).map(x => `<div class="listing"><b>${esc(x.member ? x.member.full_name : "Member")}</b> · ${esc(String(x.vehicle_type).replace("_", " "))} ${esc(x.vehicle_number || "")}<br>${esc(x.location || "")}${x.company_name ? " · " + esc(x.company_name) : ""}<br><span class="muted">${esc(when(x.created_at))}${x.member ? " · " + esc(x.member.phone || "") : ""}</span><br>
      <button class="primary" onclick="cmdRider('${esc(x.id)}',{approved:true,verified:true})">APPROVE + VERIFY</button><button class="danger" onclick="cmdRider('${esc(x.id)}',{approved:false})">REJECT</button></div>`).join("") || "<p class='muted'>No applications waiting.</p>") : esc(r.error || "");
    $("cmdPayments").innerHTML = p.ok ? `<p>Completed total shown: <b>${KSH(p.completed_total)}</b></p>` + ((p.payments || []).map(x => `<div class="listing"><b>${esc(PURPOSE[x.purpose] || x.purpose)}</b> · ${KSH(x.amount)} <span class="badge">${esc(x.status)}</span><br><span class="muted">${esc(when(x.created_at))}${x.mpesa_receipt ? " · " + esc(x.mpesa_receipt) : ""}${x.status === "needs_review" ? " · CHECK THIS MANUALLY" : ""}</span></div>`).join("") || "<p class='muted'>No payments yet.</p>") : esc(p.error || "");
  }
  window.cmdRider = async function (id, patch) { const d = await call("/api/admin/riders/" + encodeURIComponent(id), "PATCH", patch); if (!d.ok) alert(d.error || "Failed."); loadOwnerExtras(); };

  /* ---------- start after market-ui has built its pages ---------- */
  const starter = setInterval(() => {
    if (inited || !$("alerts") || !document.querySelector("#app .nav")) return;
    inited = true; clearInterval(starter); inject();
  }, 700);
})();
