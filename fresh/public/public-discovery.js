"use strict";
(()=> {
 const channels=[
  {key:"general",target:"publicGeneralFeed",updated:"publicGeneralUpdated"},
  {key:"transport",target:"publicTransportFeed",updated:"publicTransportUpdated"}
 ];
 const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
 async function load(channel){
  const target=document.getElementById(channel.target),updated=document.getElementById(channel.updated);
  if(!target)return;
  target.replaceChildren(node("p","muted","Refreshing public sources…"));
  try{
   const response=await fetch("/api/discovery/feed?world="+encodeURIComponent(channel.key),{headers:{Accept:"application/json"},credentials:"omit",cache:"no-store"});
   if(!response.ok)throw new Error("Public sources are temporarily unavailable.");
   const data=await response.json(),items=Array.isArray(data.items)?data.items.slice(0,4):[];
   target.replaceChildren();
   for(const item of items){
    let url;try{url=new URL(item.url);if(url.protocol!=="https:")continue;}catch{continue;}
    const card=node("article","public-feed-item"),link=node("a","",String(item.title||"Public update").slice(0,180));
    link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";
    const summary=node("p","",String(item.summary||"Open the original publisher for details.").replace(/\s+/g," ").slice(0,260));
    const meta=node("div","public-feed-meta",String(item.source||"Public source").slice(0,100));
    if(item.published){const time=Date.parse(item.published);if(Number.isFinite(time)){const date=node("time","",new Date(time).toLocaleDateString());date.dateTime=new Date(time).toISOString();meta.append(date);}}
    card.append(link,summary,meta);target.append(card);
   }
   if(!target.children.length)target.append(node("p","muted","No current updates are available from these sources. Try again later."));
   if(updated){const time=Date.parse(data.updatedAt);updated.textContent=(data.cached?"Cached snapshot · ":"Updated · ")+(Number.isFinite(time)?new Date(time).toLocaleString():"time unavailable")+(data.stale?" · Last successful refresh":"");}
   const status=document.getElementById("publicLiveStatus");if(status)status.textContent="Public sources connected";
  }catch(error){
   target.replaceChildren(node("p","muted","Live updates are temporarily unavailable. The JR PHEEF introduction and account entry remain available."));
   if(updated)updated.textContent="Feed unavailable · Try refreshing later";
   const status=document.getElementById("publicLiveStatus");if(status)status.textContent="Some sources unavailable";
  }
 }
 document.querySelectorAll("[data-public-feed-refresh]").forEach(button=>button.addEventListener("click",()=>{const channel=channels.find(item=>item.key===button.dataset.publicFeedRefresh);if(channel)load(channel);}));
 channels.forEach(load);
})();
