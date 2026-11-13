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
 assert.match(h,/JR's live conversation availability is checked/);
 const intelligence=read("public/intelligence.js");
 assert.match(intelligence,/fetch\("\/healthz"/);
 assert.match(intelligence,/aiConfigured/);
 assert.match(intelligence,/jrRuntimeStatus/);
 assert.match(intelligence,/value="secretary"/);
 assert.match(intelligence,/value="agent_team"/);
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

test("DGBO uses its official Diamond Global Business Operators identity",()=>{
 const html=read("public/index.html"),css=read("public/styles.css"),server=read("server.js"),routes=read("../routes/jr.js");
 assert.match(html,/Diamond Global Business Operators/);
 assert.match(html,/Powered by Diamond Global Business Operators/);
 assert.match(html,/dgbo-brandbar/);assert.match(html,/dgboGold/);
 assert.match(html,/dgbo-diamond-brand-20261112-v1/);
 assert.match(css,/\.dgbo-brandbar/);
 assert.match(server,/DGBO stands for Diamond Global Business Operators/);
 assert.match(routes,/diamond global business operators/);
 assert.doesNotMatch(html,/DIME GLOBAL BUSINESS OPERATORS/);
});

test("Diamond Global Business Operators parent brand is visible across JR access points",()=>{
 const html=read("public/index.html"),css=read("public/styles.css");
 assert.match(html,/DIAMOND GLOBAL/);assert.match(html,/BUSINESS OPERATORS/);
 assert.match(html,/Diamond Global Business Operators/);
 assert.match(html,/dgbo-brand-lockup/);assert.match(html,/dgbo-brandbar/);
 assert.match(html,/jr-dgbo-diamond-brand-20261112-v1/);
 assert.match(css,/\.dgbo-brand-lockup/);assert.match(css,/\.dgbo-brand-type/);
});
