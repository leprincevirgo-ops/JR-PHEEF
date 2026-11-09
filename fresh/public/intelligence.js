"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const view=$("view-jr"),form=$("promptForm");
 if(!view||!form)return;
 const panel=document.createElement("section");
 panel.className="jr-intelligence";
 panel.innerHTML='<p class="eyebrow">JR INTELLIGENCE · STAGING PREVIEW</p><h3>One conversation. The right world.</h3><p class="jr-intelligence-copy">Tell JR what you need. This foundation can recognise common intents, locate your existing worlds and prepare a relevant workspace. Full open-ended AI reasoning and live external research are not connected yet.</p><div id="jrIntentResult" class="jr-response" aria-live="polite"><p>Try asking to organise family plans, build a business, learn a subject, sell something or explore financial education.</p></div><div class="jr-media-composer"><p class="eyebrow">CREATE · PHOTO & VIDEO</p><h3>Prepare something to share</h3><p class="jr-intelligence-copy">Use your camera or choose existing media. JR can preview a draft here; uploading and publishing are not connected yet.</p><div class="jr-media-actions"><label>📷 Take photo/video<input id="jrCameraFiles" type="file" accept="image/*,video/*" capture="environment" multiple></label><label>▧ Choose from gallery<input id="jrGalleryFiles" type="file" accept="image/*,video/*" multiple></label></div><textarea id="jrPostCaption" maxlength="2000" placeholder="Write a caption or tell JR what you want to advertise…"></textarea><div id="jrMediaPreview" class="jr-media-preview"></div><p id="jrMediaStatus" class="jr-media-status" aria-live="polite">No media selected.</p></div><p class="jr-theme-note">Visual environment: layered atmospheric gradients and translucent panels replace the flat solid-colour feel. Your device can reduce motion through its accessibility settings.</p>';
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
 function chooseIntent(value){const s=value.toLowerCase();for(const r of routes){if(r.keys.some(k=>s.includes(k)))return r;}return null;}
 async function workspaceRequest(action,extra={}){const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"Your worlds could not be checked.");return d.data;}
 function actionButton(label,fn,primary=false){const b=document.createElement("button");b.type="button";b.textContent=label;if(primary)b.className="jr-primary-action";b.addEventListener("click",fn);return b;}
 function renderResponse(message,actions=[]){result.replaceChildren();const p=document.createElement("p");p.textContent=message;result.append(p);if(actions.length){const row=document.createElement("div");row.className="jr-response-actions";actions.forEach(a=>row.append(a));result.append(row);}}
 async function routeRequest(value){
  const intent=chooseIntent(value);
  if(!intent){const external=document.createElement("a");external.href="https://www.google.com/search?q="+encodeURIComponent(value);external.target="_blank";external.rel="noopener noreferrer";external.textContent="Search the wider web";external.className="jr-primary-action";renderResponse("I haven't confidently identified a JR PHEEF world for that request. I won't guess. You can search the wider web in a separate tab, or rephrase what you want to do.",[external]);return;}
  renderResponse("I understand this as a "+intent.label+" task. I'm checking which of your worlds is available.");
  try{
   const worlds=await workspaceRequest("list_worlds");
   const existing=(worlds||[]).find(w=>w.world_type===intent.type&&w.status==="active")||(worlds||[]).find(w=>w.world_type===intent.type);
   const openTab=()=>{const tab=document.querySelector('.workspace-tab[data-view="worlds"]');if(tab)tab.click();};
   if(existing){
    const open=actionButton("Open "+existing.name,()=>{openTab();setTimeout(()=>{const b=document.querySelector('[data-world-id="'+CSS.escape(existing.id)+'"]');if(b)b.click();},100);},true);
    const external=document.createElement("a");external.href="https://www.google.com/search?q="+encodeURIComponent(value);external.target="_blank";external.rel="noopener noreferrer";external.textContent="Also search outside JR PHEEF";
    renderResponse("Your "+intent.label+" already exists: "+existing.name+". JR has identified it from your accessible world list. Open it to continue. External information can be researched separately.",[open,external]);
   }else{
    const prepare=actionButton("Prepare a "+intent.label,()=>{openTab();setTimeout(()=>{const b=document.querySelector('.world-template-button[data-world-type="'+intent.type+'"]');if(b)b.click();},100);},true);
    renderResponse("You don't appear to have an existing "+intent.label+". I can prepare its starter structure for you to review. It will not be created until you submit the world form.",[prepare]);
   }
  }catch(e){renderResponse(e.message+" Sign in again if your session has expired.");}
 }
 document.addEventListener("submit",event=>{
  if(event.target!==form)return;
  event.preventDefault();event.stopImmediatePropagation();
  const input=$("prompt"),value=input.value.trim();if(!value)return;
  $("promptReply").textContent="JR is organising your request…";input.value="";
  routeRequest(value);
 },true);
 function setFiles(files){objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];preview.replaceChildren();const selected=Array.from(files||[]).slice(0,8);if(!selected.length){$("jrMediaStatus").textContent="No media selected.";return;}
  selected.forEach(file=>{if(!/^image\//.test(file.type)&&!/^video\//.test(file.type))return;const url=URL.createObjectURL(file);objectUrls.push(url);const media=document.createElement(file.type.startsWith("video/")?"video":"img");media.src=url;if(media.tagName==="VIDEO"){media.muted=true;media.controls=true;}media.alt=file.name;preview.append(media);});
  $("jrMediaStatus").textContent=selected.length+" file(s) selected for local preview. Nothing has been uploaded or published.";
 }
 camera.addEventListener("change",()=>setFiles(camera.files));gallery.addEventListener("change",()=>setFiles(gallery.files));
 window.addEventListener("beforeunload",()=>objectUrls.forEach(URL.revokeObjectURL));
})();
