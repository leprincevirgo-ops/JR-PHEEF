/* JR PHEEF market UI add-on.
   Adds: MY LISTINGS, DEALS (offers + chat), ALERTS, owner COMMAND CENTER,
   change password, a home activity summary and deal buttons in FIND.
   Loaded after the main script with: <script src="/market-ui.js"></script> */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => escapeHtml(v);
  const KSH = n => "KSh " + Number(n || 0).toLocaleString("en-KE");
  const when = d => (d ? new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "");
  let inited = false, dealTimer = null, openDealId = null, forceRoom = false;

  async function call(url, method, body) {
    const o = { method: method || "GET", credentials: "include" };
    if (body !== undefined) { o.headers = { "Content-Type": "application/json" }; o.body = JSON.stringify(body); }
    try { return await (await fetch(url, o)).json(); }
    catch (e) { return { ok: false, error: "Network error. Please try again." }; }
  }
  const isOwner = () => !!(typeof me !== "undefined" && me && me.is_owner);
  const myId = () => String(me && me.id);

  /* ---------- pages ---------- */
  const PAGES = `
<div id="mylistings" class="page hidden"><div class="card"><h2>MY LISTINGS</h2>
 <p class="muted">Everything you have posted. Edit, pause, mark as sold or delete.</p>
 <button class="primary" onclick="show('create')">+ NEW LISTING</button><button class="dark" onclick="show('mylistings')">REFRESH</button>
 <p id="mineMsg" class="muted" aria-live="polite"></p><div id="mineList"></div></div></div>

<div id="deals" class="page hidden">
 <div id="dealsListView"><div class="card"><h2>DEALS</h2>
  <p class="muted">Offers and chats with buyers and sellers. Agree on the price here, then the buyer confirms when the item is received.</p>
  <button class="dark" onclick="show('deals')">REFRESH</button><p id="dealsMsg" class="muted" aria-live="polite"></p><div id="dealsList"></div></div></div>
 <div id="dealRoomView" class="hidden">
  <div class="card"><button class="dark" onclick="closeDealRoom()">← ALL DEALS</button><div id="dealHead"></div><div id="dealActions"></div></div>
  <div class="card"><h3>Chat</h3><div id="dealMsgs" style="max-height:340px;overflow:auto"></div>
   <textarea id="dealMsgInput" rows="2" maxlength="2000" placeholder="Write a message (no phone numbers, emails or links)"></textarea>
   <button class="primary" onclick="sendDealMessage()">SEND</button><p id="dealChatMsg" class="muted" aria-live="polite"></p></div>
  <div class="card" id="dealOfferCard"><h3>Make or change the offer</h3>
   <input id="dealOfferInput" type="number" min="1" placeholder="Amount (KSh)">
   <button onclick="sendDealOffer()">SEND OFFER</button><p id="dealOfferMsg" class="muted" aria-live="polite"></p></div>
  <div class="card"><h3>Safety</h3><button class="dark" onclick="reportDealParty()">REPORT</button><button class="danger" onclick="blockDealParty()">BLOCK THIS MEMBER</button></div>
 </div></div>

<div id="accessgov" class="page hidden"><div class="card"><h2>ACCESS GOV</h2>
 <p class="muted">Links to official Kenyan government services. JR PHEEF is not a government site and does not process these services. Type the address yourself or use these links, and never share passwords, PINs or one-time codes with anyone.</p>
 <div class="grid">
  <div class="listing"><b>eCitizen</b><p class="muted">Passports, licences, permits, business services.</p><a target="_blank" rel="noopener noreferrer" href="https://www.ecitizen.go.ke/">ecitizen.go.ke</a></div>
  <div class="listing"><b>KRA iTax</b><p class="muted">KRA PIN, tax returns and payments.</p><a target="_blank" rel="noopener noreferrer" href="https://itax.kra.go.ke/KRA-Portal/">itax.kra.go.ke</a></div>
  <div class="listing"><b>Social Health Authority</b><p class="muted">Health cover registration and contributions.</p><a target="_blank" rel="noopener noreferrer" href="https://www.sha.go.ke/">sha.go.ke</a></div>
  <div class="listing"><b>NTSA</b><p class="muted">Driving licences and vehicle services.</p><a target="_blank" rel="noopener noreferrer" href="https://ntsa.go.ke/">ntsa.go.ke</a></div>
  <div class="listing"><b>HELB</b><p class="muted">Higher education loans and bursaries.</p><a target="_blank" rel="noopener noreferrer" href="https://www.helb.co.ke/">helb.co.ke</a></div>
  <div class="listing"><b>Huduma Kenya</b><p class="muted">Government services at Huduma Centres.</p><a target="_blank" rel="noopener noreferrer" href="https://www.hudumakenya.go.ke/">hudumakenya.go.ke</a></div>
  <div class="listing"><b>IEBC</b><p class="muted">Voter registration and elections.</p><a target="_blank" rel="noopener noreferrer" href="https://www.iebc.or.ke/">iebc.or.ke</a></div>
  <div class="listing"><b>National Treasury</b><p class="muted">Budget and public finance information.</p><a target="_blank" rel="noopener noreferrer" href="https://www.treasury.go.ke/">treasury.go.ke</a></div>
  <div class="listing"><b>Central Bank of Kenya</b><p class="muted">Financial regulation and licensed institutions.</p><a target="_blank" rel="noopener noreferrer" href="https://www.centralbank.go.ke/">centralbank.go.ke</a></div>
 </div><p class="muted">Pages and addresses can change. If a link does not open, search for the institution's official site.</p></div></div>

<div id="alerts" class="page hidden"><div class="card"><h2>ALERTS</h2>
 <button class="primary" onclick="markAlertsRead()">MARK ALL READ</button><button class="dark" onclick="show('alerts')">REFRESH</button>
 <div id="alertList"></div></div></div>

<div id="command" class="page hidden">
 <div class="card"><p style="letter-spacing:2px;color:#42f5ff;font-size:11px;font-weight:bold">OWNER ONLY</p><h2>COMMAND CENTER</h2>
  <p class="muted">Live view of members, listings, deals and safety reports.</p><div id="cmdStats" class="grid"></div>
  <button class="dark" onclick="loadCommand()">REFRESH</button></div>
 <div class="card"><h3>Reports waiting for review</h3><div id="cmdReports"></div></div>
 <div class="card"><h3>Members</h3><input id="cmdMemberSearch" placeholder="Search name, phone, email or JP number">
  <button class="primary" onclick="cmdLoadMembers()">SEARCH</button><div id="cmdMembers"></div></div>
 <div class="card"><h3>Adjust member points</h3><input id="cmdPtsMember" placeholder="Member ID (from the members list)">
  <input id="cmdPtsAmount" type="number" placeholder="Points (negative to deduct)"><input id="cmdPtsNote" placeholder="Reason">
  <button class="primary" onclick="cmdAdjustPoints()">APPLY</button><p id="cmdPtsMsg" class="muted"></p></div>
 <div class="card"><h3>Recent activity</h3><div id="cmdActivity"></div></div>
</div>`;

  function inject() {
    $("app").insertAdjacentHTML("beforeend", PAGES);

    // nav buttons
    const nav = document.querySelector("#app .nav");
    const mk = (label, id, extra) => {
      const b = document.createElement("button");
      b.innerHTML = label; b.onclick = () => show(id); if (extra) b.id = extra; return b;
    };
    const first = nav.children[1] || null;
    const buttons = [mk("ACCESS GOV", "accessgov"), mk("MY LISTINGS", "mylistings"), mk('DEALS', "deals"), mk('ALERTS <span id="alertBadge" class="badge" style="padding:1px 7px;margin:0 0 0 4px">0</span>', "alerts")];
    if (isOwner()) buttons.push(mk("COMMAND CENTER", "command"));
    buttons.forEach(b => nav.insertBefore(b, first));

    // home activity card
    $("coordination").insertAdjacentHTML("beforebegin", `
<div class="card" id="myActivity"><h2>My activity</h2>
 <div class="grid">
  <div class="listing"><div class="big" id="actListings">–</div>Active listings</div>
  <div class="listing"><div class="big" id="actDeals">–</div>Open deals</div>
  <div class="listing"><div class="big" id="actAlerts">–</div>Unread alerts</div>
  <div class="listing"><div class="big" id="actPoints">–</div>Points</div>
 </div>
 <button onclick="show('mylistings')">MY LISTINGS</button><button onclick="show('deals')">DEALS</button><button onclick="show('create')">NEW LISTING</button>
 ${isOwner() ? '<button class="primary" onclick="show(\'command\')">COMMAND CENTER</button>' : ""}
</div>`);

    // negotiable option on the create form
    $("price").insertAdjacentHTML("afterend", `<label style="display:flex;gap:8px;align-items:center"><input id="negotiable" type="checkbox" style="width:auto;margin:0"> Price is negotiable</label>`);

    // change password card on profile
    $("profile").insertAdjacentHTML("beforeend", `
<div class="card"><h3>Change password</h3>
 <input id="pwCurrent" type="password" placeholder="Current password" autocomplete="current-password">
 <input id="pwNew" type="password" placeholder="New password (8–72 characters)" autocomplete="new-password">
 <button class="primary" onclick="changePassword()">UPDATE PASSWORD</button><p id="pwMsg" class="muted" aria-live="polite"></p></div>`);
  }

  /* ---------- show() hook ---------- */
  const baseShow = window.show;
  window.show = function (id) {
    baseShow(id);
    if (!inited) return;
    if (id !== "deals") stopDealPoll();
    if (id === "home") loadSummary();
    if (id === "mylistings") loadMine();
    if (id === "deals") { if (forceRoom && openDealId) { forceRoom = false; openDealRoom(openDealId); } else showDealList(); }
    if (id === "alerts") loadAlerts();
    if (id === "command") loadCommand();
  };

  /* ---------- FIND: deal buttons ---------- */
  window.searchListings = async function (category) {
    category = typeof category === "string" ? category : "";
    const q = encodeURIComponent($("searchQ").value);
    const d = await call("/api/listings?q=" + q + (category ? "&category=" + encodeURIComponent(category) : ""));
    if (!d.ok) { $("results").innerHTML = `<div class="listing">${esc(d.error)}</div>`; return; }
    $("results").innerHTML = (d.listings || []).map(x => {
      const mine = String(x.member_id) === myId();
      const photo = (x.photos || [])[0];
      return `<div class="listing">
        ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:8px">` : ""}
        <b>${esc(x.item_name || "Opportunity")}</b>${x.negotiable ? ' <span class="badge">Negotiable</span>' : ""}<br>
        ${x.original_price ? `<s class="muted">${KSH(x.original_price)}</s> <b>${KSH(x.price)}</b> <span class="badge">${esc(x.promo_label || "Power Sale")}</span>` : KSH(x.price)}<br>📍 ${esc(x.location || "")}<br>${esc(x.description || "")}<br>
        ${mine ? '<span class="muted">Your listing</span>'
          : `<button class="primary" onclick="startDeal('${esc(x.id)}',${x.negotiable ? "true" : "false"},${Number(x.price || 0)})">OPEN DEAL</button>
             <button class="dark" onclick="reportListing('${esc(x.id)}','${esc(x.member_id)}')">REPORT</button>`}
      </div>`;
    }).join("") || "<p>No opportunities found yet.</p>";
  };

  window.createListing = async function () {
    const form = new FormData();
    form.append("item_name", $("itemName").value);
    form.append("category", $("category").value);
    form.append("price", $("price").value);
    form.append("location", $("location").value);
    form.append("description", $("description").value);
    form.append("negotiable", $("negotiable").checked ? "true" : "false");
    for (const f of $("photos").files) form.append("photos", f);
    $("createMsg").textContent = "Creating…";
    let d;
    try { d = await (await fetch("/api/listings", { method: "POST", credentials: "include", body: form })).json(); }
    catch (e) { d = { ok: false, error: "Network error. Please try again." }; }
    $("createMsg").textContent = d.ok ? "Opportunity created successfully." : d.error;
    if (d.ok) { $("itemName").value = ""; $("price").value = ""; $("description").value = ""; $("photos").value = ""; }
  };

  window.startDeal = async function (listingId, negotiable, price) {
    let offer;
    if (negotiable) {
      const v = prompt("Your offer in KSh (listed price: " + KSH(price) + ").\nLeave blank to offer the listed price.", String(price));
      if (v === null) return;
      if (v.trim() !== "") offer = Number(v);
    }
    const d = await call("/api/deals", "POST", { listing_id: listingId, offer });
    if (!d.ok) { alert(d.error || "Could not open the deal."); return; }
    openDealId = d.deal.id; forceRoom = true; show("deals");
  };

  window.reportListing = async function (listingId, memberId) {
    const reason = prompt("Why are you reporting this listing? (for example: scam, fake, prohibited item)");
    if (!reason) return;
    const d = await call("/api/report", "POST", { listing_id: listingId, reported_id: memberId, reason });
    alert(d.ok ? d.message : (d.error || "Could not send the report."));
  };

  /* ---------- MY LISTINGS ---------- */
  async function loadMine() {
    const host = $("mineList"), msg = $("mineMsg");
    msg.textContent = "Loading…";
    const d = await call("/api/listings/mine");
    if (!d.ok) { msg.textContent = d.error || "Could not load."; host.innerHTML = ""; return; }
    msg.textContent = "";
    host.innerHTML = (d.listings || []).map(x => `
      <div class="listing">
       ${(x.photos || [])[0] ? `<img src="${esc(x.photos[0])}" alt="" loading="lazy" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-bottom:8px">` : ""}
       <b>${esc(x.item_name)}</b> <span class="badge">${esc(x.status)}</span><br>
       ${x.original_price ? `<s class="muted">${KSH(x.original_price)}</s> <b>${KSH(x.price)}</b> <span class="badge">${esc(x.promo_label || "Power Sale")}</span>` : KSH(x.price)} · 👁 ${Number(x.views || 0)} · ${esc(x.category || "")}<br>
       <button onclick="editListing('${esc(x.id)}')">EDIT</button>
       ${x.status === "active" ? (x.original_price ? `<button class="dark" onclick="endPromo('${esc(x.id)}')">END POWER SALE</button>` : `<button class="dark" onclick="promoteListing('${esc(x.id)}')">POWER SALE</button>`) : ""}
       ${x.status === "active" ? `<button class="dark" onclick="setListing('${esc(x.id)}',{status:'paused'})">PAUSE</button>` : ""}
       ${x.status !== "active" ? `<button class="dark" onclick="setListing('${esc(x.id)}',{status:'active'})">ACTIVATE</button>` : ""}
       ${x.status !== "sold" ? `<button class="dark" onclick="setListing('${esc(x.id)}',{status:'sold'})">MARK SOLD</button>` : ""}
       <button class="danger" onclick="deleteListing('${esc(x.id)}')">DELETE</button>
      </div>`).join("") || "<p class='muted'>You have no listings yet.</p>";
    window.__mine = Object.fromEntries((d.listings || []).map(x => [x.id, x]));
  }
  window.setListing = async function (id, patch) {
    const d = await call("/api/listings/" + encodeURIComponent(id), "PATCH", patch);
    if (!d.ok) alert(d.error || "Could not update."); loadMine();
  };
  window.editListing = async function (id) {
    const cur = (window.__mine || {})[id] || {};
    const title = prompt("Listing title", cur.item_name || ""); if (title === null) return;
    const price = prompt("Price in KSh", cur.price); if (price === null) return;
    const neg = confirm("Is the price negotiable?\nOK = yes, Cancel = no");
    window.setListing(id, { item_name: title, price: Number(price), negotiable: neg });
  };
  window.deleteListing = async function (id) {
    if (!confirm("Delete this listing permanently?")) return;
    const d = await call("/api/listings/" + encodeURIComponent(id), "DELETE");
    if (!d.ok) alert(d.error || "Could not delete."); loadMine();
  };

  /* ---------- DEALS ---------- */
  function showDealList() {
    openDealId = null; stopDealPoll();
    $("dealRoomView").classList.add("hidden"); $("dealsListView").classList.remove("hidden"); loadDeals();
  }
  async function loadDeals() {
    const host = $("dealsList"), msg = $("dealsMsg"); msg.textContent = "Loading…";
    const d = await call("/api/deals");
    if (!d.ok) { msg.textContent = d.error || "Could not load deals."; return; }
    msg.textContent = "";
    host.innerHTML = (d.deals || []).map(r => `
      <div class="listing"><b>${esc(r.listing ? r.listing.item_name : "Listing")}</b> <span class="badge">${esc(r.status)}</span><br>
      You are the ${esc(r.role)} · Offer ${KSH(r.offer_amount ?? r.amount)}<br><span class="muted">${esc(when(r.updated_at || r.created_at))}</span><br>
      <button class="primary" onclick="openDealRoom('${esc(r.id)}')">OPEN</button></div>`).join("") || "<p class='muted'>No deals yet. Open a deal from FIND.</p>";
  }
  window.closeDealRoom = showDealList;
  window.openDealRoom = async function (id) {
    openDealId = id;
    $("dealsListView").classList.add("hidden"); $("dealRoomView").classList.remove("hidden");
    await renderRoom(true);
    stopDealPoll(); dealTimer = setInterval(() => renderRoom(false), 8000);
  };
  function stopDealPoll() { if (dealTimer) { clearInterval(dealTimer); dealTimer = null; } }

  let roomState = null;
  async function renderRoom(scroll) {
    if (!openDealId) return;
    const d = await call("/api/deals/" + encodeURIComponent(openDealId));
    if (!d.ok) { $("dealHead").innerHTML = `<p>${esc(d.error || "Deal not found.")}</p>`; stopDealPoll(); return; }
    roomState = d;
    const r = d.deal, buyer = d.role === "buyer";
    const other = buyer ? d.seller : d.buyer;
    $("dealHead").innerHTML = `
      <h2>${esc(d.listing ? d.listing.item_name : "Deal")}</h2>
      <p>With <b>${esc(other.name)}</b>${other.verified ? " ✔" : ""} · You are the ${esc(d.role)} · <span class="badge">${esc(r.status)}</span></p>
      <p>Listed: ${KSH(d.listing ? d.listing.price : r.amount)} · <b>Current offer: ${KSH(r.offer_amount ?? r.amount)}</b></p>
      <p class="muted">Buyer agreed: ${r.buyer_agreed ? "yes" : "no"} · Seller agreed: ${r.seller_agreed ? "yes" : "no"}</p>`;
    const youAgreed = buyer ? r.buyer_agreed : r.seller_agreed;
    let actions = "";
    if (r.status === "open") actions += youAgreed ? `<p class="muted">You agreed. Waiting for the other side.</p>` : `<button class="primary" onclick="dealAction('agree')">AGREE TO ${KSH(r.offer_amount ?? r.amount)}</button>`;
    if (r.status === "agreed" && buyer) actions += `<button class="primary" onclick="dealAction('complete')">I RECEIVED THE ITEM · COMPLETE</button>`;
    if (r.status === "agreed" && !buyer) actions += `<p class="muted">Agreed. The buyer confirms once the item is received.</p>`;
    if (["open", "agreed"].includes(r.status)) actions += `<button class="danger" onclick="dealAction('cancel')">CANCEL DEAL</button>`;
    $("dealActions").innerHTML = actions;
    $("dealOfferCard").classList.toggle("hidden", r.status !== "open");
    const box = $("dealMsgs"), atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    box.innerHTML = (d.messages || []).map(m => {
      const mine = String(m.sender_id) === myId();
      return `<div style="margin:6px 0;text-align:${mine ? "right" : "left"}"><span style="display:inline-block;max-width:85%;padding:9px 12px;border-radius:14px;background:${mine ? "#087db4" : "#063653"};text-align:left;white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.body)}</span><div class="muted" style="font-size:11px">${esc(when(m.created_at))}</div></div>`;
    }).join("") || "<p class='muted'>No messages yet. Say hello.</p>";
    if (scroll || atBottom) box.scrollTop = box.scrollHeight;
    const closed = !["open", "agreed"].includes(r.status);
    $("dealMsgInput").disabled = closed;
  }
  window.sendDealMessage = async function () {
    const body = $("dealMsgInput").value.trim(); if (!body) return;
    const d = await call("/api/deals/" + encodeURIComponent(openDealId) + "/messages", "POST", { body });
    $("dealChatMsg").textContent = d.ok ? "" : (d.error || "Could not send.");
    if (d.ok) { $("dealMsgInput").value = ""; renderRoom(true); }
  };
  window.sendDealOffer = async function () {
    const amount = Number($("dealOfferInput").value);
    const d = await call("/api/deals/" + encodeURIComponent(openDealId) + "/offer", "POST", { amount });
    $("dealOfferMsg").textContent = d.ok ? "Offer sent. Both sides must agree again." : (d.error || "Could not send the offer.");
    if (d.ok) { $("dealOfferInput").value = ""; renderRoom(false); }
  };
  window.dealAction = async function (what) {
    if (what === "cancel" && !confirm("Cancel this deal?")) return;
    if (what === "complete" && !confirm("Confirm you received the item and the deal is complete?")) return;
    const d = await call("/api/deals/" + encodeURIComponent(openDealId) + "/" + what, "POST", {});
    if (!d.ok) alert(d.error || "Could not update the deal.");
    renderRoom(false);
  };
  function otherId() { return roomState ? (roomState.role === "buyer" ? roomState.seller.id : roomState.buyer.id) : null; }
  window.reportDealParty = async function () {
    const reason = prompt("What is the problem? (for example: scam, abuse, asked to pay outside JR PHEEF)"); if (!reason) return;
    const d = await call("/api/report", "POST", { reported_id: otherId(), listing_id: roomState && roomState.listing ? roomState.listing.id : undefined, reason });
    alert(d.ok ? d.message : (d.error || "Could not send the report."));
  };
  window.blockDealParty = async function () {
    if (!confirm("Block this member? You will no longer see each other's listings or be able to message.")) return;
    const d = await call("/api/blocks", "POST", { member_id: otherId() });
    alert(d.ok ? "Member blocked." : (d.error || "Could not block."));
  };

  /* ---------- ALERTS ---------- */
  async function refreshBadge() {
    const d = await call("/api/notifications");
    if (d.ok) {
      const b = $("alertBadge"); if (b) { b.textContent = d.unread; b.style.display = d.unread ? "inline-block" : "none"; }
      return d;
    }
  }
  async function loadAlerts() {
    const d = await refreshBadge(); const host = $("alertList");
    if (!d) { host.innerHTML = "<p class='muted'>Could not load alerts.</p>"; return; }
    host.innerHTML = (d.notifications || []).map(n => `<div class="listing" style="${n.read ? "opacity:.65" : ""}"><b>${esc(n.title)}</b><p>${esc(n.message)}</p><span class="muted">${esc(when(n.created_at))}</span></div>`).join("") || "<p class='muted'>No alerts yet.</p>";
  }
  window.markAlertsRead = async function () { await call("/api/notifications/read-all", "POST", {}); loadAlerts(); };

  /* ---------- HOME SUMMARY ---------- */
  async function loadSummary() {
    const [mine, deals, notes] = await Promise.all([call("/api/listings/mine"), call("/api/deals"), call("/api/notifications")]);
    if (mine.ok) $("actListings").textContent = (mine.listings || []).filter(x => x.status === "active").length;
    if (deals.ok) $("actDeals").textContent = (deals.deals || []).filter(x => ["open", "agreed"].includes(x.status)).length;
    if (notes.ok) $("actAlerts").textContent = notes.unread;
    $("actPoints").textContent = Number(me.reward_points || 0);
  }

  /* ---------- PASSWORD ---------- */
  window.changePassword = async function () {
    const d = await call("/api/password/change", "POST", { current_password: $("pwCurrent").value, new_password: $("pwNew").value });
    $("pwMsg").textContent = d.ok ? d.message : (d.error || "Could not update the password.");
    if (d.ok) { $("pwCurrent").value = ""; $("pwNew").value = ""; }
  };

  /* ---------- COMMAND CENTER (owner) ---------- */
  window.loadCommand = async function () {
    if (!isOwner()) { $("cmdStats").innerHTML = "<p>Owner access required.</p>"; return; }
    const [s, r, a] = await Promise.all([call("/api/admin/stats"), call("/api/admin/reports"), call("/api/admin/activity")]);
    if (s.ok) {
      const st = s.stats, tile = (n, l) => `<div class="listing"><div class="big">${Number(n)}</div>${l}</div>`;
      $("cmdStats").innerHTML = tile(st.members, "Members") + tile(st.active_listings, "Active listings") + tile(st.open_deals, "Open deals") + tile(st.completed_deals, "Completed deals") + tile(st.pending_reports, "Reports to review");
    }
    $("cmdReports").innerHTML = r.ok ? ((r.reports || []).map(x => `
      <div class="listing"><b>${esc(x.reason)}</b><p>${esc(x.details || "")}</p>
      <p class="muted">${esc(when(x.created_at))}${x.reported_id ? " · member " + esc(x.reported_id) : ""}${x.listing_id ? " · listing " + esc(x.listing_id) : ""}</p>
      <button class="dark" onclick="cmdReport('${esc(x.id)}','dismissed')">DISMISS</button>
      <button onclick="cmdReport('${esc(x.id)}','reviewed')">REVIEWED</button>
      ${x.listing_id ? `<button class="danger" onclick="cmdListing('${esc(x.listing_id)}','${esc(x.id)}')">REMOVE LISTING</button>` : ""}
      ${x.reported_id ? `<button class="danger" onclick="cmdMember('${esc(x.reported_id)}','suspended','${esc(x.id)}')">SUSPEND MEMBER</button>` : ""}
      </div>`).join("") || "<p class='muted'>No reports waiting. 🎉</p>") : esc(r.error || "");
    $("cmdActivity").innerHTML = a.ok ? ((a.activity || []).map(x => `<div class="listing"><b>${esc(x.action)}</b> <span class="muted">${esc(when(x.created_at))}</span></div>`).join("") || "<p class='muted'>No activity yet.</p>") : esc(a.error || "");
    cmdLoadMembers();
  };
  window.cmdReport = async function (id, status) { await call("/api/admin/reports/" + encodeURIComponent(id), "PATCH", { status }); loadCommand(); };
  window.cmdListing = async function (id, reportId) {
    if (!confirm("Remove this listing from the marketplace?")) return;
    const d = await call("/api/admin/listings/" + encodeURIComponent(id), "PATCH", { status: "removed" });
    if (!d.ok) { alert(d.error || "Failed."); return; }
    if (reportId) await call("/api/admin/reports/" + encodeURIComponent(reportId), "PATCH", { status: "actioned" }); loadCommand();
  };
  window.cmdMember = async function (id, status, reportId) {
    if (!confirm("Set this member to '" + status + "'?")) return;
    const d = await call("/api/admin/members/" + encodeURIComponent(id), "PATCH", { status });
    if (!d.ok) { alert(d.error || "Failed."); return; }
    if (reportId) await call("/api/admin/reports/" + encodeURIComponent(reportId), "PATCH", { status: "actioned" }); loadCommand();
  };
  window.cmdVerify = async function (id, verified) { await call("/api/admin/members/" + encodeURIComponent(id), "PATCH", { verified }); cmdLoadMembers(); };
  window.cmdLoadMembers = async function () {
    const d = await call("/api/admin/members?q=" + encodeURIComponent($("cmdMemberSearch").value.trim()));
    $("cmdMembers").innerHTML = d.ok ? ((d.members || []).map(m => `
      <div class="listing"><b>${esc(m.full_name)}</b> <span class="badge">${esc(m.status)}</span>${m.verified ? ' <span class="badge">verified</span>' : ""}<br>
      ${esc(m.jp_number || "")} · ${esc(m.phone || "")} · ${esc(m.email || "")}<br>
      <span class="muted">ID ${esc(m.id)} · ${Number(m.reward_points || 0)} pts · joined ${esc(when(m.created_at))}</span><br>
      ${m.status === "active" ? `<button class="danger" onclick="cmdMember('${esc(m.id)}','suspended')">SUSPEND</button>` : `<button onclick="cmdMember('${esc(m.id)}','active')">REACTIVATE</button>`}
      <button class="dark" onclick="cmdVerify('${esc(m.id)}',${m.verified ? "false" : "true"})">${m.verified ? "UNVERIFY" : "VERIFY"}</button>
      <button class="dark" onclick="document.getElementById('cmdPtsMember').value='${esc(m.id)}'">USE ID FOR POINTS</button></div>`).join("") || "<p class='muted'>No members found.</p>") : esc(d.error || "");
  };
  window.cmdAdjustPoints = async function () {
    const d = await call("/api/owner/points", "POST", { member_id: $("cmdPtsMember").value.trim(), amount: Number($("cmdPtsAmount").value), description: $("cmdPtsNote").value });
    $("cmdPtsMsg").textContent = d.ok ? "Done. New balance: " + d.reward_points : (d.error || "Failed.");
  };


  /* ---------- ROOMS: working connect button ---------- */
  window.loadRooms = async function () {
    const params = new URLSearchParams();
    const q = $("roomSearch").value.trim(), location = $("roomLocation").value.trim();
    const type = $("roomTypeFilter").value, maxRent = $("roomMaxRent").value;
    if (q) params.set("q", q); if (location) params.set("location", location);
    if (type) params.set("type", type); if (maxRent !== "") params.set("max_rent", maxRent);
    const host = $("roomsResults"); host.innerHTML = "<p class='muted'>Searching rental listings...</p>";
    const d = await call("/api/rooms?" + params.toString());
    if (!d.ok) { host.innerHTML = "<p>" + esc(d.error || "Could not load rooms.") + "</p>"; return; }
    host.innerHTML = (d.rooms || []).map(r => `<div class="listing"><b>${esc(r.title)}</b>
      <div class="badge">${esc(String(r.room_type || "").replaceAll("_", " "))}</div>
      <p><b>${KSH(r.rent_ksh)} / month</b></p><p>📍 ${esc(r.location || "")}</p>
      <p>${esc(r.description || "No extra details provided.")}</p>
      <p class="muted">Available: ${esc(r.available_from || "Ask through JR PHEEF")}</p>
      ${r.is_mine ? `<button class="dark" onclick="setRoomStatus('${esc(r.id)}','paused')">PAUSE</button><button class="dark" onclick="setRoomStatus('${esc(r.id)}','filled')">MARK FILLED</button><button class="danger" onclick="deleteRoomListing('${esc(r.id)}')">DELETE</button>`
        : `<button class="primary" onclick="connectToMember('${esc(r.member_id)}')">REQUEST CONNECTION</button>`}</div>`).join("")
      || "<p class='muted'>No active rooms match these filters yet. Try a nearby area or a higher budget.</p>";
  };
  window.connectToMember = async function (memberId) {
    const d = await call("/api/connections", "POST", { receiver_id: memberId });
    alert(d.ok ? (d.already_exists ? "A connection request already exists. Check JP CONNECT." : "Connection request sent. Check JP CONNECT for their reply.") : (d.error || "Could not send the request."));
  };

  /* ---------- LOGIN: forgot password ---------- */
  function injectLogin() {
    const box = $("loginBox"); if (!box || $("forgotLink")) return;
    box.insertAdjacentHTML("beforeend", `
      <p><a href="#" id="forgotLink" style="color:#42f5ff">Forgot password?</a></p>
      <div id="forgotBox" class="hidden">
        <input id="fpPhone" placeholder="Your phone number (07XXXXXXXX)">
        <button class="dark" onclick="forgotSend()">SEND RESET CODE</button>
        <input id="fpCode" inputmode="numeric" maxlength="6" placeholder="6-digit code">
        <input id="fpNew" type="password" placeholder="New password (8–72 characters)" autocomplete="new-password">
        <button class="primary" onclick="forgotReset()">SET NEW PASSWORD</button>
        <p id="fpMsg" class="muted" aria-live="polite"></p>
      </div>`);
    $("forgotLink").onclick = e => { e.preventDefault(); $("forgotBox").classList.toggle("hidden"); };
  }
  window.forgotSend = async function () {
    const d = await call("/api/password/forgot", "POST", { phone: $("fpPhone").value.trim() });
    $("fpMsg").textContent = d.ok ? d.message : (d.error || "Could not send a code.");
  };
  window.forgotReset = async function () {
    const d = await call("/api/password/reset", "POST", { phone: $("fpPhone").value.trim(), code: $("fpCode").value.trim(), new_password: $("fpNew").value });
    $("fpMsg").textContent = d.ok ? d.message : (d.error || "Could not reset the password.");
    if (d.ok) { $("fpCode").value = ""; $("fpNew").value = ""; }
  };
  injectLogin();

  /* ---------- start once a member is signed in ---------- */
  function ready() { return typeof me !== "undefined" && me && $("app") && !$("app").classList.contains("hidden"); }
  const starter = setInterval(() => {
    if (inited || !ready()) return;
    inited = true; clearInterval(starter);
    inject(); refreshBadge(); loadSummary();
    setInterval(() => { if (ready()) refreshBadge(); }, 60000);
  }, 600);
})();
