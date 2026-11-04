(function(){
"use strict";
let requested=false;
async function loadPrivateFounderTools(){
 if(requested)return;
 requested=true;
 try{
  const response=await fetch("/api/me",{credentials:"include",cache:"no-store"});
  if(!response.ok)return;
  const data=await response.json();
  if(!data.ok||!data.logged_in||data.member?.is_owner!==true)return;
  if(document.querySelector('script[data-jr-private-founder="loaded"]'))return;
  const script=document.createElement("script");
  script.src="/founder-command.js";
  script.dataset.jrPrivateFounder="loaded";
  script.defer=true;
  document.body.append(script);
 }catch(_){}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadPrivateFounderTools,{once:true});
else loadPrivateFounderTools();
document.addEventListener("jr:login",loadPrivateFounderTools);
})();
