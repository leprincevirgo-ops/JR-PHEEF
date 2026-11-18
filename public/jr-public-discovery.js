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
 function returnToDiscovery(){document.body.classList.remove("jr-public-auth-mode");document.body.classList.add("jr-public-discovery-mode");window.scrollTo({top:0,behavior:"smooth"});}
 document.addEventListener("click",function(e){
  var el=e.target&&e.target.closest?e.target.closest("[data-jpd-action]"):null;if(!el)return;e.preventDefault();
  var action=el.getAttribute("data-jpd-action");if(action==="login")enterAuth("login");if(action==="register")enterAuth("register");if(action==="top")returnToDiscovery();
  if(action==="world"){var world=el.getAttribute("data-world");var labels={dgbo:"DGBO business intelligence and opportunity environment",family:"FAMILY financial access and money-management environment",move:"JR MOVE mobility, transport and delivery environment",link:"JR LINK communication and connection environment"};var note=byId("jpd-world-note");if(note)note.textContent=labels[world]+" is part of the connected JR PHEEF ecosystem. Sign in to access the available workspace; services not yet integrated will be clearly identified.";}
 });
 function loadPublicFeed(channel){
  if(channel!=="general"&&channel!=="transport")return;
  var target=byId("jpd-live-"+channel),stamp=byId("jpd-live-"+channel+"-time");
  if(!target)return;
  target.replaceChildren();
  var loading=document.createElement("p");loading.className="jpd-muted";loading.textContent="Refreshing verified public sources…";target.append(loading);
  if(stamp)stamp.textContent="Fetching latest available items";
  fetch("/api/discovery/feed?world="+encodeURIComponent(channel),{headers:{Accept:"application/json"},credentials:"omit",cache:"no-store"})
   .then(function(response){if(!response.ok)throw new Error("Public sources are temporarily unavailable.");return response.json();})
   .then(function(data){
    target.replaceChildren();
    var items=Array.isArray(data.items)?data.items.slice(0,4):[];
    items.forEach(function(item){
     var url;try{url=new URL(item.url);if(url.protocol!=="https:")return;}catch(_){return;}
     var card=document.createElement("article");card.className="jpd-live-item";
     var link=document.createElement("a");link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=String(item.title||"Untitled update").slice(0,180);
     var summary=document.createElement("p");summary.textContent=String(item.summary||"Open the original source for details.").replace(/\s+/g," ").slice(0,260);
     var meta=document.createElement("div");meta.className="jpd-live-meta";
     var source=document.createElement("span");source.textContent=String(item.source||"Public source").slice(0,80);meta.append(source);
     if(item.published){var date=document.createElement("time");var parsed=Date.parse(item.published);if(Number.isFinite(parsed)){date.dateTime=new Date(parsed).toISOString();date.textContent=new Date(parsed).toLocaleDateString();meta.append(date);}}
     card.append(link,summary,meta);target.append(card);
    });
    if(!target.children.length){var empty=document.createElement("p");empty.className="jpd-muted";empty.textContent="No current items are available from these public sources. Try refreshing later.";target.append(empty);}
    if(stamp){var updated=Date.parse(data.updatedAt);stamp.textContent=(data.cached?"Cached source snapshot · ":"Updated · ")+(Number.isFinite(updated)?new Date(updated).toLocaleString():"time unavailable")+(data.stale?" · Last successful snapshot":"");}
   })
   .catch(function(){target.replaceChildren();var unavailable=document.createElement("p");unavailable.className="jpd-muted";unavailable.textContent="Connected public sources are temporarily unavailable. The rest of JR PHEEF discovery remains available.";target.append(unavailable);if(stamp)stamp.textContent="Feed unavailable · Try again later";});
 }
 function initialise(){
  var app=byId("app"),auth=byId("auth");if(auth)auth.hidden=false;
  loadPublicFeed("general");loadPublicFeed("transport");
  if(app&&!app.classList.contains("hidden")){document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");var d=byId("jr-public-discovery");if(d)d.hidden=true;}
  else{document.body.classList.add("jr-public-discovery-mode");document.body.classList.remove("jr-public-auth-mode");}
  if(app&&window.MutationObserver){var observer=new MutationObserver(function(){if(!app.classList.contains("hidden")){var d=byId("jr-public-discovery");if(d)d.hidden=true;document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");observer.disconnect();}});observer.observe(app,{attributes:true,attributeFilter:["class"]});}
  window.setTimeout(function(){if(app&&!app.classList.contains("hidden")){var d=byId("jr-public-discovery");if(d)d.hidden=true;document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");}},1400);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialise);else initialise();
 window.jrPublicEnterAuth=enterAuth;
})();
