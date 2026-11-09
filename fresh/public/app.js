"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const panel=$("authPanel"),conversation=$("conversation"),workspace=$("workspace"),hero=document.querySelector(".hero"),form=$("authForm");
 let mode="login",busy=false;
 const setMessage=message=>{$("authMessage").textContent=message||"";};
 function showWorkspace(view="home"){
  if(hero)hero.hidden=true;workspace.hidden=false;panel.hidden=true;conversation.hidden=true;
  document.querySelectorAll(".workspace-tab").forEach(button=>button.classList.toggle("selected",button.dataset.view===view));
  document.querySelectorAll(".workspace-view").forEach(section=>{section.hidden=section.id!=="view-"+view;});
  const titles={home:"Welcome. Where shall we begin?",worlds:"Explore connected worlds",jr:"Talk to JR",command:"Your Command Center"};
  $("workspaceTitle").textContent=titles[view]||titles.home;
 }
 async function loadFounderOverview(){
  const panel=$("founderCommand");if(panel.hidden)return;
  $("founderLoadState").textContent="Checking your protected founder permissions…";
  try{const data=await api("/api/founder/overview");if(!data.ok)throw new Error(data.error||"Founder overview unavailable.");
   $("founderName").textContent=data.founder.fullName||"Founder";$("founderJp").textContent=data.founder.jpNumber;
   $("founderMembers").textContent=data.metrics.memberAccounts===null?"—":String(data.metrics.memberAccounts);
   $("founderVentures").textContent=data.metrics.registeredVentures===null?"—":String(data.metrics.registeredVentures);
   $("founderVerified").textContent=data.founder.verified?"Verified":"Verification pending";
   $("founderEnvironment").textContent=data.environment;$("founderOpportunities").textContent=data.metrics.opportunities??"—";$("founderListings").textContent=data.metrics.listings??"—";$("founderConversations").textContent=data.metrics.conversations??"—";$("founderDeliveries").textContent=data.metrics.deliveryRequests??"—";$("founderPayments").textContent=data.controls.paymentsEnabled?"Enabled":"Disabled";
   $("founderAi").textContent=data.controls.liveAiConnected?"Connected":"Not connected";
   const ventureBox=$("founderVentureList");ventureBox.replaceChildren();
   (data.ventures||[]).forEach(v=>{const card=document.createElement("article");card.className="founder-data-row";const name=document.createElement("strong");name.textContent=v.name;const detail=document.createElement("p");detail.textContent=v.description||"";const meta=document.createElement("small");meta.textContent=v.kind+" · "+v.status+(v.regulated?" · regulated services not activated":"");card.append(name,detail,meta);ventureBox.append(card);});
   const decisionBox=$("founderDecisionList");decisionBox.replaceChildren();
   (data.decisions||[]).forEach(d=>{const card=document.createElement("article");card.className="founder-data-row";const name=document.createElement("strong");name.textContent=d.title;const detail=document.createElement("p");detail.textContent=d.details||"No additional details.";const meta=document.createElement("small");meta.textContent=(d.venture||"DGBO")+" · "+d.status;card.append(name,detail,meta);if(d.status==="proposed"){for(const state of ["approved","rejected"]){const b=document.createElement("button");b.type="button";b.className="hub-small-button";b.textContent=state==="approved"?"Approve decision":"Reject decision";b.addEventListener("click",async()=>{b.disabled=true;try{await api("/api/founder/overview",{action:"decide_decision",id:d.id,status:state});await loadFounderOverview();}catch(err){b.textContent=err.message;b.disabled=false;}});card.append(b);}}decisionBox.append(card);});
   $("founderLoadState").textContent="Founder access verified on the server. Staging environment only.";
  }catch(error){$("founderLoadState").textContent=error.message||"Could not load founder overview.";}
 }
 function setSignedIn(user){
  window.dispatchEvent(new CustomEvent("jr:member-signed-in",{detail:user||null}));
  $("memberGreeting").hidden=!user;$("logoutButton").hidden=!user;$("openLogin").hidden=!!user;$("openSignup").hidden=!!user;
  $("memberGreeting").textContent=user?(user.fullName||user.email||"JR PHEEF member"):"";
  if(user){$("accountName").textContent=user.fullName||"JR PHEEF member";$("accountEmail").textContent=user.email||"";const isFounder=user.role==="founder"&&user.jpNumber==="JP-01";$("founderCommand").hidden=!isFounder;$("memberCommand").hidden=isFounder;showWorkspace("home");if(isFounder)loadFounderOverview();}
  else{workspace.hidden=true;if(hero)hero.hidden=false;panel.hidden=true;conversation.hidden=true;}
 }
 function showAuth(next){
  mode=next;panel.hidden=false;conversation.hidden=true;setMessage("");
  $("authTitle").textContent=mode==="login"?"Welcome back":"Create your JR PHEEF identity";
  $("loginTab").classList.toggle("selected",mode==="login");$("signupTab").classList.toggle("selected",mode==="signup");
  $("loginTab").setAttribute("aria-pressed",String(mode==="login"));$("signupTab").setAttribute("aria-pressed",String(mode==="signup"));
  for(const [id,visible] of [["nameLabel",mode==="signup"],["fullName",mode==="signup"],["phoneLabel",mode==="signup"],["phone",mode==="signup"],["birthLabel",mode==="signup"],["birthYear",mode==="signup"]])$(id).hidden=!visible;
  $("fullName").required=mode==="signup";$("phone").required=mode==="signup";$("birthYear").required=mode==="signup";
  $("password").autocomplete=mode==="login"?"current-password":"new-password";$("authSubmit").textContent=mode==="login"?"Log in":"Create account";
  $("email").focus({preventScroll:true});panel.scrollIntoView({behavior:"smooth",block:"center"});
 }
 async function api(path,body){
  const response=await fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
  let data={};try{data=await response.json();}catch{}if(!response.ok)throw new Error(data.error||"JR PHEEF could not complete that request.");return data;
 }
 $("openLogin").addEventListener("click",()=>showAuth("login"));$("openSignup").addEventListener("click",()=>showAuth("signup"));
 $("loginTab").addEventListener("click",()=>showAuth("login"));$("signupTab").addEventListener("click",()=>showAuth("signup"));
 $("closeAuth").addEventListener("click",()=>{panel.hidden=true;});
 $("startWithJr").addEventListener("click",()=>{conversation.hidden=false;panel.hidden=true;conversation.scrollIntoView({behavior:"smooth",block:"center"});$("prompt").focus({preventScroll:true});});
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;busy=true;$("authSubmit").disabled=true;$("authSubmit").textContent=mode==="login"?"Signing in…":"Creating account…";setMessage("");
  const payload={email:$("email").value.trim(),password:$("password").value};
  if(mode==="signup"){payload.fullName=$("fullName").value.trim();payload.phone=$("phone").value.trim();payload.birthYear=$("birthYear").value;}
  try{
   const result=await api(mode==="login"?"/api/auth/login":"/api/auth/signup",payload);$("password").value="";
   if(result.emailVerificationRequired){setMessage(result.message+" Then return here and log in.");return;}
   const session=await api("/api/auth/session");
   if(!session.authenticated)throw new Error("Your account is created, but email confirmation is still required. Confirm your email, then log in.");
   setSignedIn(session.user||{email:payload.email,fullName:payload.fullName});$("promptReply").textContent="Welcome to JR PHEEF. Your account is signed in.";
  }catch(error){setMessage(error.message||"Something went wrong. Please try again.");}
  finally{busy=false;$("authSubmit").disabled=false;$("authSubmit").textContent=mode==="login"?"Log in":"Create account";}
 });
 $("logoutButton").addEventListener("click",async()=>{$("logoutButton").disabled=true;try{await api("/api/auth/logout",{});}catch{}setSignedIn(null);$("logoutButton").disabled=false;$("promptReply").textContent="You have been logged out of JR PHEEF.";});
 $("promptForm").addEventListener("submit",event=>{event.preventDefault();const value=$("prompt").value.trim();if(!value){$("prompt").focus();return;}$("promptReply").textContent="JR's live conversation intelligence is the next service being connected. This message has not been sent to an AI service yet.";});
 $("founderDecisionForm").addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const button=form.querySelector("button[type=submit]");button.disabled=true;$("founderDecisionFeedback").textContent="Saving proposed decision…";try{await api("/api/founder/overview",{action:"create_decision",title:fd.get("title"),venture:fd.get("venture"),details:fd.get("details")});form.reset();$("founderDecisionFeedback").textContent="Decision recorded for founder review.";await loadFounderOverview();}catch(error){$("founderDecisionFeedback").textContent=error.message;}finally{button.disabled=false;}});
 document.querySelectorAll(".workspace-tab").forEach(button=>button.addEventListener("click",()=>showWorkspace(button.dataset.view)));
 api("/api/auth/session").then(session=>{if(session.authenticated)setSignedIn(session.user);}).catch(()=>{});
 const fragment=new URLSearchParams(window.location.hash.startsWith("#")?window.location.hash.slice(1):"");
 const confirmationToken=fragment.get("access_token"),confirmationRefresh=fragment.get("refresh_token");
 if(confirmationToken){
  window.history.replaceState({},document.title,window.location.pathname+window.location.search);
  api("/api/auth/session/establish",{access_token:confirmationToken,refresh_token:confirmationRefresh}).then(result=>{
   if(result.user)setSignedIn(result.user);else throw new Error("Email verified. Please log in to continue.");
   $("promptReply").textContent="Your email is verified. Welcome to JR PHEEF.";
  }).catch(error=>{showAuth("login");setMessage(error.message||"Email confirmation failed. Please request a new link.");});
 }
