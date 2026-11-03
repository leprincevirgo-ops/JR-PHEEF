"use strict";
(function(){
 if(!("serviceWorker" in navigator))return;
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/service-worker.js",{scope:"/"})
   .then(()=>document.documentElement.dataset.jrOfflineReady="true")
   .catch(()=>{document.documentElement.dataset.jrOfflineReady="false";});
 });
})();
