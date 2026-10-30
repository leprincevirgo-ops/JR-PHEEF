(function(){
"use strict";
const KEYS={
 "jr-pheef-app-hub-v1":"app_hub",
 "jr-pheef-discover-saved-v1":"discover_saved",
 "jr-pheef-visual-settings-v1":"appearance"
};
let memberId=null,suppress=false,timer=null,restoring=false;
const originalSet=Storage.prototype.setItem;
async function resolveMember(){if(memberId)return memberId;try{const r=await fetch("/api/me",{credentials:"include"});const d=await r.json();if(r.ok&&d.logged_in&&d.member&&d.member.id)memberId=String(d.member.id)}catch{}return memberId}
function readKey(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function request(method,body){return fetch("/api/preferences",{method,credentials:"include",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined}).then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))})).catch(()=>({ok:false,data:{}}))}
function schedule(key){if(suppress||restoring||!memberId||!KEYS[key])return;clearTimeout(timer);timer=setTimeout(()=>push(key),700)}
async function push(key){
 if(!memberId||!KEYS[key])return;
 const value=readKey(key);if(value===null)return;
 const body={};body[KEYS[key]]=value;
 const result=await request("PUT",body);
 if(!result.ok&&navigator.onLine)console.warn("JR PHEEF preferences sync deferred.");
}
async function restore(){
 const id=await resolveMember();if(!id||restoring)return;
 restoring=true;
 try{
  const result=await request("GET");
  if(!result.ok)return;
  const p=result.data.preferences||{};
  suppress=true;
  if(Array.isArray(p.app_hub))originalSet.call(localStorage,"jr-pheef-app-hub-v1",JSON.stringify(p.app_hub));
  if(Array.isArray(p.discover_saved))originalSet.call(localStorage,"jr-pheef-discover-saved-v1",JSON.stringify(p.discover_saved));
  if(p.appearance&&typeof p.appearance==="object"){
   const local=readKey("jr-pheef-visual-settings-v1")||{};
   originalSet.call(localStorage,"jr-pheef-visual-settings-v1",JSON.stringify({...local,...p.appearance,section:{...(local.section||{}),...(p.appearance.section||{})},customImage:local.customImage===true}));
  }
  suppress=false;
  document.dispatchEvent(new CustomEvent("jr:preferences-restored"));
 }finally{suppress=false;restoring=false}
}
Storage.prototype.setItem=function(key,value){
 const result=originalSet.call(this,key,value);
 if(this===localStorage&&KEYS[key])schedule(key);
 return result;
};
function attach(){
 const old=window.openApp;
 if(typeof old==="function"&&!old.__jrPreferencesWrapped){
  const wrapped=async function(){const result=await old.apply(this,arguments);await restore();return result};
  wrapped.__jrPreferencesWrapped=true;window.openApp=wrapped;
 }
 restore();
}
window.addEventListener("online",()=>{if(memberId){Object.keys(KEYS).forEach(push)}else restore()});
window.addEventListener("storage",e=>{if(e.key&&KEYS[e.key])schedule(e.key)});
document.addEventListener("jr:preferences-restored",()=>{});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach);else attach();
})();
