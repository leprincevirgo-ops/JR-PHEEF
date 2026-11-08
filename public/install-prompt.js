"use strict";
(function(){
  const KEY="jr-pwa-install-dismissed";
  let deferredPrompt=null;
  let banner=null;
  const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;
  const escapeText=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const authVisible=()=>{const auth=document.getElementById("auth");return !!auth&&!auth.classList.contains("hidden")&&getComputedStyle(auth).display!=="none";};
  const dismissed=()=>{try{return sessionStorage.getItem(KEY)==="1";}catch(_){return false;}};
  function remove(){if(banner){banner.remove();banner=null;}}
  function show(){
    if(!deferredPrompt||standalone()||authVisible()||banner||dismissed())return;
    banner=document.createElement("section");
    banner.id="jrInstallPrompt";
    banner.setAttribute("role","region");
    banner.setAttribute("aria-label","Install JR PHEEF");
    banner.innerHTML='<div class="jr-install-copy"><strong>Take JR PHEEF with you</strong><span>Install the app experience on this device for quick access.</span></div><div class="jr-install-actions"><button type="button" class="jr-install-primary" id="jrInstallNow">Install</button><button type="button" class="jr-install-later" id="jrInstallLater" aria-label="Not now">Not now</button></div>';
    document.body.appendChild(banner);
    banner.querySelector("#jrInstallLater").addEventListener("click",()=>{try{sessionStorage.setItem(KEY,"1");}catch(_){}remove();});
    banner.querySelector("#jrInstallNow").addEventListener("click",install);
  }
  async function install(){
    if(deferredPrompt){
      deferredPrompt.prompt();
      try{await deferredPrompt.userChoice;}catch(_){}
      deferredPrompt=null;remove();return;
    }
    let instructions;
    if(isIOS())instructions="On iPhone or iPad: tap Share, then choose Add to Home Screen.";
    else if(/android/i.test(navigator.userAgent))instructions="In your browser menu (⋮), choose Install app or Add to Home screen. If it is not shown, update your browser and try again.";
    else instructions="In Chrome or Edge, open the browser menu and choose Install JR PHEEF or Install this site as an app.";
    const panel=document.createElement("div");
    panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","jrInstallHelpTitle");
    panel.style.cssText="position:fixed;inset:0;z-index:100001;background:#020916eF;display:grid;place-items:center;padding:20px";
    panel.innerHTML='<div style="max-width:420px;width:100%;padding:22px;border-radius:18px;background:#071d36;border:1px solid #42f5ff;color:#f2fbff;font:16px Arial,sans-serif"><h2 id="jrInstallHelpTitle">Install JR PHEEF</h2><p>'+escapeText(instructions)+'</p><p style="color:#9bc3d5;font-size:13px">Installation adds a shortcut and app-style window. An internet connection is still needed for online features.</p><button type="button" id="jrInstallHelpClose" style="padding:11px 18px;border:0;border-radius:10px;background:#00b8d4;color:#001522;font-weight:bold">Got it</button></div>';
    document.body.appendChild(panel);
    panel.querySelector("button").addEventListener("click",()=>panel.remove());
  }
    // Expose an explicit install action so people can install before signing in.
  window.jrInstallApp=install;
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredPrompt=event;if(!standalone()&&!authVisible())show();});
  window.addEventListener("appinstalled",()=>{remove();deferredPrompt=null;});
  window.addEventListener("load",()=>{if(deferredPrompt&&!standalone()&&!authVisible())show();},{once:true});
  window.addEventListener("pageshow",()=>{if(authVisible()||standalone()||!deferredPrompt)remove();else show();});
  const auth=document.getElementById("auth");
  if(auth&&typeof MutationObserver==="function")new MutationObserver(()=>{if(authVisible()||!deferredPrompt)remove();else show();}).observe(auth,{attributes:true,attributeFilter:["class","style"]});
})();
