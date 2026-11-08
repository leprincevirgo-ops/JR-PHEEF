/* JR PHEEF Screen Studio — member-controlled layout editor. */
(function(){
"use strict";
const KEY="jr-pheef-screen-studio-v1";
const HOME=[".jp-home-hero",".jp-universe-start",".jp-home-stat-row",".jp-home-columns"];
const DEFAULT={homeOrder:HOME,homeHidden:[],dockOrder:["more","business","social","accessibility","settings"],dockHidden:[],dockLabels:{},railOrder:[0,1,2,3],railHidden:[],notes:[]};
const $=s=>document.querySelector(s);
const clone=x=>JSON.parse(JSON.stringify(x));
let state=load(),dialog=null,voice=null,dragged=null;
function load(){try{return {...clone(DEFAULT),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return clone(DEFAULT)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));apply();const s=$("#jpScreenStudioStatus");if(s)s.textContent="Saved on this device."}
function apply(){
 const home=$("#home");
 if(home){const nodes=state.homeOrder.map(s=>home.querySelector(s)).filter(Boolean);nodes.forEach(n=>home.append(n));state.homeHidden.forEach(s=>(function(){var node=home.querySelector(s);if(node)node.classList.add("jp-studio-hidden");})());state.homeOrder.filter(s=>!state.homeHidden.includes(s)).forEach(s=>(function(){var node=home.querySelector(s);if(node)node.classList.remove("jp-studio-hidden");})());
 home.querySelectorAll("[data-jp-custom-note]").forEach(n=>n.remove());state.notes.forEach(note=>{const card=document.createElement("section");card.className="jp-home-panel jp-studio-note";card.dataset.jpCustomNote="true";const h=document.createElement("h3");h.textContent=note.title||"My note";const p=document.createElement("p");p.textContent=note.text||"";card.append(h,p);home.append(card)})}
 const dock=$("#jpMobileDock");if(dock){state.dockOrder.forEach(k=>{const n=dock.querySelector('[data-mobile-destination="'+k+'"]');if(n)dock.append(n)});dock.querySelectorAll("[data-mobile-destination]").forEach(n=>{const k=n.dataset.mobileDestination;n.classList.toggle("jp-studio-hidden",state.dockHidden.includes(k));const label=n.querySelector(".jp-mobile-dock-label");if(label)label.textContent=state.dockLabels[k]||({more:"More",business:"Business",social:"Social",accessibility:"Access",settings:"Settings"}[k]||k)})}
 const rail=$("#jpActionRail");if(rail){const buttons=[...rail.querySelectorAll("button")];buttons.forEach((n,i)=>{if(!n.dataset.jpRailIndex)n.dataset.jpRailIndex=String(i)});state.railOrder.forEach(i=>{const n=rail.querySelector('[data-jp-rail-index="'+i+'"]');if(n)rail.append(n)});buttons.forEach(n=>n.classList.toggle("jp-studio-hidden",state.railHidden.includes(Number(n.dataset.jpRailIndex))))}
}
function make(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function open(){if(dialog){dialog.hidden=false;render()} }
function close(){if(dialog)dialog.hidden=true}
function createDialog(){
 dialog=make("div","jp-screen-studio-overlay");dialog.id="jpScreenStudio";dialog.hidden=true;
 const box=make("section","jp-screen-studio");box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-labelledby","jpScreenStudioTitle");
 const head=make("div","jp-screen-studio-head");const title=make("div","");title.append(make("div","jp-studio-kicker","YOUR SCREEN · YOUR CONTROL"),make("h2","","Screen Studio"));title.id="jpScreenStudioTitle";
 const closeBtn=make("button","jp-studio-close","✕");closeBtn.type="button";closeBtn.setAttribute("aria-label","Close Screen Studio");closeBtn.onclick=close;head.append(title,closeBtn);
 const intro=make("p","jp-studio-intro","Arrange your dashboard and phone navigation. Drag items, rename buttons, hide what you don't use, or tell JR what to change.");
 const tabs=make("div","jp-studio-tabs");["Dashboard","Phone navigation","Quick access","Add content"].forEach((t,i)=>{const b=make("button","",t);b.type="button";b.dataset.tab=String(i);b.onclick=()=>{dialog.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));dialog.dataset.activeTab=String(i);render()};tabs.append(b)});
 const body=make("div","jp-studio-body");body.id="jpScreenStudioBody";
 const voiceRow=make("div","jp-studio-command");const command=make("input");command.id="jpStudioCommand";command.placeholder='Type a change, e.g. "hide Social" or "move Settings up"';command.setAttribute("aria-label","Describe a screen change");const applyBtn=make("button","primary","Apply");applyBtn.type="button";applyBtn.onclick=()=>runCommand(command.value);const mic=make("button","jp-studio-mic","🎙");mic.type="button";mic.setAttribute("aria-label","Speak a screen change");mic.onclick=startVoice;voiceRow.append(command,mic,applyBtn);
 const status=make("p","jp-studio-status","Changes are saved on this device.");status.id="jpScreenStudioStatus";
 const footer=make("div","jp-studio-footer");const reset=make("button","dark","Reset layout");reset.type="button";reset.onclick=()=>{if(confirm("Reset your dashboard and phone navigation to the JR PHEEF default layout?")){state=clone(DEFAULT);save();render()}};const done=make("button","primary","Done");done.type="button";done.onclick=close;footer.append(reset,done);
 box.append(head,intro,tabs,body,voiceRow,status,footer);dialog.append(box);dialog.addEventListener("click",e=>{if(e.target===dialog)close()});document.body.append(dialog);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&dialog&&!dialog.hidden)close()});
}
function listItem(label,key,hidden,rename,up,down,dragKind){
 const row=make("div","jp-studio-row");row.draggable=true;row.dataset.dragKey=key;row.dataset.dragKind=dragKind;
 const grip=make("span","jp-studio-grip","⠿");grip.title="Drag to reorder";
 const name=make("strong","",label);const actions=make("div","jp-studio-row-actions");
 if(rename){const edit=make("button","","✎");edit.type="button";edit.title="Rename";edit.onclick=()=>{const v=prompt("New button label",label);if(v&&v.trim())rename(v.trim())};actions.append(edit)}
 const toggle=make("button","",hidden?"Show":"Hide");toggle.type="button";toggle.onclick=()=>{toggleHidden(key,dragKind);render()};
 const upBtn=make("button","","↑");upBtn.type="button";upBtn.title="Move up";upBtn.onclick=()=>move(key,dragKind,-1);
 const downBtn=make("button","","↓");downBtn.type="button";downBtn.title="Move down";downBtn.onclick=()=>move(key,dragKind,1);
 actions.append(toggle,upBtn,downBtn);row.append(grip,name,actions);
 row.addEventListener("dragstart",e=>{dragged={key,kind:dragKind};row.classList.add("dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",key)});
 row.addEventListener("dragend",()=>{dragged=null;row.classList.remove("dragging")});
 row.addEventListener("dragover",e=>{if(dragged&&dragged.kind===dragKind){e.preventDefault();row.classList.add("drag-over")}});
 row.addEventListener("dragleave",()=>row.classList.remove("drag-over"));
 row.addEventListener("drop",e=>{e.preventDefault();row.classList.remove("drag-over");if(dragged&&dragged.kind===dragKind){reorder(dragged.key,key,dragKind);dragged=null;render()}});
 return row;
}
function toggleHidden(key,kind){const prop=kind==="home"?"homeHidden":kind==="dock"?"dockHidden":"railHidden";const value=kind==="rail"?Number(key):key;const a=state[prop];state[prop]=a.includes(value)?a.filter(x=>x!==value):[...a,value];save()}
function move(key,kind,delta){const prop=kind==="home"?"homeOrder":kind==="dock"?"dockOrder":"railOrder";const a=state[prop],i=a.indexOf(kind==="rail"?Number(key):key),j=Math.max(0,Math.min(a.length-1,i+delta));if(i<0||i===j)return;[a[i],a[j]]=[a[j],a[i]];save();render()}
function reorder(from,to,kind){const prop=kind==="home"?"homeOrder":kind==="dock"?"dockOrder":"railOrder",a=state[prop],f=a.indexOf(kind==="rail"?Number(from):from),t=a.indexOf(kind==="rail"?Number(to):to);if(f<0||t<0)return;a.splice(t,0,a.splice(f,1)[0]);save()}
function render(){
 const body=$("#jpScreenStudioBody");if(!body)return;body.replaceChildren();const tab=dialog.dataset.activeTab||"0";
 if(tab==="0"){body.append(make("h3","","Dashboard sections"));const home=$("#home");HOME.forEach((s,i)=>{const n=(home?home.querySelector(s):null);if(n)body.append(listItem(((n.querySelector("h1,h2")?n.querySelector("h1,h2").textContent:"")||["Hero","Your request","Your summary","Your activity and account"][i]).trim(),s,state.homeHidden.includes(s),null,null,null,"home"))})}
 if(tab==="1"){body.append(make("h3","","Bottom phone navigation"));const labels={more:"More",business:"Business",social:"Social",accessibility:"Accessibility",settings:"Settings"};state.dockOrder.forEach(k=>body.append(listItem(state.dockLabels[k]||labels[k],k,state.dockHidden.includes(k),v=>{state.dockLabels[k]=v;save();render()},null,null,"dock")))}
 if(tab==="2"){body.append(make("h3","","Quick access shortcuts"));const labels=["Discover & Learn","Create & Work","Connect","My Space"];state.railOrder.forEach(i=>body.append(listItem(labels[i]||"Shortcut "+(i+1),String(i),state.railHidden.includes(i),null,null,null,"rail")))}
 if(tab==="3"){body.append(make("h3","","Add your own dashboard content"));const title=make("input");title.id="jpStudioNoteTitle";title.placeholder="Card title";const text=make("textarea");text.id="jpStudioNoteText";text.rows=3;text.maxLength=1000;text.placeholder="Write a note, reminder, instruction or idea…";const add=make("button","primary","＋ Add to dashboard");add.type="button";add.onclick=()=>{const t=title.value.trim(),v=text.value.trim();if(!v)return;state.notes.push({title:t||"My note",text:v});save();title.value="";text.value="";$("#jpScreenStudioStatus").textContent="Your content was added to the dashboard.";};body.append(title,text,add);state.notes.forEach((n,i)=>{const row=make("div","jp-studio-row",n.title+" — "+n.text.slice(0,60));const del=make("button","","Remove");del.onclick=()=>{state.notes.splice(i,1);save();render()};row.append(del);body.append(row)})}
}
function runCommand(raw){const q=String(raw||"").trim();if(!q)return;const s=q.toLowerCase();const match=["more","business","social","accessibility","settings"].find(x=>s.includes(x));if((s.startsWith("hide ")||s.startsWith("show "))&&match){const hide=s.startsWith("hide "),a=state.dockHidden;state.dockHidden=hide?[...new Set([...a,match])]:a.filter(x=>x!==match);save();render();$("#jpStudioCommand").value="";return}
 const moveMatch=s.match(/move\s+(more|business|social|accessibility|settings)\s+(up|down|left|right)/);if(moveMatch){move(moveMatch[1],"dock",["up","left"].includes(moveMatch[2])?-1:1);$("#jpStudioCommand").value="";return}
 const rename=s.match(/rename\s+(more|business|social|accessibility|settings)\s+to\s+(.+)/);if(rename){state.dockLabels[rename[1]]=q.slice(rename[0].toLowerCase().indexOf(" to ")+4).trim();save();render();$("#jpStudioCommand").value="";return}
 $("#jpScreenStudioStatus").textContent='I could not apply that instruction. Try "hide Social", "show Settings", "move More down", or use the controls.'}
function startVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$("#jpScreenStudioStatus").textContent="Voice input is not supported by this browser. You can type the same instruction.";return}if(voice){voice.stop();voice=null}voice=new SR();voice.lang=navigator.language||"en-US";voice.interimResults=false;voice.onresult=e=>{const t=e.results[0][0].transcript;$("#jpStudioCommand").value=t;runCommand(t)};voice.onerror=()=>$("#jpScreenStudioStatus").textContent="Voice input did not complete. Please try again or type.";voice.start();$("#jpScreenStudioStatus").textContent="Listening… describe the screen change."}
function mount(){
 const home=$("#home");if(!home)return false;
 let changed=false;
 if(!dialog){createDialog();window.jrOpenScreenStudio=open;window.jrScreenStudioApplyCommand=runCommand;changed=true}
 if(!home.querySelector(".jp-screen-studio-launch")){
  const btn=make("button","jp-screen-studio-launch","✎ Customize my screen");
  btn.type="button";btn.onclick=open;
  const heading=home.querySelector(".jp-section-head");
  if(heading&&heading.parentElement===home)home.insertBefore(btn,heading.nextSibling);else home.append(btn);changed=true;
 }
 if(changed)apply();
 return true;
}
function startMount(){
 mount();
 const observer=new MutationObserver(()=>{
  const home=$("#home");
  if(home&&(!dialog||!home.querySelector(".jp-screen-studio-launch")))mount();
 });
 observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startMount,{once:true});else startMount();
})();