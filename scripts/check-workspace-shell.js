const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const shell=fs.readFileSync(path.join(root,"public/workspace-shell.js"),"utf8");
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"public/workspace-shell.css"),"utf8");
const mobile=fs.readFileSync(path.join(root,"public/mobile-phone-shell.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"public/service-worker.js"),"utf8");
const themes=fs.readFileSync(path.join(root,"public/themes.js"),"utf8");
new vm.Script(shell,{filename:"public/workspace-shell.js"});
if(shell.includes("replaceChildren(")||shell.includes(":scope"))throw new Error("Workspace navigation uses a browser API/selector that is not safe for older Android WebViews.");
if(!shell.includes("function clearChildren(node)"))throw new Error("Missing legacy-compatible DOM clearing helper.");
if(!shell.includes('app.querySelector(".nav")'))throw new Error("Navigation lookup must avoid :scope selectors.");
const required=["connections","messages","ecosystem","family","discover","explore","browser","apphub","projects","jrsettings","assistant","mediahub","businesshub","labhub","libraryhub","learnhub"];
for(const id of required){if(!shell.includes('"'+id+'"')&&!html.includes('data-page="'+id+'"'))throw new Error("Missing workspace route: "+id);}
for(const fragment of ["jr-page-chrome","jr-workspace-hero","jr-provider-grid","jr-nav-group"]){if(!css.includes(fragment))throw new Error("Missing full-screen style: "+fragment);}
if(!html.includes("/workspace-shell.js?v=command6")||!html.includes("/workspace-shell.css"))throw new Error("Workspace shell assets are not loaded.");
if(!shell.includes("JR PHEEF MEDIA")||!shell.includes("JR PHEEF BUSINESS")||!shell.includes("JR PHEEF LAB")||!shell.includes("JR PHEEF LIBRARY")||!shell.includes("JR LINK"))throw new Error("Connected-world labels are incomplete.");
for(const hub of ["mediahub","businesshub","labhub","libraryhub","learnhub"]){if(!shell.includes(hub+":["))throw new Error("Missing organized hub groups: "+hub);}
if(!shell.includes("dedicated streaming, creator publishing and live broadcasting require further implementation"))throw new Error("Media capability status must remain honest.");
if(!shell.includes("NOT CONNECTED")||!shell.includes("provider's official API"))throw new Error("External integration state is not clearly disclosed.");
const cacheVersion=Number((sw.match(/const VERSION="jr-shell-v([0-9]+)"/)||[])[1]||0);
if(cacheVersion<22)throw new Error("PWA cache version must be refreshed for connected-world navigation.");
if(!shell.includes('["connecthub","JR LINK"'))throw new Error("JR LINK must remain the canonical communication world.");
for(const [id,accent] of [["dgbo","#D6B15E"],["family","#49C78B"],["connecthub","#38D5C8"],["mediahub","#E66AC4"],["businesshub","#43C58B"],["labhub","#9584FF"],["libraryhub","#C87991"],["learnhub","#F4A45B"]]){
 if(!themes.includes(id+':{accent:"'+accent+'"'))throw new Error("Missing brand identity palette for "+id);
}
if(!themes.includes('document.body.style.setProperty("--jp-theme-secondary",identity.secondary)'))throw new Error("Brand secondary colour is not applied.");
console.log("PASS: workspace shell syntax, connected-world hubs, cache refresh and external integration disclosures.");
