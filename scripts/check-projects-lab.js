"use strict";
const fs=require("node:fs"),vm=require("node:vm");
const lab=fs.readFileSync("public/lab-ui.js","utf8"),server=fs.readFileSync("server.js","utf8"),projects=fs.readFileSync("public/projects-ui.js","utf8");
new vm.Script(lab,{filename:"public/lab-ui.js"});
for(const x of ["/api/lab/experiments","SAVE TO MY LAB","SAVE NOTES","jrLabApproach","jrLabRisk"])if(!lab.includes(x))throw new Error("Lab UI missing "+x);
for(const x of ["/api/projects", "/api/projects/:id/tasks", "jr_project_tasks"])if(!server.includes(x))throw new Error("Projects API missing "+x);
for(const x of ["/api/projects","/api/projects/"])if(!projects.includes(x))throw new Error("Projects UI endpoint mismatch "+x);
console.log("PASS: Lab UI syntax and authenticated project/task API wiring.");
