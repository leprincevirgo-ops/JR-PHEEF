"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const hub=$("liveHub"),member=$("memberCommand");
 if(!hub||!member)return;
 const mount=(id,title,nodes)=>{
  const target=$(id);if(!target)return;
  const card=document.createElement("section");card.className="hub-card command-mounted-card";
  const heading=document.createElement("h4");heading.textContent=title;card.append(heading);
  nodes.filter(Boolean).forEach(node=>card.append(node));
  target.append(card);
 };
 const findCard=selector=>hub.querySelector(selector)?.closest(".hub-card")||null;
 const profileCard=findCard('[data-hub-action="update_profile"]');
 const profileForm=profileCard?.querySelector('[data-hub-action="update_profile"]');
 if(profileForm)mount("memberProfilePanel","Profile settings",[profileForm]);
 if(profileCard)profileCard.remove();
 const peopleCard=findCard("#memberSearchForm");
 const searchForm=peopleCard?.querySelector("#memberSearchForm");
 const searchResults=peopleCard?.querySelector("#memberSearchResults");
 const chatLayout=peopleCard?.querySelector(".hub-chat-layout");
 mount("commandContactsMount","Find and connect",[searchForm,searchResults]);
 mount("commandChatMount","Your conversations",[chatLayout]);
 if(peopleCard)peopleCard.remove();
 const statusCard=findCard('[data-hub-action="create_status"]');
 const statusForm=statusCard?.querySelector('[data-hub-action="create_status"]');
 const statuses=statusCard?.querySelector("#myStatuses");
 mount("commandStatusMount","Share an update",[statusForm,statuses]);
 if(statusCard)statusCard.remove();
 const updatesCard=findCard("#myNotifications");
 const notifications=updatesCard?.querySelector("#myNotifications");
 mount("commandUpdatesMount","Your notifications",[notifications]);
 if(updatesCard)updatesCard.remove();
 member.querySelectorAll("[data-command-target]").forEach(button=>button.addEventListener("click",()=>{
  const target=$(button.dataset.commandTarget);if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
 }));
 const openJr=$("openJrFromCommand");
 if(openJr)openJr.addEventListener("click",()=>{const tab=document.querySelector('.workspace-tab[data-view="jr"]');if(tab)tab.click();});
 const viewer=$("profilePhotoViewer"),actions=$("profilePhotoActions"),hide=$("profilePhotoHide");
 if(viewer&&actions)viewer.addEventListener("click",()=>{actions.hidden=!actions.hidden;});
 if(hide&&viewer)hide.addEventListener("click",()=>{viewer.hidden=!viewer.hidden;hide.textContent=viewer.hidden?"Show photo":"Hide photo";});
 window.addEventListener("jr:member-signed-in",event=>{
  const user=event.detail||{},name=user.fullName||user.full_name||user.email||"JR PHEEF member";
  const initials=$("profileInitials"),jp=$("profileJpNumber"),verification=$("profileVerification");
  if(initials)initials.textContent=name.split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase();
  if(jp)jp.textContent=user.jpNumber||user.jp_number||"JP number pending";
  if(verification)verification.textContent=user.verified?"Identity verified":"Email confirmed · Identity verification pending";
 });
})();
