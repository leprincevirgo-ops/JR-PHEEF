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
