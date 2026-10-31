const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const modules=["public/discover-ui.js","public/explore-ui.js","public/browser-ui.js","public/apphub-ui.js","public/themes.js","public/projects-ui.js"].map(p=>fs.readFileSync(path.join(root,p),"utf8"));
const ids=new Set([html,...modules].flatMap(s=>[...s.matchAll(/(?:id=["']|\.id\s*=\s*["'])([a-zA-Z][\w-]*)/g)].map(m=>m[1])));
const nav=html.slice(html.indexOf('<div class="nav"'),html.indexOf("</div>",html.indexOf('<div class="nav"')));
const buttons=[...nav.matchAll(/<button([^>]*)onclick=["']show\(['"]([^'"]+)['"]\)([^"']*)["'][^>]*>([\s\S]*?)<\/button>/g)];
const dynamic=new Set(["discover","explore","browser","apphub","jrsettings","projects"]);
let failures=0;
for(const m of buttons){const id=m[2];if(!ids.has(id)&&!dynamic.has(id)){failures++;console.error("FAIL: sidebar route has no page or dynamic mount: "+id);}else console.log("PASS: sidebar route "+id);}
for(const file of ["public/messages-ui.js","public/projects-ui.js","routes/messages.js"]){try{new vm.Script(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});console.log("PASS: syntax "+file);}catch(e){failures++;console.error("FAIL: syntax "+file+": "+e.message);}}
const route=fs.readFileSync(path.join(root,"routes/messages.js"),"utf8");
for(const endpoint of ['/api/messages/status','/api/messages/status/:id'])if(!route.includes(endpoint)){failures++;console.error("FAIL: missing "+endpoint);}else console.log("PASS: "+endpoint);
if(failures)process.exit(1);console.log("PASS: JR PHEEF navigation and Connect checks.");