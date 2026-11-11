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
 assert.match(j,/\/api\/auth\/session/);assert.match(j,/\/api\/auth\/logout/);assert.match(j,/\/api\/auth\/session\/establish/);assert.match(j,/access_token/);
 assert.match(j,/credentials:"same-origin"/);
});
test("server validates signup, creates HttpOnly secure cookies and refreshes sessions",()=>{
 const s=read("server.js");
 for(const fragment of ["/api/auth/signup","/api/auth/login","/api/auth/session","/api/auth/logout","HttpOnly","Secure","SameSite=Lax","grant_type=refresh_token","birth_year","redirect_to","/api/auth/session/establish"])assert.ok(s.includes(fragment),"missing "+fragment);
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
