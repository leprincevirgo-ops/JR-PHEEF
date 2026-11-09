"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const view=$("view-jr"),form=$("promptForm");
 if(!view||!form)return;
 const panel=document.createElement("section");
 panel.className="jr-intelligence";
 panel.innerHTML='<p class="eyebrow">JR INTELLIGENCE · STAGING FOUNDATION</p><h3>One conversation. The right worlds.</h3><p class="jr-intelligence-copy">Tell JR what you need. This foundation recognises several common intents, checks your world names and prepares relevant workspaces. Full open-ended AI reasoning and live external research still require an AI and research-service connection.</p><div id="jrIntentResult" class="jr-response" aria-live="polite"><p>Try asking JR to organise family plans, build a business, study a subject, advertise something or plan a financial goal.</p></div><div class="jr-media-composer"><p class="eyebrow">CREATE · PHOTO & VIDEO</p><h3>Prepare something to share</h3><p class="jr-intelligence-copy">Take a photo or video, or choose media from your gallery. Review your selection and caption before sharing. This staging preview does not upload or publish.</p><div class="jr-media-actions"><label>📷 Take photo/video<input id="jrCameraFiles" type="file" accept="image/*,video/*" capture="environment" multiple></label><label>▧ Choose from gallery<input id="jrGalleryFiles" type="file" accept="image/*,video/*" multiple></label></div><textarea id="jrPostCaption" maxlength="2000" placeholder="Write a caption or tell JR what you want to advertise…"></textarea><div id="jrMediaPreview" class="jr-media-preview"></div><p id="jrMediaStatus" class="jr-media-status" aria-live="polite">No media selected.</p></div><p class="jr-theme-note">Atmospheric layered background, translucent surfaces and readable panels. Reduced-motion preferences are respected.</p>';
 view.append(panel);
 const result=$("jrIntentResult"),camera=$("jrCameraFiles"),gallery=$("jrGalleryFiles"),preview=$("jrMediaPreview");
 let objectUrls=[];
 const routes=[
  {type:"family_personal",label:"Family World",keys:["family","relatives","children","parents","family plans","family event","family chat"]},
  {type:"family_finance",label:"FAMILY World · Financial Participation",keys:["saving","savings","investment","investing","financial goal","budget","money market","stocks","etf"]},
  {type:"business",label:"Business World",keys:["business","company","staff","employee","shop","supermarket","venture","operations"]},
  {type:"education",label:"Education & Knowledge",keys:["learn","learning","study","school","teacher","course","research","lesson","homework"]},
  {type:"commerce",label:"Commerce & Services",keys:["sell","buy","advertise","listing","product","service","property","job","delivery","room","rent"]},
  {type:"creative",label:"Creativity & Community",keys:["design","create","photo","video","content","music","community","publish","post"]},
  {type:"personal",label:"Personal World",keys:["my goal","routine","personal plan","organise my day","remind me"]}
 ];
 const normalise=s=>String(s||"").toLocaleLowerCase();
 function detectIntents(value){
  const s=normalise(value);
  return routes.filter(r=>r.keys.some(k=>s.includes(k)));
 }
 async function workspaceRequest(action,extra={}){
  const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});
  let d={};try{d=await r.json()}catch{}
  if(!r.ok)throw new Error(d.error||"Your worlds could not be checked.");
  return d.data;
 }
 function actionButton(label,fn,primary=false){
  const b=document.createElement("button");b.type="button";b.textContent=label;
  if(primary)b.className="jr-primary-action";b.addEventListener("click",fn);return b;
 }
 function renderResponse(message,actions=[]){
  result.replaceChildren();const p=document.createElement("p");p.textContent=message;result.append(p);
  if(actions.length){const row=document.createElement("div");row.className="jr-response-actions";actions.forEach(a=>row.append(a));result.append(row);}
 }
 function openWorlds(){const tab=document.querySelector('.workspace-tab[data-view="worlds"]');if(tab)tab.click();}
 async function routeRequest(value){
  const intents=detectIntents(value);
  const external=document.createElement("a");
  external.href="https://www.google.com/search?q="+encodeURIComponent(value);
  external.target="_blank";external.rel="noopener noreferrer";
  external.textContent="Research this outside JR PHEEF";external.className="jr-primary-action";
  if(!intents.length){
   renderResponse("I haven't confidently identified a JR PHEEF world for that request. I won't guess or open private information. You can research the wider web separately, or describe the task another way.",[external]);return;
  }
  renderResponse("I identified "+intents.map(x=>x.label).join(" + ")+". I'm checking your available world names. I will not read records across worlds without your permission.");
  try{
   const worlds=await workspaceRequest("list_worlds");
   const actions=[];
   for(const intent of intents){
    const existing=(worlds||[]).find(w=>w.world_type===intent.type&&w.status==="active")||(worlds||[]).find(w=>w.world_type===intent.type);
    if(existing){
     actions.push(actionButton("Open "+existing.name,()=>{
      openWorlds();
      setTimeout(()=>{const b=document.querySelector('[data-world-id="'+CSS.escape(existing.id)+'"]');if(b)b.click();},120);
     },actions.length===0));
    }else{
     actions.push(actionButton("Prepare "+intent.label,()=>{
      openWorlds();
      setTimeout(()=>{const b=document.querySelector('.world-template-button[data-world-type="'+intent.type+'"]');if(b)b.click();},120);
     },actions.length===0));
    }
   }
   actions.push(external);
   renderResponse("JR has matched your request to "+intents.map(x=>x.label).join(" and ")+". Open the relevant worlds below. If a world is missing, JR can prepare its starter structure for you to review; it is not created automatically. External research opens separately.",actions);
  }catch(e){renderResponse(e.message+" Sign in again if your session has expired.",[external]);}
 }
 document.addEventListener("submit",event=>{
  if(event.target!==form)return;
  event.preventDefault();event.stopImmediatePropagation();
  const input=$("prompt"),value=input?.value.trim();if(!value)return;
  const reply=$("promptReply");if(reply)reply.textContent="JR is organising your request…";
  input.value="";routeRequest(value);
 },true);
 function setFiles(files){
  objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];preview.replaceChildren();
  const selected=Array.from(files||[]).slice(0,8);
  if(!selected.length){$("jrMediaStatus").textContent="No media selected.";return;}
  let shown=0;
  selected.forEach(file=>{
   if((!/^image\//.test(file.type)&&!/^video\//.test(file.type))||file.size>20*1024*1024)return;
   const url=URL.createObjectURL(file);objectUrls.push(url);
   const media=document.createElement(file.type.startsWith("video/")?"video":"img");
   media.src=url;media.alt=file.name;
   if(media.tagName==="VIDEO"){media.muted=true;media.controls=true;media.playsInline=true;}
   preview.append(media);shown++;
  });
  $("jrMediaStatus").textContent=shown+" media file(s) previewed locally (maximum 8 files, 20 MB each). Nothing has been uploaded or published.";
 }
 camera.addEventListener("change",()=>setFiles(camera.files));
 gallery.addEventListener("change",()=>setFiles(gallery.files));
 window.addEventListener("beforeunload",()=>objectUrls.forEach(URL.revokeObjectURL));
})();