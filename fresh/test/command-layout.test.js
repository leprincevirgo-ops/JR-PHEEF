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

test("Status supports camera and gallery selection with a local preview",()=>{
 const app=fs.readFileSync("fresh/public/app.js","utf8");
 assert.match(app,/data-status-media="gallery"/);
 assert.match(app,/data-status-media="camera"/);
 assert.match(app,/capture="environment"/);
 assert.match(app,/statusMediaPreview/);
 assert.match(app,/secure photo\/video publishing is not enabled yet/);
});
test("Command Center includes speaker and accessibility preferences",()=>{
 for(const id of ["jrSpeakerVoice","jrSpeakerRate","jrSpeakTest","jrStopSpeech","jrVoiceInput","jrLargeText","jrHighContrast","jrReduceMotion"])assert.ok(html.includes(id));
 for(const feature of ["SpeechSynthesisUtterance","SpeechRecognition","jr-large-text","jr-high-contrast","jr-reduce-motion"])assert.ok(source.includes(feature));
});

test("Member media, status, group and channel workflows are present",()=>{
 for(const token of ["upload_media","list_my_statuses","update_status","delete_status","create_group","list_channels","create_channel","publish_channel_post"])assert.ok(source.includes(token));
 for(const token of ["profilePhotoGallery","profilePhotoCamera","jrGroupForm","jrChannelCreate","status-own-actions","world-scene-art"])assert.ok(source.includes(token));
});
test("Status image previews do not expose file names or image descriptions",()=>{
 assert.match(source,/Photo selected/);
 assert.match(source,/Status photo/);
 assert.doesNotMatch(source,/alt=.*file\.name/);
});
