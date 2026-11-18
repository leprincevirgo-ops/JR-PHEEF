"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..","public");
const server=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
test("public JR PHEEF and JR MOVE websites have dedicated routes",()=>{
 assert.match(server,/app\.get\("\/jr-pheef",sendFoundation\)/);
 assert.match(server,/app\.get\("\/jr-move"[^\n]*jr-move-site\.html/);
});
test("JR PHEEF public website presents the central connected gateway",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 for(const phrase of ["JR PHEEF","Find. Match.","Connected worlds","JR MOVE","Diamond Global Business Operators","FAMILY","/jr-move","name=\"viewport\""])assert.ok(html.includes(phrase),phrase);
});
test("JR MOVE public website presents its six service areas and honest readiness",()=>{
 const html=fs.readFileSync(path.join(root,"jr-move-site.html"),"utf8");
 for(const phrase of ["JR MOVE","RIDES","DELIVERY","MOVING","FREIGHT","DRIVERS","FLEETS","verified providers","/worlds/jr-move","/jr-pheef","name=\"viewport\""])assert.ok(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
});

test("JR PHEEF public root is the front door and the ecosystem has a separate app route",()=>{
 assert.match(server,/app\.get\("\/",sendFoundation\)/);
 assert.match(server,/app\.get\("\/app"[^\n]*index\.html/);
 const publicHtml=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.ok(publicHtml.includes("id=\"authPanel\""));
 assert.ok(publicHtml.includes("id=\"publicJoinNow\""));
 assert.ok(publicHtml.includes("id=\"workspace\""));
});
test("app route opens the account flow before entering the ecosystem",()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 assert.match(app,/window\.location\.pathname==="\/app"&&\["login","signup"\]\.includes\(fragment\.get\("mode"\)\)\)showAuth/);
});
