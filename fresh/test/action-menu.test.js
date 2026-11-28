"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("JR Action Menu exposes context-aware application, channel, legal and preference workspaces",()=>{
 const js=read("public/action-menu.js"),css=read("public/action-menu.css");
 for(const s of ["submit_application","list_my_applications","list_review_queue","review_application","request_channel_connection","save_preferences","Legal and privacy centre","Founder application review","data-jr-action-menu"])assert.ok(js.includes(s),s);
 assert.match(css,/#jrActionFab/);assert.match(css,/#jrActionPanel/);
});
test("ecosystem operations proxy is authenticated and same-origin",()=>{
 const s=read("server.js");assert.match(s,/api\/ecosystem-operations/);assert.match(s,/currentUser\(req,res\)/);
});
test("ecosystem application schema keeps automated checks separate from human approval",()=>{
 const sql=fs.readFileSync(path.join(root,"..","supabase","migrations","20261128190000_jr_ecosystem_applications_legal_channels.sql"),"utf8");
 assert.match(sql,/technical_status/);assert.match(sql,/approval_chain/);assert.match(sql,/jr_ecosystem_application_approvals/);assert.match(sql,/enable row level security/i);assert.match(sql,/revoke all.*anon, authenticated/i);
});
test("CBDC is not represented as a JR PHEEF payment or channel integration",()=>{
 const s=read("public/action-menu.js");assert.doesNotMatch(s,/cbdc/i);
});
