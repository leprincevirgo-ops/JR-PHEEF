(()=>{"use strict";
const search=document.getElementById("worldSearch"),cards=[...document.querySelectorAll(".world-card")];
if(search)search.addEventListener("input",()=>{const q=search.value.trim().toLocaleLowerCase();for(const card of cards)card.hidden=!String(card.dataset.search||"").includes(q)&&!card.textContent.toLocaleLowerCase().includes(q);});
const lessons=[...document.querySelectorAll(".lesson")],count=document.getElementById("progressCount"),text=document.getElementById("progressText"),bar=document.getElementById("progressBar");
const key="jr-pheef-guide-progress-v1";let done=new Set();
try{const saved=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(saved))done=new Set(saved.filter(x=>lessons.some(l=>l.dataset.lesson===x)));}catch{}
function render(){const n=done.size;if(count)count.textContent=n+" of "+lessons.length+" lessons completed";if(text)text.textContent=n===lessons.length?"You have completed the guide on this device.":n?"Good progress. Continue whenever you are ready.":"Your learning journey starts here.";if(bar)bar.style.width=(lessons.length?n/lessons.length*100:0)+"%";for(const lesson of lessons){const b=lesson.querySelector(".complete-lesson");if(!b)continue;const isDone=done.has(lesson.dataset.lesson);b.setAttribute("aria-pressed",String(isDone));b.textContent=isDone?"Completed ✓ · Undo":"Mark lesson complete";}}
for(const lesson of lessons){const b=lesson.querySelector(".complete-lesson");if(b)b.addEventListener("click",()=>{const id=lesson.dataset.lesson;if(done.has(id))done.delete(id);else done.add(id);try{localStorage.setItem(key,JSON.stringify([...done]));}catch{}render();});}
render();
})();