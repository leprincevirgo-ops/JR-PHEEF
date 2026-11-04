/* JR PHEEF — intent-first interaction shell.
 * A single command surface opens existing workspaces or hands goals to JR Assistant.
 * It does not bypass existing permissions or execute consequential actions.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
// Command Center is the primary control room; both spellings resolve to the same workspace.
const routeAliases={
 "home":"home","welcome":"home","start":"home",
 "command centre":"command","command center":"command","control centre":"command","control center":"command","command":"command",
 "discover":"discover","search":"discover","search and browse":"discover",
 "explore":"worlds","world":"worlds","worlds":"worlds","my worlds":"worlds",
 "browser":"browser","web browser":"browser","internet":"browser",
 "messages":"messages","message":"messages","chat":"messages","connect":"connecthub","communication":"messages",
 "dgbo":"dgbo","family":"family","ecosystem":"ecosystem",
 "business":"businessgrowth","my business":"businessgrowth","my shop":"businessgrowth","my clothing shop":"businessgrowth","clothing shop":"businessgrowth","my clothing store":"businessgrowth","shop":"find",
 "marketplace":"find","shopping":"find","buy":"find","sell":"create",
 "projects":"projects","project":"projects","research":"lab","ideas":"lab",
 "opportunities":"opportunities","people":"jpconnect","jp connect":"jpconnect",
 "profile":"profile","my profile":"profile","settings":"jrsettings","security":"jrsettings",
 "files":"vault","my files":"vault","library":"library","learning":"teacher","learn":"teacher",
 "notifications":"alerts","connections":"connections","external services":"connections",
 "screen studio":"screenstudio","customize my screen":"screenstudio"
};
function normalize(value){return String(value||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9\s&-]/g," ").replace(/\s+/g," ").trim();}
function routeCommand(value){
 const raw=normalize(value);
 const match=raw.match(/^(?:jr\s+)?(?:please\s+)?(?:open|show|go to|take me to|switch to|bring up)\s+(.+?)$/);
 if(!match)return null;
 const destination=match[1].replace(/\s+(please|for me)$/,"").trim();
 return routeAliases[destination]||null;
}
function navigate(id){
 if(id==="screenstudio"){
  if(typeof window.show==="function")window.show("home");
  window.setTimeout(()=>{const b=document.querySelector('[data-jr-open-screen-studio],#screenStudioOpen,[onclick*="screenStudio"]');if(b)b.click();},60);
  return;
 }
 if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(id);
 else if(typeof window.show==="function")window.show(id);
}
function submit(value){
 const text=String(value||"").trim();if(!text&&!window.jrIntentCameraFile)return;
 const route=routeCommand(text);
 if(route){navigate(route);setStatus("Opening "+(route==="command"?"your Command Centre":route.replace(/([a-z])([A-Z])/g,"$1 $2"))+".");return;}
 const field=$("aiQuestion");
 if(field)field.value=text;
 if(typeof window.show==="function")window.show("assistant");
 const status=$("aiStatus");if(status)status.textContent="JR is understanding your request…";
 window.setTimeout(()=>{if(typeof window.askJRAI==="function")window.askJRAI();else setStatus("JR Assistant is not available right now. Your request has not been submitted.");},80);
}
function setStatus(message){const node=$("jrIntentStatus");if(node)node.textContent=message;}
function build(){
 const app=$("app");if(!app||$("jrIntentBar"))return;
 const bar=document.createElement("section");bar.id="jrIntentBar";bar.className="jr-intent-bar";bar.setAttribute("aria-label","JR PHEEF universal command");
 const form=document.createElement("form");form.id="jrIntentForm";form.className="jr-intent-form";
 const input=document.createElement("input");input.id="jrIntentCommand";input.type="search";input.autocomplete="off";input.placeholder="Search or tell JR what to do…";input.setAttribute("aria-label","Search or tell JR what to do");
 const submitButton=document.createElement("button");submitButton.type="submit";submitButton.className="jr-intent-action jr-intent-search";submitButton.textContent="⌕";submitButton.setAttribute("aria-label","Search or submit request");
 const voice=document.createElement("button");voice.type="button";voice.id="jrIntentVoice";voice.className="jr-intent-action";voice.textContent="🎙";voice.setAttribute("aria-label","Speak to JR");
 const camera=document.createElement("button");camera.type="button";camera.id="jrIntentCamera";camera.className="jr-intent-action";camera.textContent="▣";camera.setAttribute("aria-label","Open camera or choose a photo");
 const file=document.createElement("input");file.type="file";file.id="jrIntentCameraFile";file.accept="image/*";file.setAttribute("capture","environment");file.hidden=true;file.setAttribute("aria-label","Choose or capture a photo");
 const network=document.createElement("span");network.id="jrIntentNetwork";network.className="jr-intent-network";network.setAttribute("role","status");network.setAttribute("aria-live","polite");
 const status=document.createElement("p");status.id="jrIntentStatus";status.className="jr-intent-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const home=document.createElement("button");home.type="button";home.className="jr-intent-home";home.textContent="JR";home.setAttribute("aria-label","Return to JR PHEEF welcome screen");home.addEventListener("click",()=>navigate("home"));
 form.append(input,submitButton,voice,camera,file,network);
 form.addEventListener("submit",event=>{event.preventDefault();submit(input.value);});
 bar.append(home,form,status);
 const nav=app.querySelector(":scope > .nav");
 if(nav)app.insertBefore(bar,nav);else app.prepend(bar);
 const updateNetwork=()=>{const online=navigator.onLine!==false;network.textContent=online?"● ONLINE":"● OFFLINE";network.setAttribute("aria-label",online?"Network connection reported online by the browser":"Browser reports no network connection");network.classList.toggle("is-offline",!online);};
 updateNetwork();window.addEventListener("online",updateNetwork);window.addEventListener("offline",updateNetwork);
 voice.addEventListener("click",()=>{
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){setStatus("Voice input is not supported by this browser. You can type instead.");return;}
  const recognition=new Speech();recognition.lang=navigator.language||"en";recognition.interimResults=false;recognition.maxAlternatives=1;
  setStatus("Listening…");
  recognition.onresult=event=>{const transcript=event.results?.[0]?.[0]?.transcript||"";input.value=transcript;if(transcript)submit(transcript);};
  recognition.onerror=()=>setStatus("Voice input is unavailable. You can type instead.");
  try{recognition.start();}catch(error){setStatus("Voice input could not start. You can type instead.");}
 });
 camera.addEventListener("click",()=>file.click());
 file.addEventListener("change",()=>{const photo=file.files&&file.files[0];window.jrIntentCameraFile=photo||null;if(photo){setStatus("Photo ready. It will be sent to JR’s AI provider only when you submit your request.");}else setStatus("No photo selected.");});
 document.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();input.focus();}});
 document.addEventListener("jr:workspacechange",event=>{const id=event.detail?.id||"home";bar.dataset.workspace=id;});
 // Keep legacy navigation and shortcut rails out of the way; all destinations remain addressable by command.
 document.body.classList.add("jr-intent-first");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build);else build();
window.jrIntentSubmit=submit;
window.jrIntentRoute=routeCommand;
})();