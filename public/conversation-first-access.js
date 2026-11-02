(function(){
"use strict";
const $=id=>document.getElementById(id);
const KEY="jr-pheef-conversation-access-v1";
let prefs={large:false,contrast:false,motion:true,speak:false};
try{prefs=Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){}}
function apply(){
 document.body.classList.toggle("jr-access-large",!!prefs.large);
 document.body.classList.toggle("jr-access-contrast",!!prefs.contrast);
 document.body.classList.toggle("jr-access-motion",!!prefs.motion);
 const map={jrLargeText:"large",jrHighContrast:"contrast",jrReduceMotion:"motion",jrSpeakReplies:"speak"};
 Object.keys(map).forEach(id=>{const el=$(id);if(el)el.checked=!!prefs[map[id]]});
}
function announce(message){const s=$("jpUniversalStatus");if(s)s.textContent=message}
function submitText(text){const field=$("jpUniversalRequest");if(!field)return;field.value=text;field.focus();announce("Phrase ready. Send it to JR when you are ready.")}
function speak(text){
 if(!prefs.speak||!("speechSynthesis"in window)||!text)return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text.slice(0,5000));
 utterance.lang=document.documentElement.lang||navigator.language||"en";
 window.speechSynthesis.speak(utterance);
}
function bind(){
 const toggle=$("jrAccessToggle"),panel=$("jrAccessPanel");
 if(toggle&&panel)toggle.addEventListener("click",()=>{
  const opening=panel.hidden;panel.hidden=!opening;toggle.setAttribute("aria-expanded",String(opening));
  if(opening)panel.querySelector("input,button")?.focus();
 });
 const config={jrLargeText:"large",jrHighContrast:"contrast",jrReduceMotion:"motion",jrSpeakReplies:"speak"};
 Object.entries(config).forEach(([id,key])=>{const el=$(id);if(el)el.addEventListener("change",()=>{prefs[key]=el.checked;save();apply()})});
 document.querySelectorAll("[data-jr-aac]").forEach(b=>b.addEventListener("click",()=>submitText(b.getAttribute("data-jr-aac")||"")));
 const voiceToggle=$("jrVoiceInput"),voiceButton=$("jpUniversalVoice");
 if(voiceToggle&&voiceButton)voiceToggle.addEventListener("change",()=>{voiceButton.hidden=!voiceToggle.checked;announce(voiceToggle.checked?"Voice input button enabled.":"Voice input button hidden. You can still type or use assistive technology.")});
 if(voiceButton){voiceButton.hidden=!!(voiceToggle&&!voiceToggle.checked);voiceButton.addEventListener("click",()=>{if(!voiceToggle||!voiceToggle.checked){announce("Open Accessibility & communication and enable Voice input, or type your message.");return}const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){announce("Voice input is not supported here. Use text, a screen reader, switch control or your device voice access.");return}const rec=new SR();rec.lang=navigator.language||"en";rec.interimResults=true;rec.onresult=e=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;if($("jpUniversalRequest"))$("jpUniversalRequest").value=t};rec.onerror=()=>announce("Voice input stopped. You can continue by typing.");rec.onend=()=>announce("Voice input finished. Review your message and send it.");try{rec.start();announce("JR is listening. Speak now.")}catch(e){announce("Voice input could not start. Please type or use your device's voice access.")}})}
 // Read completed JR responses only when the user has explicitly enabled speech.
 const root=$("assistant")||$("app");
 if(root&&"MutationObserver"in window){let last="";const observer=new MutationObserver(()=>{
  if(!prefs.speak)return;
  const candidates=root.querySelectorAll("#aiResponse,.ai-response,[data-jr-response],#aiAnswer");
  const node=candidates.length?candidates[candidates.length-1]:null;
  const value=node?(node.innerText||node.textContent||"").trim():"";
  if(value&&value!==last){last=value;speak(value)}
 });observer.observe(root,{subtree:true,childList:true,characterData:true})}
 apply();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();