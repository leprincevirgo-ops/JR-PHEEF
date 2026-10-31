"use strict";
const fs=require("node:fs"),vm=require("node:vm");
const js=fs.readFileSync("public/explore-ui.js","utf8"),css=fs.readFileSync("public/explore.css","utf8");
new vm.Script(js,{filename:"public/explore-ui.js"});
for(const x of ["SCIENCE & LABS","INVENTION & ENGINEERING","TECHNOLOGY","HISTORY & CIVILISATIONS","SEARCH EVERYTHING","ASK JR ABOUT IT","ASK JR TO DEVELOP THIS"])if(!js.includes(x))throw new Error("Explore is missing: "+x);
if(!css.includes("grid-template-columns:minmax(0,1fr) auto auto"))throw new Error("Explore actions are not laid out responsively.");
console.log("PASS: broad Explore discovery and Explore-to-create actions.");
