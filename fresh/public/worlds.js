"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const view=$("view-worlds"); if(!view)return;
 const form=$("createWorldForm"),list=$("worldsList"),feedback=$("worldsFeedback"),detail=$("worldDetail");
 let worlds=[];
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function api(action,extra={}){const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"World action could not be completed.");return d.data;}
 function render(){list.replaceChildren();if(!worlds.length){list.append(Object.assign(document.createElement("p"),{className:"hub-muted",textContent:"You have not created or joined a world yet. Start with the form below."}));return;}
 worlds.forEach(w=>{const card=document.createElement("article");card.className="world-card";card.dataset.jrEnvironment=w.world_type||"global";const title=document.createElement("strong");title.textContent=w.name;const p=document.createElement("p");p.textContent=w.description||"A new world ready to be shaped.";const meta=document.createElement("small");const typeLabels={family_personal:"Family World · Personal & shared family life",family_finance:"FAMILY World · Financial participation",personal:"Personal World",business:"Business World",education:"Education World",commerce:"Commerce World",creative:"Creative World",community:"Community World",global:"Global World"};meta.textContent=(typeLabels[w.world_type]||w.world_type)+" · "+w.status+" · Created "+new Date(w.created_at).toLocaleDateString();const b=document.createElement("button");b.type="button";b.dataset.worldId=w.id;b.textContent="Enter world";b.addEventListener("click",()=>openWorld(w.id));card.append(title,p,meta,b);list.append(card);});}
 async function refresh(){feedback.textContent="Loading your worlds…";try{worlds=await api("list_worlds");feedback.textContent=worlds.length?worlds.length+" world(s) available to you.":"Your worlds are ready to begin.";render();}catch(e){feedback.textContent=e.message;}}
 async function openWorld(id){detail.hidden=false;detail.textContent="Opening world…";try{const w=await api("get_world",{worldId:id});document.body.dataset.jrWorld=w.world_type||"global";detail.dataset.jrEnvironment=w.world_type||"global";detail.replaceChildren();const eyebrow=document.createElement("p");eyebrow.className="eyebrow";eyebrow.textContent=w.world_type==="family_personal"?"FAMILY WORLD · PERSONAL & SHARED LIFE":w.world_type==="family_finance"?"FAMILY · FINANCIAL PARTICIPATION":"WORLD · "+w.world_type.toUpperCase();const h=document.createElement("h3");h.textContent=w.name;const desc=document.createElement("p");desc.className="view-copy";desc.textContent=w.description||"No description yet.";const dl=document.createElement("dl");const fields=[["Status",w.status],["Members intended",w.intended_members],["Access",JSON.stringify(w.permissions)],["Workflows",Array.isArray(w.workflows)?w.workflows.join(", "):""]];fields.forEach(([k,v])=>{const dt=document.createElement("dt");dt.textContent=k;const dd=document.createElement("dd");dd.textContent=v||"Not specified";dl.append(dt,dd);});const actions=document.createElement("div");actions.className="world-actions";const toggle=document.createElement("button");toggle.type="button";toggle.textContent=w.status==="active"?"Pause world":"Activate world";toggle.addEventListener("click",async()=>{toggle.disabled=true;try{await api("update_world",{worldId:id,status:w.status==="active"?"paused":"active"});await refresh();await openWorld(id);}catch(e){toggle.textContent=e.message;toggle.disabled=false;}});const close=document.createElement("button");close.type="button";close.textContent="Close world view";close.addEventListener("click",()=>{detail.hidden=true;});actions.append(toggle,close);const editor=document.createElement("form");editor.className="jr-world-editor";editor.innerHTML='<h4>Shape this world</h4><label>World name<input name="name" required minlength="2" maxlength="120"></label><label>Description<textarea name="description" maxlength="2000" rows="3"></textarea></label><label>Who should be involved?<input name="intendedMembers" maxlength="500"></label><label>Activities and workflows<textarea name="workflows" rows="4" maxlength="2400" placeholder="One activity per line"></textarea></label><button class="hub-submit" type="submit">Save world changes</button><p class="hub-feedback" aria-live="polite"></p>';
      editor.elements.name.value=w.name||"";editor.elements.description.value=w.description||"";editor.elements.intendedMembers.value=w.intended_members||"";editor.elements.workflows.value=Array.isArray(w.workflows)?w.workflows.join("\n"):"";
      editor.addEventListener("submit",async event=>{event.preventDefault();if(!editor.reportValidity())return;const save=editor.querySelector("button[type=submit]"),note=editor.querySelector(".hub-feedback");save.disabled=true;note.textContent="Saving your world…";try{await api("update_world",{worldId:id,name:editor.elements.name.value,description:editor.elements.description.value,intendedMembers:editor.elements.intendedMembers.value,workflows:editor.elements.workflows.value.split(/[\n,;]/).map(x=>x.trim()).filter(Boolean)});note.textContent="Your world has been updated.";await refresh();await openWorld(id);}catch(error){note.textContent=error.message;}finally{save.disabled=false;}});
      detail.append(eyebrow,h,desc,dl,editor,actions);setWorldMode("enter");}catch(e){detail.textContent=e.message;}}
 form.addEventListener("submit",async e=>{e.preventDefault();if(!form.reportValidity())return;const b=form.querySelector('button[type="submit"]');b.disabled=true;$("createWorldFeedback").textContent="Creating your world…";const fd=new FormData(form);const workflows=String(fd.get("workflows")||"").split(/[\n,;]/).map(x=>x.trim()).filter(Boolean);try{const w=await api("create_world",{name:fd.get("name"),worldType:fd.get("worldType"),description:fd.get("description"),intendedMembers:fd.get("intendedMembers"),workflows});form.reset();$("createWorldFeedback").textContent="Your world has been created. It is now available in this Worlds environment.";await refresh();if(w?.id)await openWorld(w.id);}catch(err){$("createWorldFeedback").textContent=err.message;}finally{b.disabled=false;}});
 const worldTemplates={
  family_personal:{name:"My Family World",description:"A private or shared space for relatives, family communication, plans, memories and everyday coordination. This is not a financial service.",members:"Invited family members",workflows:["Family updates and announcements","Shared family calendar and events","Family plans and tasks","Family memories and important information"]},
  family_finance:{name:"FAMILY Participation World",description:"The ecosystem-wide FAMILY layer for financial access, saving education, investment access discovery and participation. This does not hold, move or invest money.",members:"Eligible ecosystem participants",workflows:["Financial education and saving guidance","Personal financial goals and planning","Investment education and access discovery","Participation records, disclosures and consent"]},
  personal:{name:"My Personal World",description:"A space for personal goals, routines, projects and everyday life.",members:"Just me",workflows:["Personal goals","Daily plans and routines","Projects and progress"]},
  business:{name:"My Business World",description:"A workspace for building and managing a business, team and operations.",members:"Owner and invited team",workflows:["Business goals and plans","Team tasks and responsibilities","Operations and progress tracking"]},
  education:{name:"My Learning World",description:"A learning space for study, skills, teaching and research.",members:"Learners and invited educators",workflows:["Learning goals and topics","Lessons and study activities","Practice and progress tracking"]},
  commerce:{name:"My Commerce World",description:"A space for goods, services, property, jobs and delivery opportunities.",members:"Owner and invited collaborators",workflows:["Products or services","Customer enquiries","Orders and opportunity tracking"]},
  creative:{name:"My Creative World",description:"A space to create, share and collaborate.",members:"Creator and invited collaborators",workflows:["Ideas and drafts","Creative projects","Collaboration and publishing plans"]},
  community:{name:"My Community World",description:"A shared space for a community and its activities.",members:"Invited community members",workflows:["Community announcements","Events and activities","Shared tasks and initiatives"]},
  global:{name:"My Global World",description:"A starting space to explore and connect with the wider JR PHEEF ecosystem.",members:"Owner and invited collaborators",workflows:["Discover ecosystem opportunities","Connect relevant worlds","Track exploration and ideas"]}
 };

 // Ready-to-enter world experiences: practical starter content appears before a member creates anything.
 // One Worlds environment with two modes: create a world or enter an existing one.
 const categoryGrid=view.querySelector(".world-category-grid");categoryGrid?.remove();
 const worldsWorkspace=view.querySelector(".worlds-workspace");
 const listHeading=worldsWorkspace.querySelector(".worlds-section-head");
 const createSection=form.closest(".world-create");
 const enterPanel=document.createElement("section");enterPanel.className="jr-worlds-mode-panel";enterPanel.dataset.worldModePanel="enter";
 const createPanel=document.createElement("section");createPanel.className="jr-worlds-mode-panel";createPanel.dataset.worldModePanel="create";createPanel.hidden=true;
 const modeBar=document.createElement("nav");modeBar.className="jr-worlds-mode-switch";modeBar.setAttribute("aria-label","World actions");
 modeBar.innerHTML='<button type="button" data-world-mode="enter" aria-pressed="true"><span aria-hidden="true">↗</span> Enter a World</button><button type="button" data-world-mode="create" aria-pressed="false"><span aria-hidden="true">＋</span> Create a World</button>';
 const modeIntro=document.createElement("p");modeIntro.className="jr-worlds-mode-intro";modeIntro.textContent="One shared environment. Enter a world you belong to, or create a new one without leaving this space.";
 enterPanel.append(listHeading,$("worldsFeedback"),list,detail);
 createPanel.append(createSection);
 worldsWorkspace.replaceChildren(modeBar,modeIntro,enterPanel,createPanel);
 const setWorldMode=mode=>{
  modeBar.querySelectorAll("[data-world-mode]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.worldMode===mode)));
  enterPanel.hidden=mode!=="enter";createPanel.hidden=mode!=="create";
  worldsWorkspace.dataset.mode=mode;
 };
 modeBar.querySelectorAll("[data-world-mode]").forEach(button=>button.addEventListener("click",()=>setWorldMode(button.dataset.worldMode)));
 setWorldMode("enter");
 list.replaceChildren(Object.assign(document.createElement("p"),{className:"hub-muted",textContent:"Your worlds will appear here. Choose Create a World to start one."}));
 // Offer studio: camera/gallery selection, local preview, upload and publication.
 const offerStudio=document.createElement("section");
 offerStudio.className="offer-studio";
 offerStudio.innerHTML='<div class="worlds-section-head"><div><p class="eyebrow">COMMERCE · OFFER STUDIO</p><h3>Have something to offer?</h3><p class="hub-muted">Photograph it, choose media from your device, preview it and publish an offer.</p></div></div><form id="jrOfferForm" class="jr-offer-form"><label>What are you offering?<select name="category" required><option value="goods">Goods / products</option><option value="services">Services</option><option value="jobs">Jobs / work</option><option value="property">Property / rooms</option><option value="transport">Transport / delivery</option><option value="business">Business opportunity</option><option value="other">Something else</option></select></label><label>Offer title<input name="title" required minlength="3" maxlength="120" placeholder="e.g. Handmade dining table"></label><label>Description<textarea name="description" required minlength="10" maxlength="2000" rows="3" placeholder="Describe what it is, condition, features, requirements or service details…"></textarea></label><div class="jr-offer-fields"><label>Price / amount (KSh)<input name="price" type="number" min="0" step="0.01" required placeholder="0"></label><label>Location<input name="location" required maxlength="180" placeholder="Town, city or remote"></label></div><div class="jr-media-actions"><label class="hub-small-button media-picker">Choose from gallery<input id="jrOfferGallery" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple></label><label class="hub-small-button media-picker">Use camera<input id="jrOfferCamera" type="file" accept="image/*" capture="environment"></label><span class="hub-muted">Up to 8 photos/videos · 8 MB each</span></div><div id="jrOfferPreview" class="jr-offer-preview" aria-live="polite"></div><label class="jr-offer-check"><input name="negotiable" type="checkbox"> Price is negotiable</label><button class="hub-submit" type="submit">Preview & publish offer</button><p id="jrOfferFeedback" class="hub-feedback" aria-live="polite"></p></form><div class="offer-feed"><div class="worlds-section-head"><div><p class="eyebrow">DISCOVER</p><h3>Offers in JR PHEEF</h3></div><button id="jrOfferRefresh" type="button" class="hub-small-button">Refresh offers</button></div><div id="jrOfferFeed" class="jr-offer-feed"><p class="hub-muted">Loading available offers…</p></div></div>';
 enterPanel.append(offerStudio);
 const offerForm=offerStudio.querySelector("#jrOfferForm"),gallery=offerStudio.querySelector("#jrOfferGallery"),camera=offerStudio.querySelector("#jrOfferCamera"),preview=offerStudio.querySelector("#jrOfferPreview"),offerFeedback=offerStudio.querySelector("#jrOfferFeedback"),feed=offerStudio.querySelector("#jrOfferFeed");
 let selectedFiles=[],previewUrls=[];
 const renderPreview=()=>{
  previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];preview.replaceChildren();
  selectedFiles.slice(0,8).forEach((file,index)=>{
   const tile=document.createElement("div");tile.className="jr-offer-media-tile";
   const url=URL.createObjectURL(file);previewUrls.push(url);
   const media=file.type.startsWith("video/")?document.createElement("video"):document.createElement("img");
   if(media.tagName==="VIDEO"){media.controls=true;media.muted=true;}else media.alt="Offer image preview";
   media.src=url;const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";remove.addEventListener("click",()=>{selectedFiles.splice(index,1);renderPreview();});
   tile.append(media,remove);preview.append(tile);
  });
 };
 const addFiles=input=>{
  const files=[...(input.files||[])];input.value="";
  for(const file of files){
   if(selectedFiles.length>=8){offerFeedback.textContent="You can attach up to 8 files.";break;}
   if(!["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"].includes(file.type)){offerFeedback.textContent="Choose JPG, PNG, WEBP, MP4, WEBM or MOV files.";continue;}
   if(file.size>8*1024*1024){offerFeedback.textContent=file.name+" is over the 8 MB limit.";continue;}
   selectedFiles.push(file);
  }
  renderPreview();
 };
 gallery?.addEventListener("change",()=>addFiles(gallery));camera?.addEventListener("change",()=>addFiles(camera));
 const bytesOf=async file=>await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=()=>reject(new Error("Could not read "+file.name));r.readAsDataURL(file);});
 async function refreshOffers(){
  feed.textContent="Loading offers…";
  try{
   const data=await api("overview");const offers=Array.isArray(data.marketListings)?data.marketListings:[];
   feed.replaceChildren();
   if(!offers.length){const p=document.createElement("p");p.className="hub-muted";p.textContent="No member offers have been published yet. Your offer will appear here after publication.";feed.append(p);return;}
   offers.forEach(item=>{
    const card=document.createElement("article");card.className="jr-offer-card";
    const title=document.createElement("h4");title.textContent=item.title;
    const desc=document.createElement("p");desc.textContent=item.description||"";
    const meta=document.createElement("small");meta.textContent=[item.category,item.location,"KSh "+Number(item.price||0).toLocaleString()].filter(Boolean).join(" · ");
    card.append(title,desc,meta);
    (item.media||[]).forEach(m=>{if(!m.url)return;const el=m.kind==="video"?document.createElement("video"):document.createElement("img");el.src=m.url;if(el.tagName==="VIDEO"){el.controls=true;el.muted=true;}else el.alt=item.title;card.append(el);});
    feed.append(card);
   });
  }catch(error){feed.textContent=error.message;}
 }
 offerForm?.addEventListener("submit",async event=>{
  event.preventDefault();if(!offerForm.reportValidity())return;
  const button=offerForm.querySelector('button[type="submit"]');button.disabled=true;
  offerFeedback.textContent="Uploading your selected media securely…";
  try{
   const media=[];
   for(const file of selectedFiles){
    const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upload_media",purpose:"listing",fileName:file.name,contentType:file.type,fileBase64:await bytesOf(file)})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Media upload failed.");media.push(d.data);
   }
   const fd=new FormData(offerForm);
   const category=String(fd.get("category"));
   const payload={action:"create_listing",title:fd.get("title"),description:fd.get("description"),price:fd.get("price"),location:fd.get("location"),category,negotiable:fd.get("negotiable")==="on",media};
   const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Offer could not be published.");
   offerFeedback.textContent="Your offer has been published to JR PHEEF.";
   offerForm.reset();selectedFiles=[];renderPreview();await refreshOffers();
  }catch(error){offerFeedback.textContent=error.message;}
  finally{button.disabled=false;}
 });
 offerStudio.querySelector("#jrOfferRefresh")?.addEventListener("click",refreshOffers);

 document.querySelectorAll(".world-template-button").forEach(button=>button.addEventListener("click",()=>{
  const type=button.dataset.worldType,template=worldTemplates[type];form.elements.worldType.value=type;
  if(template){form.elements.name.value=template.name;form.elements.description.value=template.description;form.elements.intendedMembers.value=template.members;form.elements.workflows.value=template.workflows.join("\n");}
  setWorldMode("create");form.elements.name.focus({preventScroll:true});
  $("createWorldFeedback").textContent="Loaded the "+button.closest("article").querySelector("h3").textContent+" starter template. Review or edit the details, then create your world.";
 }));
 $("worldsRefresh").addEventListener("click",refresh);
 document.querySelectorAll('.workspace-tab[data-view="worlds"]').forEach(b=>b.addEventListener("click",refresh));
 refresh();
})();