/* Public discovery → existing authentication → existing private ecosystem. */
(function(){
 "use strict";
 function byId(id){return document.getElementById(id);}
 function enterAuth(mode){
  document.body.classList.remove("jr-public-discovery-mode");
  document.body.classList.add("jr-public-auth-mode");
  var auth=byId("auth");
  if(auth){auth.hidden=false;auth.scrollIntoView({behavior:"smooth",block:"start"});}
  if(mode==="register"&&typeof window.showRegister==="function")window.showRegister();
  else if(typeof window.showLogin==="function")window.showLogin();
 }
 function returnToDiscovery(){
  document.body.classList.remove("jr-public-auth-mode");
  document.body.classList.add("jr-public-discovery-mode");
  window.scrollTo({top:0,behavior:"smooth"});
 }
 document.addEventListener("click",function(e){
  var el=e.target&&e.target.closest?e.target.closest("[data-jpd-action]"):null;
  if(!el)return;
  e.preventDefault();
  var action=el.getAttribute("data-jpd-action");
  if(action==="login")enterAuth("login");
  if(action==="register")enterAuth("register");
  if(action==="top")returnToDiscovery();
  if(action==="world"){
   var world=el.getAttribute("data-world");
   var labels={dgbo:"DGBO business intelligence and opportunity environment",family:"FAMILY financial access and money-management environment",move:"JR MOVE mobility, transport and delivery environment",link:"JR LINK communication and connection environment"};
   var note=byId("jpd-world-note");
   if(note)note.textContent=labels[world]+" is part of the connected JR PHEEF ecosystem. Sign in to access the available workspace; services not yet integrated will be clearly identified.";
  }
 });
 function initialise(){
  var app=byId("app"),auth=byId("auth");
  if(auth)auth.hidden=false;
  if(app&&!app.classList.contains("hidden")){
   document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");
   var discovery=byId("jr-public-discovery");if(discovery)discovery.hidden=true;
  }else{
   document.body.classList.add("jr-public-discovery-mode");
   document.body.classList.remove("jr-public-auth-mode");
  }
  // Follow the existing app shell when asynchronous session restoration completes.
  if(app&&window.MutationObserver){
   var observer=new MutationObserver(function(){
    if(!app.classList.contains("hidden")){
     var discovery=byId("jr-public-discovery");if(discovery)discovery.hidden=true;
     document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");
     observer.disconnect();
    }
   });
   observer.observe(app,{attributes:true,attributeFilter:["class"]});
  }
  // A returning signed-in session may be resolved asynchronously by the app.
  window.setTimeout(function(){
   if(app&&!app.classList.contains("hidden")){
    var discovery=byId("jr-public-discovery");if(discovery)discovery.hidden=true;
    document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");
   }
  },1400);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialise);
 else initialise();
 window.jrPublicEnterAuth=enterAuth;
})();
