"use strict";
(()=>{
 if(document.getElementById("jrPageNavigation"))return;
 const dock=document.createElement("nav");
 dock.id="jrPageNavigation";dock.className="jr-page-navigation";dock.setAttribute("aria-label","Page navigation");
 dock.innerHTML='<button type="button" id="jrPageBack" aria-label="Back to previous JR page" title="Previous page"><span aria-hidden="true">←</span></button><button type="button" id="jrPageForward" aria-label="Forward to next JR page" title="Next page"><span aria-hidden="true">→</span></button><span class="jr-nav-divider" aria-hidden="true"></span><button type="button" id="jrPageTop" aria-label="Go to top" title="Go to top"><span aria-hidden="true">↑</span></button><button type="button" id="jrPageBottom" aria-label="Go to bottom" title="Go to bottom"><span aria-hidden="true">↓</span></button>';
 document.body.append(dock);
 const $=id=>document.getElementById(id),back=$("jrPageBack"),forward=$("jrPageForward"),top=$("jrPageTop"),bottom=$("jrPageBottom");
 const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
 const sync=()=>{back.disabled=history.length<=1;forward.disabled=true;top.disabled=window.scrollY<60;bottom.disabled=document.documentElement.scrollHeight-window.innerHeight-window.scrollY<60;};
 back.addEventListener("click",()=>history.back());forward.addEventListener("click",()=>history.forward());
 top.addEventListener("click",()=>window.scrollTo({top:0,behavior:reduced()?"auto":"smooth"}));bottom.addEventListener("click",()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:reduced()?"auto":"smooth"}));
 let lastScrollY=window.scrollY||0;
 window.addEventListener("scroll",()=>{const y=window.scrollY||0;if(y<48||y<lastScrollY-3)document.body.classList.remove("jr-scrolling-down");else if(y>lastScrollY+3)document.body.classList.add("jr-scrolling-down");lastScrollY=y;sync();},{passive:true});
 window.addEventListener("popstate",sync);window.addEventListener("pageshow",sync);sync();
})();