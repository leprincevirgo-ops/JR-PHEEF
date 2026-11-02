(function(){
"use strict";
function openDestination(event){
 const button=event.target.closest("[data-jr-world-page]");
 if(!button)return;
 const page=button.getAttribute("data-jr-world-page");
 if(typeof window.show==="function")window.show(page);
 else if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(page);
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
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",personalise);else personalise();
document.addEventListener("jr:workspacechange",function(event){
 if(event.detail&&event.detail.id==="home")personalise();
});
})();