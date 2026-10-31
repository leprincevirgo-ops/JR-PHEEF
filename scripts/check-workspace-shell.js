const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const shell=fs.readFileSync(path.join(root,"public/workspace-shell.js"),"utf8");
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"public/workspace-shell.css"),"utf8");
new vm.Script(shell,{filename:"public/workspace-shell.js"});
const required=["connections","messages","ecosystem","family","discover","explore","browser","apphub","projects","jrsettings","assistant"];
for(const id of required){if(!shell.includes('"'+id+'"')&&!html.includes('data-page="'+id+'"'))throw new Error("Missing workspace route: "+id);}
for(const fragment of ["jr-page-chrome","jr-workspace-hero","jr-provider-grid","jr-nav-group"]){if(!css.includes(fragment))throw new Error("Missing full-screen style: "+fragment);}
if(!html.includes("/workspace-shell.js")||!html.includes("/workspace-shell.css"))throw new Error("Workspace shell assets are not loaded.");
if(!shell.includes("NOT CONNECTED")||!shell.includes("provider's official API"))throw new Error("External integration state is not clearly disclosed.");
console.log("PASS: workspace shell syntax, key destinations, full-screen styles and external integration disclosures.");
