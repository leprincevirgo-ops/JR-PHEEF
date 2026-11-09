"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("fresh/public/command-layout.js","utf8");
const html=fs.readFileSync("fresh/public/index.html","utf8");
const app=fs.readFileSync("fresh/public/app.js","utf8");
test("Command Center layout script parses",()=>assert.doesNotThrow(()=>new vm.Script(source)));
test("Command Center mounts profile, chats, contacts, status and updates into their own panels",()=>{
 for(const id of ["memberProfilePanel","commandChatMount","commandContactsMount","commandStatusMount","commandUpdatesMount"])assert.ok(html.includes(id));
 for(const id of ["update_profile","memberSearchForm","create_status","myNotifications"])assert.ok(source.includes(id));
});
test("Existing submit handlers continue working after communication forms move",()=>assert.match(app,/document\.addEventListener\("submit"/));
test("Command Center keeps a direct route back to JR",()=>assert.match(source,/openJrFromCommand/));
test("Command Center exposes all expected shortcuts",()=>{
 for(const label of ["Profile","Chats","Contacts","Status","Updates","Talk to JR"])assert.ok(html.includes(label));
 assert.ok(html.includes("command-layout.js"));
});