"use strict";
(()=> {
 const $=id=>document.getElementById(id);
 let me=null,selectedMember=null,selectedConversation=null,hubLoaded=false;
 const hub= $("liveHub");
 if(!hub)return;
 hub.innerHTML=`
 <div class="hub-intro"><div><p class="eyebrow">YOUR CONNECTED WORKSPACE</p><h2>Make something happen</h2><p class="view-copy">Create, connect, organise and participate. Your account controls what belongs to you.</p></div><button type="button" class="hub-refresh" id="hubRefresh">Refresh</button></div>
 <div class="hub-grid">
  <section class="hub-card"><h3>Sell or offer something</h3><form data-hub-action="create_listing"><label>Title<input name="title" required minlength="3" maxlength="120" placeholder="What are you offering?"></label><label>Category<input name="category" maxlength="60" placeholder="Goods, service, property…"></label><div class="hub-two"><label>Price<input name="price" type="number" min="0" step="0.01" required></label><label>Location<input name="location" required maxlength="180" placeholder="City or area"></label></div><label>Description<textarea name="description" maxlength="2000" rows="2"></textarea></label><label class="hub-check"><input name="negotiable" type="checkbox"> Price is negotiable</label><button class="hub-submit">Publish listing</button><p class="hub-feedback" aria-live="polite"></p></form></section>
  <section class="hub-card"><h3>Share an opportunity</h3><form data-hub-action="create_opportunity"><label>Opportunity title<input name="title" required minlength="3" maxlength="140" placeholder="Job, partnership, project…"></label><label>Type<select name="opportunityType"><option value="business_opportunity">Business opportunity</option><option value="job">Job</option><option value="service">Service</option><option value="goods">Goods</option><option value="partnership">Partnership</option><option value="property">Property</option></select></label><label>Location<input name="location" maxlength="180" placeholder="Optional / remote"></label><label>Details<textarea name="description" required minlength="10" maxlength="3000" rows="3"></textarea></label><button class="hub-submit">Publish opportunity</button><p class="hub-feedback" aria-live="polite"></p></form></section>
  <section class="hub-card"><h3>Build a business</h3><form data-hub-action="create_business"><label>Business name<input name="businessName" required minlength="2" maxlength="140"></label><label>Sector<input name="sector" maxlength="80" placeholder="Retail, technology, agriculture…"></label><label>Location<input name="location" maxlength="180"></label><label>What do you want to achieve?<textarea name="goals" maxlength="1000" rows="2"></textarea></label><button class="hub-submit">Create business workspace</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myBusinesses" class="hub-list"></div></section>
  <section class="hub-card"><h3>Plan a project</h3><form data-hub-action="create_project"><label>Project name<input name="title" required minlength="3" maxlength="140"></label><label>Goal<textarea name="goal" required minlength="5" maxlength="1500" rows="2"></textarea></label><label>Estimated budget (optional)<input name="budget" type="number" min="0" step="0.01"></label><button class="hub-submit">Save project</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myProjects" class="hub-list"></div></section>
  <section class="hub-card"><h3>FAMILY · Save towards a goal</h3><p class="hub-muted">FAMILY serves the whole ecosystem. This is a planning record only; no money is deposited or moved.</p><form data-hub-action="create_family_goal"><label>Goal<input name="title" required minlength="3" maxlength="140" placeholder="Education, equipment, emergency…"></label><label>Target amount<input name="targetAmount" type="number" min="0.01" step="0.01" required></label><label>Target date (optional)<input name="targetDate" type="date"></label><button class="hub-submit">Save FAMILY goal</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myGoals" class="hub-list"></div></section>
  <section class="hub-card"><h3>Delivery request</h3><form data-hub-action="create_delivery"><label>Pickup<input name="pickup" required maxlength="180"></label><label>Destination<input name="destination" required maxlength="180"></label><label>What needs moving?<textarea name="description" maxlength="1000" rows="2"></textarea></label><button class="hub-submit">Record delivery request</button><p class="hub-feedback" aria-live="polite"></p></form><p class="hub-muted">Request recording is active. Rider assignment, live tracking and fare estimates are not connected.</p></section>
  <section class="hub-card"><h3>Rooms Near Me</h3><form data-hub-action="create_room_listing"><label>Room / property title<input name="title" required minlength="3" maxlength="120" placeholder="Bright bedsitter near…"></label><label>Room type<select name="roomType"><option value="bedsitter">Bedsitter</option><option value="studio">Studio</option><option value="one_bedroom">1 bedroom</option><option value="two_bedroom">2 bedrooms</option><option value="three_bedroom">3 bedrooms</option><option value="four_bedroom">4 bedrooms</option><option value="shared">Shared</option><option value="single_room">Single room</option><option value="other">Other</option></select></label><div class="hub-two"><label>Monthly rent<input name="rent" type="number" min="0" step="0.01" required></label><label>Location<input name="location" maxlength="180" required></label></div><label>Available from (optional)<input name="availableFrom" type="date"></label><label>Description<textarea name="description" maxlength="2000" rows="2"></textarea></label><button class="hub-submit">Publish room listing</button><p class="hub-feedback"></p></form><p class="hub-muted">Listing is free in this staging build. Any future provider subscription must be clearly disclosed before activation.</p></section>
  <section class="hub-card"><h3>Share a status</h3><form data-hub-action="create_status"><label>Your update<textarea name="body" required maxlength="500" rows="3"></textarea></label><label>Who can see it?<select name="visibility"><option value="connections">Connections</option><option value="public">Public</option><option value="private">Only me</option></select></label><button class="hub-submit">Post update</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myStatuses" class="hub-list"></div></section>
  <section class="hub-card"><h3>Profile & privacy</h3><form data-hub-action="update_profile"><label>About me<textarea name="bio" maxlength="500" rows="2"></textarea></label><div class="hub-two"><label>City<input name="city" maxlength="120"></label><label>Country<input name="country" maxlength="120"></label></div><label>Profile visibility<select name="profile_visibility"><option value="public">Public</option><option value="connections">Connections</option><option value="private">Private</option></select></label><label class="hub-check"><input name="public_phone" type="checkbox"> Show phone publicly (off by default)</label><label class="hub-check"><input name="show_email" type="checkbox"> Show email publicly (off by default)</label><label class="hub-check"><input name="show_location" type="checkbox"> Show location</label><button class="hub-submit">Save profile settings</button><p class="hub-feedback" aria-live="polite"></p></form></section>
  <section class="hub-card hub-card-wide"><h3>People & conversations</h3><form id="memberSearchForm"><label>Find a member by name or JP number<input id="memberSearchQuery" minlength="2" maxlength="80" required placeholder="Name or JP-…"></label><button class="hub-submit">Search members</button></form><div id="memberSearchResults" class="hub-list"></div><div class="hub-chat-layout"><div><h4>Your conversations</h4><div id="conversationList" class="hub-list"></div></div><div><h4>Messages</h4><div id="messageList" class="hub-message-list">Choose a conversation to view messages.</div><form id="messageSendForm"><label>Message<textarea id="messageBody" maxlength="4000" rows="2" required></textarea></label><button class="hub-submit">Send message</button><p id="messageFeedback" class="hub-feedback"></p></form></div></div></section>
  <section class="hub-card hub-card-wide"><h3>Explore opportunities</h3><div id="opportunityFeed" class="hub-list"></div></section><section class="hub-card hub-card-wide"><h3>Browse goods & services</h3><div id="marketFeed" class="hub-list"></div></section><section class="hub-card hub-card-wide"><h3>Rooms Near Me · available listings</h3><div id="roomFeed" class="hub-list"></div></section><section class="hub-card hub-card-wide"><h3>Your delivery requests</h3><div id="myDeliveries" class="hub-list"></div></section>
  <section class="hub-card hub-card-wide"><h3>Your listings</h3><div id="myListings" class="hub-list"></div></section>
  <section class="hub-card hub-card-wide"><h3>Notifications</h3><div id="myNotifications" class="hub-list"></div></section>
 </div>`;
 const call=async(action,extra={})=>{const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"That action could not be completed.");return d.data;};
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const render=(id,items,make)=>{const box=$(id);box.replaceChildren();if(!items?.length){box.append(node("p","hub-muted","Nothing here yet."));return;}items.forEach(item=>box.append(make(item)));};
 const item=(title,detail,meta)=>{const e=node("article","hub-list-item");e.append(node("strong","",title||"Untitled"),node("p","",detail||""),node("small","",meta||""));return e;};
 async function refresh(){
  try{
   const d=await call("overview");me=d.member;hubLoaded=true;
   const pf=hub.querySelector('[data-hub-action="update_profile"]');
   for(const k of ["bio","city","country","profile_visibility"])if(pf.elements[k])pf.elements[k].value=me[k]||({profile_visibility:"public"}[k]||"");
   for(const k of ["public_phone","show_email","show_location"])pf.elements[k].checked=!!me[k];
   render("myListings",d.listings,x=>item(x.title,x.description,"KSh "+(x.price??"—")+" · "+(x.location||"No location")+" · "+x.status));
   render("marketFeed",d.marketListings,x=>item(x.title,x.description,"KSh "+(x.price??"—")+" · "+(x.location||"No location")+" · "+(x.category||"Listing")));
   render("myDeliveries",d.deliveries,x=>item((x.pickup||"Pickup")+" → "+(x.destination||"Destination"),x.description,"Delivery request · "+x.status));
   render("roomFeed",d.marketRooms,x=>item(x.title,x.description,(x.room_type||"Room")+" · KSh "+x.rent_ksh+"/month · "+x.location));
   render("opportunityFeed",d.opportunities,x=>{const e=item(x.title,x.description,(x.opportunity_type||"Opportunity")+" · "+(x.location||"Remote / unspecified")+" · "+x.verification_status);if(x.owner_user_id!==me.id){const b=node("button","hub-small-button","I'm interested");b.type="button";b.addEventListener("click",async()=>{try{await call("express_interest",{opportunityId:x.id,message:"I would like to learn more."});b.textContent="Interest sent";b.disabled=true;}catch(err){b.textContent=err.message;}});e.append(b);}return e;});
   render("myProjects",d.projects,x=>item(x.title,x.goal,"Project · "+x.status));
   render("myGoals",d.familyGoals,x=>item(x.title,"Target: "+x.target_amount+" · Saved: "+x.saved_amount,"FAMILY goal · "+x.status));
   render("myBusinesses",d.businesses,x=>item(x.business_name,x.sector+" · "+(x.location||"Location not set"),x.status+" · "+x.plan_tier));
   render("myStatuses",d.statuses,x=>item(x.body,"Visibility: "+x.visibility,new Date(x.created_at).toLocaleString()));
   render("myNotifications",d.notifications,x=>item(x.title,x.message,new Date(x.created_at).toLocaleString()));
   await loadConversations();
  }catch(err){hub.prepend(node("p","hub-error",err.message));}
 }
 async function loadConversations(){
  try{const list=await call("list_conversations");render("conversationList",list,c=>{const peer=c.peers?.[0];const b=node("button","hub-conversation-button",(peer?.full_name||"Conversation")+" · "+(peer?.jp_number||""));b.type="button";b.addEventListener("click",()=>openConversation(c.id));return b;});}
  catch(e){$("conversationList").textContent=e.message;}
 }
 async function openConversation(id){
  selectedConversation=id;
  try{const messages=await call("list_messages",{conversationId:id});render("messageList",messages,m=>item(m.sender_id===me.id?"You":"Member",m.body,new Date(m.created_at).toLocaleString()));}
  catch(e){$("messageList").textContent=e.message;}
 }
 hub.addEventListener("submit",async event=>{
  const form=event.target.closest("form[data-hub-action]");if(!form)return;
  event.preventDefault();const action=form.dataset.hubAction,fd=new FormData(form),payload={};
  for(const [k,v] of fd.entries())payload[k]=v;
  if(action==="create_listing"){payload.price=Number(payload.price);payload.negotiable=fd.has("negotiable");}
  if(action==="create_project"&&payload.budget!=="")payload.budget=Number(payload.budget);
  if(action==="create_family_goal")payload.targetAmount=Number(payload.targetAmount);
  if(action==="create_room_listing")payload.rent=Number(payload.rent);
  if(action==="update_profile"){payload.public_phone=fd.has("public_phone");payload.show_email=fd.has("show_email");payload.show_location=fd.has("show_location");}
  const feedback=form.querySelector(".hub-feedback");const button=form.querySelector("button[type=submit],button:not([type])");
  if(button){button.disabled=true;}
  try{const result=await call(action,payload);if(feedback)feedback.textContent=result?.note||"Saved successfully.";form.reset();await refresh();}
  catch(err){if(feedback)feedback.textContent=err.message;}
  finally{if(button)button.disabled=false;}
 });
 $("hubRefresh").addEventListener("click",refresh);
 $("memberSearchForm").addEventListener("submit",async e=>{e.preventDefault();const box=$("memberSearchResults");box.textContent="Searching…";try{const results=await call("search_members",{query:$("memberSearchQuery").value});render("memberSearchResults",results,m=>{const e=item(m.full_name,m.bio,m.jp_number+" · "+(m.city||""));const b=node("button","hub-small-button","Start chat");b.type="button";b.addEventListener("click",async()=>{try{const c=await call("create_conversation",{otherMemberId:m.id,title:"Chat"});await loadConversations();await openConversation(c.id);b.textContent="Conversation opened";}catch(err){b.textContent=err.message;}});e.append(b);return e;});}catch(err){box.textContent=err.message;}});
 $("messageSendForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedConversation){$("messageFeedback").textContent="Choose a conversation first.";return;}try{await call("send_message",{conversationId:selectedConversation,body:$("messageBody").value});$("messageBody").value="";$("messageFeedback").textContent="Message sent.";await openConversation(selectedConversation);}catch(err){$("messageFeedback").textContent=err.message;}});
 window.addEventListener("jr:member-signed-in",event=>{me=event.detail||null;refresh();});
 const existing=$("accountName");if(existing&&!$("workspace").hidden){me={id:null};refresh();}
})();

})();