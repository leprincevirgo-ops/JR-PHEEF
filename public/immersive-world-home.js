(function(){
"use strict";
function openDestination(event){
 const button=event.target.closest("[data-jr-world-page]");
 if(!button)return;
 const page=button.getAttribute("data-jr-world-page");
 if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(page);
 else if(typeof window.show==="function")window.show(page);
}
function mountCoreCapabilities(){
 const core=document.querySelector(".jr-world-universe");
 const hints=document.querySelector(".jr-capability-hints");
 if(!core||!hints||core.contains(hints))return;
 const drawer=document.createElement("div");
 drawer.className="jr-core-capability-drawer";
 drawer.setAttribute("aria-label","JR Intelligence capabilities");
 const label=document.createElement("span");
 label.textContent="ASK JR · EXPLORE CAPABILITIES";
 drawer.append(label,hints);
 core.appendChild(drawer);
}
function addResume(){
 const greeting=document.querySelector(".jr-world-greeting");
 if(!greeting||document.getElementById("jrWorldResume"))return;
 const button=document.createElement("button");
 button.id="jrWorldResume";button.type="button";button.className="jr-world-resume";
 button.textContent="↶ CONTINUE WHERE I LEFT OFF";button.hidden=true;
 button.addEventListener("click",async()=>{
  button.disabled=true;
  try{
   const response=await fetch("/api/continuity",{credentials:"include"});
   const data=await response.json();
   const page=(data&&data.state&&data.state.page)||(data&&data.page);
   if(response.ok&&data.ok!==false&&page&&page!=="home"&&/^[a-z][a-z0-9_-]{0,50}$/.test(page)){
    if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(page);
    else if(typeof window.show==="function")window.show(page);
   }else{button.textContent="YOU'RE ALREADY HOME";button.disabled=false;}
  }catch{button.textContent="RECONNECT TO RESUME";button.disabled=false;}
 });
 greeting.insertAdjacentElement("afterend",button);
 fetch("/api/continuity",{credentials:"include"}).then(r=>r.json()).then(data=>{
  const page=(data&&data.state&&data.state.page)||(data&&data.page);
  if(page&&page!=="home"&&/^[a-z][a-z0-9_-]{0,50}$/.test(page))button.hidden=false;
 }).catch(()=>{});
}
document.addEventListener("click",openDestination);
function personalise(){
 const welcome=document.getElementById("welcome");
 const greeting=document.getElementById("jrWorldGreeting");
 if(!greeting)return;
 const name=(welcome&&welcome.textContent||"").replace(/^Welcome[,! ]*/i,"").trim();
 if(name&&name!=="Your JR PHEEF space"&&!/loading/i.test(name)){
  greeting.textContent="Hello, "+name+"! What would you like to make happen?";
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){personalise();mountCoreCapabilities();addResume();});else{personalise();mountCoreCapabilities();addResume();}
document.addEventListener("jr:workspacechange",function(event){
 if(event.detail&&event.detail.id==="home"){personalise();mountCoreCapabilities();addResume();}
});
})();