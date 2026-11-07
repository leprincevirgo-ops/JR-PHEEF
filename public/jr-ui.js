/* JR PHEEF: talk to JR, projects, ideas, advertising centre and JR settings.
   Load after ecosystem-ui.js:  <script src="/jr-ui.js"></script> */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => escapeHtml(v);
  const memberRegion = () => window.jrCurrentMember || {};
  const KSH = n => { const p=memberRegion(), currency=p.preferred_currency||"KES", locale=p.preferred_locale||"en-KE"; try{return new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:2}).format(Number(n||0));}catch{return "KSh "+Number(n||0).toLocaleString(locale||"en-KE");} };
  const when = d => (d ? new Date(d).toLocaleString(memberRegion().preferred_locale||"en-KE", { dateStyle: "medium", timeStyle: "short", timeZone:memberRegion().preferred_timezone||Intl.DateTimeFormat().resolvedOptions().timeZone }) : "");
  if(!window.jrVideoSoundHandlerBound){window.jrVideoSoundHandlerBound=true;document.addEventListener("click",async event=>{const button=event.target.closest("[data-jr-enable-sound]");if(!button)return;const player=(button.parentElement?button.parentElement.querySelector("video"):null);if(!player)return;player.muted=false;player.defaultMuted=false;player.volume=1;try{await player.play();button.textContent="SOUND ON";button.setAttribute("aria-label","Sound enabled");const note=button.parentElement.querySelector("[data-jr-audio-note]");if(note){if(player.audioTracks&&player.audioTracks.length===0)note.textContent="This file has no audio track. Try uploading the original video with sound.";else note.textContent="Sound enabled. Use your device volume buttons to adjust loudness.";}}catch(error){button.textContent="TAP TO ENABLE SOUND";}});}
  let inited = false, openProject = null;

  async function call(url, method, body) {
    const o = { method: method || "GET", credentials: "include" };
    if (body !== undefined) { o.headers = { "Content-Type": "application/json" }; o.body = JSON.stringify(body); }
    try { return await (await fetch(url, o)).json(); }
    catch (e) { return { ok: false, error: "Network error. Please try again." }; }
  }

  const PAGES = `
<div id="projects" class="page hidden">
 <div id="projList"><div class="card"><h2>MY PROJECTS</h2>
  <p class="muted">Tell JR a goal and it builds a step-by-step plan you can track. Example: "I want to open a small supermarket in Nairobi with KSh 5,000,000".</p>
  <textarea id="pjGoal" rows="3" maxlength="2000" placeholder="What do you want to achieve?"></textarea>
  <input id="pjBudget" type="number" min="0" placeholder="Budget in KSh (optional)">
  <button class="primary" onclick="pjCreate()">BUILD MY PLAN</button><p id="pjMsg" class="muted" aria-live="polite"></p></div>
  <div class="card"><div id="pjItems"></div></div></div>
 <div id="projDetail" class="hidden"></div>
</div>

<div id="ideas" class="page hidden"><div class="card"><h2>SHAPE JR</h2>
 <p class="muted">Tell JR what to add or improve. The team reviews every idea, and popular ones move up. JR never changes itself: people review and release every change.</p>
 <textarea id="idText" rows="3" maxlength="2000" placeholder="I wish JR PHEEF could…"></textarea>
 <button class="primary" onclick="ideaSend()">SEND IDEA</button><p id="idMsg" class="muted" aria-live="polite"></p></div>
 <div class="card"><h3>Ideas from members</h3><div id="idList"></div></div></div>

<div id="ads" class="page hidden"><div class="card"><h2>ADVERTISING CENTRE</h2>
 <p class="muted">Promote a listing or your business. Text and image ads can pass automatic safety checks and publish without waiting for the owner. Flagged ads and all video ads go to a review queue. Prohibited sexual content is blocked. Approved ads display a Sponsored label; launch ads are currently free.</p>
 <input id="adTitle" maxlength="80" placeholder="Ad title">
 <textarea id="adBody" rows="2" maxlength="300" placeholder="Short message (no phone numbers, emails or links)"></textarea>
 <select id="adListing"><option value="">Not linked to a listing</option></select>
 <input id="adCategory" maxlength="60" placeholder="Category to appear in (optional), e.g. Food">
 <input id="adLocation" maxlength="120" placeholder="Area (optional)">
 <div class="ad-media-tools"><p class="muted">Add up to five photos or videos from your gallery or camera.</p><label for="adGallery">Gallery — photos and videos</label><input id="adGallery" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple><label for="adCamera">Take a photo</label><input id="adCamera" type="file" accept="image/*" capture="environment"><div class="ad-media-actions"><button type="button" class="dark" onclick="adStartRecording()">RECORD VIDEO</button><button type="button" class="dark" onclick="adExplainLive()">GO LIVE</button><button type="button" class="dark" onclick="adStopRecording()" id="adStopRecord" disabled>STOP RECORDING</button></div><video id="adCameraPreview" class="ad-camera-preview" playsinline muted hidden></video><p id="adRecordMsg" class="muted" aria-live="polite">Public live broadcasting is not active yet; you can record a video clip.</p><div id="adMediaPreview" class="ad-media-preview"></div></div>
 <button class="primary" onclick="adCreate()">SEND FOR REVIEW</button><p id="adMsg" class="muted" aria-live="polite"></p></div>
 <div class="card"><h3>My ads</h3><div id="adMine"></div></div></div>

<div id="jrsettings" class="page hidden"><div class="card"><h2>JR SETTINGS</h2>
 <p class="muted">You decide how much JR may do on its own. JR can never spend your money, contact other people for you, or open a deal without asking you first.</p>
 <label for="jsAutonomy">When JR is sure a step is safe and low-risk:</label>
 <select id="jsAutonomy"><option value="ask">Always ask me first</option><option value="low_risk">Do safe, low-risk things for me (saving a plan or an idea)</option></select>
 <label style="display:flex;gap:8px;align-items:center"><input id="jsPaused" type="checkbox" style="width:auto;margin:0"> Pause JR completely (nothing runs until I resume)</label>
 <button class="primary" onclick="jrSaveSettings()">SAVE</button><p id="jsMsg" class="muted" aria-live="polite"></p></div>
 <div class="card"><h3>What JR did or proposed</h3><div id="jsLog"></div></div></div>`;

  const COMMAND_CARD = `
<div class="card" id="jrCommandCard"><p style="letter-spacing:2px;color:#42f5ff;font-size:11px;font-weight:bold">TALK TO JR</p>
 <h2 style="margin-bottom:6px">What do you want to do today?</h2>
 <textarea id="jrSay" rows="2" maxlength="600" placeholder="Tell JR the outcome you want: plan a business, find a service, research a product, organize a project, discover opportunities, or improve JR PHEEF."></textarea>
 <button class="primary" onclick="jrAsk()">ASK JR</button><button class="dark" onclick="jrListen()">🎙 SPEAK</button>
 <div id="jrReply" aria-live="polite"></div></div>`;


  function inject() {
    $("app").insertAdjacentHTML("beforeend", PAGES);
    const nav = document.querySelector("#app .nav"), first = nav.children[1] || null;
    [["PROJECTS", "projects"], ["SHAPE JR", "ideas"], ["ADVERTISEMENT CENTRE", "ads"], ["JR SETTINGS", "jrsettings"]].forEach(([l, id]) => {
      const b = document.createElement("button"); b.textContent = l; b.onclick = () => show(id); nav.insertBefore(b, first);
    });

    // Group existing navigation buttons into simple menus while preserving
    // the original nodes, click handlers, and destinations.
    const style = document.createElement("style");
    style.id = "jp-unified-navigation-style";
    style.textContent = "#app .nav.jp-nav-grouped{display:flex;flex-wrap:wrap;gap:8px;overflow:visible;padding:12px 0}#app .nav .jp-nav-group{position:relative;flex:0 0 auto}#app .nav .jp-nav-group>summary{cursor:pointer;list-style:none;white-space:nowrap;border:1px solid rgba(66,245,255,.24);background:#082b46;border-radius:10px;padding:10px 12px;color:#eafcff;font-size:11px;font-weight:bold}#app .nav .jp-nav-group>summary::-webkit-details-marker{display:none}#app .nav .jp-nav-group .jp-nav-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:190px;max-height:60vh;overflow:auto;padding:8px;border:1px solid rgba(66,245,255,.25);border-radius:14px;background:#041629;box-shadow:0 16px 40px #0009;display:flex;flex-direction:column;gap:5px}#app .nav .jp-nav-group .jp-nav-menu button{width:100%;text-align:left;white-space:normal;font-size:11px;margin:0;padding:11px}@media(max-width:600px){#app .nav .jp-nav-group .jp-nav-menu{position:fixed;left:12px;right:12px;top:auto;max-height:60vh;min-width:0}}";
    document.head.appendChild(style);
    const groups = [
      {label:"DISCOVER", names:["ECOSYSTEM","FIND","SOCIAL","JP CONNECT"]},
      {label:"CREATE & GROW", names:["CREATE","PROJECTS","SHAPE JR","ADVERTISEMENT CENTRE","ADS"]},
      {label:"INTELLIGENCE", names:["UNIVERSE","LAB","LIBRARY","AI ASSISTANT","SCI-FI & FUTURES","REPAIR SERVICES"]},
      {label:"SERVICES", names:["ROOMS NEAR ME","FLEX","POINTS","ECONOMY","DELIVERY","JR PHEEF DELIVERY","ACCESS GOV","POWER SALE"]},
      {label:"MY SPACE", names:["PROFILE","MY FILES","DEVICES","VOICE / TYPE","JR SETTINGS"]},
    ];
    const buttons = [...nav.querySelectorAll(":scope > button")];
    nav.classList.add("jp-nav-grouped");
    const home = buttons.find(b => b.textContent.trim().toUpperCase() === "HOME");
    const used = new Set(home ? [home] : []);
    for (const group of groups) {
      const members = buttons.filter(b => !used.has(b) && group.names.includes(b.textContent.trim().toUpperCase()));
      if (!members.length) continue;
      const details = document.createElement("details");
      details.className = "jp-nav-group";
      const summary = document.createElement("summary");
      summary.textContent = group.label;
      const menu = document.createElement("div");
      menu.className = "jp-nav-menu";
      menu.setAttribute("role","group");
      menu.setAttribute("aria-label",group.label);
      for (const button of members) {
        used.add(button);
        menu.appendChild(button);
      }
      details.append(summary,menu);
      nav.appendChild(details);
    }
    const remaining = buttons.filter(b => !used.has(b));
    if (remaining.length) {
      const details = document.createElement("details");
      details.className = "jp-nav-group";
      const summary = document.createElement("summary");
      summary.textContent = "MORE";
      const menu = document.createElement("div");
      menu.className = "jp-nav-menu";
      menu.setAttribute("role","group");
      menu.setAttribute("aria-label","More JR PHEEF sections");
      remaining.forEach(button => menu.appendChild(button));
      details.append(summary,menu);
      nav.appendChild(details);
    }
    nav.addEventListener("click", event => {
      if (event.target.closest("button")) nav.querySelectorAll("details[open]").forEach(d => d.open = false);
    });

    const anchor = $("myActivity") || $("coordination");
    anchor.insertAdjacentHTML("beforebegin", COMMAND_CARD);
    const find = $("results"); if (find) find.insertAdjacentHTML("beforebegin", '<div id="sponsoredBox"></div>');
  }

  document.addEventListener("jr:workspacechange",e=>{if((e.detail&&e.detail.id)==="ads"){bindAdMediaInputs();adLoad();}});
  const prev = window.show;
  window.show = function (id) {
    prev(id);
    if (!inited) return;
    if (id === "projects") { if (openProject) pjOpen(openProject); else pjList(); }
    if (id === "ideas") ideaList();
    if (id === "ads") { bindAdMediaInputs(); adLoad(); }
    if (id === "jrsettings") jsLoad();
    if (id === "find") loadSponsored();
  };

  /* ---------- talk to JR ---------- */
  const RISK_LABEL = { none: "", low: "Low risk", high: "Needs your approval" };
  window.jrAsk = async function () {
    const text = $("jrSay").value.trim(); if (!text) return;
    $("jrReply").innerHTML = '<p class="muted">JR is thinking…</p>';
    const d = await call("/api/jr/command", "POST", { text });
    if (!d.ok) { $("jrReply").innerHTML = `<p>${esc(d.error || "JR could not help just now.")}</p>`; return; }
    const acts = (d.actions || []).map(a => {
      let ui = "";
      if (a.status === "ready") ui = `<span class="badge">Done for you</span>`;
      else if (a.status === "done") ui = `<span class="badge">Done by JR</span>${a.result && a.result.project_id ? ` <button class="primary" onclick="pjGo('${esc(a.result.project_id)}')">OPEN PROJECT</button>` : ""}`;
      else if (a.status === "proposed") ui = `<span class="badge">${esc(RISK_LABEL[a.risk] || "Proposed")}</span> <button class="primary" onclick="jrConfirm('${esc(a.id)}')">CONFIRM</button><button class="dark" onclick="jrDismiss('${esc(a.id)}')">NO THANKS</button>`;
      else if (a.status === "failed") ui = `<span class="badge">Could not do it</span> ${esc(a.error || "")}`;
      return `<div class="listing"><b>${esc(a.summary)}</b><br>${ui}</div>`;
    }).join("");
    $("jrReply").innerHTML = `<p>${esc(d.reply)}</p>${d.paused ? '<p class="muted">JR is paused, so it will only propose things.</p>' : ""}${acts}`;
    for (const a of d.actions || []) if (a.status === "ready") jrDo(a);
  };
  function jrDo(a) {
    if (a.type === "navigate") { if ($(a.args.page)) show(a.args.page); else $("jrReply").insertAdjacentHTML("beforeend", "<p class='muted'>That screen is not available yet.</p>"); }
    if (a.type === "search") { $("searchQ").value = a.args.q || ""; show("find"); window.searchListings(a.args.category || ""); }
  }
  window.jrConfirm = async function (id) {
    const d = await call("/api/jr/actions/" + encodeURIComponent(id) + "/confirm", "POST", {});
    if (!d.ok) { alert(d.error || "Could not do that."); return; }
    if (d.result && d.result.project_id) { pjGo(d.result.project_id); return; }
    if (d.kind === "open_deal" && d.payload && d.payload.listing_id) {
      const l = await call("/api/listings/" + encodeURIComponent(d.payload.listing_id));
      if (l.ok) { window.startDeal(l.listing.id, !!l.listing.negotiable, Number(l.listing.price)); return; }
    }
    $("jrReply").insertAdjacentHTML("beforeend", "<p>Done.</p>");
  };
  window.jrDismiss = async function (id) { await call("/api/jr/actions/" + encodeURIComponent(id) + "/dismiss", "POST", {}); $("jrReply").innerHTML = "<p class='muted'>Okay, I did not do it.</p>"; };
  window.jrListen = function () {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) { $("jrReply").innerHTML = "<p class='muted'>Voice is not supported in this browser. You can type instead.</p>"; return; }
    const r = new R(); r.lang = "en-KE"; r.interimResults = false;
    $("jrReply").innerHTML = '<p class="muted">Listening…</p>';
    r.onresult = e => { $("jrSay").value = e.results[0][0].transcript; jrAsk(); };
    r.onerror = e => { $("jrReply").innerHTML = "<p class='muted'>Voice failed (" + esc(e.error) + "). Please type instead.</p>"; };
    r.start();
  };

  /* ---------- projects ---------- */
  window.pjGo = function (id) { openProject = id; show("projects"); };
  async function pjList() {
    openProject = null; $("projDetail").classList.add("hidden"); $("projList").classList.remove("hidden");
    const d = await call("/api/projects");
    $("pjItems").innerHTML = d.ok ? ((d.projects || []).map(p => `<div class="listing"><b>${esc(p.title)}</b> <span class="badge">${esc(p.status)}</span><br>
      ${p.budget_ksh ? "Budget " + KSH(p.budget_ksh) + " · " : ""}${p.tasks_done}/${p.tasks_total} steps done<br><span class="muted">${esc(p.summary || "")}</span><br>
      <button class="primary" onclick="pjOpen('${esc(p.id)}')">OPEN</button></div>`).join("") || "<p class='muted'>No projects yet. Describe a goal above.</p>") : esc(d.error || "");
  }
  window.pjCreate = async function () {
    const goal = $("pjGoal").value.trim(); $("pjMsg").textContent = "JR is building your plan…";
    const d = await call("/api/projects", "POST", { goal, budget_ksh: $("pjBudget").value });
    if (!d.ok) { $("pjMsg").textContent = d.error || "Could not build the plan."; return; }
    $("pjMsg").textContent = ""; $("pjGoal").value = ""; $("pjBudget").value = ""; pjOpen(d.project.id);
  };
  window.pjOpen = async function (id) {
    openProject = id; $("projList").classList.add("hidden"); const host = $("projDetail"); host.classList.remove("hidden");
    const d = await call("/api/projects/" + encodeURIComponent(id));
    if (!d.ok) { host.innerHTML = `<div class="card">${esc(d.error || "Not found.")}<br><button class="dark" onclick="pjBack()">BACK</button></div>`; return; }
    const p = d.project, t = d.tasks || [], done = t.filter(x => x.status === "done").length;
    const total = t.reduce((s, x) => s + Number(x.est_cost_ksh || 0), 0);
    host.innerHTML = `<div class="card"><button class="dark" onclick="pjBack()">← ALL PROJECTS</button>
      <h2>${esc(p.title)}</h2><p>${esc(p.summary || "")}</p><p class="muted">Goal: ${esc(p.goal)}</p>
      <p>${done}/${t.length} steps done${total ? " · estimated costs " + KSH(total) : ""}${p.ai_generated ? "" : " · standard plan"}</p>
      <div style="height:8px;background:#063653;border-radius:6px"><div style="height:8px;width:${t.length ? Math.round(done / t.length * 100) : 0}%;background:#42f5ff;border-radius:6px"></div></div>
      ${(p.risks || []).length ? "<h4>Watch out for</h4><ul>" + p.risks.map(r => `<li>${esc(r)}</li>`).join("") + "</ul>" : ""}
      <select id="pjStatus" onchange="pjSetStatus('${esc(p.id)}',this.value)">${["planning", "active", "paused", "done"].map(s => `<option value="${s}" ${p.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      <button class="danger" onclick="pjDelete('${esc(p.id)}')">DELETE PROJECT</button></div>
     <div class="card"><h3>Steps</h3>${t.map(x => `<div class="listing"><b>${esc(x.title)}</b> ${x.category ? '<span class="badge">' + esc(x.category) + "</span>" : ""}<br>
       <span class="muted">${esc(x.detail || "")}</span>${x.est_cost_ksh ? "<br>~" + KSH(x.est_cost_ksh) : ""}<br>
       <select onchange="pjTask('${esc(p.id)}','${esc(x.id)}',this.value)">${["todo", "doing", "done"].map(s => `<option value="${s}" ${x.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
       <button class="danger" onclick="pjTaskDel('${esc(p.id)}','${esc(x.id)}')">REMOVE</button></div>`).join("")}
       <input id="pjNewTask" maxlength="160" placeholder="Add your own step"><button onclick="pjAddTask('${esc(p.id)}')">ADD STEP</button></div>
     <div class="card"><p class="muted">This plan is guidance, not legal, tax or financial advice. Confirm licences, fees and requirements with the relevant authorities and qualified professionals. Never pay an upfront fee to receive funding or a licence.</p></div>`;
  };
  window.pjBack = function () { openProject = null; show("projects"); };
  window.pjSetStatus = async (id, status) => { await call("/api/projects/" + encodeURIComponent(id), "PATCH", { status }); };
  window.pjTask = async (id, tid, status) => { await call("/api/projects/" + encodeURIComponent(id) + "/tasks/" + encodeURIComponent(tid), "PATCH", { status }); pjOpen(id); };
  window.pjTaskDel = async (id, tid) => { if (!confirm("Remove this step?")) return; await call("/api/projects/" + encodeURIComponent(id) + "/tasks/" + encodeURIComponent(tid), "DELETE"); pjOpen(id); };
  window.pjAddTask = async id => { const title = $("pjNewTask").value.trim(); if (!title) return; const d = await call("/api/projects/" + encodeURIComponent(id) + "/tasks", "POST", { title }); if (!d.ok) alert(d.error || "Could not add."); pjOpen(id); };
  window.pjDelete = async id => { if (!confirm("Delete this project and all its steps?")) return; await call("/api/projects/" + encodeURIComponent(id), "DELETE"); pjBack(); };

  /* ---------- ideas ---------- */
  window.ideaSend = async function () {
    const d = await call("/api/ideas", "POST", { text: $("idText").value });
    $("idMsg").textContent = d.ok ? "Thank you! The team will review your idea." : (d.error || "Could not send.");
    if (d.ok) { $("idText").value = ""; ideaList(); }
  };
  async function ideaList() {
    const d = await call("/api/ideas");
    $("idList").innerHTML = d.ok ? ((d.ideas || []).map(i => `<div class="listing"><b>${esc(i.summary)}</b> <span class="badge">${esc(i.status)}</span><br>
      ${i.owner_note ? '<span class="muted">Team note: ' + esc(i.owner_note) + "</span><br>" : ""}
      <button class="${i.voted ? "primary" : "dark"}" onclick="ideaVote('${esc(i.id)}')">👍 ${Number(i.votes || 0)}${i.voted ? " (you)" : ""}</button>${i.mine ? ' <span class="muted">your idea</span>' : ""}</div>`).join("") || "<p class='muted'>No ideas yet. Be the first.</p>") : esc(d.error || "");
  }
  window.ideaVote = async id => { const d = await call("/api/ideas/" + encodeURIComponent(id) + "/vote", "POST", {}); if (!d.ok) alert(d.error || "Could not vote."); ideaList(); };

  /* ---------- advertising centre ---------- */
  const adMediaFiles=[];let adRecorder=null,adStream=null,adChunks=[];
  function adRenderMedia(){const host=$("adMediaPreview");if(!host)return;host.replaceChildren();adMediaFiles.forEach((f,i)=>{const box=document.createElement("div");box.className="ad-media-item";const media=document.createElement(f.type.startsWith("video/")?"video":"img");media.src=URL.createObjectURL(f);if(media.tagName==="VIDEO"){media.controls=true;media.playsInline=true;media.preload="metadata";media.muted=false;media.volume=1;media.setAttribute("aria-label","Video preview with sound");}else media.alt="Ad media preview";const label=document.createElement("span");label.textContent=f.name;const remove=document.createElement("button");remove.type="button";remove.className="danger";remove.textContent="REMOVE";remove.onclick=()=>{adMediaFiles.splice(i,1);adRenderMedia();};box.append(media,label,remove);host.append(box);});}
  function adAddFiles(files){for(const f of Array.from(files||[])){if(adMediaFiles.length>=5)break;if(!/^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime))$/.test(f.type)||f.size>20*1024*1024)continue;adMediaFiles.push(f);}adRenderMedia();}
  function bindAdMediaInputs(){["adGallery","adCamera"].forEach(id=>{const el=$(id);if(el&&!el.dataset.bound){el.dataset.bound="1";el.addEventListener("change",()=>{adAddFiles(el.files);el.value="";});}});}
  window.adStartRecording=async function(){if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)||!window.MediaRecorder){$("adRecordMsg").textContent="Video recording is not supported here. Upload a clip from your gallery.";return;}if(adMediaFiles.length>=5)return;try{adStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:true});const preview=$("adCameraPreview");preview.srcObject=adStream;preview.hidden=false;await preview.play();const mime=["video/webm;codecs=vp9,opus","video/webm","video/mp4"].find(t=>MediaRecorder.isTypeSupported(t));adRecorder=mime?new MediaRecorder(adStream,{mimeType:mime}):new MediaRecorder(adStream);adChunks=[];adRecorder.ondataavailable=e=>{if((e.data&&e.data.size))adChunks.push(e.data);};adRecorder.onstop=()=>{const type=adRecorder.mimeType||"video/webm",ext=type.includes("mp4")?"mp4":"webm";adAddFiles([new File([new Blob(adChunks,{type})],"jr-ad-video-"+Date.now()+"."+ext,{type})]);if(adStream)adStream.getTracks().forEach(t=>t.stop());adStream=null;preview.srcObject=null;preview.hidden=true;$("adRecordMsg").textContent="Video saved for your ad. Preview it below.";};adRecorder.start();$("adStopRecord").disabled=false;$("adRecordMsg").textContent="Recording on this device — not broadcasting. Press STOP RECORDING to save."; }catch(e){$("adRecordMsg").textContent="Camera/microphone unavailable or permission denied. Gallery upload is still available.";if(adStream)adStream.getTracks().forEach(t=>t.stop());adStream=null;}};
  window.adStopRecording=function(){if(adRecorder&&adRecorder.state!=="inactive"){adRecorder.stop();$("adStopRecord").disabled=true;}};
  window.adExplainLive=function(){$("adRecordMsg").textContent="Public Go Live is not enabled yet. It requires a streaming provider and live moderation controls. Record or upload a video clip for now.";};
  async function adUploadMedia(){if(!adMediaFiles.length)return [];const form=new FormData();adMediaFiles.forEach(f=>form.append("media",f));const response=await fetch("/api/ads/media",{method:"POST",credentials:"include",body:form});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||"Media upload failed.");return data.media_urls||[];}
  function adMediaMarkup(urls){return (urls||[]).map(url=>{const v=/\.(mp4|webm|mov)(?:\?|$)/i.test(url);return v?'<div class="jr-video-player"><video src="'+esc(url)+'" controls playsinline preload="metadata" data-jr-audio-player aria-label="Advertisement video with sound" style="max-width:100%;max-height:260px"></video><button type="button" class="jr-enable-sound" data-jr-enable-sound>🔊 ENABLE SOUND</button><small data-jr-audio-note>Use the video controls or enable sound. If the original file has no audio, JR cannot recreate it.</small></div>':'<img src="'+esc(url)+'" alt="Ad media" loading="lazy" style="max-width:100%;max-height:180px;border-radius:10px">';}).join("");}
  async function adLoad() {
    const [mine, listings] = await Promise.all([call("/api/ads/mine"), call("/api/listings/mine")]);
    if (listings.ok) $("adListing").innerHTML = '<option value="">Not linked to a listing</option>' + (listings.listings || []).filter(l => l.status === "active").map(l => `<option value="${esc(l.id)}">${esc(l.item_name)}</option>`).join("");
    $("adMine").innerHTML = mine.ok ? ((mine.ads || []).map(a => `<div class="listing"><b>${esc(a.title)}</b> <span class="badge">${esc(a.status)}</span><br>${esc(a.body)}<br>${adMediaMarkup(a.media_urls)}
      <span class="muted">${Number(a.impressions || 0)} views · ${Number(a.clicks || 0)} clicks${a.ends_at && a.status === "approved" ? " · ends " + esc(when(a.ends_at)) : ""}${a.review_note ? " · " + esc(a.review_note) : ""}</span><br>
      ${a.status === "approved" ? `<button class="dark" onclick="adSet('${esc(a.id)}','paused')">PAUSE</button>` : ""}${a.status === "paused" ? `<button onclick="adSet('${esc(a.id)}','approved')">RESUME</button>` : ""}
      ${["approved", "paused", "pending"].includes(a.status) ? `<button class="danger" onclick="adSet('${esc(a.id)}','ended')">END</button>` : ""}</div>`).join("") || "<p class='muted'>No ads yet.</p>") : esc(mine.error || "");
  }
  window.adCreate = async function () {
    const msg=$("adMsg");msg.textContent="Preparing your ad…";try{const media_urls=await adUploadMedia();const d=await call("/api/ads","POST",{title:$("adTitle").value,body:$("adBody").value,listing_id:$("adListing").value||undefined,category:$("adCategory").value,location:$("adLocation").value,media_urls});msg.textContent=d.ok?d.message:(d.error||"Could not send the ad.");if(d.ok){$("adTitle").value="";$("adBody").value="";$("adGallery").value="";$("adCamera").value="";adMediaFiles.length=0;adRenderMedia();adLoad();}}catch(e){msg.textContent=e.message||"Could not upload your ad media.";}
  };
  window.adSet = async (id, status) => { const d = await call("/api/ads/" + encodeURIComponent(id), "PATCH", { status }); if (!d.ok) alert(d.error || "Not possible."); adLoad(); };

  async function loadSponsored() {
    const box = $("sponsoredBox"); if (!box) return;
    const d = await call("/api/ads/feed");
    box.innerHTML = d.ok && (d.ads || []).length ? d.ads.map(a => `<div class="listing" style="border-color:#42f5ff"><span class="badge">Sponsored</span> <b>${esc(a.title)}</b><br>${esc(a.body)}<br>${adMediaMarkup(a.media_urls)}
      <span class="muted">${esc(a.advertiser)}${a.verified ? " ✔" : ""}${a.location ? " · 📍 " + esc(a.location) : ""}</span>${a.listing_id ? `<br><button class="primary" onclick="adOpen('${esc(a.id)}')">VIEW OFFER</button>` : ""}</div>`).join("") : "";
  }
  window.adOpen = async function (id) {
    const c = await call("/api/ads/" + encodeURIComponent(id) + "/click", "POST", {});
    if (!c.ok || !c.listing_id) { alert(c.error || "This ad is no longer available."); return; }
    const l = await call("/api/listings/" + encodeURIComponent(c.listing_id));
    if (l.ok) window.startDeal(l.listing.id, !!l.listing.negotiable, Number(l.listing.price)); else alert(l.error || "Listing not available.");
  };

  /* ---------- JR settings ---------- */
  async function jsLoad() {
    const [s, a] = await Promise.all([call("/api/jr/settings"), call("/api/jr/activity")]);
    if (s.ok) { $("jsAutonomy").value = s.settings.autonomy; $("jsPaused").checked = !!s.settings.paused; $("jsMsg").textContent = s.ai_ready ? "" : "JR's AI is not switched on yet, so JR uses simple rules and standard plans."; }
    $("jsLog").innerHTML = a.ok ? ((a.actions || []).map(x => `<div class="listing"><b>${esc(x.summary)}</b> <span class="badge">${esc(x.status)}</span>${x.auto ? ' <span class="badge">by JR</span>' : ""}<br><span class="muted">${esc(when(x.created_at))}</span></div>`).join("") || "<p class='muted'>Nothing yet.</p>") : esc(a.error || "");
  }
  window.jrSaveSettings = async function () {
    const d = await call("/api/jr/settings", "PUT", { autonomy: $("jsAutonomy").value, paused: $("jsPaused").checked });
    $("jsMsg").textContent = d.ok ? "Saved." : (d.error || "Could not save.");
  };

  /* ---------- owner review panels ---------- */
  async function loadOwnerJr() {
    const [ads, ideas] = await Promise.all([call("/api/admin/ads"), call("/api/admin/ideas")]);
    $("cmdAds").innerHTML = ads.ok ? ((ads.ads || []).map(a => `<div class="listing"><b>${esc(a.title)}</b> by ${esc(a.advertiser)}<br>${esc(a.body)}<br>${adMediaMarkup(a.media_urls)}<p class="muted">${esc(a.review_note || "Queued for safety review.")}</p><span class="muted">${esc(a.category || "any category")} · ${esc(a.location || "anywhere")}</span><br>
      <button class="primary" onclick="cmdAd('${esc(a.id)}','approved')">APPROVE</button><button class="danger" onclick="cmdAd('${esc(a.id)}','rejected')">REJECT</button></div>`).join("") || "<p class='muted'>No ads waiting.</p>") : esc(ads.error || "");
    $("cmdIdeas").innerHTML = ideas.ok ? ((ideas.ideas || []).map(i => `<div class="listing"><b>${esc(i.summary || i.body)}</b> · 👍 ${Number(i.votes || 0)}<br><span class="muted">${esc(i.body)}</span><br>
      ${["planned", "building", "done", "declined"].map(s => `<button class="${s === "declined" ? "danger" : "dark"}" onclick="cmdIdea('${esc(i.id)}','${s}')">${s.toUpperCase()}</button>`).join("")}</div>`).join("") || "<p class='muted'>No new ideas.</p>") : esc(ideas.error || "");
  }
  window.cmdAd = async function (id, status) {
    const body = { status };
    if (status === "approved") { const days = prompt("How many days should this ad run? (1 to 30)", "7"); if (days === null) return; body.days = Number(days); }
    else { const note = prompt("Reason shown to the advertiser (optional)", ""); if (note === null) return; body.review_note = note; }
    const d = await call("/api/admin/ads/" + encodeURIComponent(id), "PATCH", body); if (!d.ok) alert(d.error || "Failed."); loadOwnerJr();
  };
  window.cmdIdea = async function (id, status) {
    const note = prompt("Short note for the member (optional)", ""); if (note === null) return;
    const d = await call("/api/admin/ideas/" + encodeURIComponent(id), "PATCH", { status, owner_note: note }); if (!d.ok) alert(d.error || "Failed."); loadOwnerJr();
  };

  const starter = setInterval(() => {
    if (inited || !$("alerts") || !document.querySelector("#app .nav")) return;
    inited = true; clearInterval(starter); inject();
  }, 700);
})();
