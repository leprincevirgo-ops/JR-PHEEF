"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("JR PHEEF entry puts JR at the centre",()=>{
 const h=read("public/index.html");
 assert.match(h,/JR PHEEF/);assert.match(h,/Meet JR/);
 assert.match(h,/What would you like to do\?/);
});
test("signup collects required identity details",()=>{
 const h=read("public/index.html");
 for(const id of ["fullName","phone","birthYear","email","confirmEmail","password","togglePassword","resendLoginConfirmation"])assert.match(h,new RegExp('id="'+id+'"'));
});
test("login and signup controls call real same-origin auth endpoints",()=>{
 const j=read("public/app.js");
 assert.match(j,/\/api\/auth\/login/);assert.match(j,/\/api\/auth\/signup/);assert.match(j,/Your email addresses do not match/);assert.match(j,/togglePassword/);assert.match(j,/resendLoginConfirmation/);
 assert.match(j,/emailVerificationCode/);assert.match(j,/resendVerificationEmail/);
 assert.match(j,/\/api\/auth\/session/);assert.match(j,/\/api\/auth\/logout/);assert.match(j,/\/api\/auth\/session\/establish/);assert.match(j,/access_token/);
 assert.match(j,/credentials:"same-origin"/);
});
test("server validates signup, creates HttpOnly secure cookies and refreshes sessions",()=>{
 const s=read("server.js");
 for(const fragment of ["/api/auth/signup","/api/auth/resend","/api/auth/verify-email","/api/auth/login","/api/auth/session","/api/auth/logout","HttpOnly","Secure","SameSite=Lax","grant_type=refresh_token","birth_year","redirect_to","/api/auth/session/establish"])assert.ok(s.includes(fragment),"missing "+fragment);
});
test("server never places privileged service key in the browser",()=>{
 const s=read("server.js"),j=read("public/app.js"),h=read("public/index.html");
 assert.match(s,/SUPABASE_PUBLISHABLE_KEY/);
 assert.doesNotMatch(j,/service_role|SUPABASE_SECRET_KEY/);
 assert.doesNotMatch(h,/service_role|SUPABASE_SECRET_KEY/);
});
test("server exposes health endpoint and binds to Render interface",()=>{
 const s=read("server.js");assert.match(s,/healthz/);assert.match(s,/0\.0\.0\.0/);
});

test("member provisioning uses the auth_user_id relation and verifies email",()=>{
 const fn=fs.readFileSync(path.join(root,"..","supabase","functions","jr-member-provision","index.ts"),"utf8");
 assert.match(fn,/auth_user_id:\s*user\.id/);
 assert.match(fn,/on_conflict=auth_user_id/);
 assert.match(fn,/if\s*\(!user\.email_confirmed_at\)/);
 assert.match(fn,/birthYear\s*>\s*currentYear\s*-\s*18/);
});
test("login, signup and email handoff require a confirmed email",()=>{
 const s=read("server.js");
 assert.match(s,/result\.data\.user\?\.email_confirmed_at/);
 assert.match(s,/user\.email_confirmed_at/);
 assert.match(s,/provisionMember\(req\.jrAccessToken\)/);
});

