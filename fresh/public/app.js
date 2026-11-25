"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const panel=$("authPanel"),conversation=$("conversation"),workspace=$("workspace"),hero=document.querySelector(".hero"),form=$("authForm");
 let mode="login",busy=false,recoveryAccessToken="",recoveryRefreshToken="",signedInUser=null;
 const referralCodePattern=/^JR-[A-F0-9]{12}$/i;
 try{const incomingReferral=new URLSearchParams(window.location.search).get("ref");if(incomingReferral&&referralCodePattern.test(incomingReferral.trim()))sessionStorage.setItem("jr_referral_code",incomingReferral.trim().toUpperCase());}catch{}
 const worldRoutes={"/":"home","/worlds/jr-pheef":"home","/worlds":"worlds","/jr":"jr","/worlds/dgbo":"dgbo","/worlds/family":"family","/worlds/jr-move":"turbex","/worlds/jr-link":"command","/agents":"agents"};
 const routeForView={home:"/",worlds:"/worlds",jr:"/jr",dgbo:"/worlds/dgbo",family:"/worlds/family",turbex:"/worlds/jr-move",command:"/worlds/jr-link",agents:"/agents"};
 const requestedWorld=worldRoutes[window.location.pathname]||"home";
 const requestedLink=window.location.pathname==="/worlds/jr-link";
 const setMessage=message=>{$("authMessage").textContent=message||"";};
 let multiWindowMode=false;
 let openWindows=["home"];
 const workspaceWindowGrid=document.createElement("div");
 workspaceWindowGrid.id="jrWorkspaceWindowGrid";
 workspaceWindowGrid.className="jr-workspace-window-grid";
 const workspaceWindowToolbar=document.createElement("div");
 workspaceWindowToolbar.id="jrWorkspaceWindowToolbar";
 workspaceWindowToolbar.className="jr-workspace-window-toolbar";
 workspaceWindowToolbar.innerHTML='<div class="jr-window-toolbar-copy"><strong>Workspace windows</strong><span>Open several parts of your world side by side.</span></div><div class="jr-window-toolbar-actions"><select id="jrAddWindowSelect" aria-label="Choose a workspace to open"><option value="home">Home</option><option value="worlds">Worlds</option><option value="jr">JR</option><option value="command">Command Center</option><option value="dgbo">DGBO</option><option value="family">FAMILY</option><option value="turbex">Transport & Logistics</option><option value="agents">Agent Universe</option></select><button type="button" id="jrAddWindow">Open panel</button><select id="jrWindowColumns" aria-label="Number of workspace columns"><option value="1">1 column</option><option value="2" selected>2 columns</option><option value="3">3 columns</option><option value="4">4 columns</option></select><button type="button" id="jrWindowReset">Reset layout</button></div>';
 const originalWorkspaceViews=[...document.querySelectorAll("#workspace .workspace-view")];
 originalWorkspaceViews.forEach(section=>{
  const key=section.id.replace("view-","");
  const frame=document.createElement("section");frame.className="jr-workspace-window";frame.dataset.window=key;frame.hidden=true;
  const head=document.createElement("div");head.className="jr-workspace-window-head";
  const label=document.createElement("strong");label.textContent=({home:"HOME",worlds:"WORLDS",jr:"JR",command:"COMMAND CENTER"})[key]||key.toUpperCase();
  const actions=document.createElement("div");actions.className="jr-workspace-window-actions";
  const focus=document.createElement("button");focus.type="button";focus.textContent="Focus";focus.addEventListener("click",()=>{showWorkspace(key);});
  const close=document.createElement("button");close.type="button";close.textContent="×";close.setAttribute("aria-label","Close "+key+" panel");close.addEventListener("click",()=>closeWorkspaceWindow(key));
  actions.append(focus,close);head.append(label,actions);frame.append(head,section);workspaceWindowGrid.append(frame);
 });
 const workspaceNav=document.querySelector("#workspace .workspace-nav");
 if(workspaceNav){workspaceNav.after(workspaceWindowToolbar,workspaceWindowGrid);}
 function renderWorkspaceWindows(){
  document.body.dataset.jrWindowMode=multiWindowMode?"multiple":"single";
  const columns=Number($("jrWindowColumns")?.value||2);
  workspaceWindowGrid.style.setProperty("--jr-window-columns",String(columns));
  workspaceWindowToolbar.hidden=false;
  workspaceWindowGrid.classList.toggle("is-multiple",multiWindowMode);
  workspaceWindowGrid.querySelectorAll(".jr-workspace-window").forEach(frame=>{
   const visible=multiWindowMode?openWindows.includes(frame.dataset.window):openWindows[0]===frame.dataset.window;
   frame.hidden=!visible;
   const section=frame.querySelector(".workspace-view");if(section)section.hidden=!visible;
  });
 }
 function closeWorkspaceWindow(key){
  openWindows=openWindows.filter(x=>x!==key);
  if(!openWindows.length)openWindows=["home"];
  if(multiWindowMode)showWorkspace(openWindows[0]);else renderWorkspaceWindows();
 }
 $("jrAddWindow")?.addEventListener("click",()=>{
  const key=$("jrAddWindowSelect").value;
  if(!openWindows.includes(key)){if(openWindows.length>=4){$("jrAddWindow").textContent="Maximum 4 panels";setTimeout(()=>{$("jrAddWindow").textContent="Open panel";},1800);return;}openWindows.push(key);}
  multiWindowMode=true;showWorkspace(key);
 });
 $("jrWindowColumns")?.addEventListener("change",renderWorkspaceWindows);
 $("jrWindowReset")?.addEventListener("click",()=>{multiWindowMode=false;showWorkspace("home");});
 function showWorkspace(view="home",options={}){
   const nextPath=routeForView[view]||"/";
   if(!options.fromRoute&&window.location.pathname!==nextPath)window.history.pushState({jrWorld:view},"",nextPath);
  document.body.dataset.jrWorld=view==="worlds"?"global":view;
  if(hero)hero.hidden=true;workspace.hidden=false;panel.hidden=true;conversation.hidden=true;
  const primaryView=["dgbo","family","turbex"].includes(view)?"worlds":view;
  document.querySelectorAll(".workspace-tab").forEach(button=>{const active=button.dataset.view===primaryView;button.classList.toggle("selected",active);if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");});
  const titles={home:"Welcome. Where shall we begin?",worlds:"Explore connected worlds",jr:"Talk to JR",command:"Your Command Center",dgbo:"Diamond Global Business Operators",family:"FAMILY",turbex:"Transport & Logistics",agents:"JR Agent Universe"};
  $("workspaceTitle").textContent=titles[view]||titles.home;
  if(multiWindowMode){if(!openWindows.includes(view)){if(openWindows.length>=4)openWindows[openWindows.length-1]=view;else openWindows.push(view);}}
  else openWindows=[view];
  renderWorkspaceWindows();
 }
 window.jrNavigateWorkspace=showWorkspace;
 document.querySelectorAll("[data-company-open]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();if(workspace.hidden){showAuth("login");setMessage("Log in to enter your company workspaces.");return;}showWorkspace(button.dataset.companyOpen);}));
 document.querySelectorAll("[data-company-back]").forEach(button=>button.addEventListener("click",()=>showWorkspace("home")));
 document.querySelectorAll("[data-company-action]").forEach(button=>button.addEventListener("click",()=>{const prompts={research:"Help me research practical business ideas and opportunities for DGBO.",venture:"Help me develop a business venture with a practical operating plan.",partners:"Help me prepare a partnership enquiry for Diamond Global Business Operators.",operations:"Help me plan the roles, workflows and governance for a company.",education:"Teach me practical financial education, starting with budgeting and saving.",savings:"Help me prepare a realistic personal savings goal and plan.",family:"Help me organise family priorities and financial wellbeing goals.", "turbex-provider":"I want to become a driver or transport provider on JR PHEEF. Guide me through a safe, step-by-step pre-registration. First ask whether I am a motorcycle rider, car driver, courier, vehicle owner or transport operator, then ask my operating area and contact details. Explain which identity, licence, vehicle, insurance and safety documents apply to my role. Do not ask me to post sensitive document numbers or images into an ordinary chat. Explain that registration is not approval and that real jobs begin only after secure document submission, manual verification and operational activation.", "turbex-customer":"I need transport or delivery. Ask whether I need passenger transport, a parcel, cargo or business logistics; then ask pickup, destination, timing and relevant item details. Help me understand the next steps, but do not claim that live booking, dispatch, tracking or provider availability is active.", "turbex-operations":"Plan road delivery and logistics operations, starting with a low-capital motorcycle parcel pilot using existing providers. Include dispatch, routing, customer support, incident response and unit economics. Do not claim live GPS or dispatch is active.", "turbex-partners":"Prepare a partnership enquiry for the transport and logistics venture with independent riders, transport operators, fleet companies and logistics businesses."};showWorkspace("jr");const field=$("workspacePrompt");if(field){field.value=prompts[button.dataset.companyAction]||"Help me plan my next step.";field.focus();}}));
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
   const membershipBox=$("founderVentureMembershipQueue");
   if(membershipBox){
    membershipBox.replaceChildren();
    try{
     const applications=await window.jrWorkspaceAction("founder_list_venture_memberships");
     const pending=(applications||[]).filter(x=>x.status==="applied");
     if(!pending.length){const empty=document.createElement("p");empty.className="hub-muted";empty.textContent="No DGBO or FAMILY membership applications are waiting for review.";membershipBox.append(empty);}
     for(const application of pending){
      const card=document.createElement("article");card.className="founder-data-row";
      const name=document.createElement("strong");name.textContent=application.applicant?.full_name||"JR PHEEF member";
      const meta=document.createElement("small");meta.textContent=(application.applicant?.jp_number||"JP number unavailable")+" · "+application.venture_slug.toUpperCase()+" · "+application.role_key.replace(/_/g," ")+" · "+new Date(application.created_at).toLocaleString();
      const email=document.createElement("p");email.textContent=application.applicant?.email||"";
      card.append(name,meta,email);
      const details=application.application_data||{};
      for(const [key,value] of Object.entries(details)){const detail=document.createElement("p");detail.textContent=key.replace(/_/g," ")+": "+String(value);card.append(detail);}
      const consent=document.createElement("small");consent.textContent="Consent version: "+application.consent_version;card.append(consent);
      const notes=document.createElement("textarea");notes.maxLength=1200;notes.placeholder="Optional review note";card.append(notes);
      const actions=document.createElement("div");actions.className="founder-capability-actions";
      for(const status of ["approved","rejected"]){
       const button=document.createElement("button");button.type="button";button.className="hub-small-button";button.textContent=status==="approved"?"Approve membership":"Reject application";
       button.addEventListener("click",async()=>{
        button.disabled=true;
        try{
         await window.jrWorkspaceAction("founder_review_venture_membership",{membershipId:application.id,status,reviewNote:notes.value});
         await loadFounderOverview();
        }catch(error){button.textContent=error.message;button.disabled=false;}
       });
       actions.append(button);
      }
      card.append(actions);membershipBox.append(card);
     }
    }catch(error){const note=document.createElement("p");note.className="hub-muted";note.textContent=error.message||"Membership review is temporarily unavailable.";membershipBox.append(note);}
   }
   const decisionBox=$("founderDecisionList");decisionBox.replaceChildren();
   (data.decisions||[]).forEach(d=>{const card=document.createElement("article");card.className="founder-data-row";const name=document.createElement("strong");name.textContent=d.title;const detail=document.createElement("p");detail.textContent=d.details||"No additional details.";const meta=document.createElement("small");meta.textContent=(d.venture==="dgbo"?"Diamond Global Business Operators":(d.venture||"DGBO"))+" · "+d.status;card.append(name,detail,meta);if(d.status==="proposed"){for(const state of ["approved","rejected"]){const b=document.createElement("button");b.type="button";b.className="hub-small-button";b.textContent=state==="approved"?"Approve decision":"Reject decision";b.addEventListener("click",async()=>{b.disabled=true;try{await api("/api/founder/overview",{action:"decide_decision",id:d.id,status:state});await loadFounderOverview();}catch(err){b.textContent=err.message;b.disabled=false;}});card.append(b);}}decisionBox.append(card);});
   const capabilityBox=$("founderCapabilityList");if(capabilityBox){capabilityBox.replaceChildren();(data.capabilities||[]).forEach(c=>{const card=document.createElement("article");card.className="founder-data-row";const name=document.createElement("strong");name.textContent=c.name;const desc=document.createElement("p");desc.textContent=c.description||"No description yet.";const meta=document.createElement("small");meta.textContent=c.capability_key+" · "+c.category+" · "+c.status.replace(/_/g," ");card.append(name,desc,meta);const actions=document.createElement("div");actions.className="founder-capability-actions";for(const status of ["approved","in_development","available","paused","retired"]){const b=document.createElement("button");b.type="button";b.className="hub-small-button";b.textContent=({approved:"Approve",in_development:"In development",available:"Mark available",paused:"Pause",retired:"Retire"})[status];b.disabled=c.status===status;b.addEventListener("click",async()=>{b.disabled=true;try{await api("/api/founder/overview",{action:"update_capability",id:c.id,status});await loadFounderOverview();}catch(error){b.textContent=error.message;b.disabled=false;}});actions.append(b);}const edit=document.createElement("button");edit.type="button";edit.className="hub-small-button";edit.textContent="Edit details";edit.addEventListener("click",async()=>{const nextName=window.prompt("Capability name",c.name);if(nextName===null)return;const nextDescription=window.prompt("Capability description",c.description||"");if(nextDescription===null)return;try{await api("/api/founder/overview",{action:"update_capability",id:c.id,name:nextName,description:nextDescription});await loadFounderOverview();}catch(error){window.alert(error.message);}});actions.append(edit);card.append(actions);capabilityBox.append(card);});}
   const queue=$("founderOpportunityQueue");if(queue){queue.replaceChildren();const items=data.dossiers||[];if(!items.length){const empty=document.createElement("p");empty.className="hub-muted";empty.textContent="No opportunity dossiers are waiting in the private queue.";queue.append(empty);}items.forEach(d=>{const card=document.createElement("article");card.className="founder-data-row";const title=document.createElement("strong");title.textContent=d.title;const summary=document.createElement("p");summary.textContent=d.summary;const meta=document.createElement("small");meta.textContent=d.sector+" · "+d.source_type.replace(/_/g," ")+" · "+d.source_name+" · "+d.status.replace(/_/g," ");card.append(title,summary,meta);if(d.source_url){const link=document.createElement("a");link.href=d.source_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open source";card.append(link);}if(["ready_for_review","in_review","needs_research"].includes(d.status)){const notes=document.createElement("textarea");notes.placeholder="Review notes";notes.maxLength=4000;const next=document.createElement("input");next.placeholder="Next steps / validation plan";next.maxLength=3000;card.append(notes,next);for(const decision of ["approved","needs_research","rejected"]){const b=document.createElement("button");b.type="button";b.className="hub-small-button";b.textContent=decision==="approved"?"Approve & open venture":decision==="rejected"?"Reject":"Request more research";b.addEventListener("click",async()=>{b.disabled=true;try{const result=await api("/api/founder/overview",{action:"review_opportunity_dossier",id:d.id,decision,notes:notes.value,nextSteps:next.value});await loadFounderOverview();$("founderLoadState").textContent=result.note||"Opportunity review saved.";}catch(error){b.textContent=error.message;b.disabled=false;}});card.append(b);}}queue.append(card);});}
   const projects=$("founderVentureProjects");if(projects){projects.replaceChildren();(data.ventureProjects||[]).forEach(v=>{const card=document.createElement("article");card.className="founder-data-row";const title=document.createElement("strong");title.textContent=v.venture_name;const meta=document.createElement("small");meta.textContent="Stage: "+v.stage.replace(/_/g," ");const select=document.createElement("select");for(const stage of ["validation","business_plan","pilot","partnership","operations","paused","closed"]){const o=document.createElement("option");o.value=stage;o.textContent=stage.replace(/_/g," ");o.selected=stage===v.stage;select.append(o);}const milestone=document.createElement("input");milestone.value=v.next_milestone||"";milestone.placeholder="Next milestone";milestone.maxLength=1000;const save=document.createElement("button");save.type="button";save.className="hub-small-button";save.textContent="Save stage & milestone";save.addEventListener("click",async()=>{save.disabled=true;try{await api("/api/founder/overview",{action:"update_venture_stage",id:v.id,stage:select.value,nextMilestone:milestone.value});await loadFounderOverview();}catch(error){save.textContent=error.message;save.disabled=false;}});card.append(title,meta,select,milestone,save);projects.append(card);});}
   const adBox=$("founderAdCampaignList");if(adBox){adBox.replaceChildren();if(!(data.adCampaigns||[]).length){const empty=document.createElement("p");empty.className="hub-muted";empty.textContent="No advertisements are awaiting review.";adBox.append(empty);}for(const campaign of data.adCampaigns||[]){const card=document.createElement("article");card.className="founder-data-row";const title=document.createElement("strong");title.textContent=campaign.title;const body=document.createElement("p");body.textContent=campaign.body;const meta=document.createElement("small");meta.textContent=(campaign.category||"General")+(campaign.location?" · "+campaign.location:"")+" · KSh "+Number(campaign.budget_ksh||0).toLocaleString()+" proposed · "+(campaign.paid?"Paid":"Not paid");card.append(title,body,meta);for(const status of ["approved","rejected"]){const button=document.createElement("button");button.type="button";button.className="hub-small-button";button.textContent=status==="approved"?"Approve for review":"Reject campaign";button.addEventListener("click",async()=>{button.disabled=true;try{const result=await api("/api/founder/overview",{action:"review_ad_campaign",id:campaign.id,status,reviewNote:status==="rejected"?"Not approved during founder review.":""});await loadFounderOverview();if(result.note)window.alert(result.note);}catch(error){button.textContent=error.message;button.disabled=false;}});card.append(button);}adBox.append(card);}}
   $("founderLoadState").textContent="Founder access verified on the production server.";
  }catch(error){$("founderLoadState").textContent=error.message||"Could not load founder overview.";}
 }
 function setSignedIn(user){
  signedInUser=user||null;
  if(user){try{sessionStorage.removeItem("jr_referral_code");}catch{}}
  const publicInfo=$("publicInfo");if(publicInfo)publicInfo.hidden=!!user;
  const publicLive=$("publicLive");if(publicLive)publicLive.hidden=!!user;
  window.dispatchEvent(new CustomEvent("jr:member-signed-in",{detail:user||null}));
  $("memberGreeting").hidden=!user;$("logoutButton").hidden=!user;$("openLogin").hidden=!!user;$("openSignup").hidden=!!user;
  $("memberGreeting").textContent=user?(user.fullName||user.email||"JR PHEEF member"):"";
  if(user){const ideaForm=$("memberOpportunitySubmission");if(ideaForm)ideaForm.hidden=false;$("accountName").textContent=user.fullName||"JR PHEEF member";$("accountEmail").textContent=user.email||"";const isFounder=user.role==="founder"&&user.jpNumber==="JP-01";$("founderCommand").hidden=!isFounder;$("memberCommand").hidden=false;showWorkspace(requestedWorld);if(isFounder)loadFounderOverview();if(requestedLink&&requestedWorld==="command")requestAnimationFrame(()=>document.querySelector('#jrConnectWorkspace [data-connect-tab="feed"]')?.click());}
  else{const ideaForm=$("memberOpportunitySubmission");if(ideaForm)ideaForm.hidden=true;workspace.hidden=true;if(hero)hero.hidden=false;panel.hidden=true;conversation.hidden=true;}
 }
 function showAuth(next){
  mode=next;panel.hidden=false;conversation.hidden=true;setMessage("");
  const recovery=mode==="recovery",requestRecovery=mode==="requestRecovery",login=mode==="login",signup=mode==="signup";
  $("authTitle").textContent=recovery?"Choose a new password":requestRecovery?"Reset your password":login?"Welcome back":"Create your JR PHEEF identity";
  $("loginTab").hidden=recovery||requestRecovery;$("signupTab").hidden=recovery||requestRecovery;
  $("loginTab").classList.toggle("selected",login);$("signupTab").classList.toggle("selected",signup);
  $("loginTab").setAttribute("aria-pressed",String(login));$("signupTab").setAttribute("aria-pressed",String(signup));
  for(const [id,visible] of [["nameLabel",signup],["fullName",signup],["phoneLabel",signup],["phone",signup],["birthLabel",signup],["birthYear",signup],["confirmEmailLabel",signup],["confirmEmail",signup]])$(id).hidden=!visible;
  $("emailLabel").hidden=recovery;$("email").hidden=recovery;$("email").required=!recovery;$("passwordLabel").hidden=requestRecovery;$("password").hidden=requestRecovery;$("togglePassword").hidden=requestRecovery;$("password").required=!requestRecovery;$("backToLogin").hidden=!(requestRecovery||recovery);
  $("confirmEmail").required=signup;$("resendLoginConfirmation").hidden=true;$("forgotPassword").hidden=!login;
  try{$("referralAttributionNote").hidden=!(signup&&!!sessionStorage.getItem("jr_referral_code"));}catch{$("referralAttributionNote").hidden=true;}
  $("fullName").required=signup;$("phone").required=signup;$("birthYear").required=signup;
  $("password").required=true;$("password").autocomplete=login?"current-password":"new-password";
  $("authSubmit").textContent=recovery?"Save new password":requestRecovery?"Send recovery email":login?"Log in":"Create account";
  $("password").type="password";$("togglePassword").textContent="Show";$("togglePassword").setAttribute("aria-label","Show password");$("togglePassword").setAttribute("aria-pressed","false");
  if(!recovery)$("email").focus({preventScroll:true});else $("password").focus({preventScroll:true});
  panel.scrollIntoView({behavior:"smooth",block:"center"});
 }
 async function api(path,body){
  const response=await fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
  let data={};try{data=await response.json();}catch{}if(!response.ok)throw new Error(data.error||"JR PHEEF could not complete that request.");return data;
 }
 window.jrWorkspaceAction=async(action,payload={})=>{
  const result=await api("/api/workspace",{action,...payload});
  return result.data;
 };
 function showEmailVerification(email){
  let tools=$("emailVerificationTools");
  if(!tools){
   tools=document.createElement("section");tools.id="emailVerificationTools";tools.className="email-verification-tools";
   const heading=document.createElement("h3");heading.textContent="Verify your email";
   const copy=document.createElement("p");copy.textContent="Enter the six-digit code in your confirmation email. If your email contains a confirmation link instead, open that link.";
   const code=document.createElement("input");code.id="emailVerificationCode";code.inputMode="numeric";code.autocomplete="one-time-code";code.maxLength=6;code.pattern="[0-9]{6}";code.placeholder="6-digit email code";code.setAttribute("aria-label","Six-digit email verification code");
   const verify=document.createElement("button");verify.type="button";verify.className="primary wide";verify.id="verifyEmailCode";verify.textContent="Verify email";
   const resend=document.createElement("button");resend.type="button";resend.className="secondary wide";resend.id="resendVerificationEmail";resend.textContent="Resend confirmation email";
   const status=document.createElement("p");status.id="emailVerificationStatus";status.className="form-message";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
   tools.append(heading,copy,code,verify,resend,status);$("authMessage").insertAdjacentElement("afterend",tools);
   verify.addEventListener("click",async()=>{
    verify.disabled=true;status.textContent="Verifying your email…";
    try{const result=await api("/api/auth/verify-email",{email:tools.dataset.email,token:code.value});setSignedIn(result.user);status.textContent=result.message||"Email verified."; $("promptReply").textContent="Your email is verified. Welcome to JR PHEEF.";}
    catch(error){status.textContent=error.message;}
    finally{verify.disabled=false;}
   });
   resend.addEventListener("click",async()=>{
    resend.disabled=true;status.textContent="Requesting a fresh confirmation email…";
    try{const result=await api("/api/auth/resend",{email:tools.dataset.email});status.textContent=result.message;}
    catch(error){status.textContent=error.message;}
    finally{resend.disabled=false;}
   });
  }
  tools.dataset.email=email;tools.hidden=false;$("emailVerificationCode").value="";$("emailVerificationCode").focus({preventScroll:true});
 }
 $("openLogin").addEventListener("click",()=>showAuth("login"));$("openSignup").addEventListener("click",()=>showAuth("signup"));$("openPartnerSignup")?.addEventListener("click",()=>showAuth("signup"));
 $("loginTab").addEventListener("click",()=>showAuth("login"));$("signupTab").addEventListener("click",()=>showAuth("signup"));
 $("togglePassword").addEventListener("click",()=>{const visible=$("password").type==="password";$("password").type=visible?"text":"password";$("togglePassword").textContent=visible?"Hide":"Show";$("togglePassword").setAttribute("aria-label",visible?"Hide password":"Show password");$("togglePassword").setAttribute("aria-pressed",String(visible));});
 $("forgotPassword").addEventListener("click",()=>showAuth("requestRecovery"));
 $("backToLogin").addEventListener("click",()=>showAuth("login"));
 $("resendLoginConfirmation").addEventListener("click",async()=>{const button=$("resendLoginConfirmation");button.disabled=true;setMessage("Requesting a new confirmation email…");try{const result=await api("/api/auth/resend",{email:$("email").value.trim()});setMessage(result.message+" Check spam and promotions too.");}catch(error){setMessage(error.message);}finally{button.disabled=false;}});

 $("closeAuth").addEventListener("click",()=>{panel.hidden=true;});

 const welcomeShare=$("jrWelcomeShare"),welcomeSpeak=$("jrWelcomeSpeak"),welcomeFeedback=$("jrWelcomeFeedback");
 const welcomeText="Hi, I'm JR. Welcome aboard! Wanna experience a little magic? Share JR PHEEF with the person next to you, a friend, or someone across the world. Exchange JP numbers with people you trust, build your circle, discover opportunities, and let's grow together. One connection can open a world of possibilities. Your JP number and phone number stay private unless you choose to share them.";
 welcomeShare?.addEventListener("click",async()=>{
  const inviteUrl=signedInUser?.referralCode&&referralCodePattern.test(signedInUser.referralCode)?window.location.origin+"/?ref="+encodeURIComponent(signedInUser.referralCode):window.location.origin;
  const shareData={title:"JR PHEEF — One world. Every possibility.",text:"I’m inviting you to JR PHEEF. Connect with people you trust, discover opportunities, and grow together. One connection can open a world of possibilities.",url:inviteUrl};
  try{if(navigator.share){await navigator.share(shareData);welcomeFeedback.textContent="Thanks for sharing your JR PHEEF invitation.";}else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(shareData.text+" "+shareData.url);welcomeFeedback.textContent="JR PHEEF's invitation has been copied. You can share it with someone you trust.";}else{welcomeFeedback.textContent="Use your browser's address bar to copy and share the JR PHEEF link.";}}
  catch(error){if(error?.name!=="AbortError")welcomeFeedback.textContent="Sharing is unavailable right now. You can still copy the JR PHEEF address from your browser.";}
 });
 welcomeSpeak?.addEventListener("click",()=>{
  if(!("speechSynthesis" in window)){welcomeFeedback.textContent="Read-aloud is not supported by this browser.";return;}
  if(window.speechSynthesis.speaking){window.speechSynthesis.cancel();welcomeSpeak.textContent="🔊 Read welcome";welcomeSpeak.setAttribute("aria-pressed","false");welcomeFeedback.textContent="Read-aloud stopped.";return;}
  const utterance=new SpeechSynthesisUtterance(welcomeText);utterance.lang="en-KE";utterance.rate=0.96;
  utterance.onend=()=>{welcomeSpeak.textContent="🔊 Read welcome";welcomeSpeak.setAttribute("aria-pressed","false");};
  utterance.onerror=()=>{welcomeSpeak.textContent="🔊 Read welcome";welcomeSpeak.setAttribute("aria-pressed","false");welcomeFeedback.textContent="Read-aloud could not start. Try again.";};
  window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);welcomeSpeak.textContent="■ Stop reading";welcomeSpeak.setAttribute("aria-pressed","true");welcomeFeedback.textContent="JR is reading the welcome message.";
 });

 $("startWithJr").addEventListener("click",()=>showAuth("signup"));
 $("publicJoinNow")?.addEventListener("click",()=>showAuth("signup"));
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;busy=true;$("authSubmit").disabled=true;setMessage("");
  $("authSubmit").textContent=mode==="recovery"?"Updating password…":mode==="login"?"Signing in…":"Creating account…";
  const payload={email:$("email").value.trim(),password:$("password").value};
  if(mode==="signup"){
   if(payload.email.toLowerCase()!==$("confirmEmail").value.trim().toLowerCase()){setMessage("Your email addresses do not match. Please check both fields.");busy=false;$("authSubmit").disabled=false;$("authSubmit").textContent="Create account";$("confirmEmail").focus();return;}
   payload.fullName=$("fullName").value.trim();payload.phone=$("phone").value.trim();payload.birthYear=$("birthYear").value;
   try{const invite=sessionStorage.getItem("jr_referral_code")||"";if(referralCodePattern.test(invite))payload.referralCode=invite.toUpperCase();}catch{}
  }
  try{
   if(mode==="requestRecovery"){
    const email=payload.email;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter the email address registered to your JR PHEEF account.");
    const result=await api("/api/auth/recover",{email});setMessage(result.message||"If an account exists for that address, a recovery email has been sent. Check your inbox and spam folder.");return;
   }
   if(mode==="recovery"){
    if(!recoveryAccessToken)throw new Error("This recovery link is missing or expired. Request a new password-recovery email.");
    await api("/api/auth/password/update",{password:payload.password,access_token:recoveryAccessToken,refresh_token:recoveryRefreshToken});
    $("password").value="";recoveryAccessToken="";recoveryRefreshToken="";
    const session=await api("/api/auth/session");
    if(!session.authenticated)throw new Error("Your password was updated. Please log in with your new password.");
    setSignedIn(session.user);$("promptReply").textContent="Your password has been updated. Welcome back to JR PHEEF.";setMessage("Password updated successfully.");return;
   }
   const result=await api(mode==="login"?"/api/auth/login":"/api/auth/signup",payload);$("password").value="";
   if(result.emailVerificationRequired){setMessage(result.message+" You can enter the six-digit code below or open the confirmation link.");showEmailVerification(payload.email);return;}
   const session=await api("/api/auth/session");
   if(!session.authenticated)throw new Error("Your account is created, but email confirmation is still required. Confirm your email, then log in.");
   setSignedIn(session.user||{email:payload.email,fullName:payload.fullName});$("promptReply").textContent="Welcome to JR PHEEF. Your account is signed in.";
  }catch(error){setMessage(error.message||"Something went wrong. Please try again.");if(mode==="login"&&/verify your email|email not confirmed|email confirmation/i.test(error.message))$("resendLoginConfirmation").hidden=false;}
  finally{busy=false;$("authSubmit").disabled=false;$("authSubmit").textContent=mode==="recovery"?"Save new password":mode==="requestRecovery"?"Send recovery email":mode==="login"?"Log in":"Create account";}
 });
 $("logoutButton").addEventListener("click",async()=>{$("logoutButton").disabled=true;try{await api("/api/auth/logout",{});}catch{}setSignedIn(null);$("logoutButton").disabled=false;$("promptReply").textContent="You have been logged out of JR PHEEF.";});
 $("promptForm").addEventListener("submit",event=>{event.preventDefault();showAuth("signup");});
 const jrConversationHistory=[];
 $("workspacePromptForm")?.addEventListener("submit",async event=>{
  event.preventDefault();
  const input=$("workspacePrompt"),reply=$("workspacePromptReply"),button=event.currentTarget.querySelector('button[type="submit"]');
  const message=input.value.trim();if(!message||button.disabled)return;
  button.disabled=true;input.disabled=true;reply.textContent="JR is thinking…";
  try{
   const result=await api("/api/ai/chat",{message,mode:"universe",history:jrConversationHistory.slice(-8)});
   const answer=String(result.answer||"").trim();if(!answer)throw new Error("JR did not return a response. Please try again.");
   jrConversationHistory.push({role:"user",content:message},{role:"assistant",content:answer});
   if(jrConversationHistory.length>16)jrConversationHistory.splice(0,jrConversationHistory.length-16);
   reply.textContent=answer;input.value="";
  }catch(error){reply.textContent=error.message||"JR is temporarily unavailable. Please try again.";}
  finally{button.disabled=false;input.disabled=false;input.focus();}
 });
 $("memberOpportunityForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const fd=new FormData(form),button=form.querySelector("button[type=submit]"),feedback=$("memberOpportunityFeedback");button.disabled=true;feedback.textContent="Submitting your idea privately to DGBO…";try{const result=await api("/api/workspace",{action:"submit_idea_to_dgbo",title:fd.get("title"),sector:fd.get("sector"),targetMarket:fd.get("targetMarket"),summary:fd.get("summary"),consentToDgbo:fd.get("consentToDgbo")==="on"});form.reset();feedback.textContent=result.data?.message||"Your idea has been submitted for private review.";}catch(error){feedback.textContent=error.message;}finally{button.disabled=false;}});
 $("founderResearchForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const fd=new FormData(form),button=form.querySelector("button[type=submit]");const payload={action:"create_opportunity_dossier",sourceType:"public_research"};for(const [k,v] of fd.entries())payload[k]=v;button.disabled=true;$("founderResearchFeedback").textContent="Saving sourced research to DGBO's private queue…";try{const result=await api("/api/founder/overview",payload);form.reset();$("founderResearchFeedback").textContent=result.note||"Research dossier saved.";await loadFounderOverview();}catch(error){$("founderResearchFeedback").textContent=error.message;}finally{button.disabled=false;}});
 $("founderCapabilityForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,fd=new FormData(form),button=form.querySelector("button[type=submit]");button.disabled=true;$("founderCapabilityFeedback").textContent="Adding capability blueprint…";try{const result=await api("/api/founder/overview",{action:"create_capability",capabilityKey:fd.get("capabilityKey"),name:fd.get("name"),category:fd.get("category"),description:fd.get("description")});form.reset();$("founderCapabilityFeedback").textContent=result.note||"Capability blueprint added for founder review.";await loadFounderOverview();}catch(error){$("founderCapabilityFeedback").textContent=error.message;}finally{button.disabled=false;}});
 $("founderDecisionForm").addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const button=form.querySelector("button[type=submit]");button.disabled=true;$("founderDecisionFeedback").textContent="Saving proposed decision…";try{await api("/api/founder/overview",{action:"create_decision",title:fd.get("title"),venture:fd.get("venture"),details:fd.get("details")});form.reset();$("founderDecisionFeedback").textContent="Decision recorded for founder review.";await loadFounderOverview();}catch(error){$("founderDecisionFeedback").textContent=error.message;}finally{button.disabled=false;}});
 $("partnerInquiryForm")?.addEventListener("submit",async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const button=form.querySelector('button[type="submit"]'),feedback=$("partnerInquiryFeedback"),fd=new FormData(form);
  button.disabled=true;feedback.textContent="Sending your enquiry securely…";
  try{const result=await api("/api/partner-inquiry",{organizationName:fd.get("organizationName"),partnerType:fd.get("partnerType"),details:fd.get("details")});form.reset();feedback.textContent=result.message||"Your partnership enquiry has been received for review.";}
  catch(error){feedback.textContent=error.message||"The enquiry could not be sent. Please try again.";}
  finally{button.disabled=false;}
 });
 document.querySelectorAll(".workspace-tab").forEach(button=>button.addEventListener("click",()=>showWorkspace(button.dataset.view)));
 window.addEventListener("popstate",()=>{const view=worldRoutes[window.location.pathname]||"home";showWorkspace(view,{fromRoute:true});if(window.location.pathname==="/worlds/jr-link")requestAnimationFrame(()=>document.querySelector('#jrConnectWorkspace [data-connect-tab="feed"]')?.click());});
  api("/api/auth/session").then(session=>{if(session.authenticated)setSignedIn(session.user);}).catch(()=>{});
 const fragment=new URLSearchParams(window.location.hash.startsWith("#")?window.location.hash.slice(1):"");
 if(window.location.pathname==="/app"&&["login","signup"].includes(fragment.get("mode")))showAuth(fragment.get("mode"));

 const queryParams=new URLSearchParams(window.location.search);
 const emailTokenHash=queryParams.get("token_hash");
 const emailTokenType=queryParams.get("type");
 let pendingEmailTokenHash="";
 if(emailTokenHash&&["email","signup"].includes(emailTokenType)){
  // Keep the one-time token unconsumed until the member explicitly confirms.
  // Email-security scanners may open this URL, but a passive page load does not verify it.
  window.history.replaceState({},document.title,window.location.pathname);
  showAuth("login");setMessage("Your email link is ready. Tap Confirm email to finish verification.");
  let linkTools=$("emailLinkVerificationTools");
  if(!linkTools){
   linkTools=document.createElement("section");linkTools.id="emailLinkVerificationTools";linkTools.className="email-verification-tools";
   const heading=document.createElement("h3");heading.textContent="Confirm your email";
   const copy=document.createElement("p");copy.textContent="Tap the button below to securely confirm this email address.";
   const verify=document.createElement("button");verify.type="button";verify.id="verifyEmailLink";verify.className="primary wide";verify.textContent="Confirm email";
   const status=document.createElement("p");status.id="emailLinkVerificationStatus";status.className="form-message";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
   linkTools.append(heading,copy,verify,status);
   $("authMessage").insertAdjacentElement("afterend",linkTools);
   verify.addEventListener("click",async()=>{
    verify.disabled=true;status.textContent="Confirming your email…";
    try{
     const result=await api("/api/auth/verify-link",{token_hash:pendingEmailTokenHash});
     if(result.user)setSignedIn(result.user);
     linkTools.hidden=true;
     $("promptReply").textContent="Your email is verified. Welcome to JR PHEEF.";
     status.textContent=result.message||"Your email is verified. Welcome to JR PHEEF.";
    }catch(error){status.textContent=error.message||"This confirmation link is invalid or expired. Request a fresh confirmation email.";}
    finally{verify.disabled=false;}
   });
  }
  pendingEmailTokenHash=emailTokenHash;linkTools.hidden=false;
 }
 const confirmationToken=fragment.get("access_token"),confirmationRefresh=fragment.get("refresh_token"),confirmationType=fragment.get("type");
 const confirmationError=fragment.get("error_description")||fragment.get("error");
 if(confirmationError){window.history.replaceState({},document.title,window.location.pathname+window.location.search);showAuth("login");setMessage("Email confirmation could not be completed: "+confirmationError.replace(/\+/g," ")+". Request a fresh confirmation email.");}
 if(confirmationToken&&confirmationType==="recovery"){
  recoveryAccessToken=confirmationToken;recoveryRefreshToken=confirmationRefresh||"";
  window.history.replaceState({},document.title,window.location.pathname+window.location.search);
  showAuth("recovery");setMessage("Your recovery link is valid. Choose a new password to restore access.");
 }else if(confirmationToken){
  window.history.replaceState({},document.title,window.location.pathname+window.location.search);
  api("/api/auth/session/establish",{access_token:confirmationToken,refresh_token:confirmationRefresh}).then(result=>{
   if(result.user)setSignedIn(result.user);else throw new Error("Email verified. Please log in to continue.");
   $("promptReply").textContent="Your email is verified. Welcome to JR PHEEF.";
  }).catch(error=>{showAuth("login");setMessage(error.message||"Email confirmation failed. Please request a new link.");});
 }
"use strict";
(()=> {
 const $=id=>document.getElementById(id);
 let me=null,selectedMember=null,selectedConversation=null,selectedDealRoom=null,hubLoaded=false;
 const hub= $("liveHub");
 if(!hub)return;
 hub.innerHTML=`
 <div class="hub-intro"><div><p class="eyebrow">YOUR CONNECTED WORKSPACE</p><h2>Make something happen</h2><p class="view-copy">Create, connect, organise and participate. Your account controls what belongs to you.</p></div><button type="button" class="hub-refresh" id="hubRefresh">Refresh</button></div>
 <section class="hub-card hub-card-wide jr-match-panel">
  <h3>Find a match</h3><p class="hub-muted">Tell JR what you need. Matching searches available goods, services, jobs, partnerships and property, then explains why each result may fit.</p>
  <form id="jrMatchForm"><label>What are you looking for?<input id="jrMatchQuery" name="query" required minlength="2" maxlength="240" placeholder="e.g. a reliable electrician, a delivery rider, a business partner…"></label>
   <div class="hub-two"><label>Type<select id="jrMatchType" name="matchType"><option value="all">All suitable matches</option><option value="goods_services">Goods & services</option><option value="jobs">Jobs & skills</option><option value="property">Property & rooms</option><option value="partners">Business partners</option><option value="transport">Transport & delivery</option></select></label>
   <label>Location (optional)<input id="jrMatchLocation" name="location" maxlength="180" placeholder="City, area or remote"></label></div>
   <label>Maximum budget in KSh (optional)<input id="jrMatchMaxPrice" name="maxPrice" type="number" min="0" step="0.01" placeholder="No maximum"></label>
   <button class="hub-submit" type="submit">Find matches</button><p id="jrMatchFeedback" class="hub-feedback" aria-live="polite"></p>
  </form><div id="jrMatchResults" class="hub-list" aria-live="polite"></div>
 </section>
 <div class="hub-grid">
  <section class="hub-card"><h3>Sell or offer something</h3><form data-hub-action="create_listing"><label>Title<input name="title" required minlength="3" maxlength="120" placeholder="What are you offering?"></label><label>Category<input name="category" maxlength="60" placeholder="Goods, service, property…"></label><div class="hub-two"><label>Price<input name="price" type="number" min="0" step="0.01" required></label><label>Location<input name="location" required maxlength="180" placeholder="City or area"></label></div><label>Description<textarea name="description" maxlength="2000" rows="2"></textarea></label><label class="hub-check"><input name="negotiable" type="checkbox"> Price is negotiable</label><button class="hub-submit">Publish listing</button><p class="hub-feedback" aria-live="polite"></p></form></section>
  <section class="hub-card"><h3>Share an opportunity</h3><form data-hub-action="create_opportunity"><label>Opportunity title<input name="title" required minlength="3" maxlength="140" placeholder="Job, partnership, project…"></label><label>Type<select name="opportunityType"><option value="business_opportunity">Business opportunity</option><option value="job">Job</option><option value="service">Service</option><option value="goods">Goods</option><option value="partnership">Partnership</option><option value="property">Property</option></select></label><label>Location<input name="location" maxlength="180" placeholder="Optional / remote"></label><label>Details<textarea name="description" required minlength="10" maxlength="3000" rows="3"></textarea></label><button class="hub-submit">Publish opportunity</button><p class="hub-feedback" aria-live="polite"></p></form></section>
  <section class="hub-card"><h3>Build a business</h3><form data-hub-action="create_business"><label>Business name<input name="businessName" required minlength="2" maxlength="140"></label><label>Sector<input name="sector" maxlength="80" placeholder="Retail, technology, agriculture…"></label><label>Location<input name="location" maxlength="180"></label><label>What do you want to achieve?<textarea name="goals" maxlength="1000" rows="2"></textarea></label><button class="hub-submit">Create business workspace</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myBusinesses" class="hub-list"></div></section>
  <section class="hub-card"><h3>Plan a project</h3><form data-hub-action="create_project"><label>Project name<input name="title" required minlength="3" maxlength="140"></label><label>Goal<textarea name="goal" required minlength="5" maxlength="1500" rows="2"></textarea></label><label>Estimated budget (optional)<input name="budget" type="number" min="0" step="0.01"></label><button class="hub-submit">Save project</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myProjects" class="hub-list"></div></section>
  <section class="hub-card"><h3>FAMILY · Save towards a goal</h3><p class="hub-muted">FAMILY serves the whole ecosystem. This is a planning record only; no money is deposited or moved.</p><form data-hub-action="create_family_goal"><label>Goal<input name="title" required minlength="3" maxlength="140" placeholder="Education, equipment, emergency…"></label><label>Target amount<input name="targetAmount" type="number" min="0.01" step="0.01" required></label><label>Target date (optional)<input name="targetDate" type="date"></label><button class="hub-submit">Save FAMILY goal</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myGoals" class="hub-list"></div></section>
  <section class="hub-card"><h3>Delivery request</h3><form data-hub-action="create_delivery"><label>Pickup<input name="pickup" required maxlength="180"></label><label>Destination<input name="destination" required maxlength="180"></label><label>What needs moving?<textarea name="description" maxlength="1000" rows="2"></textarea></label><button class="hub-submit">Record delivery request</button><p class="hub-feedback" aria-live="polite"></p></form><p class="hub-muted">Request recording is active. Rider assignment, live tracking and fare estimates are not connected.</p></section>
  <section class="hub-card"><h3>Rooms Near Me</h3><form data-hub-action="create_room_listing"><label>Room / property title<input name="title" required minlength="3" maxlength="120" placeholder="Bright bedsitter near…"></label><label>Room type<select name="roomType"><option value="bedsitter">Bedsitter</option><option value="studio">Studio</option><option value="one_bedroom">1 bedroom</option><option value="two_bedroom">2 bedrooms</option><option value="three_bedroom">3 bedrooms</option><option value="four_bedroom">4 bedrooms</option><option value="shared">Shared</option><option value="single_room">Single room</option><option value="other">Other</option></select></label><div class="hub-two"><label>Monthly rent<input name="rent" type="number" min="0" step="0.01" required></label><label>Location<input name="location" maxlength="180" required></label></div><label>Available from (optional)<input name="availableFrom" type="date"></label><label>Description<textarea name="description" maxlength="2000" rows="2"></textarea></label><div class="room-media-studio"><p class="status-media-label">Property photos &amp; walkthrough</p><div class="status-media-actions"><label class="hub-small-button media-picker">Choose from gallery<input id="roomGallery" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><label class="hub-small-button media-picker">Take photo<input id="roomCamera" type="file" accept="image/*" capture="environment"></label><label class="hub-small-button media-picker">Optional video<input id="roomVideo" type="file" accept="video/mp4,video/webm,video/quicktime"></label></div><p class="hub-muted">Add up to 8 photos and one optional video. Maximum 8 MB per file. Choose a cover photo before publishing.</p><div id="roomMediaPreview" class="room-media-preview" aria-live="polite"></div><p id="roomMediaFeedback" class="hub-feedback" aria-live="polite"></p></div><button class="hub-submit" type="submit">Preview &amp; publish room</button><p class="hub-feedback" aria-live="polite"></p></form><p class="hub-muted">Listing is free in this staging build. Any future provider subscription must be clearly disclosed before activation.</p></section>
  <section class="hub-card"><h3>Share a status</h3><form data-hub-action="create_status"><label>Your update<textarea name="body" required maxlength="500" rows="3"></textarea></label><div class="status-media-tools"><span class="status-media-label">Add photos or videos</span><div class="status-media-actions"><label class="hub-small-button media-picker">Choose from gallery<input type="file" accept="image/*,video/*" multiple data-status-media="gallery"></label><label class="hub-small-button media-picker">Open camera<input type="file" accept="image/*,video/*" capture="environment" data-status-media="camera"></label></div><div id="statusMediaPreview" class="status-media-preview" aria-live="polite"></div><p class="hub-muted">Preview your selected media before sharing. JR stores it privately and does not analyse or describe the picture.</p></div><label>Who can see it?<select name="visibility"><option value="connections">Connections</option><option value="public">Public</option><option value="private">Only me</option></select></label><button class="hub-submit">Post text status</button><p class="hub-feedback" aria-live="polite"></p></form><div id="myStatuses" class="hub-list"></div></section>
  <section class="hub-card"><h3>Profile & privacy</h3><form data-hub-action="update_profile"><label>About me<textarea name="bio" maxlength="500" rows="2"></textarea></label><div class="hub-two"><label>City<input name="city" maxlength="120"></label><label>Country<input name="country" maxlength="120"></label></div><label>Profile visibility<select name="profile_visibility"><option value="public">Public</option><option value="connections">Connections</option><option value="private">Private</option></select></label><p class="hub-muted">Your phone number is private and is never shown to other members.</p><label class="hub-check"><input name="show_email" type="checkbox"> Show email publicly (off by default)</label><label class="hub-check"><input name="show_location" type="checkbox"> Show location</label><button class="hub-submit">Save profile settings</button><p class="hub-feedback" aria-live="polite"></p></form></section>
  <section class="hub-card hub-card-wide"><h3>People & conversations</h3><form id="memberSearchForm"><label>Find a member by name<input id="memberSearchQuery" minlength="2" maxlength="80" required placeholder="Member name"></label><button class="hub-submit">Search members</button></form><div id="memberSearchResults" class="hub-list"></div><div class="hub-chat-layout"><div><h4>Your conversations</h4><div id="conversationList" class="hub-list"></div></div><div><h4>Messages</h4><div id="messageList" class="hub-message-list">Choose a conversation to view messages.</div><form id="messageSendForm"><label>Message<textarea id="messageBody" maxlength="4000" rows="2" required></textarea></label><button class="hub-submit">Send message</button><p id="messageFeedback" class="hub-feedback"></p></form></div></div></section>
  <section class="hub-card hub-card-wide"><h3>Explore opportunities</h3><div id="opportunityFeed" class="hub-list"></div></section><section class="hub-card hub-card-wide"><h3>Deal Rooms</h3><p class="hub-muted">Discuss terms privately with the other party. Confirming terms does not transfer money or complete a payment.</p><div id="dealRoomList" class="hub-list"></div><div id="dealRoomMessages" class="hub-message-list">Open a Deal Room to view its messages.</div><form id="dealRoomMessageForm"><label>Deal Room message<textarea id="dealRoomMessageBody" maxlength="2000" rows="2" required></textarea></label><button class="hub-submit">Send Deal Room message</button><p id="dealRoomFeedback" class="hub-feedback"></p></form><button id="confirmDealTerms" type="button" class="hub-small-button" disabled>Confirm current terms</button></section><section class="hub-card hub-card-wide"><h3>Browse goods & services</h3><div id="marketFeed" class="hub-list"></div></section><section class="hub-card hub-card-wide"><h3>Rooms Near Me · available listings</h3><div id="roomFeed" class="hub-list"></div></section><section class="hub-card hub-card-wide"><h3>Your delivery requests</h3><div id="myDeliveries" class="hub-list"></div></section>
  <section class="hub-card hub-card-wide"><h3>Your listings</h3><div id="myListings" class="hub-list"></div></section>
  <section class="hub-card hub-card-wide"><h3>Notifications</h3><div id="myNotifications" class="hub-list"></div></section>
 </div>`;
 const roomForm=document.querySelector('[data-hub-action="create_room_listing"]');
 if(roomForm){
  const gallery=roomForm.querySelector("#roomGallery"),camera=roomForm.querySelector("#roomCamera"),video=roomForm.querySelector("#roomVideo"),preview=roomForm.querySelector("#roomMediaPreview"),mediaFeedback=roomForm.querySelector("#roomMediaFeedback");
  let roomFiles=[],coverFile=null,roomPreviewUrls=[];
  const drawRoomMedia=()=>{
   roomPreviewUrls.forEach(url=>URL.revokeObjectURL(url));roomPreviewUrls=[];preview.replaceChildren();
   roomFiles.forEach(file=>{
    const tile=document.createElement("article");tile.className="room-media-tile";
    const url=URL.createObjectURL(file);roomPreviewUrls.push(url);
    const el=file.type.startsWith("video/")?document.createElement("video"):document.createElement("img");el.src=url;el.alt=file.type.startsWith("video/")?"Property walkthrough preview":"Property photo preview";if(el.tagName==="VIDEO"){el.controls=true;el.muted=true;}
    const controls=document.createElement("div");controls.className="room-media-tile-actions";
    if(!file.type.startsWith("video/")){const cover=document.createElement("button");cover.type="button";cover.textContent=file===coverFile?"Cover photo ✓":"Set as cover";cover.setAttribute("aria-pressed",String(file===coverFile));cover.addEventListener("click",()=>{coverFile=file;drawRoomMedia();});controls.append(cover);}
    const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";remove.addEventListener("click",()=>{roomFiles=roomFiles.filter(item=>item!==file);if(file===coverFile)coverFile=roomFiles.find(item=>item.type.startsWith("image/"))||null;drawRoomMedia();});controls.append(remove);
    tile.append(el,controls);preview.append(tile);
   });
  };
  const addRoomFiles=input=>{
   const chosen=[...(input.files||[])];input.value="";
   for(const file of chosen){
    const isImage=["image/jpeg","image/png","image/webp"].includes(file.type),isVideo=["video/mp4","video/webm","video/quicktime"].includes(file.type);
    if(!isImage&&!isVideo){mediaFeedback.textContent="Use JPG, PNG, WEBP photos or MP4, WEBM, MOV video.";continue;}
    if(file.size>8*1024*1024){mediaFeedback.textContent=file.name+" exceeds the 8 MB limit.";continue;}
    if(isVideo&&roomFiles.some(f=>f.type.startsWith("video/"))){mediaFeedback.textContent="Only one walkthrough video can be added.";continue;}
    if(roomFiles.length>=9){mediaFeedback.textContent="You can add up to 8 photos and one video.";break;}
    if(isImage&&roomFiles.filter(f=>f.type.startsWith("image/")).length>=8){mediaFeedback.textContent="You can add up to 8 photos.";break;}
    roomFiles.push(file);if(isImage&&!coverFile)coverFile=file;
   }
   drawRoomMedia();
  };
  gallery?.addEventListener("change",()=>addRoomFiles(gallery));camera?.addEventListener("change",()=>addRoomFiles(camera));video?.addEventListener("change",()=>addRoomFiles(video));
  roomForm.addEventListener("room-media-reset",()=>{roomFiles=[];coverFile=null;mediaFeedback.textContent="";drawRoomMedia();});
  roomForm._getRoomMedia=()=>({files:[...roomFiles],coverFile});
 }
 const call=async(action,extra={})=>{const r=await fetch("/api/workspace",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"That action could not be completed.");return d.data;};
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const render=(id,items,make)=>{const box=$(id);box.replaceChildren();if(!items?.length){box.append(node("p","hub-muted","Nothing here yet."));return;}items.forEach(item=>box.append(make(item)));};
 const item=(title,detail,meta)=>{const e=node("article","hub-list-item");e.append(node("strong","",title||"Untitled"),node("p","",detail||""),node("small","",meta||""));return e;};
 async function refresh(){
  try{
   const d=await call("overview");me=d.member;hubLoaded=true;
   const pf=document.querySelector('[data-hub-action="update_profile"]');
   for(const k of ["bio","city","country","profile_visibility"])if(pf.elements[k])pf.elements[k].value=me[k]||({profile_visibility:"public"}[k]||"");
   for(const k of ["public_phone","show_email","show_location"])pf.elements[k].checked=!!me[k];
   render("myListings",d.listings,x=>item(x.title,x.description,"KSh "+(x.price??"—")+" · "+(x.location||"No location")+" · "+x.status));
   render("marketFeed",d.marketListings,x=>{const e=item(x.title,x.description,"KSh "+(x.price??"—")+" · "+(x.location||"No location")+" · "+(x.category||"Listing"));if(x.member_id!==me.id){const b=node("button","hub-small-button","Open CHAT / Deal Room");b.type="button";b.addEventListener("click",async()=>{try{const room=await call("create_deal_room",{listingId:x.id});await refresh();await openDealRoom(room.id);}catch(err){b.textContent=err.message;}});e.append(b);}return e;});
   render("myDeliveries",d.deliveries,x=>item((x.pickup||"Pickup")+" → "+(x.destination||"Destination"),x.description,"Delivery request · "+x.status));
   render("roomFeed",d.marketRooms,x=>{const card=item(x.title,x.description,(x.room_type||"Room")+" · KSh "+x.rent_ksh+"/month · "+x.location);(x.media||[]).sort((a,b)=>Number(!!b.isCover)-Number(!!a.isCover)).forEach(m=>{if(!m.url)return;const el=node(m.kind==="video"?"video":"img","room-feed-media");el.src=m.url;if(el.tagName==="VIDEO"){el.controls=true;el.muted=true;}else el.alt=x.title+" property photo";card.append(el);});return card;});
   render("dealRoomList",d.dealRooms,x=>{const b=node("button","hub-conversation-button",(x.buyer_id===me.id?"Buyer":"Seller")+" · "+x.status+" · "+(x.buyer_agreed?"Buyer agreed":"Buyer pending")+" / "+(x.seller_agreed?"Seller agreed":"Seller pending"));b.type="button";b.addEventListener("click",()=>openDealRoom(x.id));return b;});
   render("opportunityFeed",d.opportunities,x=>{const e=item(x.title,x.description,(x.opportunity_type||"Opportunity")+" · "+(x.location||"Remote / unspecified")+" · "+x.verification_status);if(x.owner_user_id!==me.id){const b=node("button","hub-small-button","I'm interested");b.type="button";b.addEventListener("click",async()=>{try{await call("express_interest",{opportunityId:x.id,message:"I would like to learn more."});b.textContent="Interest sent";b.disabled=true;}catch(err){b.textContent=err.message;}});e.append(b);}return e;});
   render("myProjects",d.projects,x=>item(x.title,x.goal,"Project · "+x.status));
   render("myGoals",d.familyGoals,x=>item(x.title,"Target: "+x.target_amount+" · Saved: "+x.saved_amount,"FAMILY goal · "+x.status));
   render("myBusinesses",d.businesses,x=>item(x.business_name,x.sector+" · "+(x.location||"Location not set"),x.status+" · "+x.plan_tier));
   render("myStatuses",d.statuses,x=>item(x.body,"Visibility: "+x.visibility,new Date(x.created_at).toLocaleString()));
   render("myNotifications",d.notifications,x=>item(x.title,x.message,new Date(x.created_at).toLocaleString()));
   await loadConversations();
  }catch(err){hub.prepend(node("p","hub-error",err.message));}
 }
 async function openDealRoom(id){
  selectedDealRoom=id;
  try{const messages=await call("deal_room_messages",{roomId:id});render("dealRoomMessages",messages,m=>item(m.sender_id===me.id?"You":"Other party",m.body,new Date(m.created_at).toLocaleString()));$("confirmDealTerms").disabled=false;}
  catch(e){$("dealRoomMessages").textContent=e.message;$("confirmDealTerms").disabled=true;}
 }
 async function loadConversations(){
  try{const list=await call("list_conversations");render("conversationList",list,c=>{const peer=c.peers?.[0];const b=node("button","hub-conversation-button",(peer?.full_name||"Conversation"));b.type="button";b.addEventListener("click",()=>openConversation(c.id));return b;});}
  catch(e){$("conversationList").textContent=e.message;}
 }
 async function openConversation(id){
  selectedConversation=id;
  try{const messages=await call("list_messages",{conversationId:id});render("messageList",messages,m=>item(m.sender_id===me.id?"You":"Member",m.body,new Date(m.created_at).toLocaleString()));}
  catch(e){$("messageList").textContent=e.message;}
 }
 document.addEventListener("submit",async event=>{
  const form=event.target.closest("form[data-hub-action]");if(!form)return;
  event.preventDefault();const action=form.dataset.hubAction,fd=new FormData(form),payload={};
  for(const [k,v] of fd.entries())payload[k]=v;
  if(action==="create_status"&&form.querySelector('[data-status-media]')?.files?.length){const feedback=form.querySelector(".hub-feedback");if(feedback)feedback.textContent="Your media preview is ready, but secure photo/video publishing is not enabled yet. Remove the attachment to publish a text-only status.";return;}
  if(action==="create_listing"){payload.price=Number(payload.price);payload.negotiable=fd.has("negotiable");}
  if(action==="create_project"&&payload.budget!=="")payload.budget=Number(payload.budget);
  if(action==="create_family_goal")payload.targetAmount=Number(payload.targetAmount);
  if(action==="create_room_listing"){
   payload.rent=Number(payload.rent);
   const chosen=form._getRoomMedia?.()||{files:[],coverFile:null};
   if(chosen.files.some(file=>file.type.startsWith("image/"))&&!chosen.coverFile){const feedback=form.querySelector("#roomMediaFeedback");if(feedback)feedback.textContent="Choose a cover photo before publishing.";return;}
   payload.media=[];
   const toBase64=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(new Error("Could not read "+file.name));reader.readAsDataURL(file);});
   try{for(let index=0;index<chosen.files.length;index++){
    const file=chosen.files[index],mediaStatus=form.querySelector("#roomMediaFeedback");
    if(mediaStatus)mediaStatus.textContent="Uploading media "+(index+1)+" of "+chosen.files.length+"…";
    const uploaded=await call("upload_media",{purpose:"listing",fileName:file.name,contentType:file.type,fileBase64:await toBase64(file)});
    payload.media.push({...uploaded,isCover:file===chosen.coverFile});
   }}catch(error){const feedback=form.querySelector("#roomMediaFeedback");if(feedback)feedback.textContent=error.message+" You can retry publishing.";return;}
  }
  if(action==="update_profile"){payload.public_phone=fd.has("public_phone");payload.show_email=fd.has("show_email");payload.show_location=fd.has("show_location");}
  const feedback=form.querySelector(".hub-feedback");const button=form.querySelector("button[type=submit],button:not([type])");
  if(button){button.disabled=true;}
  try{const result=await call(action,payload);if(feedback)feedback.textContent=result?.note||"Saved successfully.";form.reset();form.dispatchEvent(new Event("room-media-reset"));await refresh();}
  catch(err){if(feedback)feedback.textContent=err.message;}
  finally{if(button)button.disabled=false;}
 });
 $("jrMatchForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const feedback=$("jrMatchFeedback"),box=$("jrMatchResults"),button=e.currentTarget.querySelector('button[type="submit"]');
  feedback.textContent="Searching for suitable matches…";box.replaceChildren();button.disabled=true;
  const maxValue=$("jrMatchMaxPrice").value;
  try{
   const matches=await call("find_matches",{query:$("jrMatchQuery").value,matchType:$("jrMatchType").value,location:$("jrMatchLocation").value,maxPrice:maxValue===""?null:Number(maxValue)});
   render("jrMatchResults",matches,match=>{
    const card=item(match.title,match.description,(match.kind==="property"?"Property":match.kind==="opportunity"?"Opportunity":"Listing")+" · "+(match.location||"Location not specified")+" · "+(match.price===null||match.price===undefined?"Price on request": "KSh "+match.price+(match.kind==="property"?"/month":""))+" · "+match.matchScore+"% relevance");
    card.append(node("small","hub-muted","Why this matched: "+(match.matchReasons||[]).join(" · ")));
    const action=node("button","hub-small-button",match.kind==="listing"?"Open CHAT / Deal Room":match.kind==="opportunity"?"I'm interested":"Start property chat");
    action.type="button";
    action.addEventListener("click",async()=>{
     action.disabled=true;
     try{
      if(match.kind==="listing"){const room=await call("create_deal_room",{listingId:match.id});await refresh();await openDealRoom(room.id);action.textContent="Deal Room opened";}
      else if(match.kind==="opportunity"){await call("express_interest",{opportunityId:match.id,message:"I found this through JR matching and would like to learn more."});action.textContent="Interest sent";}
      else{const conversation=await call("create_conversation",{otherMemberId:match.ownerId,title:"Property enquiry"});await loadConversations();await openConversation(conversation.id);action.textContent="Chat opened";}
     }catch(error){action.textContent=error.message;action.disabled=false;}
    });
    card.append(action);return card;
   });
   feedback.textContent=matches.length?matches.length+" relevant match"+(matches.length===1?"":"es")+" found. Review the reasons before connecting.":"No suitable matches found yet. Try a broader description or another location.";
  }catch(error){feedback.textContent=error.message||"Matching is temporarily unavailable.";}
  finally{button.disabled=false;}
 });
 $("hubRefresh").addEventListener("click",refresh);
 $("memberSearchForm").addEventListener("submit",async e=>{e.preventDefault();const box=$("memberSearchResults");box.textContent="Searching…";try{const results=await call("search_members",{query:$("memberSearchQuery").value});render("memberSearchResults",results,m=>{const e=item(m.full_name,m.bio,m.city||"JR PHEEF member");const b=node("button","hub-small-button",m.connection_status==="accepted"?"Start chat":m.connection_status==="pending"?"Request pending":"Connect");b.type="button";b.disabled=m.connection_status==="pending"&&m.connection_direction==="outgoing";b.addEventListener("click",async()=>{try{if(m.connection_status==="accepted"){const c=await call("create_conversation",{otherMemberId:m.id,title:"Chat"});await loadConversations();await openConversation(c.id);b.textContent="Conversation opened";}else if(m.connection_status==="pending"&&m.connection_direction==="incoming"){await call("update_connection",{connectionId:m.connection_id,status:"accepted"});b.textContent="Connected";}else{await call("request_connection_by_member_id",{memberId:m.id});b.textContent="Request sent";b.disabled=true;}}catch(err){b.textContent=err.message;}});e.append(b);return e;});}catch(err){box.textContent=err.message;}});
 $("dealRoomMessageForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedDealRoom){$("dealRoomFeedback").textContent="Open a Deal Room first.";return;}try{await call("send_deal_message",{roomId:selectedDealRoom,body:$("dealRoomMessageBody").value});$("dealRoomMessageBody").value="";$("dealRoomFeedback").textContent="Message sent.";await openDealRoom(selectedDealRoom);}catch(err){$("dealRoomFeedback").textContent=err.message;}});
 $("confirmDealTerms").addEventListener("click",async()=>{if(!selectedDealRoom)return;try{await call("confirm_deal_terms",{roomId:selectedDealRoom});$("dealRoomFeedback").textContent="Your agreement has been recorded. This does not make a payment.";await refresh();await openDealRoom(selectedDealRoom);}catch(err){$("dealRoomFeedback").textContent=err.message;}});
 $("messageSendForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedConversation){$("messageFeedback").textContent="Choose a conversation first.";return;}try{await call("send_message",{conversationId:selectedConversation,body:$("messageBody").value});$("messageBody").value="";$("messageFeedback").textContent="Message sent.";await openConversation(selectedConversation);}catch(err){$("messageFeedback").textContent=err.message;}});
 window.addEventListener("jr:member-signed-in",event=>{me=event.detail||null;refresh();});
 const existing=$("accountName");if(existing&&!$("workspace").hidden){me={id:null};refresh();}
})();

})();