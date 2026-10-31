(function(){
"use strict";
const KEY="jr-pheef-accessibility-v1";
const defaults={largeText:false,highContrast:false,reduceMotion:false};
let prefs={...defaults};
try{prefs={...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch(e){}
const style=document.createElement("style");
style.textContent=`
#jr-accessibility-launcher{position:fixed;right:14px;bottom:16px;z-index:9999;border:2px solid #8af8ff;border-radius:999px;background:#063653;color:#fff;padding:12px 16px;font-weight:800;box-shadow:0 4px 22px #0008}
#jr-accessibility-launcher:focus-visible,#jr-accessibility-panel button:focus-visible,#jr-accessibility-panel select:focus-visible{outline:3px solid #fff;outline-offset:3px}
#jr-accessibility-panel{position:fixed;right:12px;bottom:76px;z-index:9998;width:min(390px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;padding:18px;background:#06172c;color:#fff;border:2px solid #62eaff;border-radius:18px;box-shadow:0 14px 45px #000b}
#jr-accessibility-panel[hidden]{display:none}
#jr-accessibility-panel h2{font-size:1.25rem;margin:0 0 8px}
#jr-accessibility-panel p{line-height:1.55}
#jr-accessibility-panel .jr-a11y-row{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
#jr-accessibility-panel button{min-height:44px;padding:10px 13px;background:#07527b;color:#fff;border:1px solid #74dfff;border-radius:10px}
#jr-accessibility-panel button[aria-pressed=true]{background:#e0fbff;color:#001522;border:2px solid #fff}
#jr-accessibility-panel .jr-a11y-phrases{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#jr-accessibility-panel .jr-a11y-phrases button{text-align:left;min-height:54px}
#jr-accessibility-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
body.jr-a11y-large{font-size:1.15em}
body.jr-a11y-large input,body.jr-a11y-large textarea,body.jr-a11y-large select,body.jr-a11y-large button{font-size:1.08em}
body.jr-a11y-contrast{filter:contrast(1.35)}
body.jr-a11y-motion *,body.jr-a11y-motion *::before,body.jr-a11y-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
#jr-a11y-skip{position:fixed;top:8px;left:8px;z-index:10001;transform:translateY(-160%);padding:12px;background:#fff;color:#001522;border:3px solid #005b82;border-radius:8px}
#jr-a11y-skip:focus{transform:translateY(0)}
@media(prefers-reduced-motion:reduce){#jr-accessibility-panel *,#jr-accessibility-launcher{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;
document.head.append(style);
function el(tag,attrs,text){const n=document.createElement(tag);Object.entries(attrs||{}).forEach(([k,v])=>{if(k==="class")n.className=v;else n.setAttribute(k,v)});if(text!==undefined)n.textContent=text;return n;}
function apply(){document.body.classList.toggle("jr-a11y-large",!!prefs.largeText);document.body.classList.toggle("jr-a11y-contrast",!!prefs.highContrast);document.body.classList.toggle("jr-a11y-motion",!!prefs.reduceMotion);try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){}}
function announce(message){status.textContent="";window.setTimeout(()=>{status.textContent=message},30);}
const skip=el("a",{id:"jr-a11y-skip",href:"#main"},"Skip to main content");
document.body.prepend(skip);
const main=document.querySelector("main");if(main&&!main.id)main.id="main";else if(!main)skip.href="#app";
const status=el("div",{id:"jr-accessibility-status","role":"status","aria-live":"polite","aria-atomic":"true"});
const launcher=el("button",{id:"jr-accessibility-launcher","type":"button","aria-expanded":"false","aria-controls":"jr-accessibility-panel","aria-label":"Open accessibility and communication options"},"Accessibility");
const panel=el("section",{id:"jr-accessibility-panel","aria-labelledby":"jr-a11y-title",hidden:""});
panel.append(el("h2",{id:"jr-a11y-title"},"Accessibility & communication"));
panel.append(el("p",{},"Choose the way JR PHEEF works best for you. These controls do not replace your device screen reader or operating-system accessibility settings."));
const controls=el("div",{class:"jr-a11y-row"});
function toggle(label,key){const b=el("button",{type:"button","aria-pressed":String(!!prefs[key])},label);b.addEventListener("click",()=>{prefs[key]=!prefs[key];b.setAttribute("aria-pressed",String(prefs[key]));apply();announce(label+" "+(prefs[key]?"on":"off"))});controls.append(b);}
toggle("Larger text","largeText");toggle("High contrast","highContrast");toggle("Reduce motion","reduceMotion");
panel.append(controls);
const readRow=el("div",{class:"jr-a11y-row"});
const read=el("button",{type:"button"},"Read this page aloud");
const stop=el("button",{type:"button"},"Stop reading");
read.addEventListener("click",()=>{if(!("speechSynthesis"in window)){announce("Text to speech is not supported by this browser. Your device screen reader can read the page.");return;}const textContent=(document.querySelector("main")||document.body).innerText.slice(0,12000);window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(textContent);utterance.lang=document.documentElement.lang||navigator.language||"en";window.speechSynthesis.speak(utterance);announce("Reading page content aloud.");});
stop.addEventListener("click",()=>{if("speechSynthesis"in window)window.speechSynthesis.cancel();announce("Reading stopped.");});
readRow.append(read,stop);panel.append(readRow);
panel.append(el("h3",{},"Quick communication phrases"));
panel.append(el("p",{},"Choose a phrase to copy, then paste it into JR messages or another conversation."));
const phrases=el("div",{class:"jr-a11y-phrases"});
["Hello, I would like to talk.","Please help me.","I need more time to respond.","Please explain that in writing.","I agree.","I do not agree.","Please contact me by text.","I need assistance navigating this page."].forEach(phrase=>{const b=el("button",{type:"button"},phrase);b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(phrase);announce("Phrase copied: "+phrase)}catch(e){const t=el("textarea",{"aria-label":"Copy this phrase"});t.value=phrase;panel.append(t);t.focus();t.select();announce("Select and copy the phrase.")}});phrases.append(b)});
panel.append(phrases);
panel.append(el("p",{class:"muted"},"JR PHEEF accessibility commitment: all core actions should be operable without sight, hearing, or speech. Video publishers should provide captions and meaningful descriptions."));
const close=el("button",{type:"button"},"Close accessibility options");
close.addEventListener("click",()=>{panel.hidden=true;launcher.setAttribute("aria-expanded","false");launcher.focus()});
panel.append(close);
launcher.addEventListener("click",()=>{panel.hidden=!panel.hidden;launcher.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden)panel.querySelector("button")?.focus()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){panel.hidden=true;launcher.setAttribute("aria-expanded","false");launcher.focus()}});
document.body.append(status,launcher,panel);
apply();
})();