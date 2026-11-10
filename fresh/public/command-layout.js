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
 const contactSearchForm=peopleCard?.querySelector("#memberSearchForm");
 const searchResults=peopleCard?.querySelector("#memberSearchResults");
 const chatLayout=peopleCard?.querySelector(".hub-chat-layout");
 mount("commandContactsMount","Find and connect",[contactSearchForm,searchResults]);
 mount("commandChatMount","Your conversations",[chatLayout]);
 if(peopleCard)peopleCard.remove();
 const statusCard=findCard('[data-hub-action="create_status"]');
 const statusCreateForm=statusCard?.querySelector('[data-hub-action="create_status"]');
 const statuses=statusCard?.querySelector("#myStatuses");
 mount("commandStatusMount","Share an update",[statusCreateForm,statuses]);
 if(statusCard)statusCard.remove();
 const mediaStatusForm=member.querySelector('[data-hub-action="create_status"]');
 if(mediaStatusForm){
  const gallery=mediaStatusForm.querySelector('[data-status-media="gallery"]'),camera=mediaStatusForm.querySelector('[data-status-media="camera"]'),preview=$("statusMediaPreview");
  let objectUrls=[];
  const showMedia=()=>{
   objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[];
   if(!preview)return;preview.replaceChildren();
   const files=[...(gallery?.files||[]),...(camera?.files||[])];
   files.forEach(file=>{const url=URL.createObjectURL(file);objectUrls.push(url);const tile=document.createElement("div");tile.className="status-media-tile";let media;if(file.type.startsWith("video/")){media=document.createElement("video");media.controls=true;media.muted=true;}else{media=document.createElement("img");media.alt="Selected status photo";}media.src=url;tile.append(media);const name=document.createElement("span");name.textContent=file.type.startsWith("video/")?"Video selected":"Photo selected";tile.append(name);preview.append(tile);});
  };
  [gallery,camera].filter(Boolean).forEach(input=>input.addEventListener("change",showMedia));
 }
 const updatesCard=findCard("#myNotifications");
 const notifications=updatesCard?.querySelector("#myNotifications");
 mount("commandUpdatesMount","Your notifications",[notifications]);
 if(updatesCard)updatesCard.remove();
 member.querySelectorAll("[data-command-target]").forEach(button=>button.addEventListener("click",()=>{
  const target=$(button.dataset.commandTarget);if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
 }));
 const openJr=$("openJrFromCommand");
 if(openJr)openJr.addEventListener("click",()=>{const tab=document.querySelector('.workspace-tab[data-view="jr"]');if(tab)tab.click();});
 const hide=$("profilePhotoHide");

 {
 // Member media, status management, groups and channels.
 const workspaceCall=async(action,extra={})=>{const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"This action could not be completed.");return d.data;};
 // Personal command intelligence: concise, data-backed guidance from the member's own workspace.
 const intelligence=document.createElement("section");
 intelligence.id="memberCommandIntelligence";
 intelligence.className="command-intelligence";
 intelligence.innerHTML='<div class="command-intelligence-head"><div><span class="command-intelligence-kicker">JR COMMAND INTELLIGENCE</span><h3>Your next useful move</h3><p>Practical suggestions based on your account activity—not guesses or financial promises.</p></div><span class="command-intelligence-orb" aria-hidden="true">✦</span></div><div id="commandIntelligenceSummary" class="command-intelligence-summary" aria-live="polite">Reviewing your workspace…</div><div class="command-intelligence-actions"><button type="button" data-jr-prompt="Help me organise my priorities and choose one useful next action.">Plan my next move</button><button type="button" data-jr-prompt="Help me turn an idea into a practical step-by-step plan.">Develop an idea</button><button type="button" data-jr-prompt="Help me review my profile and improve how people understand what I offer.">Improve my profile</button></div><p class="command-intelligence-note">Your records stay within your account permissions. Suggestions do not publish, message, spend or change anything automatically.</p>';
 const profilePanel=$("memberProfilePanel");
 if(profilePanel?.parentNode)profilePanel.parentNode.insertBefore(intelligence,profilePanel);
 const summaryBox=$("commandIntelligenceSummary");
 const refreshCommandIntelligence=async()=>{
  if(!summaryBox)return;
  summaryBox.textContent="Reviewing your workspace…";
  try{
   const data=await workspaceCall("overview");
   const memberData=data?.member||{};
   const listings=Array.isArray(data?.listings)?data.listings:[];
   const projects=Array.isArray(data?.projects)?data.projects:[];
   const goals=Array.isArray(data?.familyGoals)?data.familyGoals:[];
   const notices=Array.isArray(data?.notifications)?data.notifications:[];
   const unread=notices.filter(n=>!n.read).length;
   const tiles=[
    ["Listings",String(listings.length),"Your current offers"],
    ["Projects",String(projects.length),"Plans in progress"],
    ["FAMILY goals",String(goals.length),"Personal saving goals recorded"],
    ["Unread updates",String(unread),"Notifications to review"]
   ];
   summaryBox.replaceChildren();
   const grid=document.createElement("div");grid.className="command-intelligence-metrics";
   tiles.forEach(([label,value,detail])=>{const item=document.createElement("article");item.className="command-intelligence-metric";const strong=document.createElement("strong");strong.textContent=value;const title=document.createElement("span");title.textContent=label;const small=document.createElement("small");small.textContent=detail;item.append(strong,title,small);grid.append(item);});
   summaryBox.append(grid);
   const suggestions=[];
   if(!memberData.profile_photo)suggestions.push("Add a profile photo so people can recognise your account.");
   if(!(memberData.bio||"").trim())suggestions.push("Write a short introduction explaining who you are or what you do.");
   if(unread)suggestions.push("Review "+unread+" unread update"+(unread===1?"":"s")+" so you don't miss a response.");
   if(!listings.length)suggestions.push("If you have something to offer, create one clear listing with a useful description.");
   if(!projects.length)suggestions.push("Record one goal as a project and break it into a first action.");
   if(!suggestions.length)suggestions.push("Your workspace has useful activity. Review your updates and choose what deserves attention next.");
   const list=document.createElement("ul");list.className="command-intelligence-suggestions";
   suggestions.slice(0,3).forEach(value=>{const li=document.createElement("li");li.textContent=value;list.append(li);});
   summaryBox.append(list);
  }catch(error){summaryBox.textContent="Your private workspace summary is temporarily unavailable. "+error.message;}
 };
 intelligence.querySelectorAll("[data-jr-prompt]").forEach(button=>button.addEventListener("click",()=>{
  const prompt=button.dataset.jrPrompt||"";
  const tab=document.querySelector('.workspace-tab[data-view="jr"]');
  if(tab)tab.click();
  const target=$("workspacePrompt")||$("prompt");
  if(target){target.value=prompt;target.focus();target.dispatchEvent(new Event("input",{bubbles:true}));}
 }));


 // Dedicated member-facing AI Secretary using the authenticated JR AI service.
 const secretary=document.createElement("section");
 secretary.id="jrAISecretary";
 secretary.className="jr-ai-secretary";
 secretary.innerHTML='<div class="jr-secretary-head"><div><span class="command-intelligence-kicker">PERSONAL AI WORKFORCE</span><h3>Your AI Secretary</h3><p>Organise your day, prepare correspondence, structure decisions and coordinate specialist agents when needed.</p></div><span class="jr-secretary-symbol" aria-hidden="true">✧</span></div><div class="jr-secretary-tools"><button type="button" data-secretary-prompt="Help me organise my day. Ask only for essential details, then prepare a prioritised schedule.">Organise my day</button><button type="button" data-secretary-prompt="Help me prepare a clear professional email or letter. Ask me for the recipient and purpose if missing.">Prepare correspondence</button><button type="button" data-secretary-prompt="Help me review my priorities and prepare a concise executive briefing with decisions I need to make.">Executive briefing</button><button type="button" data-secretary-prompt="Choose the specialist AI roles needed for this task, coordinate their contributions and return one consolidated result: ">Coordinate AI agents</button></div><div id="jrSecretaryTranscript" class="jr-secretary-transcript" aria-live="polite"><p>Your Secretary is ready. Give it a task in your own words.</p></div><form id="jrSecretaryForm" class="jr-secretary-form"><textarea id="jrSecretaryPrompt" rows="3" maxlength="5000" placeholder="Tell your AI Secretary what you need organised, prepared or coordinated…"></textarea><div><span class="hub-muted">Private to your signed-in JR PHEEF account</span><button type="submit" class="hub-submit">Ask my Secretary</button></div></form><p class="jr-secretary-note">Your Secretary can prepare and advise. It will not send messages, make bookings, spend money, publish or change important records without an authorised workflow and your confirmation. Scheduled reminders and background agent execution are not yet connected.</p>';
 const intelligenceAnchor=$("memberCommandIntelligence");
 if(intelligenceAnchor?.parentNode)intelligenceAnchor.after(secretary);
 const secretaryTranscript=secretary.querySelector("#jrSecretaryTranscript");
 const secretaryForm=secretary.querySelector("#jrSecretaryForm");
 const secretaryInput=secretary.querySelector("#jrSecretaryPrompt");
 const secretaryHistory=[];
 let secretaryBusy=false;
 const secretaryMessage=(role,value)=>{const item=document.createElement("article");item.className="jr-secretary-message jr-secretary-"+role;const who=document.createElement("strong");who.textContent=role==="assistant"?"AI Secretary":"You";const body=document.createElement("p");body.textContent=value;item.append(who,body);secretaryTranscript.append(item);item.scrollIntoView({behavior:"smooth",block:"nearest"});};
 const askSecretary=async value=>{
  if(secretaryBusy||!value.trim())return;
  secretaryBusy=true;const send=secretaryForm.querySelector("button[type=submit]");send.disabled=true;
  secretaryMessage("user",value);const waiting=document.createElement("p");waiting.className="hub-muted";waiting.textContent="Your Secretary is working…";secretaryTranscript.append(waiting);
  try{
   const response=await fetch("/api/ai/chat",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value,history:secretaryHistory.slice(-8),mode:"secretary",use_web:false})});
   const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Your Secretary is temporarily unavailable.");
   if(typeof data.answer!=="string"||!data.answer.trim())throw new Error("Your Secretary did not return a usable response.");
   waiting.remove();secretaryHistory.push({role:"user",content:value},{role:"assistant",content:data.answer});secretaryMessage("assistant",data.answer);
  }catch(error){waiting.textContent=error.message;}
  finally{secretaryBusy=false;send.disabled=false;}
 };
 secretaryForm.addEventListener("submit",event=>{event.preventDefault();const value=secretaryInput.value.trim();if(!value)return;secretaryInput.value="";askSecretary(value);});
 secretary.querySelectorAll("[data-secretary-prompt]").forEach(button=>button.addEventListener("click",()=>{secretaryInput.value=button.dataset.secretaryPrompt||"";secretaryInput.focus();}));

 const fileData=async file=>{if(file.size>8*1024*1024)throw new Error("Each photo or video must be 8 MB or smaller.");return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(new Error("Could not read the selected file."));reader.readAsDataURL(file);});};
 const uploadFile=async(file,purpose)=>workspaceCall("upload_media",{purpose,fileName:file.name,contentType:file.type,fileBase64:await fileData(file)});
 const profileViewer=$("profilePhotoViewer");
 const photoDialog=$("profilePhotoDialog"),photoDialogImage=$("profilePhotoDialogImage");
 let profileUrl=null;
 const profileImage=document.createElement("img");profileImage.alt="Your profile photo";profileImage.hidden=true;profileImage.className="profile-avatar-image";
 profileViewer?.append(profileImage);
 const refreshProfilePhoto=async()=>{try{const data=await workspaceCall("get_profile_photo");profileUrl=data.url;if(profileUrl){profileImage.src=profileUrl;profileImage.hidden=false;$("profileInitials").hidden=true;}else{profileImage.hidden=true;$("profileInitials").hidden=false;}}catch{}};
 const photoTools=document.createElement("div");photoTools.className="profile-photo-tools";
 photoTools.innerHTML='<label class="hub-small-button media-picker">Choose from gallery<input id="profilePhotoGallery" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="hub-small-button media-picker">Take photo<input id="profilePhotoCamera" type="file" accept="image/*" capture="user"></label><button type="button" class="hub-small-button" id="profilePhotoEdit">Edit / crop</button><button type="button" class="hub-small-button" id="profilePhotoShow">Show photo</button>';
 $("memberProfilePanel")?.append(photoTools);
 const photoFeedback=document.createElement("p");photoFeedback.className="hub-feedback";photoFeedback.setAttribute("aria-live","polite");photoTools.after(photoFeedback);
 const cropDialog=document.createElement("dialog");cropDialog.className="profile-crop-dialog";
 cropDialog.innerHTML='<div class="profile-crop-inner"><div><p class="eyebrow">PROFILE PHOTO STUDIO</p><h3>Adjust your photo</h3><p class="hub-muted">Move and zoom the crop before saving it to your profile.</p></div><div class="profile-crop-stage"><canvas id="profileCropCanvas" width="512" height="512"></canvas></div><label>Zoom <input id="profileCropZoom" type="range" min="1" max="3" step=".05" value="1"></label><label>Horizontal position <input id="profileCropX" type="range" min="0" max="100" value="50"></label><div class="profile-crop-actions"><button type="button" id="profileCropCancel">Cancel</button><button type="button" id="profileCropSave" class="hub-submit">Save photo</button></div></div>';
 document.body.append(cropDialog);
 const cropCanvas=cropDialog.querySelector("#profileCropCanvas"),cropCtx=cropCanvas.getContext("2d"),zoomInput=cropDialog.querySelector("#profileCropZoom"),xInput=cropDialog.querySelector("#profileCropX");
 let cropImage=null,cropFileName="profile.jpg";
 const drawCrop=()=>{
  if(!cropImage)return;const size=512,scale=Math.max(size/cropImage.width,size/cropImage.height)*Number(zoomInput.value);
  const w=cropImage.width*scale,h=cropImage.height*scale,extraX=Math.max(0,w-size),x=-extraX*(Number(xInput.value)/100),y=-(h-size)/2;
  cropCtx.clearRect(0,0,size,size);cropCtx.drawImage(cropImage,x,y,w,h);
 };
 [zoomInput,xInput].forEach(el=>el.addEventListener("input",drawCrop));
 const applyProfilePhoto=async file=>{
  if(!file)return;
  if(!file.type.startsWith("image/")){photoFeedback.textContent="A profile photo must be an image.";return;}
  if(file.size>8*1024*1024){photoFeedback.textContent="Choose a photo under 8 MB.";return;}
  cropFileName=file.name||"profile.jpg";
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{cropImage=image;zoomInput.value="1";xInput.value="50";drawCrop();URL.revokeObjectURL(url);if(cropDialog.showModal)cropDialog.showModal();else cropDialog.setAttribute("open","");};
  image.onerror=()=>{URL.revokeObjectURL(url);photoFeedback.textContent="This image could not be opened.";};
  image.src=url;
 };
 ["profilePhotoGallery","profilePhotoCamera"].forEach(id=>$(id)?.addEventListener("change",e=>{applyProfilePhoto(e.target.files?.[0]);e.target.value="";}));
 cropDialog.querySelector("#profileCropCancel").addEventListener("click",()=>cropDialog.close());
 cropDialog.querySelector("#profileCropSave").addEventListener("click",async()=>{
  const save=cropDialog.querySelector("#profileCropSave");save.disabled=true;photoFeedback.textContent="Saving your adjusted profile photo…";
  try{
   const blob=await new Promise(resolve=>cropCanvas.toBlob(resolve,"image/jpeg",.9));
   if(!blob)throw new Error("Could not prepare the cropped image.");
   const file=new File([blob],cropFileName.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"});
   const uploaded=await uploadFile(file,"profile");
   await workspaceCall("update_profile",{profile_photo:uploaded.path,profile_photo_hidden:false});
   await refreshProfilePhoto();photoFeedback.textContent="Your adjusted profile photo is saved.";cropDialog.close();
  }catch(e){photoFeedback.textContent=e.message;}
  finally{save.disabled=false;}
 });
 $("profilePhotoEdit")?.addEventListener("click",()=>{if(!profileUrl){photoFeedback.textContent="Choose a photo first to edit it.";return;}fetch(profileUrl).then(r=>r.blob()).then(blob=>applyProfilePhoto(new File([blob],"profile.jpg",{type:blob.type||"image/jpeg"}))).catch(()=>photoFeedback.textContent="Could not load the current photo for editing.");});
 $("profilePhotoShow")?.addEventListener("click",async()=>{try{await workspaceCall("update_profile",{profile_photo_hidden:false});await refreshProfilePhoto();if(profileViewer)profileViewer.hidden=false;if(hide)hide.textContent="Hide photo";photoFeedback.textContent="Your profile photo is visible again.";}catch(e){photoFeedback.textContent=e.message;}});
 $("profilePhotoHide")?.addEventListener("click",async()=>{try{await workspaceCall("update_profile",{profile_photo_hidden:true});await refreshProfilePhoto();if(profileViewer)profileViewer.hidden=false;if(hide)hide.textContent="Hide photo";photoFeedback.textContent="Your profile photo is hidden from others.";}catch(e){photoFeedback.textContent=e.message;}});
 $("profilePhotoRemove")?.addEventListener("click",async()=>{if(!confirm("Remove your profile photo?"))return;try{await workspaceCall("update_profile",{profile_photo:"",profile_photo_hidden:false,profile_photo_hidden_url:""});await refreshProfilePhoto();photoFeedback.textContent="Profile photo removed."; }catch(e){photoFeedback.textContent=e.message;}});
 $("closeProfilePhotoDialog")?.addEventListener("click",()=>photoDialog?.close());
 photoDialog?.addEventListener("click",event=>{if(event.target===photoDialog)photoDialog.close();});
 profileViewer?.addEventListener("click",()=>{
  if(!profileUrl){photoFeedback.textContent="Add a profile photo first, then tap it to view the enlarged image.";return;}
  if(photoDialogImage)photoDialogImage.src=profileUrl;
  if(typeof photoDialog?.showModal==="function")photoDialog.showModal();
  else photoDialog?.setAttribute("open","");
 });
 // Keep photo metadata private: previews use generic labels and no image analysis is run.
 const socialStatusForm=member.querySelector('[data-hub-action="create_status"]');
 const statusFiles=()=>[...(socialStatusForm?.querySelector('[data-status-media="gallery"]')?.files||[]),...(socialStatusForm?.querySelector('[data-status-media="camera"]')?.files||[])];
 const statusList=$("myStatuses");
 const renderStatuses=async()=>{if(!statusList)return;statusList.textContent="Loading your updates…";try{const rows=await workspaceCall("list_my_statuses");statusList.replaceChildren();if(!rows.length){statusList.textContent="Your posted updates will appear here.";return;}rows.forEach(s=>{const card=document.createElement("article");card.className="hub-list-item status-own-item";const text=document.createElement("p");text.textContent=s.body||"Media status";card.append(text);(s.media||[]).forEach(m=>{const el=m.kind==="video"?document.createElement("video"):document.createElement("img");el.src=m.url;el.controls=m.kind==="video";el.alt=m.kind==="video"?"Status video":"Status photo";card.append(el);});const meta=document.createElement("small");meta.textContent=new Date(s.created_at).toLocaleString()+" · "+s.visibility;card.append(meta);const actions=document.createElement("div");actions.className="status-own-actions";const edit=document.createElement("button");edit.type="button";edit.textContent="Edit";edit.addEventListener("click",()=>{const editor=document.createElement("textarea");editor.maxLength=700;editor.value=s.body||"";editor.setAttribute("aria-label","Edit status text");const visibility=document.createElement("select");[["connections","Connections"],["everyone","Everyone"],["private","Only me"]].forEach(([v,l])=>visibility.add(new Option(l,v)));visibility.value=s.visibility==="everyone"?"everyone":s.visibility;const save=document.createElement("button");save.type="button";save.textContent="Save changes";save.addEventListener("click",async()=>{save.disabled=true;try{await workspaceCall("update_status",{statusId:s.id,body:editor.value,visibility:visibility.value});await renderStatuses();}catch(e){save.textContent=e.message;save.disabled=false;}});const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancel";cancel.addEventListener("click",()=>editor.remove());card.append(editor,visibility,save,cancel);});const del=document.createElement("button");del.type="button";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm("Delete this status?"))return;del.disabled=true;try{await workspaceCall("delete_status",{statusId:s.id});await renderStatuses();}catch(e){del.textContent=e.message;del.disabled=false;}});actions.append(edit,del);card.append(actions);statusList.append(card);});}catch(e){statusList.textContent=e.message;}};
 if(socialStatusForm)socialStatusForm.addEventListener("submit",async e=>{if(!statusFiles().length)return;e.preventDefault();e.stopImmediatePropagation();const button=socialStatusForm.querySelector("button[type=submit]");const feedback=socialStatusForm.querySelector(".hub-feedback");button.disabled=true;try{feedback.textContent="Uploading selected media privately…";const media=[];for(const file of statusFiles())media.push(await uploadFile(file,"status"));const body=socialStatusForm.elements.body.value.trim();const visibility=socialStatusForm.elements.visibility.value;await workspaceCall("create_status",{body,visibility,media});socialStatusForm.reset();$("statusMediaPreview")?.replaceChildren();feedback.textContent="Your status has been posted.";await renderStatuses();}catch(err){feedback.textContent=err.message;}finally{button.disabled=false;}},true);
 // Group builder: select members from search results, then create a group conversation.
 const contactsMount=$("commandContactsMount"),chatMount=$("commandChatMount");
 const groupBox=document.createElement("section");groupBox.className="hub-card communication-extra";groupBox.innerHTML='<h4>Create a group</h4><p class="hub-muted">Search members above, then add the people you want in this group.</p><form id="jrGroupForm"><label>Group name<input name="title" required minlength="2" maxlength="80" placeholder="e.g. Project team"></label><label>About this group<input name="description" maxlength="500" placeholder="What is this group for?"></label><div id="jrGroupSelected" class="hub-list">No members selected yet.</div><button class="hub-submit" type="submit">Create group</button><p class="hub-feedback" aria-live="polite"></p></form>';
 contactsMount?.append(groupBox);
 const selectedGroupMembers=new Map();
 const selectedBox=$("jrGroupSelected");
 const drawSelected=()=>{selectedBox.replaceChildren();if(!selectedGroupMembers.size){selectedBox.textContent="No members selected yet.";return;}selectedGroupMembers.forEach((m,id)=>{const row=document.createElement("div");row.className="hub-list-item";const label=document.createElement("span");label.textContent=m.full_name+" · "+m.jp_number;const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";remove.addEventListener("click",()=>{selectedGroupMembers.delete(id);drawSelected();});row.append(label,remove);selectedBox.append(row);});};
 const groupSearchForm=$("memberSearchForm");
 groupSearchForm?.addEventListener("submit",async e=>{e.preventDefault();e.stopImmediatePropagation();const box=$("memberSearchResults");box.textContent="Searching members…";try{const rows=await workspaceCall("search_members",{query:$("memberSearchQuery").value});box.replaceChildren();if(!rows.length){box.textContent="No members found.";return;}rows.forEach(m=>{const row=document.createElement("article");row.className="hub-list-item";const title=document.createElement("strong");title.textContent=m.full_name;const detail=document.createElement("small");detail.textContent=m.jp_number+" · "+(m.city||"");const start=document.createElement("button");start.type="button";start.textContent="Start chat";start.addEventListener("click",async()=>{try{const c=await workspaceCall("create_conversation",{otherMemberId:m.id,title:"Chat"});$("hubRefresh")?.click();row.dataset.conversation=c.id;start.textContent="Chat created";}catch(err){start.textContent=err.message;}});const add=document.createElement("button");add.type="button";add.textContent=selectedGroupMembers.has(m.id)?"Selected":"Add to group";add.addEventListener("click",()=>{if(selectedGroupMembers.has(m.id)){selectedGroupMembers.delete(m.id);add.textContent="Add to group";}else{selectedGroupMembers.set(m.id,m);add.textContent="Selected";}drawSelected();});row.append(title,detail,start,add);box.append(row);});}catch(err){box.textContent=err.message;}},true);
 $("jrGroupForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),feedback=f.querySelector(".hub-feedback"),button=f.querySelector("button[type=submit]");button.disabled=true;try{if(!selectedGroupMembers.size)throw new Error("Search for and select at least one other member.");await workspaceCall("create_group",{title:fd.get("title"),description:fd.get("description"),memberIds:[...selectedGroupMembers.keys()]});selectedGroupMembers.clear();drawSelected();f.reset();feedback.textContent="Group created. Your group is now in Chats."; $("hubRefresh")?.click();}catch(err){feedback.textContent=err.message;}finally{button.disabled=false;}});
 // Channels are broadcast spaces, separate from interactive group conversations.
 const channels=document.createElement("section");channels.className="hub-card communication-extra";channels.innerHTML='<h4>Channels</h4><p class="hub-muted">Follow public channels for updates, learning, business and communities. Only channel owners and moderators publish.</p><form id="jrChannelCreate"><label>Channel name<input name="name" required minlength="2" maxlength="100" placeholder="Channel name"></label><label>Description<input name="description" maxlength="1000" placeholder="What will this channel share?"></label><label>Category<select name="category"><option>Community</option><option>Education</option><option>Business</option><option>News</option><option>Entertainment</option><option>Creativity</option></select></label><label>Privacy<select name="visibility"><option value="public">Public</option><option value="private">Private · invitation only</option></select></label><button class="hub-submit">Create channel</button><p class="hub-feedback" aria-live="polite"></p></form><div id="jrChannelList" class="hub-list"></div><section id="jrChannelOpen" hidden></section>';
 contactsMount?.append(channels);
 const channelList=$("jrChannelList"),channelOpen=$("jrChannelOpen");
 const loadChannels=async()=>{try{const rows=await workspaceCall("list_channels");channelList.replaceChildren();if(!rows.length){channelList.textContent="No channels yet. Create one or check back later.";return;}rows.forEach(ch=>{const row=document.createElement("article");row.className="hub-list-item channel-row";const h=document.createElement("strong");h.textContent=ch.name;const desc=document.createElement("p");desc.textContent=ch.description||ch.category;const meta=document.createElement("small");meta.textContent=ch.visibility+" · "+ch.role;const follow=document.createElement("button");follow.type="button";follow.textContent=ch.role==="discover"?"Follow":"Open channel";follow.addEventListener("click",async()=>{try{if(ch.role==="discover"){await workspaceCall("join_channel",{channelId:ch.id});await loadChannels();}openChannel(ch);}catch(e){follow.textContent=e.message;}});row.append(h,desc,meta,follow);channelList.append(row);});}catch(e){channelList.textContent=e.message;}};
 const openChannel=async ch=>{channelOpen.hidden=false;channelOpen.replaceChildren();const h=document.createElement("h4");h.textContent=ch.name;const p=document.createElement("p");p.textContent=ch.description||"Channel";channelOpen.append(h,p);if(ch.role==="owner"||ch.role==="moderator"){const form=document.createElement("form");form.innerHTML='<label>Publish an update<textarea name="body" maxlength="4000" rows="3"></textarea></label><button class="hub-submit">Publish to channel</button><p class="hub-feedback"></p>';form.addEventListener("submit",async e=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;try{await workspaceCall("publish_channel_post",{channelId:ch.id,body:form.elements.body.value});form.reset();form.querySelector(".hub-feedback").textContent="Published.";await openChannel(ch);}catch(err){form.querySelector(".hub-feedback").textContent=err.message;}finally{button.disabled=false;}});channelOpen.append(form);}const posts=await workspaceCall("list_channel_posts",{channelId:ch.id});const feed=document.createElement("div");feed.className="hub-list";posts.forEach(post=>{const item=document.createElement("article");item.className="hub-list-item";const body=document.createElement("p");body.textContent=post.body||"Media update";item.append(body);(post.media||[]).forEach(m=>{const el=m.kind==="video"?document.createElement("video"):document.createElement("img");el.src=m.url;el.alt=m.kind==="video"?"Channel video":"Channel photo";el.controls=m.kind==="video";item.append(el);});feed.append(item);});channelOpen.append(feed);};
 $("jrChannelCreate")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),feedback=f.querySelector(".hub-feedback"),button=f.querySelector("button");button.disabled=true;try{const ch=await workspaceCall("create_channel",{name:fd.get("name"),description:fd.get("description"),category:fd.get("category"),visibility:fd.get("visibility")});f.reset();ch.role="owner";feedback.textContent="Channel created.";await loadChannels();openChannel(ch);}catch(err){feedback.textContent=err.message;}finally{button.disabled=false;}});
 // Initial signed-in load and refresh.
 const signedInLoad=()=>{refreshProfilePhoto();renderStatuses();loadChannels();refreshCommandIntelligence();};
 window.addEventListener("jr:member-signed-in",signedInLoad);
 if(!$("workspace").hidden)signedInLoad();
 // Visually rich world cards: each has a distinct atmospheric scene and clear invitation.
 const scenes={global:"🌐",personal:"✨",family_personal:"🏡",business:"🏙️",education:"📚",commerce:"🛍️",family_finance:"🌱",creative:"🎨"};
 document.querySelectorAll(".world-category-grid article").forEach(card=>{const type=card.querySelector("[data-world-type]")?.dataset.worldType||"global";card.dataset.scene=type;const scene=document.createElement("div");scene.className="world-scene-art";scene.setAttribute("aria-hidden","true");scene.textContent=scenes[type]||"✦";card.prepend(scene);});

 }
 // Device-level accessibility preferences and optional speech tools.
 const root=document.documentElement;
 const prefs=[["jrLargeText","jr-large-text"],["jrHighContrast","jr-high-contrast"],["jrReduceMotion","jr-reduce-motion"]];
 prefs.forEach(([id,cls])=>{const control=$(id);if(!control)return;try{control.checked=localStorage.getItem("jr-pref-"+id)==="true";}catch{}root.classList.toggle(cls,control.checked);control.addEventListener("change",()=>{root.classList.toggle(cls,control.checked);try{localStorage.setItem("jr-pref-"+id,String(control.checked));}catch{}});});
 const voiceSelect=$("jrSpeakerVoice"),rate=$("jrSpeakerRate"),feedback=$("jrVoiceFeedback");
  const synth=window.speechSynthesis;
  let activeRecognition=null;
  const stopVoice=()=>{synth?.cancel();if(activeRecognition){try{activeRecognition.stop();}catch{}activeRecognition=null;}if(feedback)feedback.textContent="Voice stopped.";};
  const fillVoices=()=>{if(!voiceSelect||!synth)return;const current=voiceSelect.value;voiceSelect.replaceChildren(new Option("System default",""));synth.getVoices().forEach((voice,index)=>voiceSelect.add(new Option(voice.name+" · "+voice.lang,String(index))));if(current)voiceSelect.value=current;};
  if(synth){fillVoices();synth.addEventListener?.("voiceschanged",fillVoices);}
  const speak=(message)=>{if(!synth||typeof SpeechSynthesisUtterance==="undefined"){if(feedback)feedback.textContent="Speech output is not supported by this browser.";return;}stopVoice();const utterance=new SpeechSynthesisUtterance(message);const voices=synth.getVoices();if(voiceSelect?.value!=="")utterance.voice=voices[Number(voiceSelect.value)]||null;utterance.rate=Number(rate?.value||1);utterance.onstart=()=>{if(feedback)feedback.textContent="Speaker is reading aloud.";};utterance.onend=()=>{if(feedback)feedback.textContent="Finished reading.";};utterance.onerror=()=>{if(feedback)feedback.textContent="The selected voice could not be played.";};synth.speak(utterance);};
  $("jrSpeakTest")?.addEventListener("click",()=>speak("Hello. This is the JR PHEEF speaker and accessibility test."));
  $("jrStopSpeech")?.addEventListener("click",stopVoice);
  $("jrVoiceInput")?.addEventListener("click",()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){if(feedback)feedback.textContent="Voice typing is not supported here. You can still type normally.";return;}stopVoice();const recognition=new Recognition();activeRecognition=recognition;recognition.interimResults=false;recognition.maxAlternatives=1;recognition.continuous=false;recognition.onstart=()=>{if(feedback)feedback.textContent="Listening. Tap Stop voice whenever you want to stop.";};recognition.onerror=event=>{if(feedback)feedback.textContent="Voice input unavailable: "+event.error;};recognition.onresult=event=>{const transcript=event.results?.[0]?.[0]?.transcript||"";const target=$("workspacePrompt")||$("prompt");if(target){target.value=transcript;target.focus();}if(feedback)feedback.textContent=transcript?"Voice typing added your words to the JR message box. Review before sending.":"No speech was recognised.";};recognition.onend=()=>{if(activeRecognition===recognition)activeRecognition=null;if(feedback&&!feedback.textContent.startsWith("Voice typing")&&!feedback.textContent.startsWith("Voice stopped"))feedback.textContent="Voice input stopped.";};try{recognition.start();}catch{activeRecognition=null;if(feedback)feedback.textContent="Voice input could not start. Check microphone permission.";}});
})();
