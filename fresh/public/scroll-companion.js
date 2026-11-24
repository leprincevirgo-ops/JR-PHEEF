"use strict";
(()=> {
  if (document.getElementById("jrScrollCompanion")) return;
  const KEY="jr-pheef-scroll-companion-v1";
  const styles=["flow","spider","orb","butterfly","classic","off"];
  const labels={flow:"JR Flow — light trail",spider:"JR Spider — eight-legged guide",orb:"JR Orb — glowing sphere",butterfly:"JR Butterfly — flying guide",classic:"Classic scrollbar",off:"No companion"};
  let selected="flow";
  try { const saved=localStorage.getItem(KEY); if(styles.includes(saved)) selected=saved; } catch {}
  const reduced=()=>window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dock=document.createElement("div");
  dock.id="jrScrollCompanion";
  dock.className="jr-scroll-companion";
  dock.innerHTML='<button type="button" class="jr-sc-handle" id="jrScHandle" aria-label="Scroll companion. Swipe left for forward, right for back, up for bottom, down for top. Tap to choose a style." aria-controls="jrScPanel" aria-expanded="false"><span class="jr-sc-glyph" aria-hidden="true"></span></button><section class="jr-sc-panel" id="jrScPanel" aria-labelledby="jrScTitle" hidden><div class="jr-sc-panel-head"><div><p class="jr-sc-eyebrow">PERSONAL READING CONTROL</p><h2 id="jrScTitle">Choose your scroll companion</h2></div><button type="button" class="jr-sc-close" id="jrScClose" aria-label="Close">×</button></div><p class="jr-sc-description">Choose a visual style or turn the companion off. Your choice stays on this device.</p><label class="jr-sc-label" for="jrScStyle">Scroll style</label><select id="jrScStyle" class="jr-sc-select"><option value="flow">JR Flow — light trail</option><option value="spider">JR Spider — eight-legged guide</option><option value="orb">JR Orb — glowing sphere</option><option value="butterfly">JR Butterfly — flying guide</option><option value="classic">Classic scrollbar</option><option value="off">No companion</option></select><p class="jr-sc-help">Swipe on the companion: left = forward, right = back, up = bottom, down = top. Normal page scrolling and text selection remain available.</p><p class="jr-sc-status" id="jrScStatus" role="status" aria-live="polite"></p></section>';
  document.body.append(dock);
  const handle=dock.querySelector("#jrScHandle"),panel=dock.querySelector("#jrScPanel"),select=dock.querySelector("#jrScStyle"),status=dock.querySelector("#jrScStatus");
  const glyph=dock.querySelector(".jr-sc-glyph");
  const spider='<svg viewBox="0 0 64 64" focusable="false"><g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M25 23 13 13 5 17M22 29 9 26 4 32M22 36 9 40 5 48M26 42 17 54 9 55M39 23 51 13 59 17M42 29 55 26 60 32M42 36 55 40 59 48M38 42 47 54 55 55"/></g><ellipse cx="32" cy="34" rx="12" ry="15" fill="currentColor"/><circle cx="28" cy="30" r="2" fill="#06172c"/><circle cx="36" cy="30" r="2" fill="#06172c"/></svg>';
  function draw(){
    dock.dataset.style=selected;
    glyph.innerHTML=selected==="spider"?spider:selected==="butterfly"?"🦋":selected==="orb"?"":selected==="classic"?"↕":selected==="off"?"": "✧";
    handle.hidden=selected==="off";
    dock.classList.toggle("is-classic",selected==="classic");
    dock.classList.toggle("is-off",selected==="off");
    handle.setAttribute("aria-label",labels[selected]+". Swipe left for forward, right for back, up for bottom, down for top. Tap to choose a style.");
    if(selected==="off") closePanel();
    try{localStorage.setItem(KEY,selected)}catch{}
  }
  function announce(message){status.textContent=message;}
  function openPanel(){panel.hidden=false;handle.setAttribute("aria-expanded","true");select.value=selected;select.focus();}
  function closePanel(){panel.hidden=true;handle.setAttribute("aria-expanded","false");}
  function activate(id){const button=document.getElementById(id);if(button&&!button.disabled){button.click();return true;}return false;}
  function move(direction){
    if(direction==="left"){activate("jrPageForward");announce("Moving forward.");}
    else if(direction==="right"){activate("jrPageBack");announce("Moving back.");}
    else if(direction==="up"){activate("jrPageBottom");announce("Moving to the bottom.");}
    else if(direction==="down"){activate("jrPageTop");announce("Moving to the top.");}
  }
  let start=null;
  handle.addEventListener("pointerdown",event=>{if(event.button!==undefined&&event.button!==0)return;start={x:event.clientX,y:event.clientY,id:event.pointerId};try{handle.setPointerCapture(event.pointerId)}catch{}});
  handle.addEventListener("pointerup",event=>{
    if(!start)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    const ax=Math.abs(dx),ay=Math.abs(dy);
    if(Math.max(ax,ay)<24){if(panel.hidden)openPanel();else closePanel();return;}
    if(Math.max(ax,ay)<38)return;
    if(ax>ay)move(dx<0?"left":"right");else move(dy<0?"up":"down");
  });
  handle.addEventListener("pointercancel",()=>{start=null});
  handle.addEventListener("keydown",event=>{
    const map={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
    if(map[event.key]){event.preventDefault();move(map[event.key]);}
    else if(event.key==="Enter"||event.key===" "){event.preventDefault();openPanel();}
  });
  select.addEventListener("change",()=>{selected=styles.includes(select.value)?select.value:"flow";draw();announce("Selected "+labels[selected]+".");if(selected==="off")closePanel();else handle.focus();});
  dock.querySelector("#jrScClose").addEventListener("click",()=>{closePanel();handle.focus()});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!panel.hidden){closePanel();handle.focus()}});
  const media=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)");
  if(media)media.addEventListener?.("change",()=>dock.classList.toggle("jr-sc-reduced",reduced()));
  dock.classList.toggle("jr-sc-reduced",reduced());
  draw();
})();