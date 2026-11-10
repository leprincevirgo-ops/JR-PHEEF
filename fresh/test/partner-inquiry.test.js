"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("profile photo opens in an in-app accessible dialog, never a new browser tab",()=>{
 const html=read("public/index.html"),js=read("public/command-layout.js");
 assert.match(html,/id="profilePhotoDialog"/);
 assert.match(html,/id="profilePhotoDialogImage"/);
 assert.match(js,/showModal\(\)/);
 assert.doesNotMatch(js,/window\.open\(/);
});
test("partner enquiries are presented with clear non-contractual wording",()=>{
 const html=read("public/index.html");
 assert.match(html,/Partner with us/);
 assert.match(html,/not a partnership agreement/);
 assert.match(html,/id="partnerInquiryForm"/);
});
test("partner enquiry is proxied only after a verified server session",()=>{
 const server=read("server.js"),fn=fs.readFileSync(path.join(root,"..","supabase","functions","jr-partner-inquiry","index.ts"),"utf8");
 assert.match(server,/\/api\/partner-inquiry/);
 assert.match(server,/user\.email_confirmed_at/);
 assert.match(fn,/email_confirmed_at/);
 assert.match(fn,/jr_partner_inquiries/);
 assert.match(fn,/status!=="active"/);
});
test("partner enquiry table is private and unavailable to browser roles",()=>{
 const migration=fs.readFileSync(path.join(root,"..","supabase","migrations","20261110121811_jr_partner_inquiries.sql"),"utf8");
 assert.match(migration,/enable row level security/i);
 assert.match(migration,/revoke all on table public\.jr_partner_inquiries from anon, authenticated/i);
 assert.match(migration,/grant all on table public\.jr_partner_inquiries to service_role/i);
});
test("JR distinguishes questions, curiosity, wondering and casual conversation",()=>{
 const js=read("public/intelligence.js");
 for(const term of ["classifyConversation","wonder","question","curiosity","open_chat","human_context"])assert.ok(js.includes(term),"missing "+term);
 assert.match(js,/live answer and research engine is not connected/);
});
test("origin protection uses configured canonical origins and supports explicit custom domains",()=>{
 const server=read("server.js");
 assert.match(server,/JR_ALLOWED_ORIGINS/);
 assert.match(server,/new URL\(origin\)\.origin/);
 assert.match(server,/ALLOWED_ORIGINS\.has\(normalized\)/);
 assert.match(server,/sec-fetch-site/);
 assert.doesNotMatch(server,/const expected=.*req\.headers\["host"\]/);
});
