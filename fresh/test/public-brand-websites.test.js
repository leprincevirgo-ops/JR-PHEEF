"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..","public");
const server=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
test("public JR PHEEF and JR MOVE websites have dedicated routes",()=>{
 assert.match(server,/app\.get\("\/jr-pheef"[^\n]*jr-pheef-site\.html/);
 assert.match(server,/app\.get\("\/jr-move"[^\n]*jr-move-site\.html/);
});
test("JR PHEEF public website presents the central connected gateway",()=>{
 const html=fs.readFileSync(path.join(root,"jr-pheef-site.html"),"utf8");
 for(const phrase of ["JR PHEEF","Find. Match.","Connected worlds","JR MOVE","Diamond Global Business Operators","FAMILY","/jr-move","name=\"viewport\""])assert.ok(html.includes(phrase),phrase);
});
test("JR MOVE public website presents its six service areas and honest readiness",()=>{
 const html=fs.readFileSync(path.join(root,"jr-move-site.html"),"utf8");
 for(const phrase of ["JR MOVE","RIDES","DELIVERY","MOVING","FREIGHT","DRIVERS","FLEETS","verified providers","/worlds/jr-move","/jr-pheef","name=\"viewport\""])assert.ok(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
});
