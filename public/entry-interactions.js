"use strict";
/* Reliable entry actions: delegated at document capture so a broken/late inline
   handler elsewhere cannot strand the signed-out screen. Keep auth APIs intact. */
(function(){
  function byId(id){return document.getElementById(id);}
  function announce(message){
    var status=byId("loginMsg");
    if(status)status.textContent=message;
  }
  function focusField(id){
    var field=byId(id);
    if(!field)return;
    try{field.scrollIntoView({behavior:"smooth",block:"center"});}catch(_){field.scrollIntoView();}
    try{field.focus({preventScroll:true});}catch(_){field.focus();}
  }
  function invoke(name,unavailableMessage){
    var action=window[name];
    if(typeof action!=="function"){announce(unavailableMessage);return;}
    try{
      var result=action();
      if(result&&typeof result.catch==="function")result.catch(function(){announce("JR PHEEF could not complete that action. Please try again.");});
    }catch(error){announce("JR PHEEF could not complete that action. Please reload and try again.");}
  }
  document.addEventListener("click",function(event){
    var target=event.target;
    if(!target)return;
    var control=target.closest?target.closest("[data-jr-entry-action]"):null;
    if(!control)return;
    var action=control.getAttribute("data-jr-entry-action");
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    if(action==="continue"){focusField("loginIdentifier");return;}
    if(action==="register"){invoke("showRegister","Account registration is temporarily unavailable. Reload JR PHEEF and try again.");focusField("regName");return;}
    if(action==="login"){invoke("login","Sign-in is temporarily unavailable. Reload JR PHEEF and try again.");return;}
    if(action==="create-account"){invoke("register","Account creation is temporarily unavailable. Reload JR PHEEF and try again.");return;}
    if(action==="back-to-login"){invoke("showLogin","Sign-in is temporarily unavailable. Reload JR PHEEF and try again.");focusField("loginIdentifier");return;}
  },true);
  document.addEventListener("keydown",function(event){
    if(event.key!=="Enter")return;
    var target=event.target;
    if(!target||!target.id)return;
    if(target.id==="loginIdentifier"||target.id==="loginPassword"){
      event.preventDefault();
      invoke("login","Sign-in is temporarily unavailable. Reload JR PHEEF and try again.");
    }else if(target.id==="regPassword"){
      event.preventDefault();
      invoke("register","Account creation is temporarily unavailable. Reload JR PHEEF and try again.");
    }
  },true);
  window.addEventListener("error",function(event){
    if(event&&event.message)announce("JR PHEEF had a loading error. You can still retry sign-in after reloading this page.");
  });
})();
