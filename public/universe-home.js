(function(){
"use strict";
function jrToggleMoreMenu(event){if(event)event.stopPropagation();const menu=document.getElementById("jpMoreMenu"),trigger=document.getElementById("jpMoreTrigger");if(!menu||!trigger)return;const open=menu.hidden;menu.hidden=!open;trigger.setAttribute("aria-expanded",String(open));}
function jrCloseMoreMenu(){const menu=document.getElementById("jpMoreMenu"),trigger=document.getElementById("jpMoreTrigger");if(menu)menu.hidden=true;if(trigger)trigger.setAttribute("aria-expanded","false");}
function jrUpdateMoreActive(id){const menu=document.getElementById("jpMoreMenu"),trigger=document.getElementById("jpMoreTrigger");if(!menu||!trigger)return;const active=Array.from(menu.querySelectorAll("[data-page]")).some(button=>button.dataset.page===id);trigger.classList.toggle("jp-nav-active",active);if(active)trigger.setAttribute("aria-current","page");else trigger.removeAttribute("aria-current");}

function goToAssistant(prompt){
 const field=document.getElementById("aiQuestion");
 if(typeof window.show==="function")window.show("assistant");
 if(field)field.value=prompt;
 const status=document.getElementById("aiStatus");
 if(status)status.textContent="JR is understanding your request…";
 // The home composer is the user instruction to begin. Do not make them repeat it.
 window.setTimeout(function(){
  if(typeof window.askJRAI==="function")window.askJRAI();
  else if(status)status.textContent="JR could not start this request. Please try again.";
 },80);
}
function submitUniversalRequest(){
 const field=document.getElementById("jpUniversalRequest");
 const value=(field&&field.value||"").trim();
 const status=document.getElementById("jpUniversalStatus");
 if(!value){if(status)status.textContent="Tell JR what you want to do, find, learn, create or coordinate.";if(field)field.focus();return;}
 goToAssistant(value);
}
function startUniversalVoice(){
 const field=document.getElementById("jpUniversalRequest"),status=document.getElementById("jpUniversalStatus");
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){if(status)status.textContent="Voice input is not supported by this browser. You can type your request instead.";return;}
 const recognition=new Speech();recognition.lang=navigator.language||"en";recognition.interimResults=false;recognition.maxAlternatives=1;
 if(status)status.textContent="Listening…";
 recognition.onresult=function(event){const transcript=event.results&&event.results[0]&&event.results[0][0]?event.results[0][0].transcript:"";if(field)field.value=transcript;if(status)status.textContent=transcript?"Voice request captured. Press LET'S GO when ready.":"";};
 recognition.onerror=function(){if(status)status.textContent="Voice input unavailable. Type your request instead.";};
 try{recognition.start();}catch(error){if(status)status.textContent="Voice input could not start. Type your request instead.";}
}
document.addEventListener("DOMContentLoaded",function(){
 document.addEventListener("click",function(event){if(!event.target.closest(".jp-more-wrap"))jrCloseMoreMenu();});
 document.addEventListener("keydown",function(event){if(event.key==="Escape")jrCloseMoreMenu();});
 const form=document.getElementById("jpUniversalForm");
 if(form)form.addEventListener("submit",function(event){event.preventDefault();submitUniversalRequest();});
 document.querySelectorAll("[data-jr-prompt]").forEach(function(button){button.addEventListener("click",function(){const field=document.getElementById("jpUniversalRequest");if(field)field.value=button.getAttribute("data-jr-prompt")||"";if(field)field.focus();});});
 const voice=document.getElementById("jpUniversalVoice");if(voice)voice.addEventListener("click",startUniversalVoice);
 document.querySelectorAll("[data-jr-open]").forEach(function(button){button.addEventListener("click",function(){if(typeof window.show==="function")window.show(button.getAttribute("data-jr-open"));});});
});
window.jrUniversalStart={submit:submitUniversalRequest,voice:startUniversalVoice};
})();