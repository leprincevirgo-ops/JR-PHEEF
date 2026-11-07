(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let activeTab="jr",member=null,connections=[],recognition=null,silenceTimer=null,maxTimer=null,statusSection=null,chatGrid=null,mounted=false,floatingObserver=null;
const api=async(url,method="GET",body)=>{try{const r=await fetch(url,{method,credentials:"include",cache:"no-store",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));return r.ok?d:{...d,ok:false};}catch{return{ok:false,error:"Connection unavailable. Please try again."};}};
function node(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function stopVoice(message){
 clearTimeout(silenceTimer);clearTimeout(maxTimer);
 if(recognition){const r=recognition;recognition=null;try{r.stop();}catch{}}
 const start=$("jrccVoice"),stop=$("jrccStopVoice");
 if(start){start.disabled=false;start.textContent="🎙 Speak";}
 if(stop)stop.hidden=true;
 const note=$("jrccVoiceStatus");if(note)note.textContent=message||"Microphone is off.";
}
function startVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){$("jrccVoiceStatus").textContent="Voice input is not supported by this browser. You can type instead.";return;}
 stopVoice("Preparing microphone…");
 const r=new SR();recognition=r;r.lang=navigator.language||"en-KE";r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
 const input=$("jrccInput");let finalText="",heard=false;
 $("jrccVoice").disabled=true;$("jrccVoice").textContent="Listening…";$("jrccStopVoice").hidden=false;
 $("jrccVoiceStatus").textContent="Listening only for this request. Stop is always available.";
 const stopAfterSilence=()=>{clearTimeout(silenceTimer);silenceTimer=setTimeout(()=>stopVoice("Speech ended. Review your words and send when ready."),1800);};
 r.onresult=e=>{
  heard=true;let interim="";
  for(let i=e.resultIndex;i<e.results.length;i++){const phrase=(e.results[i][0]&&e.results[i][0].transcript)||"";if(e.results[i].isFinal)finalText+=phrase;else interim+=phrase;}
  input.value=(finalText+interim).trim();stopAfterSilence();
 };
 r.onerror=e=>stopVoice(e.error==="not-allowed"?"Microphone permission was not granted. You can type instead.":"Voice input stopped. You can continue by typing.");
 r.onend=()=>{if(recognition===r){recognition=null;stopVoice(heard?"Speech captured. Review and send when ready.":"Listening ended. You can try again or type.");}};
 maxTimer=setTimeout(()=>stopVoice("Voice input reached its 15-second limit. Review what was captured."),15000);
 try{r.start();}catch{stopVoice("The microphone could not start. You can type instead.");}
}
function appendBubble(kind,title,content){
 const host=$("jrccTranscript");if(!host)return;
 const item=node("article","jrcc-message "+(kind==="user"?"is-user":"is-jr"));
 item.append(node("strong","jrcc-message-label",title));
 if(typeof content==="string"){const p=node("p","",content);item.append(p);}else if(content)item.append(content);
 host.append(item);host.scrollTop=host.scrollHeight;
}
async function askJR(){
 const input=$("jrccInput"),text=(input?input.value.trim():"");if(!text)return;
 stopVoice("Microphone is off.");
 appendBubble("user","YOU",text);input.value="";
 const send=$("jrccSend");if(send)send.disabled=true;
 const thinking=node("article","jrcc-message is-jr");thinking.append(node("strong","jrcc-message-label","JR"),node("p","jrcc-thinking","Thinking through your request…"));$("jrccTranscript").append(thinking);$("jrccTranscript").scrollTop=$("jrccTranscript").scrollHeight;
 let helper=$("jrSay"),reply=$("jrReply");
 if(!helper){helper=node("textarea");helper.id="jrSay";helper.hidden=true;document.body.append(helper);}
 if(!reply){reply=node("div");reply.id="jrReply";reply.hidden=true;document.body.append(reply);}
 helper.value=text;reply.replaceChildren();
 try{
  if(typeof window.jrAsk==="function")await window.jrAsk();
  else {const d=await api("/api/jr/command","POST",{text});reply.textContent=d.reply||d.error||"JR could not complete that request.";}
  const response=node("div","jrcc-response");
  if(reply.childNodes.length)response.append(...[...reply.childNodes].map(n=>n.cloneNode(true)));
  else response.textContent="JR did not return a response. Please try again.";
  thinking.replaceWith(node("article","jrcc-message is-jr"));
  const bubble=$("jrccTranscript").lastElementChild;
  bubble.append(node("strong","jrcc-message-label","JR"),response);
 }catch{thinking.replaceWith(node("article","jrcc-message is-jr","JR could not respond just now. Please try again."));}
 finally{if(send)send.disabled=false;if(input)input.focus();}
}
function switchTab(tab){
 activeTab=tab;const root=$("jrCommandSocial");if(!root)return;
 root.querySelectorAll("[data-jrcc-tab]").forEach(b=>{const on=b.dataset.jrccTab===tab;b.classList.toggle("is-active",on);b.setAttribute("aria-selected",String(on));});
 root.querySelectorAll("[data-jrcc-panel]").forEach(p=>p.hidden=p.dataset.jrccPanel!==tab);
 if(tab==="chats"){if(window.jrMessagesLoad)window.jrMessagesLoad();if(window.jrCommandCentreChatActive){}}
 if(tab==="status")if(window.jrLoadStatuses)window.jrLoadStatuses();
 if(tab==="contacts")loadContacts();
 if(tab==="profile")loadProfile();
}
async function loadContacts(){
 const host=$("jrccContacts");if(!host)return;host.textContent="Loading your contacts…";
 const d=await api("/api/connections");if(!d.ok){host.textContent=d.error||"Contacts are unavailable.";return;}
 connections=d.connections||[];renderContacts();
}
function renderContacts(){
 const host=$("jrccContacts");if(!host)return;const q=(($("jrccContactSearch")?$("jrccContactSearch").value:"")||"").trim().toLowerCase();host.replaceChildren();
 const rows=connections.filter(c=>{const o=c.other_member||{};return [o.full_name,o.jp_number].join(" ").toLowerCase().includes(q);});
 if(!rows.length){host.append(node("p","jrcc-empty",q?"No matching contacts.":"No connections yet. Add someone using their JP number, or accept an incoming request."));return;}
 rows.forEach(c=>{
  const o=c.other_member||{},card=node("article","jrcc-contact");
  const avatar=node("span","jrcc-contact-avatar",(o.full_name||"J").trim().slice(0,1).toUpperCase());
  const info=node("div","jrcc-contact-info");info.append(node("strong","",o.full_name||"JR PHEEF Member"),node("small","",o.jp_number||"JP identity unavailable"));
  const top=node("div","jrcc-contact-top");top.append(avatar,info,node("span","jrcc-contact-state",c.status==="accepted"?"CONNECTED":c.status==="pending"?"PENDING":String(c.status||"").toUpperCase()));card.append(top);
  const actions=node("div","jrcc-contact-actions");
  if(c.status==="pending"&&String(c.receiver_id)===String((member&&member.id))){
   const accept=node("button","primary","ACCEPT");accept.onclick=()=>changeConnection(c.id,"accepted");
   const decline=node("button","dark","DECLINE");decline.onclick=()=>changeConnection(c.id,"declined");actions.append(accept,decline);
  }else if(c.status==="pending"){
   const cancel=node("button","dark","CANCEL REQUEST");cancel.onclick=()=>changeConnection(c.id,"cancelled");actions.append(cancel);
  }else if(c.status==="accepted"){
   const chat=node("button","primary","CHAT");chat.onclick=()=>switchTab("chats");actions.append(chat);
  }
  if(actions.childNodes.length)card.append(actions);host.append(card);
 });
}
async function changeConnection(id,status){const d=await api("/api/connections/"+encodeURIComponent(id),"PATCH",{status});if(!d.ok){$("jrccContactStatus").textContent=d.error||"Could not update request.";return;}$("jrccContactStatus").textContent="Connection updated.";loadContacts();}
async function addContact(){
 const input=$("jrccContactNumber"),note=$("jrccContactStatus"),jp=input.value.trim();if(!jp){note.textContent="Enter a JP number first.";return;}
 const button=$("jrccAddContact");button.disabled=true;note.textContent="Sending connection request…";
 const d=await api("/api/connections/by-jp-number","POST",{jp_number:jp});button.disabled=false;note.textContent=d.message||d.error||"Request processed.";if(d.ok){input.value="";loadContacts();}
}
async function loadProfile(){
 const host=$("jrccProfile");if(!host)return;host.textContent="Loading your profile…";
 const d=await api("/api/me");if(!d.ok||!d.member){host.textContent=d.error||"Profile unavailable.";return;}
 member=d.member;window.jrCurrentMemberId=member.id;host.replaceChildren();
 const top=node("div","jrcc-profile-top");const avatar=node("div","jrcc-profile-avatar",(member.full_name||"JR").trim().slice(0,2).toUpperCase());
 const copy=node("div","jrcc-profile-copy");copy.append(node("h3","",member.full_name||"Your profile"),node("p","",member.jp_number||"JP number pending"));top.append(avatar,copy);host.append(top);
 const grid=node("div","jrcc-profile-grid");
 [["Account",member.status||"Active"],["Verification",member.verified===true?"Platform verified":"Not verified"],["Membership",member.plan||"Standard"],["Email",member.email||"Not added"]].forEach(([k,v])=>{const cell=node("div","jrcc-profile-cell");cell.append(node("small","",k),node("strong","",v));grid.append(cell);});
 host.append(grid);
 const note=node("p","jrcc-note",member.verified===true?"Your account has a platform verification flag.":"Founder or JP identity status does not itself verify a person's identity. Verification must be completed through an evidence-based process.");host.append(note);
 const edit=node("button","primary","EDIT FULL PROFILE");edit.onclick=()=>{if(window.jrWorkspaceNavigate)window.jrWorkspaceNavigate("profile");};host.append(edit);
}
function syncFloatingTalkControl(){
 const page=$("command"),open=!!page&&!page.hidden&&!page.classList.contains("hidden");
 document.body.classList.toggle("jrcc-command-open",open);
 document.querySelectorAll("button,a,[role='button']").forEach(el=>{
  if(el.closest("#jrCommandSocial"))return;
  const label=(el.innerText||el.textContent||"").replace(/\s+/g," ").trim();
  if(!/^✦?\s*Talk to JR$/i.test(label))return;
  let node=el,floating=false;
  for(let i=0;node&&i<4;i++,node=node.parentElement){
   if(getComputedStyle(node).position==="fixed"){floating=true;break;}
  }
  if(floating)el.classList.add("jrcc-floating-talk-control");
 });
}
function observeFloatingTalkControl(){
 syncFloatingTalkControl();
 if(floatingObserver)return;
 floatingObserver=new MutationObserver(()=>syncFloatingTalkControl());
 floatingObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
}
function mount(){
 const page=$("command");if(!page||mounted)return;
 const root=node("section","jr-command-social");root.id="jrCommandSocial";
 const heading=node("div","jrcc-heading");heading.append(node("span","jp-kicker","JR PHEEF · COMMAND CENTER"),node("h2","","Your people. Your conversations. One JR."),node("p","","A single connected space for JR, private chats, contacts, status and your profile."));
 const tabs=node("div","jrcc-tabs");tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Command Center communication");
 [["jr","✦ Talk to JR"],["chats","✉ Chats"],["contacts","♧ Contacts"],["status","◌ Status"],["profile","◉ Profile"]].forEach(([id,label])=>{const b=node("button",id==="jr"?"is-active":"",label);b.type="button";b.dataset.jrccTab=id;b.setAttribute("role","tab");b.setAttribute("aria-selected",String(id==="jr"));b.addEventListener("click",()=>switchTab(id));tabs.append(b);});
 const body=node("div","jrcc-body");
 const jr=node("section","jrcc-panel");jr.dataset.jrccPanel="jr";jr.setAttribute("role","tabpanel");
 const jrtop=node("div","jrcc-jr-top");jrtop.append(node("div","jrcc-jr-orb","JR"),node("div","", "JR is here. Start anywhere."));jr.append(jrtop);
 const transcript=node("div","jrcc-transcript");transcript.id="jrccTranscript";transcript.setAttribute("aria-live","polite");const welcome=node("article","jrcc-message is-jr");welcome.append(node("strong","jrcc-message-label","JR"),node("p","","Hello. What would you like to understand, create, learn, connect or make happen today?"));transcript.append(welcome);jr.append(transcript);
 const compose=node("div","jrcc-compose");const input=node("textarea");input.id="jrccInput";input.rows=2;input.maxLength=4000;input.placeholder="Talk to JR in your own words…";input.setAttribute("aria-label","Message JR");
 const controls=node("div","jrcc-compose-controls");const voice=node("button","dark","🎙 Speak");voice.id="jrccVoice";voice.type="button";voice.onclick=startVoice;const stop=node("button","dark","STOP");stop.id="jrccStopVoice";stop.type="button";stop.hidden=true;stop.onclick=()=>stopVoice("Listening stopped. Microphone is off.");
 const send=node("button","primary","SEND");send.id="jrccSend";send.type="button";send.onclick=askJR;controls.append(voice,stop,send);compose.append(input,controls);
 const voiceStatus=node("p","jrcc-note","Microphone stays off until you choose Speak.");voiceStatus.id="jrccVoiceStatus";jr.append(compose,voiceStatus);
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();askJR();}});
 const chats=node("section","jrcc-panel");chats.dataset.jrccPanel="chats";chats.hidden=true;chats.setAttribute("role","tabpanel");
 const contacts=node("section","jrcc-panel");contacts.dataset.jrccPanel="contacts";contacts.hidden=true;contacts.setAttribute("role","tabpanel");
 const add=node("div","jrcc-add-contact");const jp=node("input");jp.id="jrccContactNumber";jp.maxLength=24;jp.placeholder="JP number e.g. JP-01…";const addButton=node("button","primary","ADD");addButton.id="jrccAddContact";addButton.onclick=addContact;add.append(jp,addButton);
 const search=node("input","jrcc-contact-search");search.id="jrccContactSearch";search.type="search";search.placeholder="Search contacts by name or JP number…";search.oninput=renderContacts;
 const contactStatus=node("p","jrcc-note");contactStatus.id="jrccContactStatus";const contactList=node("div","jrcc-contact-list");contactList.id="jrccContacts";contacts.append(add,search,contactStatus,contactList);
 const status=node("section","jrcc-panel");status.dataset.jrccPanel="status";status.hidden=true;status.setAttribute("role","tabpanel");
 const profile=node("section","jrcc-panel");profile.dataset.jrccPanel="profile";profile.hidden=true;profile.setAttribute("role","tabpanel");const profileHost=node("div","");profileHost.id="jrccProfile";profile.append(profileHost);
 body.append(jr,chats,contacts,status,profile);root.append(heading,tabs,body);
 const snapshot=page.querySelector(".jr-member-snapshot");if(snapshot)snapshot.after(root);else page.prepend(root);
 const messagePage=$("messages");if(messagePage){
  statusSection=statusSection||messagePage.querySelector(".jr-status-section");
  chatGrid=chatGrid||messagePage.querySelector(".grid");
  if(statusSection)status.append(statusSection);
  if(chatGrid)chats.append(chatGrid);
 }
 mounted=true;loadProfile();observeFloatingTalkControl();
}
document.addEventListener("jr:workspacechange",e=>{
 if((e.detail&&e.detail.id)==="command"){mounted=false;mount();switchTab(activeTab);}syncFloatingTalkControl();
 if((e.detail&&e.detail.id)==="messages"){if(window.jrWorkspaceNavigate)window.jrWorkspaceNavigate("command");switchTab("chats");}
 if((e.detail&&e.detail.id)==="jpconnect"){if(window.jrWorkspaceNavigate)window.jrWorkspaceNavigate("command");switchTab("contacts");}
});
window.jrCommandCentreChatActive=()=>{const page=$("command"),root=$("jrCommandSocial");return activeTab==="chats"&&!!page&&!page.hidden&&!page.classList.contains("hidden")&&!!root&&!root.hidden;};
window.jrCommandCentreOpen=switchTab;
const originalShow=window.show;if(typeof originalShow==="function"){window.show=function(id){if(id==="messages"){if(window.jrWorkspaceNavigate)window.jrWorkspaceNavigate("command");switchTab("chats");return;}if(id==="jpconnect"){if(window.jrWorkspaceNavigate)window.jrWorkspaceNavigate("command");switchTab("contacts");return;}return originalShow(id);};}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{if($("command"))mount();observeFloatingTalkControl();});else{mount();observeFloatingTalkControl();}
window.addEventListener("beforeunload",()=>stopVoice("Microphone is off."));
})();