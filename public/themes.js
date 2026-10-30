(function(){
"use strict";
const STORE="jr-pheef-visual-settings-v1", DB="jr-pheef-visual-assets", SECTION_IDS=["home","ecosystem","jpidentity","family","teacher","referrals","universe","lab","library","find","create","opportunities","rooms","points","flex","profile","assistant","jpconnect","social","economy","vault","devices","voice","scifi","fixedit","command","themes","projects","ideas","ads","jrsettings"];
const SECTIONS=[["home","Home dashboard"],["ecosystem","DGBO ecosystem"],["find","Discover & marketplace"],["create","Create listing"],["opportunities","Opportunities"],["social","Social"],["jpconnect","JP Connect"],["assistant","AI assistant"],["universe","Universe"],["lab","Lab & research"],["teacher","JR Teacher"],["library","Library"],["family","Family"],["referrals","Invite & grow"],["profile","Profile"],["vault","My files"],["voice","Voice & type"],["rooms","Rooms"],["economy","Economy"],["flex","PHEEF Flex"],["devices","Devices"],["jpidentity","JP Identity"],["scifi","Sci-fi & futures"],["fixedit","Repair services"],["command","Command centre"],["projects","Projects"],["ideas","Shape JR"],["ads","Advertising centre"],["jrsettings","JR settings"]];
const PRESETS=[
{name:"Midnight",a:"#42f5ff",b:"#07345b",wall:"aurora"},
{name:"Royal purple",a:"#c5a3ff",b:"#29164f",wall:"nebula"},
{name:"Emerald",a:"#63f2b0",b:"#073d34",wall:"aurora"},
{name:"Sunset",a:"#ffb36b",b:"#592b48",wall:"sunset"},
{name:"Ocean",a:"#67c7ff",b:"#06345a",wall:"waves"},
{name:"Rose",a:"#ff91c8",b:"#522044",wall:"nebula"},
{name:"Gold",a:"#f2d27b",b:"#4c3514",wall:"geometry"},
{name:"Minimal",a:"#d5e4f5",b:"#26374b",wall:"none"}
];
const DEFAULTS={global:"Midnight",wallpaper:"aurora",opacity:22,section:{},customImage:false};
let state={global:"Midnight",wallpaper:"aurora",opacity:22,section:{},customImage:false},storedImageUrl=null;
const $=id=>document.getElementById(id);
function read(){try{const v=JSON.parse(localStorage.getItem(STORE)||"{}");state={...state,...v,section:v.section||{}};}catch(e){}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){alert("Your browser could not save these appearance settings. Try a smaller wallpaper image.");}}
function preset(name){return PRESETS.find(p=>p.name===name)||PRESETS[0];}
function wallpaper(name){
const svg={
aurora:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><radialGradient id="a"><stop stop-color="#0dd8d0" stop-opacity=".5"/><stop offset="1" stop-color="#08152d" stop-opacity="0"/></radialGradient><linearGradient id="b"><stop stop-color="#2e7bff" stop-opacity=".45"/><stop offset="1" stop-color="#07152c" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="1000" fill="#041326"/><ellipse cx="1150" cy="220" rx="700" ry="390" fill="url(#a)"/><ellipse cx="330" cy="720" rx="650" ry="430" fill="url(#b)"/><path d="M0 700 Q400 300 800 650 T1600 360" fill="none" stroke="#52f4ff" stroke-opacity=".16" stroke-width="3"/></svg>',
nebula:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><radialGradient id="a"><stop stop-color="#8b5cf6" stop-opacity=".55"/><stop offset="1" stop-color="#071126" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="1000" fill="#080d24"/><ellipse cx="1050" cy="400" rx="700" ry="500" fill="url(#a)"/><ellipse cx="300" cy="800" rx="500" ry="350" fill="#145b9b" opacity=".22"/><g fill="#fff" opacity=".45"><circle cx="180" cy="180" r="2"/><circle cx="600" cy="270" r="2"/><circle cx="1300" cy="150" r="2"/><circle cx="1450" cy="750" r="2"/><circle cx="900" cy="850" r="2"/></g></svg>',
sunset:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><linearGradient id="a" x2="0" y2="1"><stop stop-color="#421c55"/><stop offset=".55" stop-color="#a84d66"/><stop offset="1" stop-color="#e69b59"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#a)"/><circle cx="1150" cy="300" r="190" fill="#ffd28c" opacity=".18"/><path d="M0 740 Q450 570 850 760 T1600 660 V1000 H0Z" fill="#111a37" opacity=".62"/></svg>',
waves:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#04172b"/><g fill="none" stroke="#37c8ff" stroke-opacity=".2" stroke-width="3"><path d="M-100 250 Q300 80 700 250 T1500 250 T2200 250"/><path d="M-100 390 Q300 220 700 390 T1500 390 T2200 390"/><path d="M-100 530 Q300 360 700 530 T1500 530 T2200 530"/><path d="M-100 670 Q300 500 700 670 T1500 670 T2200 670"/></g></svg>',
geometry:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#111827"/><g fill="none" stroke="#e4c56f" stroke-opacity=".22" stroke-width="2"><circle cx="1200" cy="300" r="100"/><circle cx="1200" cy="300" r="180"/><circle cx="1200" cy="300" r="260"/><path d="M0 800L800 0M250 1000L1250 0M700 1000L1600 100"/></g></svg>'
};
if(name==="none")return "none";
return "url(\"data:image/svg+xml,"+encodeURIComponent(svg[name]||svg.aurora)+"\")";
}
function apply(){
const section=document.body.dataset.jpSection||"home",override=state.section[section]||{},p=preset(override.preset||state.global),accent=override.accent||p.a,wall=override.wallpaper||state.wallpaper;
document.body.classList.add("jp-theme-active");
document.body.style.setProperty("--jp-theme-accent",accent);
document.body.style.setProperty("--jp-theme-accent-soft",hexRgba(accent,.14));
document.body.style.setProperty("--jp-theme-border",hexRgba(accent,.32));
document.body.style.setProperty("--jp-theme-wallpaper",state.customImage&&storedImageUrl?"url("+storedImageUrl+")":wallpaper(wall));
document.body.style.setProperty("--jp-theme-wallpaper-opacity",String(Math.max(0,Math.min(60,Number(state.opacity)||22))/100));
document.body.dataset.jpSection=section;
}
function hexRgba(hex,a){const m=/^#([0-9a-f]{6})$/i.exec(hex||"");if(!m)return "rgba(66,245,255,"+a+")";const n=parseInt(m[1],16);return "rgba("+(n>>16)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
function ensurePage(){
const app=$("app");if(!app||$("themes"))return;
const nav=app.querySelector(".nav");
const header=document.querySelector("body > header");
if(header){
 let controls=document.getElementById("jpHeaderNavigation");
 if(!controls){
  controls=document.createElement("div");controls.id="jpHeaderNavigation";controls.className="jp-header-navigation";controls.setAttribute("aria-label","Page navigation");
  const back=document.createElement("button");back.type="button";back.className="jp-nav-arrow";back.textContent="←";back.setAttribute("aria-label","Go back");back.title="Back";
  const forward=document.createElement("button");forward.type="button";forward.className="jp-nav-arrow";forward.textContent="→";forward.setAttribute("aria-label","Go forward");forward.title="Forward";
  back.onclick=()=>{if(window.jpPheefGoBack)window.jpPheefGoBack();};
  forward.onclick=()=>{if(window.jpPheefGoForward)window.jpPheefGoForward();};
  controls.append(back,forward);header.appendChild(controls);
 }
}
const page=document.createElement("section");page.id="themes";page.className="page hidden jp-theme-page";
page.innerHTML=`
<div class="card jp-theme-hero"><p class="jp-kicker">JR PHEEF · YOUR SPACE, YOUR STYLE</p><h1>Appearance studio</h1><p class="muted">Personalize the command centre and give each JR PHEEF area its own visual identity. Changes are saved in this browser and do not alter account permissions or shared content.</p><span class="jp-theme-chip">Global themes</span><span class="jp-theme-chip">Workspace colours</span><span class="jp-theme-chip">Wallpapers</span></div>
<div class="jp-theme-layout">
<div>
 <div class="card"><div class="jp-section-head"><div><div class="jp-kicker">01 · GLOBAL THEME</div><h2>Choose your JR PHEEF look</h2><p>Sets the default colour and wallpaper across the platform.</p></div></div><div id="jpThemePresets" class="jp-theme-swatches"></div></div>
 <div class="card"><div class="jp-kicker">02 · WALLPAPER</div><h2>Background atmosphere</h2><p class="jp-theme-note">Choose a built-in background or upload your own image. Your uploaded wallpaper stays in this browser only.</p><label for="jpWallpaper">Wallpaper style</label><select id="jpWallpaper" class="jp-theme-control"><option value="aurora">Aurora glow</option><option value="nebula">Cosmic nebula</option><option value="sunset">Sunset horizon</option><option value="waves">Ocean waves</option><option value="geometry">Gold geometry</option><option value="none">No wallpaper</option></select><label for="jpWallpaperOpacity">Wallpaper strength <span id="jpOpacityValue">22%</span></label><input id="jpWallpaperOpacity" class="jp-theme-control" type="range" min="0" max="60" value="22"><label for="jpWallpaperFile">Upload wallpaper image</label><input id="jpWallpaperFile" class="jp-theme-control" type="file" accept="image/png,image/jpeg,image/webp"><p id="jpWallpaperStatus" class="jp-theme-note" aria-live="polite">Recommended: landscape image, at least 1600 × 900. Large files are resized in your browser.</p><button id="jpRemoveWallpaper" class="dark">REMOVE UPLOADED WALLPAPER</button></div>
 <div class="card"><div class="jp-kicker">03 · WORKSPACE IDENTITY</div><h2>Give every area its own style</h2><p class="jp-theme-note">Pick a workspace, then assign a colour and optional background style. The selected workspace keeps its own appearance without changing other sections.</p><label for="jpThemeSection">JR PHEEF area</label><select id="jpThemeSection" class="jp-theme-control"></select><label for="jpSectionPreset">Colour preset</label><select id="jpSectionPreset" class="jp-theme-control"></select><div class="jp-theme-row"><div><label for="jpSectionAccent">Custom accent colour</label><small>Overrides the preset accent for this area.</small></div><input id="jpSectionAccent" class="jp-theme-color" type="color" value="#42f5ff"></div><label for="jpSectionWallpaper">Area wallpaper</label><select id="jpSectionWallpaper" class="jp-theme-control"><option value="">Use global wallpaper</option><option value="aurora">Aurora glow</option><option value="nebula">Cosmic nebula</option><option value="sunset">Sunset horizon</option><option value="waves">Ocean waves</option><option value="geometry">Gold geometry</option><option value="none">No wallpaper</option></select><div class="jp-theme-actions"><button class="primary" id="jpApplySection">SAVE THIS AREA</button><button class="dark" id="jpResetSection">RESET THIS AREA</button></div><p id="jpSectionStatus" class="jp-theme-note" aria-live="polite"></p></div>
</div>
<div>
 <div class="card"><div class="jp-kicker">LIVE PREVIEW</div><h2>How your interface will feel</h2><div class="jp-theme-preview" id="jpThemePreview"><div><span class="jp-kicker">JR PHEEF · COMMAND CENTRE</span><h2 style="margin:10px 0">Your world.<br>More possibilities.</h2><p class="jp-theme-note">A consistent identity with a unique look for each space.</p></div><div class="jp-theme-preview-card"><b>DISCOVER</b><p class="jp-theme-note">Find · Match · Coordinate</p><button class="primary" type="button" tabindex="-1">OPEN WORKSPACE</button></div></div><p class="jp-theme-note">Preview follows your selected global preset and active workspace accent.</p></div>
 <div class="card"><div class="jp-kicker">04 · DISPLAY PREFERENCES</div><h2>Comfort & readability</h2><div class="jp-theme-row"><div><label for="jpThemeContrast">High contrast</label><small>Strengthens borders and text contrast.</small></div><input id="jpThemeContrast" type="checkbox" style="width:22px;height:22px"></div><div class="jp-theme-row"><div><label for="jpThemeCompact">Compact cards</label><small>Reduces dashboard tile spacing.</small></div><input id="jpThemeCompact" type="checkbox" style="width:22px;height:22px"></div><div class="jp-theme-row"><div><label for="jpThemeMotion">Reduce motion</label><small>Minimizes animated transitions.</small></div><input id="jpThemeMotion" type="checkbox" style="width:22px;height:22px"></div><button class="primary" id="jpSaveDisplay">SAVE DISPLAY PREFERENCES</button></div>
 <div class="card"><div class="jp-kicker">05 · RESET</div><h2>Restore JR PHEEF appearance</h2><p class="jp-theme-note">Reset all colours, wallpaper and display preferences to the JR PHEEF default. This does not affect your account, listings or data.</p><button class="danger" id="jpResetAll">RESET ALL APPEARANCE</button><p id="jpResetStatus" class="jp-theme-note" aria-live="polite"></p></div>
</div></div>`;
app.appendChild(page);
const settingsNav=document.createElement("button");
settingsNav.type="button";
settingsNav.textContent="SETTINGS";
settingsNav.setAttribute("aria-label","Open JR PHEEF settings");
settingsNav.onclick=()=>window.show("jrsettings");
if(nav)nav.appendChild(settingsNav);
const settings=document.createElement("section");
settings.id="jrsettings";
settings.className="page hidden jp-settings-page";
settings.innerHTML=`
<div class="card jp-settings-hero"><p class="jp-kicker">JR PHEEF · CONTROL CENTRE</p><h1>Settings</h1><p class="muted">Manage your account, privacy, sign-in, appearance and app preferences from one place.</p></div>
<div class="jp-settings-grid">
 <article class="card jp-settings-card"><span class="jp-settings-icon">👤</span><h2>Profile & account</h2><p class="jp-theme-note">Update your name, email, location and personal profile details.</p><button class="primary" type="button" data-settings-go="profile">OPEN PROFILE</button></article>
 <article class="card jp-settings-card"><span class="jp-settings-icon">🔐</span><h2>Security & sign-in</h2><p class="jp-theme-note">Manage available sign-in methods and review account security options.</p><button class="primary" type="button" data-settings-go="profile" data-settings-focus="security">SECURITY SETTINGS</button></article>
 <article class="card jp-settings-card"><span class="jp-settings-icon">🎨</span><h2>Appearance</h2><p class="jp-theme-note">Choose themes, wallpapers, workspace colours and display preferences.</p><button class="primary" type="button" data-settings-go="themes">CUSTOMIZE APPEARANCE</button></article>
 <article class="card jp-settings-card"><span class="jp-settings-icon">🧭</span><h2>App preferences</h2><p class="jp-theme-note">Adjust your JR PHEEF experience. More controls will appear here as they become available.</p><span class="jp-settings-status">Additional preferences are being prepared.</span></article>
 <article class="card jp-settings-card"><span class="jp-settings-icon">🛡️</span><h2>Privacy & data</h2><p class="jp-theme-note">Review privacy controls and how your information is used. Sensitive account actions remain protected.</p><span class="jp-settings-status">Privacy controls are being expanded.</span></article>
 <article class="card jp-settings-card"><span class="jp-settings-icon">❔</span><h2>Help & support</h2><p class="jp-theme-note">Get help using JR PHEEF and report a problem.</p><span class="jp-settings-status">Support centre integration is pending.</span></article>
</div>`;
settings.addEventListener("click",e=>{const b=e.target.closest("[data-settings-go]");if(!b)return;const target=b.dataset.settingsGo;window.show(target);if(b.dataset.settingsFocus==="security"){setTimeout(()=>{const panel=document.querySelector("#profile h2:nth-of-type(2)");if(panel)panel.scrollIntoView({behavior:"smooth",block:"start"});},80);}});
app.appendChild(settings);
}
function render(){
const host=$("jpThemePresets");if(!host)return;
host.innerHTML=PRESETS.map(p=>'<button type="button" class="jp-theme-swatch" data-preset="'+p.name+'" style="--swatch-a:'+p.a+';--swatch-b:'+p.b+'" aria-pressed="'+(state.global===p.name)+'"><small>'+p.name+'</small></button>').join("");
$("jpWallpaper").value=state.wallpaper;$("jpWallpaperOpacity").value=state.opacity;$("jpOpacityValue").textContent=state.opacity+"%";
$("jpThemeSection").innerHTML=SECTIONS.map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join("");
$("jpSectionPreset").innerHTML=PRESETS.map(p=>'<option value="'+p.name+'">'+p.name+'</option>').join("");
$("jpThemeContrast").checked=!!state.highContrast;$("jpThemeCompact").checked=!!state.compact;$("jpThemeMotion").checked=!!state.reduceMotion;
loadSectionControls();preview();
}
function loadSectionControls(){
const id=$("jpThemeSection").value||"home",v=state.section[id]||{};
$("jpSectionPreset").value=v.preset||state.global;$("jpSectionAccent").value=v.accent||preset(v.preset||state.global).a;$("jpSectionWallpaper").value=v.wallpaper||"";
}
function preview(){
const id=$("jpThemeSection").value||"home",v=state.section[id]||{},p=preset(v.preset||state.global),a=v.accent||p.a;
$("jpThemePreview").style.setProperty("--jp-theme-accent",a);$("jpThemePreview").style.setProperty("--jp-theme-accent-soft",hexRgba(a,.18));$("jpThemePreview").style.borderColor=hexRgba(a,.6);
}
function bind(){
$("jpThemePresets").addEventListener("click",e=>{const b=e.target.closest("[data-preset]");if(!b)return;state.global=b.dataset.preset;const p=preset(state.global);state.wallpaper=p.wall;save();apply();render();});
$("jpWallpaper").onchange=e=>{state.wallpaper=e.target.value;state.customImage=false;save();apply();};
$("jpWallpaperOpacity").oninput=e=>{$("jpOpacityValue").textContent=e.target.value+"%";state.opacity=Number(e.target.value);save();apply();};
$("jpThemeSection").onchange=loadSectionControls;
$("jpSectionPreset").onchange=()=>{$("jpSectionAccent").value=preset($("jpSectionPreset").value).a;preview();};
$("jpSectionAccent").oninput=preview;$("jpSectionWallpaper").onchange=preview;
$("jpApplySection").onclick=()=>{const id=$("jpThemeSection").value;state.section[id]={preset:$("jpSectionPreset").value,accent:$("jpSectionAccent").value,wallpaper:$("jpSectionWallpaper").value};save();apply();$("jpSectionStatus").textContent="Saved. "+(SECTIONS.find(s=>s[0]===id)||[id,id])[1]+" now has its own visual identity.";preview();};
$("jpResetSection").onclick=()=>{delete state.section[$("jpThemeSection").value];save();loadSectionControls();apply();$("jpSectionStatus").textContent="This area now follows the global JR PHEEF theme.";};
$("jpSaveDisplay").onclick=()=>{state.highContrast=$("jpThemeContrast").checked;state.compact=$("jpThemeCompact").checked;state.reduceMotion=$("jpThemeMotion").checked;save();applyDisplay();$("jpSectionStatus").textContent="Display preferences saved.";};
$("jpResetAll").onclick=()=>{if(!confirm("Reset all JR PHEEF appearance settings in this browser?"))return;state={...DEFAULTS,section:{}};save();delete state.customImageData;removeImage().then(()=>{apply();applyDisplay();render();$("jpResetStatus").textContent="Default appearance restored.";});};
$("jpRemoveWallpaper").onclick=async()=>{await removeImage();state.customImage=false;save();apply();$("jpWallpaperStatus").textContent="Uploaded wallpaper removed. Your selected built-in background is active.";};
$("jpWallpaperFile").onchange=handleUpload;
}
function applyDisplay(){document.body.classList.toggle("jp-theme-high-contrast",!!state.highContrast);document.body.classList.toggle("jp-theme-compact",!!state.compact);document.body.classList.toggle("jp-theme-reduce-motion",!!state.reduceMotion);}
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore("assets");req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function storeImage(blob){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put(blob,"wallpaper");tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
async function getImage(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const r=db.transaction("assets").objectStore("assets").get("wallpaper");r.onsuccess=()=>{db.close();resolve(r.result||null);};r.onerror=()=>{db.close();reject(r.error);};});}catch(e){return null;}}
async function removeImage(){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").delete("wallpaper");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch(e){}}
async function handleUpload(e){
const file=e.target.files&&e.target.files[0];if(!file)return;
if(!/^image\/(png|jpeg|webp)$/.test(file.type)){ $("jpWallpaperStatus").textContent="Choose a PNG, JPG or WebP image.";return;}
if(file.size>12*1024*1024){$("jpWallpaperStatus").textContent="Image is too large. Choose an image under 12 MB.";return;}
$("jpWallpaperStatus").textContent="Preparing your wallpaper…";
try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/bitmap.width,1100/bitmap.height),canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.78));if(!blob)throw new Error("Image conversion failed");await storeImage(blob);state.customImage=true;state.wallpaper="none";save();await loadStoredImage();apply();$("jpWallpaperStatus").textContent="Wallpaper uploaded and saved in this browser ("+Math.round(blob.size/1024)+" KB).";}catch(err){$("jpWallpaperStatus").textContent="Could not save this image. Try another image or a built-in wallpaper.";}
}
async function loadStoredImage(){const blob=await getImage();if(blob){if(storedImageUrl)URL.revokeObjectURL(storedImageUrl);storedImageUrl=URL.createObjectURL(blob);}else{state.customImage=false;storedImageUrl=null;}}
function wrapShow(){
if(typeof window.show!=="function")return;
const original=window.show;
let stack=[],index=-1,restoring=false;
function syncArrows(){
const controls=document.getElementById("jpHeaderNavigation");
const back=controls&&controls.querySelector('[aria-label="Go back"]');
const forward=controls&&controls.querySelector('[aria-label="Go forward"]');
if(back)back.disabled=index<=0;
if(forward)forward.disabled=index<0||index>=stack.length-1;
}
window.jpPheefGoBack=function(){if(index<=0)return;index--;restoring=true;window.show(stack[index]);restoring=false;syncArrows();};
window.jpPheefGoForward=function(){if(index>=stack.length-1)return;index++;restoring=true;window.show(stack[index]);restoring=false;syncArrows();};
window.show=function(id){
if(!restoring&&id&&stack[index]!==id){stack=stack.slice(0,index+1);stack.push(id);index=stack.length-1;}
original(id);
if(SECTION_IDS.includes(id)){document.body.dataset.jpSection=id;apply();}
if(id==="themes")render();
syncArrows();
};
syncArrows();
}
function init(){
read();ensurePage();wrapShow();bind();applyDisplay();apply();
if(state.customImage)loadStoredImage().then(apply);
if(!document.body.dataset.jpSection)document.body.dataset.jpSection="home";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();