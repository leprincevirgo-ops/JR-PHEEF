"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const hub=$("liveHub"),member=$("memberCommand");
 if(!hub||!member)return;
 const mount=(id,title,nodes)=>{
  const target=$(id);if(!target)return;
  const card=document.createElement("section");card.className="hub-card command-mounted-card";
  const heading=document.createElement("h4");heading.textContent=title;card.append(heading);
  nodes.filter(Boolean).forEach(node=>card.append(node));
  target.append(card);
 };
 const findCard=selector=>hub.querySelector(selector)?.closest(".hub-card")||null;
 const profileCard=findCard('[data-hub-action="update_profile"]');
 const profileForm=profileCard?.querySelector('[data-hub-action="update_profile"]');
 if(profileForm)mount("memberProfilePanel","Profile settings",[profileForm]);
 if(profileCard)profileCard.remove();
 const peopleCard=findCard("#memberSearchForm");
 const searchForm=peopleCard?.querySelector("#memberSearchForm");
 const searchResults=peopleCard?.querySelector("#memberSearchResults");
 const chatLayout=peopleCard?.querySelector(".hub-chat-layout");
 mount("commandContactsMount","Find and connect",[searchForm,searchResults]);
 mount("commandChatMount","Your conversations",[chatLayout]);
 if(peopleCard)peopleCard.remove();
 const statusCard=findCard('[data-hub-action="create_status"]');
 const statusForm=statusCard?.querySelector('[data-hub-action="create_status"]');
 const statuses=statusCard?.querySelector("#myStatuses");
 mount("commandStatusMount","Share an update",[statusForm,statuses]);
 if(statusCard)statusCard.remove();
 const statusForm=member.querySelector('[data-hub-action="create_status"]');
 if(statusForm){
  const gallery=statusForm.querySelector('[data-status-media="gallery"]'),camera=statusForm.querySelector('[data-status-media="camera"]'),preview=$("statusMediaPreview");
  let objectUrls=[];
  const showMedia=()=>{
   objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[];
   if(!preview)return;preview.replaceChildren();
   const files=[...(gallery?.files||[]),...(camera?.files||[])];
   files.forEach(file=>{const url=URL.createObjectURL(file);objectUrls.push(url);const tile=document.createElement("div");tile.className="status-media-tile";let media;if(file.type.startsWith("video/")){media=document.createElement("video");media.controls=true;media.muted=true;}else{media=document.createElement("img");media.alt=file.name||"Selected status photo";}media.src=url;tile.append(media);const name=document.createElement("span");name.textContent=file.name;tile.append(name);preview.append(tile);});
  };
  [gallery,camera].filter(Boolean).forEach(input=>input.addEventListener("change",showMedia));
 }
 const updatesCard=findCard("#myNotifications");
 const notifications=updatesCard?.querySelector("#myNotifications");
 mount("commandUpdatesMount","Your notifications",[notifications]);
 if(updatesCard)updatesCard.remove();
 member.querySelectorAll("[data-command-target]").forEach(button=>button.addEventListener("click",()=>{
  const target=$(button.dataset.commandTarget);if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
 }));
 const openJr=$("openJrFromCommand");
 if(openJr)openJr.addEventListener("click",()=>{const tab=document.querySelector('.workspace-tab[data-view="jr"]');if(tab)tab.click();});
 const viewer=$("profilePhotoViewer"),actions=$("profilePhotoActions"),hide=$("profilePhotoHide");
 if(viewer&&actions)viewer.addEventListener("click",()=>{actions.hidden=!actions.hidden;});
 if(hide&&viewer)hide.addEventListener("click",()=>{viewer.hidden=!viewer.hidden;hide.textContent=viewer.hidden?"Show photo":"Hide photo";});
 // Device-level accessibility preferences and optional speech tools.
 const root=document.documentElement;
 const prefs=[["jrLargeText","jr-large-text"],["jrHighContrast","jr-high-contrast"],["jrReduceMotion","jr-reduce-motion"]];
 prefs.forEach(([id,cls])=>{const control=$(id);if(!control)return;try{control.checked=localStorage.getItem("jr-pref-"+id)==="true";}catch{}root.classList.toggle(cls,control.checked);control.addEventListener("change",()=>{root.classList.toggle(cls,control.checked);try{localStorage.setItem("jr-pref-"+id,String(control.checked));}catch{}});});
 const voiceSelect=$("jrSpeakerVoice"),rate=$("jrSpeakerRate"),feedback=$("jrVoiceFeedback");
 const synth=window.speechSynthesis;
 const fillVoices=()=>{if(!voiceSelect||!synth)return;const current=voiceSelect.value;voiceSelect.replaceChildren(new Option("System default",""));synth.getVoices().forEach((voice,index)=>voiceSelect.add(new Option(voice.name+" · "+voice.lang,String(index))));if(current)voiceSelect.value=current;};
 if(synth){fillVoices();synth.addEventListener?.("voiceschanged",fillVoices);}
 const speak=(message)=>{if(!synth||typeof SpeechSynthesisUtterance==="undefined"){if(feedback)feedback.textContent="Speech output is not supported by this browser.";return;}synth.cancel();const utterance=new SpeechSynthesisUtterance(message);const voices=synth.getVoices();if(voiceSelect?.value!=="")utterance.voice=voices[Number(voiceSelect.value)]||null;utterance.rate=Number(rate?.value||1);utterance.onstart=()=>{if(feedback)feedback.textContent="Speaker is reading aloud.";};utterance.onend=()=>{if(feedback)feedback.textContent="Finished reading.";};utterance.onerror=()=>{if(feedback)feedback.textContent="The selected voice could not be played.";};synth.speak(utterance);};
 $("jrSpeakTest")?.addEventListener("click",()=>speak("Hello. This is the JR PHEEF speaker and accessibility test."));
 $("jrStopSpeech")?.addEventListener("click",()=>{synth?.cancel();if(feedback)feedback.textContent="Speech stopped.";});
 $("jrVoiceInput")?.addEventListener("click",()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){if(feedback)feedback.textContent="Voice typing is not supported here. You can still type normally.";return;}const recognition=new Recognition();recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{if(feedback)feedback.textContent="Listening. Speak now; tap Stop in your browser if needed.";};recognition.onerror=event=>{if(feedback)feedback.textContent="Voice input unavailable: "+event.error;};recognition.onresult=event=>{const transcript=event.results?.[0]?.[0]?.transcript||"";const target=$("workspacePrompt")||$("prompt");if(target){target.value=transcript;target.focus();}if(feedback)feedback.textContent=transcript?"Voice typing added your words to the JR message box. Review before sending.":"No speech was recognised.";};recognition.onend=()=>{if(feedback&&!feedback.textContent.startsWith("Voice typing"))feedback.textContent="Listening stopped.";};try{recognition.start();}catch{if(feedback)feedback.textContent="Voice input could not start. Check microphone permission.";}});
 window.addEventListener("jr:member-signed-in",event=>{
  const user=event.detail||{},name=user.fullName||user.full_name||user.email||"JR PHEEF member";
  const initials=$("profileInitials"),jp=$("profileJpNumber"),verification=$("profileVerification");
  if(initials)initials.textContent=name.split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase();
  if(jp)jp.textContent=user.jpNumber||user.jp_number||"JP number pending";
  if(verification)verification.textContent=user.verified?"Identity verified":"Email confirmed · Identity verification pending";
 });
})();
