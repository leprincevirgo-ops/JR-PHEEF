/* JR PHEEF CONNECT — private/group chat and expiring Status updates. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const call=async(url,method="GET",body)=>{try{const r=await fetch(url,{method,credentials:"include",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});return await r.json();}catch{return{ok:false,error:"Network error. Try again."};}};
 let active=null,stream=null,refreshing=false;
 function status(s){if($("jrChatStatus"))$("jrChatStatus").textContent=s||"";}
 function activePage(){return $("messages")&&!$("messages").classList.contains("hidden");}
 function connectStream(){if(stream||!window.EventSource)return;stream=new EventSource("/api/messages/stream");stream.addEventListener("refresh",async()=>{if(!activePage()||refreshing)return;refreshing=true;try{await window.jrMessagesLoad();if(active)await open(active,true);}finally{refreshing=false;}});stream.addEventListener("ready",()=>status("Live connection active"));stream.onerror=()=>status("Reconnecting to live messages…");}
 window.jrMessagesLoad=async function(){
  const box=$("jrConversations");if(!box)return;connectStream();
  const d=await call("/api/messages/conversations");if(!d.ok){box.textContent=d.error||"Could not load conversations.";return;}
  box.innerHTML="";
  (d.conversations||[]).forEach(c=>{const b=document.createElement("button");b.type="button";b.className="jr-conversation-item";b.setAttribute("aria-current",String(c.id===active));const names=(c.participants||[]).filter(p=>p.name!=="You").map(p=>p.name).join(", ");const title=document.createElement("strong");title.textContent=c.title||names||"Private chat";const sub=document.createElement("small");sub.textContent=c.is_group?"Group conversation":"Private conversation";b.append(title,sub);b.onclick=()=>open(c.id);box.appendChild(b);});
  if(!d.conversations?.length){const p=document.createElement("p");p.className="muted";p.textContent="No conversations yet. Start a chat using a member's JP number.";box.appendChild(p);}
  if(active&&!d.conversations?.some(c=>c.id===active))active=null;
 };
 async function open(id,preservePosition=false){
  active=id;const d=await call("/api/messages/conversations/"+encodeURIComponent(id));if(!d.ok){status(d.error);return;}
  $("jrChatHeader").textContent=d.conversation.title||d.participants.filter(p=>p.name!=="You").map(p=>p.name).join(", ")||"Private chat";
  const box=$("jrChatMessages"),wasAtBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;box.innerHTML="";
  (d.messages||[]).forEach(m=>{const row=document.createElement("div");row.className="jr-chat-bubble"+(m.sender_name==="You"?" is-mine":"");const who=document.createElement("b");who.textContent=m.sender_name+" · ";const body=document.createElement("span");body.textContent=m.body;const time=document.createElement("small");time.textContent=new Date(m.created_at).toLocaleString();row.append(who,body,time);box.appendChild(row);});
  if(!preservePosition||wasAtBottom)box.scrollTop=box.scrollHeight;status("");
  document.querySelectorAll(".jr-conversation-item").forEach(b=>b.setAttribute("aria-current",String(b.textContent.includes($("jrChatHeader").textContent))));
 }
 window.jrNewChat=async function(){const raw=prompt("Enter one member JP number, or several separated by commas for a group chat:");if(!raw)return;const nums=raw.split(",").map(x=>x.trim()).filter(Boolean);let payload={member_jp_number:nums[0]};if(nums.length>1){const title=prompt("Name your group:");if(!title)return;payload={member_jp_numbers:nums,title};}status("Creating conversation…");const d=await call("/api/messages/conversations","POST",payload);if(!d.ok){status(d.error||"Could not create conversation.");return;}await jrMessagesLoad();await open(d.conversation.id);};
 window.jrSendMessage=async function(){if(!active){status("Choose a conversation first.");return;}const input=$("jrChatInput"),body=input.value.trim();if(!body)return;input.disabled=true;const d=await call("/api/messages/conversations/"+encodeURIComponent(active),"POST",{body});input.disabled=false;if(!d.ok){status(d.error||"Message could not be sent.");return;}input.value="";await open(active);await jrMessagesLoad();input.focus();};
 window.jrLoadStatuses=async function(){const host=$("jrStatusStories");if(!host)return;host.textContent="Loading status updates…";const d=await call("/api/messages/status");if(!d.ok){host.textContent=d.error||"Statuses are unavailable.";return;}host.innerHTML="";const own=document.createElement("div");own.className="jr-status-own";const label=document.createElement("strong");label.textContent="Your status";const add=document.createElement("button");add.type="button";add.className="primary";add.textContent="＋ Add status";add.onclick=()=>$("jrStatusComposer").scrollIntoView({behavior:"smooth",block:"center"});own.append(label,add);host.append(own);
  const rows=d.statuses||[];if(!rows.length){const empty=document.createElement("p");empty.className="muted";empty.textContent="No active statuses yet. Share a short update that disappears after 24 hours.";host.append(empty);return;}
  const grouped=new Map();rows.forEach(s=>{const k=String(s.member_id);if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(s);});
  for(const items of grouped.values()){const first=items[0],card=document.createElement("article");card.className="jr-status-story jr-status-"+first.background;const top=document.createElement("div");top.className="jr-status-story-top";const name=document.createElement("strong");name.textContent=first.owner?.name||"JR PHEEF Member";const count=document.createElement("small");count.textContent=items.length+" update"+(items.length===1?"":"s");top.append(name,count);card.append(top);
   items.forEach(s=>{const body=document.createElement("p");body.className="jr-status-copy";body.textContent=s.body;const meta=document.createElement("small");meta.textContent=new Date(s.created_at).toLocaleString()+" · expires "+new Date(s.expires_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});card.append(body,meta);if(String(s.member_id)===String(window.jrCurrentMemberId||"")){const del=document.createElement("button");del.className="jr-status-delete";del.textContent="Delete";del.onclick=async()=>{if(!confirm("Delete this status?"))return;const z=await call("/api/messages/status/"+encodeURIComponent(s.id),"DELETE");if(z.ok)jrLoadStatuses();else status(z.error);};card.append(del);}else if(s.viewed_by_me){const seen=document.createElement("small");seen.textContent="✓ Viewed";card.append(seen);}});
   if(first.view_count!==undefined){const views=document.createElement("small");views.textContent=first.view_count+" views";card.append(views);}host.append(card);
  }
 };
 window.jrPostStatus=async function(){const input=$("jrStatusInput"),body=input.value.trim();if(!body){$("jrStatusMessage").textContent="Write something before sharing.";return;}const btn=$("jrStatusPublish");btn.disabled=true;$("jrStatusMessage").textContent="Sharing…";const d=await call("/api/messages/status","POST",{body,background:$("jrStatusBackground").value,visibility:$("jrStatusVisibility").value});btn.disabled=false;$("jrStatusMessage").textContent=d.ok?"Your status is live for 24 hours.":(d.error||"Could not share status.");if(d.ok){input.value="";jrLoadStatuses();}};
 $("jrChatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();jrSendMessage();}});
 window.addEventListener("beforeunload",()=>{if(stream)stream.close();});
 const originalShow=window.show;if(typeof originalShow==="function"){window.show=function(id){originalShow(id);if(id==="messages"){jrMessagesLoad();jrLoadStatuses();}};}
})();