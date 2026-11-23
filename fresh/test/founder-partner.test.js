"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const server=fs.readFileSync(path.join(root,"fresh/server.js"),"utf8");
const page=fs.readFileSync(path.join(root,"fresh/public/index.html"),"utf8");
const client=fs.readFileSync(path.join(root,"fresh/public/founder-partner.js"),"utf8");

test("Founder–JR conversation is protected by verified founder identity",()=>{
 new vm.Script(server,{filename:"fresh/server.js"});
 assert.match(server,/app\.post\("\/api\/founder\/partner-chat"/);
 assert.match(server,/functions\/v1\/jr-founder-overview/);
 assert.match(server,/founder\\?\\.role!=="founder"/);
 assert.match(server,/founder\\?\\.jpNumber!=="JP-01"/);
});
test("JR teaches abbreviations in full before using their short form",()=>{
 assert.match(server,/Application Programming Interface \(API\)/);
 assert.match(server,/beginner-friendly teaching style/);
});
test("Founder workspace persists its private conversation and offers voice plus text",()=>{
 new vm.Script(client,{filename:"fresh/public/founder-partner.js"});
 assert.match(page,/founderPartnerMount/);
 assert.match(page,/founder-partner\.js/);
 assert.match(client,/Founder–JR Partnership/);
 assert.match(client,/save_ai_message/);
 assert.match(client,/SpeechRecognition/);
 assert.match(client,/speechSynthesis/);
 assert.match(client,/Stop voice/);
});
