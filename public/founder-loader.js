(function(){
"use strict";
let loading=false,loaded=false;
async function loadPrivateFounderTools(){
 if(loading||loaded)return;
 loading=true;
 try{
  const response=await fetch("/api/me",{credentials:"include",cache:"no-store"});
  if(!response.ok)return;
  const data=await response.json();
  if(!data.ok||!data.logged_in||(data.member&&data.member.is_owner)!==true)return;
  if(document.querySelector('script[data-jr-private-founder="loaded"]')){loaded=true;return;}
  const script=document.createElement("script");
  script.src="/founder-command.js";
  script.dataset.jrPrivateFounder="loaded";
  script.defer=true;
  script.addEventListener("load",()=>{loaded=true;});
  document.body.append(script);
 }catch(_){}
 finally{loading=false;}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadPrivateFounderTools,{once:true});
else loadPrivateFounderTools();
document.addEventListener("jr:login",loadPrivateFounderTools);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadPrivateFounderTools();});
const app=document.getElementById("app");
if(app)new MutationObserver(()=>{if(!app.classList.contains("hidden"))loadPrivateFounderTools();}).observe(app,{attributes:true,attributeFilter:["class"]});
})();