test("authenticated users receive a real workspace with working navigation views",()=>{
 const h=read("public/index.html"),j=read("public/app.js");
 for(const id of ["workspace","view-home","view-worlds","view-jr","view-command"])assert.match(h,new RegExp('id="'+id+'"'));
 for(const view of ["home","worlds","jr","command"])assert.match(h,new RegExp('data-view="'+view+'"'));
 assert.match(j,/function showWorkspace/);assert.match(j,/if\(session\.authenticated\)setSignedIn\(session\.user\)/);assert.match(j,/workspace-tab/);assert.match(j,/showWorkspace\("home"\)/);
 assert.match(h,/Sign in to talk with JR and explore what you can do/);
 const intelligence=read("public/intelligence.js");
 assert.match(intelligence,/fetch\("\/healthz"/);
 assert.match(intelligence,/aiConfigured/);
 assert.match(intelligence,/jrRuntimeStatus/);
 assert.match(intelligence,/id="jrConversationMode" type="hidden"/);
 assert.doesNotMatch(intelligence,/Conversation focus <select/);
 assert.match(intelligence,/function inferMatchRequest/);assert.match(intelligence,/workspaceRequest\("find_matches"/);assert.match(intelligence,/function addMatchCards/);assert.match(intelligence,/liveAiConfigured/);
});

test("JR PHEEF uses an animated living wallpaper with reduced-motion support",()=>{
 const css=read("public/styles.css"),h=read("public/index.html");
 assert.match(css,/jrAuroraDrift/);assert.match(css,/jrStarDrift/);assert.match(css,/prefers-reduced-motion/);
 assert.match(h,/jr-dgbo-diamond-brand-20261112-v1/);
});

test("worlds switch the living environment according to world type",()=>{
 const w=read("public/worlds.js"),a=read("public/app.js"),c=read("public/styles.css");
 assert.match(w,/dataset\.jrEnvironment=w\.world_type/);assert.match(w,/dataset\.jrWorld=w\.world_type/);
 assert.match(a,/dataset\.jrWorld=view/);
 for(const world of ["business","education","creative","community","family_personal","family_finance","personal","commerce"])assert.match(c,new RegExp("data-jr-world=."+world));
});

test("members can open multiple live workspace panels",()=>{
 const a=read("public/app.js"),c=read("public/styles.css");
 for(const key of ["jrWorkspaceWindowGrid","jrWorkspaceWindowToolbar","jrAddWindow","jrWindowColumns","jrWindowReset","openWindows","multiWindowMode"])assert.match(a,new RegExp(key));
 assert.match(c,/jr-workspace-window-grid\.is-multiple/);
 assert.match(c,/jr-workspace-window-head/);
});
test("members can edit their own worlds and save activities",()=>{
 const w=read("public/worlds.js");
 assert.match(w,/Shape this world/);
 assert.match(w,/update_world/);
 assert.match(w,/intendedMembers/);
 assert.match(w,/workflows/);
});
test("JR conversations persist across sessions and members control memory consent",()=>{
 const i=read("public/intelligence.js"),s=read("server.js");
 for(const action of ["list_ai_conversations","create_ai_conversation","list_ai_messages","save_ai_message","list_jr_memories","create_jr_memory","update_jr_memory","delete_jr_memory"])assert.match(i,new RegExp(action));
 assert.match(i,/consentAiContext/);
 assert.match(i,/jrSavedConversation/);
 assert.match(s,/list_ai_memories/);
 assert.match(s,/Member-approved continuity context/);
});

test("JR AI continuity schema is private and member-scoped",()=>{
 const sql=fs.readFileSync(path.join(root,"..","supabase","migrations","20261111213401_jr_ai_conversation_continuity.sql"),"utf8");
 assert.match(sql,/jr_ai_conversations/);assert.match(sql,/jr_ai_messages/);
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/revoke all.*anon, authenticated/i);
});
test("workspace API persists JR conversations and enforces member ownership",()=>{
 const api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8");
 for(const action of ["list_ai_conversations","create_ai_conversation","list_ai_messages","save_ai_message","list_ai_memories","list_jr_memories","create_jr_memory","update_jr_memory","delete_jr_memory"])assert.match(api,new RegExp(action));
 assert.match(api,/member_id=eq\.\"\+mid/);
 assert.match(api,/consent_ai_context=eq\.true/);
 assert.match(api,/owner_member_id=eq\.\"\+mid/);
});

test("Founder Build Studio manages a private capability lifecycle registry",()=>{
 const h=read("public/index.html"),a=read("public/app.js");
 const api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-founder-overview","index.ts"),"utf8");
 const sql=fs.readFileSync(path.join(root,"..","supabase","migrations","20261111214242_dgbo_founder_capability_registry.sql"),"utf8");
 assert.match(h,/founderCapabilityForm/);assert.match(h,/Build & Evolution Studio/);
 assert.match(a,/create_capability/);assert.match(a,/update_capability/);
 assert.match(api,/member\.role!=="founder"/);assert.match(api,/dgbo_capabilities/);
 assert.match(sql,/enable row level security/i);assert.match(sql,/revoke all.*anon, authenticated/i);
});


test("persistent page navigation provides back, top and bottom controls",()=>{
 const h=read("public/index.html"),n=read("public/navigation.js"),c=read("public/styles.css");
 assert.match(h,/navigation\.js/);
 for(const key of ["jrPageBack","jrPageForward","jrPageTop","jrPageBottom"])assert.match(n,new RegExp(key));
 assert.match(n,/trail/);assert.match(n,/index/);assert.match(n,/jrConnectWorkspace/);assert.match(n,/panel:/);assert.doesNotMatch(n,/history\.back/);assert.match(n,/scrollTo/);
 assert.match(c,/\.jr-page-navigation/);
});

test("global voice dock provides speaker, microphone and shared stop controls",()=>{
 const h=read("public/index.html"),v=read("public/voice.js"),c=read("public/styles.css"),l=read("public/command-layout.js");
 assert.match(h,/voice\.js/);for(const id of ["jrGlobalSpeak","jrGlobalMic","jrGlobalStop"])assert.match(v,new RegExp(id));
 assert.match(v,/SpeechSynthesisUtterance/);assert.match(v,/SpeechRecognition/);assert.match(v,/\.abort\(\)/);
 assert.match(v,/aria-live="polite"/);assert.match(c,/\.jr-global-voice/);assert.match(l,/Shared voice interaction is initialized/);
});

test("member social features are consolidated into the JR LINK workspace",()=>{
 const c=read("public/command-layout.js"),h=read("public/index.html"),css=read("public/styles.css");
 assert.match(c,/jrConnectWorkspace/);
 assert.match(c,/<h3>JR LINK<\/h3>/);assert.match(c,/aria-label="JR LINK workspace"/);assert.match(h,/jr-link-workspace-20261113-v1/);
 for(const tab of ["feed","status","chats","channels","ads","profile"])assert.match(c,new RegExp('data-connect-tab="'+tab+'"'));
 for(const id of ["memberStatusPanel","memberUpdatesPanel","memberChatsPanel","memberContactsPanel","memberProfilePanel","memberAccessibilityPanel"])assert.match(c,new RegExp(id));
 assert.match(c,/move\(channels,connectPanel\("channels"\)\)/);
 assert.match(css,/\.jr-connect-workspace/);assert.match(css,/\.jr-connect-tabs/);
 assert.match(h,/Your profile\. Your people\. Your conversations\./);
});
test("JR social feed and following respect member visibility",()=>{
 const api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8");
 assert.match(api,/list_social_feed/);assert.match(api,/visibility=eq\.everyone/);
 assert.match(api,/visibility=eq\.connections/);assert.match(api,/social_follows/);
 assert.match(api,/follow_member/);assert.match(api,/unfollow_member/);
 assert.match(api,/profile_visibility===\"private\"/);
});
test("advertising campaigns are private until approved and payment is verified",()=>{
 const api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8"),c=read("public/command-layout.js");
 assert.match(api,/create_ad_campaign/);assert.match(api,/status:\"pending\",paid:false/);
 assert.match(api,/status=eq\.approved&paid=eq\.true/);
 assert.match(api,/pause_ad_campaign/);
 assert.match(c,/jrAdCampaignForm/);assert.match(c,/jrAdGallery/);assert.match(c,/jrAdCamera/);
 assert.match(c,/Submit campaign for review/);
});
test("members can use gallery and camera for profile, status, channels and adverts",()=>{
 const c=read("public/command-layout.js"),a=read("public/app.js");
 assert.match(c,/profilePhotoCamera/);assert.match(c,/status-media.*camera/s);
 assert.match(c,/capture=\"environment\"/);assert.match(c,/attachChannelMedia/);
 assert.match(c,/uploadFile\(file,\"channel\"\)/);assert.match(c,/uploadFile\(file,\"ad\"\)/);
 assert.match(a,/data-status-media=\"gallery\"/);assert.match(a,/data-status-media=\"camera\"/);
});
test("JR voice input supports selectable language and a shared stop action",()=>{
 const v=read("public/voice.js");
 assert.match(v,/jrGlobalVoiceLanguage/);assert.match(v,/sw-KE/);assert.match(v,/r\.lang=/);
 assert.match(v,/jrGlobalStop/);assert.match(v,/r\.abort\(\)/);
});

test("Founder can review ads but approval never marks a campaign paid",()=>{
 const api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-founder-overview","index.ts"),"utf8");
 const h=read("public/index.html"),a=read("public/app.js");
 assert.match(api,/review_ad_campaign/);assert.match(api,/status=eq\.pending/);
 assert.match(api,/paid/);assert.match(api,/adCampaigns/);
 assert.match(h,/founderAdCampaignList/);assert.match(a,/review_ad_campaign/);
 assert.match(api,/will not appear in feeds until payment is separately verified/);
});

test("Connect sections return to the top of the same workspace",()=>{
 const c=read("public/command-layout.js"),css=read("public/styles.css");
 assert.match(c,/activateConnectTab/);assert.match(c,/window\.scrollTo/);
 assert.match(c,/connectPanel\("status"\)/);assert.match(c,/jrConnectPanel/);
 assert.match(css,/#jrConnectWorkspace \.jr-connect-tabs\{position:sticky/);
});
test("Worlds is one environment with Create or Enter modes",()=>{
 const w=read("public/worlds.js"),h=read("public/index.html"),css=read("public/styles.css");
 assert.match(w,/jr-worlds-mode-switch/);assert.match(w,/data-world-mode="enter"/);assert.match(w,/data-world-mode="create"/);
 assert.match(w,/setWorldMode/);assert.match(w,/enterPanel\.append\(offerStudio\)/);
 assert.doesNotMatch(w,/world-starter-section/);assert.doesNotMatch(w,/world-starter-grid/);
 assert.doesNotMatch(h,/world-category-grid/);assert.match(h,/One Worlds environment\. Create or enter\./);
 assert.match(css,/\.jr-worlds-mode-switch/);
});

test("DGBO keeps its official identity inside its own company environment",()=>{
 const html=read("public/index.html"),css=read("public/styles.css"),server=read("server.js"),routes=read("../routes/jr.js");
 assert.match(html,/Diamond Global Business Operators/);
 assert.match(html,/id="view-dgbo"/);assert.match(html,/data-company-open="dgbo"/);
 assert.doesNotMatch(html,/class="dgbo-brandbar"/);assert.doesNotMatch(html,/class="dgbo-brand-lockup"/);
 assert.match(css,/\.company-dgbo/);
 assert.match(server,/DGBO stands for Diamond Global Business Operators/);
 assert.match(routes,/diamond global business operators/);
 assert.doesNotMatch(html,/DIME GLOBAL BUSINESS OPERATORS/);
});

test("JR PHEEF public access does not repeat the parent company branding",()=>{
 const html=read("public/index.html");
 assert.match(html,/<title>JR PHEEF \| Find\. Match\. Trade\.<\/title>/);
 assert.doesNotMatch(html,/class="dgbo-brand-lockup"/);assert.doesNotMatch(html,/class="dgbo-brandbar"/);
 assert.match(html,/id="view-dgbo"/);assert.match(html,/id="view-family"/);
});

test("DGBO and FAMILY open as separate branded company environments",()=>{const h=read("public/index.html"),a=read("public/app.js"),css=read("public/styles.css");for(const id of ["dgbo","family"])assert.match(h,new RegExp('id="view-'+id+'"'));assert.match(h,/data-company-open="dgbo"/);assert.match(h,/data-company-open="family"/);assert.match(h,/data-company-back/);assert.match(a,/showWorkspace\(button\.dataset\.companyOpen\)/);assert.match(a,/titles=\{[\s\S]*dgbo:/);assert.match(a,/titles=\{[\s\S]*family:/);assert.match(css,/\.company-entry-dgbo/);assert.match(css,/\.company-entry-family/);assert.match(h,/NOT ACTIVE · PARTNER DEPENDENT/);});


test("Rooms Near Me supports camera, gallery, cover selection and secure media persistence",()=>{
 const a=read("public/app.js"),api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8");
 assert.match(a,/id="roomGallery"/);assert.match(a,/id="roomCamera"/);assert.match(a,/id="roomVideo"/);assert.match(a,/Set as cover/);assert.match(a,/Uploading media/);assert.match(a,/payload\.media/);assert.match(api,/available_from,media/);assert.match(api,/mid\+"\/listing\//);assert.match(api,/signedMedia\(item.media\|\|\[\]\)/);
});
test("JR PHEEF leads public branding and DGBO is not repeated on the public entry screen",()=>{
 const h=read("public/index.html");assert.match(h,/<title>JR PHEEF \| Find\. Match\. Trade\.<\/title>/);assert.doesNotMatch(h,/class="dgbo-brandbar"/);assert.doesNotMatch(h,/class="dgbo-brand-lockup"/);assert.match(h,/data-company-open="dgbo"/);
});
test("JR discovers business opportunities and DGBO evaluates selected opportunities",()=>{
 const h=read("public/index.html"),s=read("server.js");assert.match(h,/Receive selected opportunity research from JR PHEEF/);assert.match(h,/evaluate selected opportunities, develop viable ventures/);assert.match(s,/JR discovers, researches and organises business-opportunity intelligence/);assert.match(s,/DGBO evaluates selected opportunity dossiers/);
});


test("JR-to-DGBO opportunity intelligence has private consent-based intake, sourced research, reviews and venture tracking",()=>{
 const member=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8"),founder=fs.readFileSync(path.join(root,"..","supabase","functions","jr-founder-overview","index.ts"),"utf8"),sql=fs.readFileSync(path.join(root,"..","supabase","migrations","20261113180539_dgbo_opportunity_pipeline.sql"),"utf8"),html=read("public/index.html"),app=read("public/app.js");
 assert.match(member,/submit_idea_to_dgbo/);assert.match(member,/consentToDgbo!==true/);assert.match(member,/member_submission/);
 assert.match(founder,/create_opportunity_dossier/);assert.match(founder,/https:\/\//);assert.match(founder,/review_opportunity_dossier/);assert.match(founder,/update_venture_stage/);assert.match(founder,/dgbo_opportunity_reviews/);assert.match(founder,/dgbo_opportunity_events/);
 for(const table of ["dgbo_opportunity_dossiers","dgbo_opportunity_reviews","dgbo_venture_projects","dgbo_opportunity_events"])assert.match(sql,new RegExp("create table if not exists public\\."+table));
 assert.match(sql,/enable row level security/i);assert.match(sql,/revoke all on public\.%I from anon, authenticated/i);
 assert.match(html,/memberOpportunityForm/);assert.match(html,/I choose to submit this idea to DGBO/);assert.match(html,/founderResearchForm/);assert.match(html,/founderOpportunityQueue/);assert.match(html,/founderVentureProjects/);
 assert.match(app,/review_opportunity_dossier/);assert.match(app,/update_venture_stage/);assert.match(app,/submit_idea_to_dgbo/);
});


test("JR PHEEF includes a living cosmic home and connected universe explorer",()=>{
 const html=read("public/index.html"),cosmic=read("public/cosmic.js"),css=read("public/cosmic.css");
 assert.match(html,/cosmic\.css/);assert.match(html,/cosmic\.js/);
 assert.match(cosmic,/jr-cosmic-home/);assert.match(cosmic,/jrCosmicExplorer/);
 for(const place of ["business","agriculture","science","technology","government","finance","health","society","nature","travel","creativity","food","forest","ocean","mountain","city","underwater","desert","garden","space"])assert.match(cosmic,new RegExp("^\\s*"+place+":\\[","m"));
 assert.match(cosmic,/jrCosmicAsk/);assert.match(cosmic,/workspacePrompt/);assert.match(cosmic,/Pause movement/);
 assert.match(css,/prefers-reduced-motion/);assert.match(css,/jr-cosmic-paused/);assert.doesNotMatch(cosmic,/jr-cosmic-environment-grid/);
 assert.doesNotMatch(cosmic,/founder|ownership|secret key/i);
});

test("home discoveries open the matching place inside WORLDS",()=>{
 const cosmic=read("public/cosmic.js");
 assert.match(cosmic,/const worldsView=\$\("view-worlds"\)/);
 assert.match(cosmic,/if\(worldsView\?\.hidden\)/);
 assert.match(cosmic,/showPlace\(placeButton\.dataset\.cosmicPlace\)/);
});

test("cosmic environments show illustrated scenes, time-aware light and volcano exploration",()=>{
 const cosmic=read("public/cosmic.js"),css=read("public/cosmic.css");
 assert.match(cosmic,/jrCosmicSceneArt/);assert.match(cosmic,/jrCosmicConnections/);
 assert.match(cosmic,/volcano:\{tag:/);assert.match(cosmic,/volcano:\["Volcano"/);
 assert.match(cosmic,/Explore with JR|Explore\s*with JR/);
 assert.match(cosmic,/jrCosmicTimeLabel/);
 for(const phase of ["morning","day","sunset","night"])assert.match(css,new RegExp('data-jr-cosmic-time="'+phase+'"'));
 assert.match(css,/jr-cosmic-scene-art\[data-scene="volcano"\]/);
 assert.match(css,/jr-cosmic-scene-art\[data-scene="forest"\]/);
 assert.match(css,/jr-cosmic-scene-art\[data-scene="ocean"\]/);
 assert.match(css,/jr-cosmic-connections/);
});

test("WORLDS opens practical real-life domains rather than only school subjects",()=>{
 const j=read("public/cosmic.js");
 for(const domain of ["business","agriculture","science","technology","government","finance","health","society","nature","travel","creativity","food"])assert.ok(j.includes('data-cosmic-place="'+domain+'"')||j.includes(domain+':{tag:"'),"missing domain "+domain);
 assert.match(j,/Business & Enterprise/);assert.match(j,/Agriculture & Food Systems/);assert.match(j,/Science & Discovery/);assert.match(j,/Technology & Innovation/);
});

test("JR PHEEF home is an active discovery surface beyond navigation tabs",()=>{
 const j=read("public/cosmic.js"),c=read("public/cosmic.css");
 for(const item of ["jr-pulse-board","Find something to do","JR LINK & people","Business & ideas","FAMILY","data-pulse-action","jr-world-page","openWorldPage","closeWorldPage","data-world-section","Ask JR (optional)","Starter experiences are ready to explore"])assert.ok(j.includes(item),"missing "+item);
 assert.match(c,/jr-world-page/);assert.match(c,/jr-pulse-actions/);
});
test("Opening a place enters its own experience and does not automatically open JR",()=>{
 const j=read("public/cosmic.js");
 assert.match(j,/if\(worldCard\)\{event\.preventDefault\(\);openWorldPage\(worldCard\.dataset\.cosmicPlace\);return;\}/);
 assert.match(j,/data-world-ask/);
 assert.match(j,/closeWorldPage\(\);openJr\(/);
 assert.doesNotMatch(j,/function showPlace\(key\)\{[\s\S]{0,500}openJr\(/);
});


test("JR PHEEF provides a separate honest web-access destination",()=>{
 const j=read("public/cosmic.js"),c=read("public/cosmic.css");
 assert.match(j,/id="jrWebSpace"/);assert.match(j,/Search the web or enter a website address/);
 assert.match(j,/https:\/\/www\.google\.com\/search\?q=/);
 assert.match(j,/noopener,noreferrer/);assert.match(j,/data-web-site/);
 assert.match(j,/Full in-app tabs, bookmarks, downloads and browser history remain future browser features/);
 assert.match(c,/\.jr-web-space/);assert.match(c,/\.jr-web-search/);
});


test("TURBEX has a distinct transport and logistics venture environment",()=>{
 const html=read("public/index.html"),app=read("public/app.js"),css=read("public/styles.css");
 assert.match(html,/data-company-open="turbex"/);
 assert.match(html,/id="view-turbex"/);
 for(const item of ["TURBEX ROAD","TURBEX CARGO","TURBEX FLEET","TURBEX EXPANSION","independent providers","not a live transport booking or dispatch service"])assert.ok(html.includes(item),"missing "+item);
 assert.match(html,/value="turbex">TURBEX/);assert.ok(app.includes("jrAddWindowSelect")&&app.includes("turbex"),"TURBEX is available in the workspace panel selector");
 for(const item of ["turbex-provider","turbex-operations","turbex-partners"])assert.ok(app.includes(item),"missing "+item);
 assert.match(css,/\.company-turbex/);assert.match(css,/\.company-entry-turbex/);
});

test("business operating intelligence is connected to the Worlds workspace",()=>{
 const h=read("public/index.html"),b=read("public/business.js"),s=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8");
 assert.match(h,/business\.js/);assert.match(b,/your business workspace/i);
 for(const action of ["list_business_workspaces","business_overview","create_business_product","receive_business_stock","record_business_sale","create_business_task"])assert.match(b,new RegExp(action));
 for(const action of ["list_business_workspaces","business_overview","create_business_product","receive_business_stock","record_business_sale","create_business_task"])assert.match(s,new RegExp('action==="'+action+'"'));
 assert.match(s,/jr_business_record_sale/);assert.match(s,/businessAccess/);
});
test("business POS records sales and decrements inventory transactionally",()=>{
 const sql=fs.readFileSync(path.join(root,"..","supabase","migrations","20261116130000_jr_business_operating_intelligence.sql"),"utf8");
 assert.match(sql,/for update/i);assert.match(sql,/jr_business_record_sale/);assert.match(sql,/stock_quantity=stock_quantity-/);
 assert.match(sql,/enable row level security/i);assert.match(sql,/revoke all on public\.jr_business_products/);
});

test("business purchasing records supplier orders and receives stock",()=>{
 const b=read("public/business.js"),api=fs.readFileSync(path.join(root,"..","supabase","functions","jr-workspace-api","index.ts"),"utf8"),sql=fs.readFileSync(path.join(root,"..","supabase","migrations","20261116130000_jr_business_operating_intelligence.sql"),"utf8");
 for(const action of ["create_business_supplier","create_business_purchase_order","receive_business_purchase_order"])assert.ok(b.includes(action)||api.includes(action),"missing "+action);
 assert.match(api,/jr_business_create_purchase_order/);assert.match(api,/jr_business_receive_purchase_order/);
 assert.match(sql,/jr_business_purchase_order_items/);assert.match(sql,/security invoker/i);assert.match(sql,/stock_quantity=stock_quantity\+v_remaining/);
});

test("business workspace and command interface scripts parse cleanly",()=>{
 const vm=require("node:vm");
 for(const file of ["public/business.js","public/command-layout.js","public/intelligence.js","server.js"])assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}),file+" syntax");
});
