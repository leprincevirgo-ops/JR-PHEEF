"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"public/styles.css"),"utf8");
const discovery=fs.readFileSync(path.join(root,"public/public-discovery.js"),"utf8");
const app=fs.readFileSync(path.join(root,"public/app.js"),"utf8");
const server=fs.readFileSync(path.join(root,"server.js"),"utf8");
test("the public domain serves the real connected foundation, not the retired brochure page",()=>{
 assert.match(server,/function sendFoundation\(req,res\)/);
 assert.match(server,/app\.get\("\/",sendFoundation\)/);
 assert.match(server,/app\.get\("\/jr-pheef",sendFoundation\)/);
 assert.match(server,/app\.get\("\/app",sendFoundation\)/);
 assert.match(server,/path\.join\(__dirname,"public","index\.html"\)/);
 assert.doesNotMatch(server,/jr-pheef-site\.html/);
});
test("visitors understand JR PHEEF before registration and authenticated workspace entry",()=>{
 const live=html.indexOf('<section class="public-live" id="publicLive">');
 const workspace=html.indexOf('<section class="workspace" id="workspace" hidden>');
 const auth=html.indexOf('<section class="auth" id="authPanel" hidden>');
 assert.ok(live>0&&workspace>live&&auth>workspace);
 assert.match(html,/A connected world, ready for you/);
 assert.match(html,/PLATFORM REGISTRATION/);
 assert.match(html,/Understand\. Register\. Enter\. Grow\./);
 assert.match(html,/id="publicJoinNow"/);
 assert.match(app,/\$\("startWithJr"\)\.addEventListener\("click",\(\)=>showAuth\("signup"\)\)/);
 assert.match(app,/\$\("publicJoinNow"\)\?\.addEventListener\("click",\(\)=>showAuth\("signup"\)\)/);
 assert.match(app,/if\(publicLive\)publicLive\.hidden=!!user/);
});
test("the public experience introduces the four connected environments",()=>{
 for(const name of ["DIAMOND GLOBAL BUSINESS OPERATORS","FAMILY","JR MOVE","JR LINK"])assert.ok(html.includes(name));
 for(const route of ["data-company-open=\"dgbo\"","data-company-open=\"family\"","data-company-open=\"turbex\"","data-company-open=\"command\""])assert.ok(html.includes(route));
});
test("public live discovery loads attributed general and transport feeds safely",()=>{
 assert.match(html,/id="publicGeneralFeed"/);
 assert.match(html,/id="publicTransportFeed"/);
 assert.match(html,/public-discovery\.js\?v=20261118-founder-live-v1/);
 assert.match(discovery,/fetch\("\/api\/discovery\/feed\?world="/);
 assert.match(discovery,/url\.protocol!=="https:"/);
 assert.match(discovery,/link\.textContent=/);
 assert.match(discovery,/summary=node\("p","",String\(item\.summary/);
 assert.match(server,/app\.get\("\/api\/discovery\/feed"/);
 assert.match(server,/loadWorldFeed\(world\)/);
});
test("JR conversation in the authenticated workspace calls the real server AI endpoint",()=>{
 assert.match(html,/id="workspacePromptForm"/);
 assert.match(app,/api\("\/api\/ai\/chat",\{message,mode:"universe",history:/);
 assert.match(app,/reply\.textContent=answer/);
 assert.match(server,/app\.post\("\/api\/ai\/chat",rateLimit,sameOrigin/);
 assert.match(server,/if\(!user\|\|!user\.email_confirmed_at\|\|!req\.jrAccessToken\)/);
 assert.match(server,/process\.env\.OPENAI_API_KEY/);
});
test("founder access is private, role-gated and connected to the protected overview service",()=>{
 assert.match(html,/id="founderCommand" hidden/);
 assert.match(app,/user\.role==="founder"&&user\.jpNumber==="JP-01"/);
 assert.match(app,/loadFounderOverview\(\)/);
 assert.match(app,/api\("\/api\/founder\/overview"\)/);
 assert.match(server,/app\.all\("\/api\/founder\/overview",sameOrigin/);
 assert.match(server,/functions\/v1\/jr-founder-overview/);
 assert.match(server,/liveAiConnected:Boolean\(process\.env\.OPENAI_API_KEY\)/);
});
test("public discovery layouts adapt to mobile screens",()=>{
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/\.public-world-grid,\.public-live-feeds\{grid-template-columns:1fr\}/);
 assert.match(css,/\.public-live\[hidden\]\{display:none!important\}/);
});

test("the deployed server and browser entry scripts parse without syntax errors",()=>{
 assert.doesNotThrow(()=>new vm.Script(server,{filename:"fresh/server.js"}));
 assert.doesNotThrow(()=>new vm.Script(app,{filename:"fresh/public/app.js"}));
 assert.doesNotThrow(()=>new vm.Script(discovery,{filename:"fresh/public/public-discovery.js"}));
});
