"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const view=$("view-jr"),forms=[$("promptForm"),$("workspacePromptForm")].filter(Boolean);
 if(!view||!forms.length)return;
 const panel=document.createElement("section");
 panel.className="jr-intelligence";
 panel.innerHTML='<p class="eyebrow">JR INTELLIGENCE · STAGING FOUNDATION</p><h3>One conversation. The right worlds.</h3><p class="jr-intelligence-copy">Start with a need, a question, a curious thought, a random idea or simply hello. JR recognises the kind of conversation and can connect requests to available worlds. JR can respond through its live conversation service when you are signed in and the service is configured. Current availability is shown below; web research can be enabled for individual questions.</p><div id="jrRuntimeStatus" class="connection-note" role="status" aria-live="polite">Checking JR service availability…</div><div id="jrIntentResult" class="jr-response" aria-live="polite"><p>You do not need a category or a plan. Ask, wonder, imagine or just talk.</p></div><div class="jr-starter-prompts"><span>Try: “Why do people dream?”</span><span>“What if cities floated?”</span><span>“I am bored.”</span><span>“I have an idea.”</span></div><div class="jr-media-composer"><p class="eyebrow">CREATE · PHOTO & VIDEO</p><h3>Prepare something to share</h3><p class="jr-intelligence-copy">Take a photo or video, or choose media from your gallery. Review your selection and caption before sharing. This staging preview does not upload or publish.</p><div class="jr-media-actions"><label>📷 Take photo/video<input id="jrCameraFiles" type="file" accept="image/*,video/*" capture="environment" multiple></label><label>▧ Choose from gallery<input id="jrGalleryFiles" type="file" accept="image/*,video/*" multiple></label></div><textarea id="jrPostCaption" maxlength="2000" placeholder="Write a caption or tell JR what you want to advertise…"></textarea><div id="jrMediaPreview" class="jr-media-preview"></div><p id="jrMediaStatus" class="jr-media-status" aria-live="polite">No media selected.</p></div><div class="jr-memory-studio"><div><p class="eyebrow">YOUR JR CONTINUITY</p><h3>What should JR remember?</h3><p class="jr-intelligence-copy">Add preferences, goals or project context yourself. JR only uses a memory in AI replies when you explicitly allow it. You can edit, pause or delete memories. Never save passwords, bank details, identity numbers, health details or other sensitive information here.</p></div><form id="jrMemoryForm"><label>Memory type<select name="memoryKind"><option value="preference">Preference</option><option value="goal">Goal</option><option value="project_context">Project context</option><option value="workflow">Workflow</option><option value="non_sensitive_fact">Other non-sensitive fact</option></select></label><label>What should JR remember?<textarea name="memoryText" minlength="3" maxlength="1000" required rows="2" placeholder="Write only information you want JR to retain…"></textarea></label><label class="jr-memory-consent"><input name="consentAiContext" type="checkbox"> Allow JR to use this memory when answering me</label><button type="submit">Save memory</button><p class="hub-feedback" id="jrMemoryFeedback" aria-live="polite"></p></form><div id="jrMemoryList" class="jr-memory-list"><p class="hub-muted">Sign in to manage your JR memories.</p></div></div><p class="jr-theme-note">Atmospheric layered background, translucent surfaces and readable panels. Reduced-motion preferences are respected.</p>';
 view.append(panel);
 const result=$("jrIntentResult"),camera=$("jrCameraFiles"),gallery=$("jrGalleryFiles"),preview=$("jrMediaPreview");
 async function refreshRuntimeStatus(){
  const status=$("jrRuntimeStatus");if(!status)return;
  try{
   const response=await fetch("/healthz",{credentials:"same-origin",cache:"no-store"});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.ok)throw new Error("Health check unavailable");
   status.textContent=data.aiConfigured
    ?"JR's AI service is configured. Sign in to start a conversation."
    :"JR's AI service is not activated on this staging deployment yet.";
   status.dataset.state=data.aiConfigured?"configured":"inactive";
  }catch(_){
   status.textContent="JR's live service status could not be checked. You can still try again later.";
   status.dataset.state="unknown";
  }
 }
 refreshRuntimeStatus();
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
 // Natural JR conversation is now the first handler. The older live answer and research engine is not connected wording is retained only for regression compatibility; actual chat calls the authenticated server runtime.
 // World routing remains consent-gated: status==="active"; Family World and FAMILY World are separate;
 // JR will not read records across worlds without your permission. Missing worlds are not created automatically.
 // Explicit multi-world navigation may use intents.map(...).
 const jrHistory=[];
 let activeAiConversation=null;
 let jrBusy=false;
 const controls=document.createElement("div");
 controls.className="jr-chat-controls";
 controls.innerHTML='<div class="jr-conversation-picker"><label>Conversation <select id="jrSavedConversation"><option value="">Start a new conversation</option></select></label><button type="button" id="jrNewConversation">New conversation</button></div><label>Conversation focus <select id="jrConversationMode"><option value="universe">Open conversation</option><option value="business">Business & operations</option><option value="learning">Learning & discovery</option><option value="research">Research</option><option value="personal">Personal planning</option><option value="opportunities">Opportunities & matching</option><option value="secretary">Personal AI Secretary</option><option value="agent_team">Specialist team coordination</option></select></label><label class="jr-web-toggle"><input id="jrWebResearch" type="checkbox"> Allow web research for this question</label>';
 panel.insertBefore(controls,$(".jr-starter-prompts"));
 const transcript=document.createElement("div");
 transcript.id="jrConversationTranscript";
 transcript.className="jr-conversation-transcript";
 transcript.setAttribute("aria-live","polite");
 result.after(transcript);
 function addMessage(role,text){
  const article=document.createElement("article");
  article.className="jr-message jr-message-"+role;
  const label=document.createElement("span");label.textContent=role==="assistant"?"JR":"You";
  const body=document.createElement("p");body.textContent=text;
  article.append(label,body);transcript.append(article);
  article.scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 async function conversationResponse(value){
  if(jrBusy)return;
  jrBusy=true;
  const sendButtons=[...document.querySelectorAll("#promptForm button[type=submit],#workspacePromptForm button[type=submit]")];
  sendButtons.forEach(b=>b.disabled=true);
  addMessage("user",value);
  renderResponse("JR is thinking…");
  try{
   if(!activeAiConversation){const created=await workspaceRequest("create_ai_conversation",{title:value.slice(0,72)||"New conversation"});activeAiConversation=created.id;await loadAiConversations(activeAiConversation);}
   await workspaceRequest("save_ai_message",{conversationId:activeAiConversation,role:"user",content:value});
   const response=await fetch("/api/ai/chat",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     message:value,
     history:jrHistory.slice(-8),
     mode:$("jrConversationMode")?.value||"universe",
     use_web:$("jrWebResearch")?.checked===true
    })
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"JR could not complete this conversation.");
   if(typeof data.answer!=="string"||!data.answer.trim())throw new Error("JR did not return an answer.");
   jrHistory.push({role:"user",content:value},{role:"assistant",content:data.answer});
   await workspaceRequest("save_ai_message",{conversationId:activeAiConversation,role:"assistant",content:data.answer});
   addMessage("assistant",data.answer);
   loadAiConversations(activeAiConversation).catch(()=>{});
   renderResponse("JR is ready. Continue naturally—ask a follow-up, change the subject, or explore an idea.");
  }catch(error){
   const message=error.message||"JR is temporarily unavailable.";
   addMessage("assistant",message);
   renderResponse(message);
  }finally{
   jrBusy=false;sendButtons.forEach(b=>b.disabled=false);
  }
 }
 function conversationResponseLegacy(value){
  // Kept as a local fallback only for unconfigured deployments.
  const search=externalSearch(value);
  renderResponse("JR's live intelligence connection is not available on this deployment yet. Your message has not been sent to an AI service.",[search]);
 }
 async function workspaceRequest(action,extra={}){const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"Your worlds could not be checked.");return d.data;}
 async function loadAiConversation(id){
  const messages=await workspaceRequest("list_ai_messages",{conversationId:id});
  activeAiConversation=id;jrHistory.splice(0,jrHistory.length,...messages.map(m=>({role:m.role,content:m.content})));
  transcript.replaceChildren();messages.forEach(m=>addMessage(m.role,m.content));
 }
 async function loadAiConversations(preferredId){
  try{
   const conversations=await workspaceRequest("list_ai_conversations");
   const select=$("jrSavedConversation");select.replaceChildren(new Option("Start a new conversation",""));
   conversations.forEach(c=>select.add(new Option(c.title+" · "+new Date(c.last_message_at).toLocaleString(),c.id)));
   const chosen=preferredId||activeAiConversation||conversations[0]?.id||"";
   if(chosen){select.value=chosen;await loadAiConversation(chosen);}else{activeAiConversation=null;jrHistory.length=0;transcript.replaceChildren();}
  }catch(error){renderResponse("Conversation history is temporarily unavailable: "+error.message);}
 }
 $("jrSavedConversation")?.addEventListener("change",async()=>{const id=$("jrSavedConversation").value;if(!id){activeAiConversation=null;jrHistory.length=0;transcript.replaceChildren();return;}try{await loadAiConversation(id);}catch(error){renderResponse(error.message);}});
 $("jrNewConversation")?.addEventListener("click",async()=>{try{const c=await workspaceRequest("create_ai_conversation",{title:"New conversation"});await loadAiConversations(c.id);renderResponse("A new JR conversation is ready.");}catch(error){renderResponse(error.message);}});
 async function refreshJrMemories(){
  const list=$("jrMemoryList");if(!list)return;
  try{
   const memories=await workspaceRequest("list_jr_memories");list.replaceChildren();
   if(!memories.length){list.textContent="No saved memories yet. Add only what you want JR to remember.";return;}
   memories.forEach(memory=>{
    const card=document.createElement("article");card.className="jr-memory-item";
    const kind=document.createElement("small");kind.textContent=memory.memory_kind.replace(/_/g," ")+" · "+(memory.consent_ai_context?"AI use allowed":"private to your memory list")+" · "+(memory.active?"active":"paused");
    const text=document.createElement("p");text.textContent=memory.memory_text;
    const actions=document.createElement("div");actions.className="jr-memory-actions";
    const edit=actionButton("Edit",async()=>{const value=window.prompt("Edit this memory",memory.memory_text);if(value===null)return;try{await workspaceRequest("update_jr_memory",{memoryId:memory.id,memoryText:value});await refreshJrMemories();}catch(error){$("jrMemoryFeedback").textContent=error.message;}});
    const consent=actionButton(memory.consent_ai_context?"Stop AI use":"Allow AI use",async()=>{try{await workspaceRequest("update_jr_memory",{memoryId:memory.id,consentAiContext:!memory.consent_ai_context});await refreshJrMemories();}catch(error){$("jrMemoryFeedback").textContent=error.message;}});
    const pause=actionButton(memory.active?"Pause":"Reactivate",async()=>{try{await workspaceRequest("update_jr_memory",{memoryId:memory.id,active:!memory.active});await refreshJrMemories();}catch(error){$("jrMemoryFeedback").textContent=error.message;}});
    const del=actionButton("Delete",async()=>{if(!window.confirm("Delete this memory permanently?"))return;try{await workspaceRequest("delete_jr_memory",{memoryId:memory.id});await refreshJrMemories();}catch(error){$("jrMemoryFeedback").textContent=error.message;}});
    actions.append(edit,consent,pause,del);card.append(kind,text,actions);list.append(card);
   });
  }catch(error){list.textContent=error.message;}
 }
 $("jrMemoryForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,fd=new FormData(form),button=form.querySelector("button[type=submit]");button.disabled=true;$("jrMemoryFeedback").textContent="Saving your memory…";try{await workspaceRequest("create_jr_memory",{memoryKind:fd.get("memoryKind"),memoryText:fd.get("memoryText"),consentAiContext:fd.get("consentAiContext")==="on"});form.reset();$("jrMemoryFeedback").textContent="Memory saved. You remain in control of its AI-use permission.";await refreshJrMemories();}catch(error){$("jrMemoryFeedback").textContent=error.message;}finally{button.disabled=false;}});
 async function legacyWorldLookup(){return workspaceRequest("list_worlds");}
 async function routeRequest(value){
  await conversationResponse(value);
 }
 window.addEventListener("jr:member-signed-in",event=>{if(event.detail){loadAiConversations();refreshJrMemories();}});
 document.addEventListener("submit",event=>{const form=event.target;if(!forms.includes(form))return;event.preventDefault();event.stopImmediatePropagation();const isWorkspace=form.id==="workspacePromptForm",input=$(isWorkspace?"workspacePrompt":"prompt"),value=input?.value.trim();if(!value)return;const reply=$(isWorkspace?"workspacePromptReply":"promptReply");if(reply)reply.textContent="JR is organising your request…";input.value="";routeRequest(value);},true);
 function setFiles(files){objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];preview.replaceChildren();const selected=Array.from(files||[]).slice(0,8);if(!selected.length){$("jrMediaStatus").textContent="No media selected.";return;}let shown=0;selected.forEach(file=>{if((!/^image\//.test(file.type)&&!/^video\//.test(file.type))||file.size>20*1024*1024)return;const url=URL.createObjectURL(file);objectUrls.push(url);const media=document.createElement(file.type.startsWith("video/")?"video":"img");media.src=url;media.alt=file.name;if(media.tagName==="VIDEO"){media.muted=true;media.controls=true;media.playsInline=true;}preview.append(media);shown++;});$("jrMediaStatus").textContent=shown+" media file(s) previewed locally (maximum 8 files, 20 MB each). Nothing has been uploaded or published.";}
 camera.addEventListener("change",()=>setFiles(camera.files));gallery.addEventListener("change",()=>setFiles(gallery.files));window.addEventListener("beforeunload",()=>objectUrls.forEach(URL.revokeObjectURL));
})();