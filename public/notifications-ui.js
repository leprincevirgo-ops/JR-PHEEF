(function(){
"use strict";
const KEY="jr-pheef-voice-notifications-v1";
const $=id=>document.getElementById(id);
let panel,button,badge,list,status,voiceButton,known=new Set(),initialized=false,timer=null;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function voiceEnabled(){return localStorage.getItem(KEY)==="on"}
function setVoice(on){try{localStorage.setItem(KEY,on?"on":"off")}catch{};voiceButton.textContent=on?"VOICE ON":"VOICE OFF";voiceButton.setAttribute("aria-pressed",String(on))}
function announce(title){if(!voiceEnabled()||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance("JR PHEEF notification. "+String(title||"You have a new alert.").slice(0,120));u.lang="en-KE";u.rate=1;window.speechSynthesis.speak(u)}catch{}}
async function fetchAlerts(announceNew=false){
 if(!document.body.contains(panel)||!window.jrNotificationsReady)return;
 try{
  const r=await fetch("/api/notifications",{credentials:"include",headers:{"Accept":"application/json"}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok){status.textContent=d.error||"Notifications are temporarily unavailable.";return}
  const rows=Array.isArray(d.notifications)?d.notifications.slice(0,40):[];
  badge.textContent=String(Number(d.unread)||0);badge.hidden=!(Number(d.unread)>0);
  if(announceNew&&initialized){for(const n of rows){if(n&&n.id&&!known.has(n.id)&&!n.read)announce(n.title)}}
  rows.forEach(n=>{if(n&&n.id)known.add(n.id)});
  if(known.size>300)known=new Set([...known].slice(-150));
  list.replaceChildren();
  if(!rows.length)list.append(el("p","jp-notification-empty","You're all caught up. New activity will appear here."));
  rows.forEach(n=>{
   const card=el("article","jp-notification-item"+(n.read?" is-read":""));
   card.append(el("strong","",n.title||"JR PHEEF update"),el("p","",n.message||""),el("time","",n.created_at?new Date(n.created_at).toLocaleString():""));
   list.append(card);
  });
  status.textContent=Number(d.unread)>0?Number(d.unread)+" unread notification(s).":"No unread notifications.";
  initialized=true;
 }catch{status.textContent="Could not connect. Your notifications will retry when online."}
}
async function markRead(){
 status.textContent="Marking notifications as read…";
 try{const r=await fetch("/api/notifications/read-all",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:"{}"});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok){status.textContent=d.error||"Could not update notifications.";return}await fetchAlerts(false);status.textContent="All notifications marked as read."}catch{status.textContent="Connection unavailable."}
}
function open(){panel.hidden=false;button.setAttribute("aria-expanded","true");fetchAlerts(false)}
function close(){panel.hidden=true;button.setAttribute("aria-expanded","false")}
function mount(){
 const header=document.querySelector("body > header"),actions=$("jpCommandPalette")?.parentElement||document.querySelector(".jp-command-header-actions");
 if(!header||$("jpNotificationPanel"))return;
 const host=actions||header;
 button=el("button","jp-notification-bell","♧");button.type="button";button.title="Notifications";button.setAttribute("aria-label","Open notifications");button.setAttribute("aria-expanded","false");
 badge=el("span","jp-notification-badge","0");badge.hidden=true;button.append(badge);button.addEventListener("click",()=>panel.hidden?open():close());host.append(button);
 panel=el("section","jp-notification-panel");panel.id="jpNotificationPanel";panel.hidden=true;panel.setAttribute("aria-label","JR PHEEF notifications");
 const head=el("div","jp-notification-head");const title=el("div","");title.append(el("div","jp-kicker","JR PHEEF CONNECTED ACTIVITY"),el("h2","","Notifications"));
 const actionsRow=el("div","jp-notification-actions");const read=el("button","dark","MARK ALL READ");read.type="button";read.addEventListener("click",markRead);
 voiceButton=el("button","dark",voiceEnabled()?"VOICE ON":"VOICE OFF");voiceButton.type="button";voiceButton.setAttribute("aria-pressed",String(voiceEnabled()));voiceButton.title="Opt in to spoken notification titles";voiceButton.addEventListener("click",()=>{const on=!voiceEnabled();setVoice(on);status.textContent=on?"Spoken notification titles enabled on this device.":"Spoken notifications disabled.";});
 const x=el("button","dark","CLOSE");x.type="button";x.addEventListener("click",close);actionsRow.append(voiceButton,read,x);head.append(title,actionsRow);
 list=el("div","jp-notification-list");status=el("p","jp-notification-status","Sign in to view your notifications.");panel.append(head,list,status);host.append(panel);
 document.addEventListener("click",e=>{if(!panel.hidden&&!panel.contains(e.target)&&!button.contains(e.target))close()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
 const old=window.openApp;
 if(typeof old==="function"&&!old.__jrNotificationsWrapped){const wrapped=async function(){const r=await old.apply(this,arguments);window.jrNotificationsReady=true;await fetchAlerts(false);return r};wrapped.__jrNotificationsWrapped=true;window.openApp=wrapped;}
 const oldLogout=window.logout;
 if(typeof oldLogout==="function"&&!oldLogout.__jrNotificationsLogoutWrapped){const wrapped=async function(){window.jrNotificationsReady=false;close();return oldLogout.apply(this,arguments)};wrapped.__jrNotificationsLogoutWrapped=true;window.logout=wrapped;}
 window.addEventListener("focus",()=>{if(window.jrNotificationsReady)fetchAlerts(true)});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&window.jrNotificationsReady)fetchAlerts(true)});
 timer=setInterval(()=>{if(window.jrNotificationsReady&&!document.hidden)fetchAlerts(true)},45000);
 if(document.querySelector("#app:not(.hidden)")){window.jrNotificationsReady=true;fetchAlerts(false)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
