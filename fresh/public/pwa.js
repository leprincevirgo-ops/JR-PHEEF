"use strict";
(()=>{
 let installPrompt=null;
 const installButton=document.getElementById("installAppButton");
 const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
 const syncButton=()=>{if(installButton)installButton.hidden=standalone()||!installPrompt;};
 window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  installPrompt=event;
  syncButton();
 });
 window.addEventListener("appinstalled",()=>{
  installPrompt=null;
  syncButton();
 });
 installButton?.addEventListener("click",async()=>{
  if(!installPrompt)return;
  installButton.disabled=true;
  try{
   await installPrompt.prompt();
   await installPrompt.userChoice;
  }catch(error){console.warn("JR PHEEF install prompt unavailable:",String(error?.message||error));}
  finally{installPrompt=null;installButton.disabled=false;syncButton();}
 });
 if("serviceWorker" in navigator&&location.protocol==="https:"){
  window.addEventListener("load",()=>{
   navigator.serviceWorker.register("/service-worker.js",{scope:"/"})
    .catch(error=>console.warn("JR PHEEF offline shell registration unavailable:",String(error?.message||error)));
  },{once:true});
 }
 syncButton();
})();
