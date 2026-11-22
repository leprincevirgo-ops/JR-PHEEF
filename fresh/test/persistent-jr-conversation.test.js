"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../public");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
test("JR conversation history is stored in member-owned conversations",()=>{
 assert.match(app,/list_ai_conversations/);
 assert.match(app,/create_ai_conversation/);
 assert.match(app,/save_ai_message/);
 assert.match(app,/list_ai_messages/);
 assert.match(app,/loadJrConversation\(\)/);
});
test("JR restores only the latest conversation and bounds in-memory model context",()=>{
 assert.match(app,/conversations\[0\]/);
 assert.match(app,/jrConversationHistory\.slice\(-8\)/);
 assert.match(app,/jrConversationHistory\.length>16/);
});
test("JR transcript renders member content as text, not HTML",()=>{
 assert.match(app,/body\.textContent=String\(content\|\|""\)/);
 assert.match(app,/jr-chat-message-assistant/);
 assert.match(css,/\.jr-chat-messages/);
});
test("members can start a fresh conversation and logout clears local context",()=>{
 assert.match(app,/New conversation/);
 assert.match(app,/jrConversationId=null;jrConversationHistory\.length=0/);
});
