"use strict";
(()=>{
 if(document.getElementById("jrPageNavigation"))return;
 const dock=document.createElement("nav");
 dock.id="jrPageNavigation";
 dock.className="jr-page-navigation";
 dock.setAttribute("aria-label","Page navigation");
 dock.innerHTML='<button type="button" id="jrPageBack" aria-label="Go back" title="Go back">← Back</button><button type="button" id="jrPageTop" class="jr-nav-top" aria-label="Back to top" title="Back to top">↑</button><button type="button" id="jrPageBottom" aria-label="Go to page bottom" title="Go to page bottom">↓ Bottom</button>';
 document.body.append(dock);
 const top=dock.querySelector("#jrPageTop");
 const back=dock.querySelector("#jrPageBack");
 const bottom=dock.querySelector("#jrPageBottom");
 const update=()=>{top.disabled=window.scrollY<80;};
 top.addEventListener("click",()=>window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));
 bottom.addEventListener("click",()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));
 back.addEventListener("click",()=>{
  if(window.history.length>1)window.history.back();
  else window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
 });
 window.addEventListener("scroll",update,{passive:true});
 window.addEventListener("pageshow",update);
 update();
})();