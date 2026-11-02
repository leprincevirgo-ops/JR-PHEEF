(function(){
 "use strict";
 function openWorldNode(event){
  const button=event.target.closest("[data-world-open]");
  if(!button)return;
  const page=button.getAttribute("data-world-open");
  if(typeof window.show==="function")window.show(page);
 }
 document.addEventListener("click",openWorldNode);
})();