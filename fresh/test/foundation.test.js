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
 for(const id of ["fullName","phone","birthYear","email","password"])assert.match(h,new RegExp('id="'+id+'"'));
});
test("login and signup controls call real same-origin auth endpoints",()=>{
 const j=read("public/app.js");
 assert.match(j,/\/api\/auth\/login/);assert.match(j,/\/api\/auth\/signup/);
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
});

test("JR PHEEF uses an animated living wallpaper with reduced-motion support",()=>{
 const css=read("public/styles.css"),h=read("public/index.html");
 assert.match(css,/jrAuroraDrift/);assert.match(css,/jrStarDrift/);assert.match(css,/prefers-reduced-motion/);
 assert.match(h,/jr-multiwindow-continuity-20261112-v1/);
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
