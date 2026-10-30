/* JR PHEEF CONNECT — private/group text messaging UI. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const call=async(url,method="GET",body)=>{try{const r=await fetch(url,{method,credentials:"include",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});return await r.json();}catch{return{ok:false,error:"Network error. Try again."};}};
 let active=null,stream=null;
 function status(s){if($("jrChatStatus"))$("jrChatStatus").textContent=s||"";}
 function activePage(){return $("messages")&&!$("messages").classList.contains("hidden");}
 window.jrMessagesLoad=async function(){
  const box=$("jrConversations");if(!box)return;\n  if(!stream && window.EventSource){stream=new EventSource("/api/messages/stream");stream.addEventListener("refresh",()=>{if(activePage()){jrMessagesLoad();if(active)open(active,true);}});stream.onerror=()=>status("Reconnecting to live messages…");stream.addEventListener("ready",()=>status("Live connection active"));}
  const d=await call("/api/messages/conversations");if(!d.ok){box.textContent=d.error||"Could not load conversations.";return;}
  box.innerHTML="";
  (d.conversations||[]).forEach(c=>{
   const b=document.createElement("button");b.type="button";b.className="dark";b.style.cssText="display:block;width:100%;text-align:left;margin:6px 0;white-space:normal";
   const names=(c.participants||[]).filter(p=>p.name!=="You").map(p=>p.name).join(", ");
   b.textContent=c.title||names||"Private chat";b.onclick=()=>open(c.id);box.appendChild(b);
  });
  if(!d.conversations?.length){const p=document.createElement("p");p.className="muted";p.textContent="No conversations yet. Start a chat using a member's JP number.";box.appendChild(p);}
  if(active&&!d.conversations?.some(c=>c.id===active))active=null;
 };
 async function open(id,preservePosition=false){
  active=id;const d=await call("/api/messages/conversations/"+encodeURIComponent(id));
  if(!d.ok){status(d.error);return;}
  $("jrChatHeader").textContent=d.conversation.title||d.participants.filter(p=>p.name!=="You").map(p=>p.name).join(", ")||"Private chat";
  const box=$("jrChatMessages");const wasAtBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;box.innerHTML="";
  (d.messages||[]).forEach(m=>{
   const row=document.createElement("div");row.style.cssText="margin:8px 0;padding:9px 12px;border-radius:12px;max-width:88%;background:"+(m.sender_name==="You"?"rgba(35,150,180,.25)":"rgba(130,150,180,.16)")+";margin-left:"+(m.sender_name==="You"?"auto":"0");
   const who=document.createElement("b");who.textContent=m.sender_name+" · ";
   const body=document.createElement("span");body.textContent=m.body;
   const time=document.createElement("small");time.style.cssText="display:block;opacity:.65;margin-top:4px";time.textContent=new Date(m.created_at).toLocaleString();
   row.append(who,body,time);box.appendChild(row);
  });
  if(!preservePosition||wasAtBottom)box.scrollTop=box.scrollHeight;status("");
 }
 window.jrNewChat=async function(){
  const raw=prompt("Enter one member JP number, or several separated by commas for a group chat:");
  if(!raw)return;
  const nums=raw.split(",").map(x=>x.trim()).filter(Boolean);
  let payload={member_jp_number:nums[0]};
  if(nums.length>1){const title=prompt("Name your group:");if(!title)return;payload={member_jp_numbers:nums,title};}
  status("Creating conversation…");const d=await call("/api/messages/conversations","POST",payload);
  if(!d.ok){status(d.error||"Could not create conversation.");return;}
  await jrMessagesLoad();await open(d.conversation.id);
 };
 window.jrSendMessage=async function(){
  if(!active){status("Choose a conversation first.");return;}
  const input=$("jrChatInput"),body=input.value.trim();if(!body)return;
  input.disabled=true;const d=await call("/api/messages/conversations/"+encodeURIComponent(active),"POST",{body});input.disabled=false;
  if(!d.ok){status(d.error||"Message could not be sent.");return;}
  input.value="";await open(active);await jrMessagesLoad();input.focus();
 };
 $("jrChatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();jrSendMessage();}});
 const poll=setInterval(()=>{if(activePage()){jrMessagesLoad();if(active)open(active);}},10000);
 window.addEventListener("beforeunload",()=>clearInterval(poll));
})();
