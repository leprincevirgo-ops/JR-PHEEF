"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process");
const root=path.join(__dirname,"../public");
const js=fs.readFileSync(path.join(root,"company-offices.js"),"utf8");
const css=fs.readFileSync(path.join(root,"company-offices.css"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const fn=fs.readFileSync(path.join(__dirname,"../../supabase/functions/jr-founder-overview/index.ts"),"utf8");
test("private founder operations exposes all four company offices",()=>{
 for(const name of ["DGBO","JR MOVE","FAMILY","JR PHEEF"])assert.ok(js.includes(name),"Missing office "+name);
 assert.match(html,/id="founderCompanyOffices"/);
 assert.match(app,/jr:founder-overview/);
});
test("office metrics are read-only and derived from founder-authenticated aggregate data",()=>{
 for(const field of ["pendingApplications","teamMembers","providers","documentsPending","deliveriesOpen","financialTransactionsEnabled","agentRunsPending"])assert.ok(fn.includes(field)||js.includes(field),"Missing operations field "+field);
 assert.match(fn,/member.role!=="founder"\|\|member.jp_number!=="JP-01"/);
 assert.match(fn,/environment:"STAGING"/);
 assert.match(js,/event.detail.founder.jpNumber!=="JP-01"/);
});
test("company offices disclose unavailable financial and transport actions",()=>{
 assert.match(js,/financial transactions, deposits, lending and investment services are not enabled/i);
 assert.match(js,/Live dispatch, payments and GPS tracking remain disabled/i);
 assert.match(js,/read-only aggregates/);
});
test("company office script passes Node syntax validation and has a responsive layout",()=>{
 const result=spawnSync(process.execPath,["--check",path.join(root,"company-offices.js")],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.match(css,/@media\(max-width:760px\)/);
});
