"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const view=$("view-jr"),forms=[$("promptForm"),$("workspacePromptForm")].filter(Boolean);
 if(!view||!forms.length)return;
 const panel=document.createElement("section");
 panel.className="jr-intelligence";
 panel.innerHTML='<p class="eyebrow">JR INTELLIGENCE · STAGING FOUNDATION</p><h3>One conversation. The right worlds.</h3><p class="jr-intelligence-copy">Start with a need, a question, a curious thought, a random idea or simply hello. JR recognises the kind of conversation and can connect requests to available worlds. Full open-ended AI reasoning and live research are not connected yet.</p><div id="jrIntentResult" class="jr-response" aria-live="polite"><p>You do not need a category or a plan. Ask, wonder, imagine or just talk.</p></div><div class="jr-starter-prompts"><span>Try: “Why do people dream?”</span><span>“What if cities floated?”</span><span>“I am bored.”</span><span>“I have an idea.”</span></div><div class="jr-media-composer"><p class="eyebrow">CREATE · PHOTO & VIDEO</p><h3>Prepare something to share</h3><p class="jr-intelligence-copy">Take a photo or video, or choose media from your gallery. Review your selection and caption before sharing. This staging preview does not upload or publish.</p><div class="jr-media-actions"><label>📷 Take photo/video<input id="jrCameraFiles" type="file" accept="image/*,video/*" capture="environment" multiple></label><label>▧ Choose from gallery<input id="jrGalleryFiles" type="file" accept="image/*,video/*" multiple></label></div><textarea id="jrPostCaption" maxlength="2000" placeholder="Write a caption or tell JR what you want to advertise…"></textarea><div id="jrMediaPreview" class="jr-media-preview"></div><p id="jrMediaStatus" class="jr-media-status" aria-live="polite">No media selected.</p></div><p class="jr-theme-note">Atmospheric layered background, translucent surfaces and readable panels. Reduced-motion preferences are respected.</p>';
 view.append(panel);
 const result=$("jrIntentResult"),camera=$("jrCameraFiles"),gallery=$("jrGalleryFiles"),preview=$("jrMediaPreview");
 let objectUrls=[];
 const routes=[
  {type:"family_finance",label:"FAMILY World · Financial Participation",keys:["saving","savings","investment","investing","financial goal","budget","money market","stocks","etf","family finance","family financial"]},
  {type:"family_personal",label:"Family World",keys:["family life","relatives","children","parents","family plans","family event","family chat","family coordination"]},
  {type:"business",label:"Business World",keys:["business","company","staff","employee","shop","supermarket","venture","operations","start a business"]},
  {type:"education",label:"Education & Knowledge",keys:["learn","learning","study","school","teacher","course","research","lesson","homework","teach me"]},
  {type:"commerce",label:"Commerce & Services",keys:["sell","buy","advertise","listing","product","service","property","job","delivery","room","rent"]},
  {type:"creative",label:"Creativity & Community",keys:["design","create","photo","video","content","music","community","publish","post","brainstorm"]},
  {type:"personal",label:"Personal World",keys:["my goal","routine","personal plan","organise my day","organize my day","remind me"]}
 ];
 const normalise=s=>String(s||"").toLocaleLowerCase().trim();
 function detectIntents(value){const s=normalise(value);return routes.filter(r=>r.keys.some(k=>s.includes(k)));}
 function classifyConversation(value){
  const s=normalise(value);
  if(/^(hi|hello|hey|good morning|good afternoon|good evening|sasa|niaje|mambo)[!. ]*$/.test(s))return "greeting";
  if(/\b(what if|imagine|suppose|i wonder|wondering|could it be|wouldn't it be)\b/.test(s))return "wonder";
  if(/\b(i'm bored|i am bored|feeling bored|nothing to do|i'm tired|i am tired|i feel stuck|i feel lonely|i'm broke|i am broke)\b/.test(s))return "human_context";
  if(/\b(curious|curiosity|surprise me|interesting fact|show me something new|teach me something|i want to discover)\b/.test(s))return "curiosity";
  if(/\b(why|what|when|where|who|how|which|whose|can|could|does|do|is|are|will|would)\b/.test(s)||/[?？]$/.test(s))return "question";
  if(/\b(let's talk|lets talk|just chatting|random thought|nothing in mind|no particular reason|just wondering)\b/.test(s))return "open_chat";
  if(/\b(i have an idea|here's an idea|i've got an idea|new idea)\b/.test(s))return "idea";
  return "open_chat";
 }
 function actionButton(label,fn,primary=false){const b=document.createElement("button");b.type="button";b.textContent=label;if(primary)b.className="jr-primary-action";b.addEventListener("click",fn);return b;}
 function renderResponse(message,actions=[]){result.replaceChildren();const p=document.createElement("p");p.textContent=message;result.append(p);if(actions.length){const row=document.createElement("div");row.className="jr-response-actions";actions.forEach(a=>row.append(a));result.append(row);}}
 function openWorlds(){const tab=document.querySelector('.workspace-tab[data-view="worlds"]');if(tab)tab.click();}
 function externalSearch(value){const a=document.createElement("a");a.href="https://www.google.com/search?q="+encodeURIComponent(value);a.target="_blank";a.rel="noopener noreferrer";a.textContent="Also search outside JR PHEEF · wider web";a.className="jr-primary-action";return a;}
 function conversationResponse(value){
  const kind=classifyConversation(value),search=externalSearch(value),actions=[search];
  if(kind==="greeting"){renderResponse("Hello! You don't need to arrive with a plan. You can ask a question, share a thought, imagine something, or tell me what is happening in your day. The full live JR reasoning service is still being connected.",[]);return;}
  if(kind==="wonder"){renderResponse("Let's treat that as a thought experiment. We can explore what might happen, which assumptions matter, what science or evidence says, and what is only speculation. The full live reasoning engine is not connected yet, so I won't pretend to have completed that exploration.",actions);return;}
  if(kind==="question"){renderResponse("That's a valid question. I can help identify what needs explaining and point you towards research. The live answer and research engine is not connected in this staging build, so I won't invent a factual answer. You can search this exact question separately.",actions);return;}
  if(kind==="curiosity"){renderResponse("Curiosity is reason enough. Pick any subject, ask something unusual, or explore a field you have never encountered. Live AI answers are still being connected; external research is available separately.",actions);return;}
  if(kind==="human_context"){renderResponse("I hear you. I won't assume what is behind that feeling. We can talk about it, explore something lighter, or look at practical next steps. What would be most helpful right now?",[]);return;}
  if(kind==="idea"){renderResponse("An unfinished idea is welcome. It can start as a sentence, a sketch or a question. We can later explore its purpose, who it could help, what already exists and how to test it. Live AI development support is still being connected.",[]);return;}
  renderResponse("We can simply talk. You don't need to turn every thought into a task or a transaction. Tell me whatever is on your mind, even if it is unfinished. The full live JR conversation engine is not connected yet.",[]);
 }
 async function workspaceRequest(action,extra={}){const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"Your worlds could not be checked.");return d.data;}
 async function routeRequest(value){
  const intents=detectIntents(value);
  if(!intents.length){conversationResponse(value);return;}
  const external=externalSearch(value);
  renderResponse("I identified "+intents.map(x=>x.label).join(" + ")+". I'm checking which of your worlds are available. I will not read records across worlds without your permission.");
  try{
   const worlds=await workspaceRequest("list_worlds"),actions=[];
   for(const intent of intents){
    const existing=(worlds||[]).find(w=>w.world_type===intent.type&&w.status==="active")||(worlds||[]).find(w=>w.world_type===intent.type);
    if(existing){actions.push(actionButton("Open "+existing.name,()=>{openWorlds();setTimeout(()=>{const b=document.querySelector('[data-world-id="'+CSS.escape(existing.id)+'"]');if(b)b.click();},120);},actions.length===0));}
    else{actions.push(actionButton("Prepare "+intent.label,()=>{openWorlds();setTimeout(()=>{const b=document.querySelector('.world-template-button[data-world-type="'+intent.type+'"]');if(b)b.click();},120);},actions.length===0));}
   }
   actions.push(external);
   renderResponse("JR matched your request to "+intents.map(x=>x.label).join(" and ")+". Open an existing world, or prepare a starter structure for review. A missing world is not created automatically. JR will not create a world or share records without your action.",actions);
  }catch(e){
   const login=actionButton("Log in",()=>document.getElementById("openLogin")?.click());
   renderResponse(e.message+" Sign in to open private worlds. Your request has not been stored.",[login,external]);
  }
 }
 document.addEventListener("submit",event=>{const form=event.target;if(!forms.includes(form))return;event.preventDefault();event.stopImmediatePropagation();const isWorkspace=form.id==="workspacePromptForm",input=$(isWorkspace?"workspacePrompt":"prompt"),value=input?.value.trim();if(!value)return;const reply=$(isWorkspace?"workspacePromptReply":"promptReply");if(reply)reply.textContent="JR is organising your request…";input.value="";routeRequest(value);},true);
 function setFiles(files){objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];preview.replaceChildren();const selected=Array.from(files||[]).slice(0,8);if(!selected.length){$("jrMediaStatus").textContent="No media selected.";return;}let shown=0;selected.forEach(file=>{if((!/^image\//.test(file.type)&&!/^video\//.test(file.type))||file.size>20*1024*1024)return;const url=URL.createObjectURL(file);objectUrls.push(url);const media=document.createElement(file.type.startsWith("video/")?"video":"img");media.src=url;media.alt=file.name;if(media.tagName==="VIDEO"){media.muted=true;media.controls=true;media.playsInline=true;}preview.append(media);shown++;});$("jrMediaStatus").textContent=shown+" media file(s) previewed locally (maximum 8 files, 20 MB each). Nothing has been uploaded or published.";}
 camera.addEventListener("change",()=>setFiles(camera.files));gallery.addEventListener("change",()=>setFiles(gallery.files));window.addEventListener("beforeunload",()=>objectUrls.forEach(URL.revokeObjectURL));
})();