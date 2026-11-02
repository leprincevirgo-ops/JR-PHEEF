"use strict";
const fs=require("node:fs");
const html=fs.readFileSync("public/index.html","utf8");
const css=fs.readFileSync("public/mobile-experience.css","utf8");
const nav=html.match(/<nav class="nav jp-primary-nav"[\s\S]*?<\/nav>/)?.[0]||"";
const expected=["Business","Social","Access","Settings","More"];
let last=-1;
for(const label of expected){
 const at=nav.indexOf(">"+label+"<");
 if(at<0||at<=last)throw new Error("Mobile bottom navigation missing or out of order: "+label);
 last=at;
}
for(const token of ['id="jpActionRail"','id="globalCommandSearch"','aria-label="Voice search"','aria-label="Notifications"','aria-label="Open account menu"'])if(!html.includes(token))throw new Error("Missing upper command-shell control: "+token);
for(const token of ['@media(max-width:900px)','position:sticky!important;top:0!important','position:fixed!important;left:0!important','grid-template-columns:repeat(5,minmax(0,1fr))','env(safe-area-inset-bottom)','#jr-accessibility-panel'])if(!(css.includes(token)||html.includes(token)))throw new Error("Missing responsive mobile-shell requirement: "+token);
if(!html.includes('id="home" class="page jp-reference-home"'))throw new Error("Existing central home experience was removed.");
console.log("PASS: three-zone mobile shell, five bottom destinations, upper controls, safe-area handling and central home preserved.");
