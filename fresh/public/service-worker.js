"use strict";
const CACHE_NAME="jr-pheef-shell-v27";
const APP_SHELL=[
 "/",
 "/manifest.webmanifest",
 "/jr-pheef-icon.svg",
 "/styles.css?v=jr-fullscreen-pages-20261127-v1",
 "/cosmic.css?v=jr-cosmic-universe-20261115-v1",
 "/living-interface.css?v=jr-top-navigation-20261125-v1",
 "/app.js?v=jr-fullscreen-pages-20261127-v2",
 "/founder-partner.js?v=founder-jr-20261124-v1",
 "/pwa.js?v=jr-pwa-20261118-v1",
 "/living-interface.js?v=20261119-space-living-v1",
 "/public-discovery.js?v=20261118-founder-live-v1",
 "/command-layout.js?v=jr-command-center-order-20261127-v2&brand=jr-dgbo-diamond-brand-20261112-v1",
 "/worlds.js?v=jr-one-world-space-20261112-v2",
 "/intelligence.js?v=jr-agent-orchestration-20261125-v2",
 "/navigation.js?v=jr-browser-history-20261127-v2",
 "/scroll-companion.css?v=jr-scroll-companion-20261124-v1",
 "/scroll-companion.js?v=jr-scroll-companion-20261124-v1",
 "/voice.js?v=jr-connect-voice-20261112-v3",
 "/cosmic.js?v=jr-cosmic-universe-20261115-v1",
 "/business.js?v=jr-business-ops-v1",
 "/diamond-company-worlds.css?v=diamond-company-worlds-20261118-v1",
 "/company-offices.css?v=company-offices-20261127-v1",
 "/company-offices.js?v=company-offices-20261127-v1",
 "/transport-world.css?v=jr-move-connected-world-20261118-v1",
 "/connected-world-engine.css?v=connected-world-engine-20261118-v1",
 "/diamond-company-worlds.js?v=diamond-company-worlds-20261118-v1",
 "/transport-world.js?v=jr-move-connected-world-20261118-v1",
 "/connected-world-engine.js?v=connected-world-engine-20261118-v1",
 "/agent-universe.css?v=9",
 "/agent-universe.js?v=13",
 "/personal-settings.js?v=jr-personal-settings-20261127-v6"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("jr-pheef-")&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith("/api/")||url.pathname==="/healthz"||url.pathname.startsWith("/auth/"))return;
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put("/",copy));}
   return response;
  }).catch(()=>caches.match("/")));
  return;
 }
 if(APP_SHELL.some(item=>new URL(item,self.location.origin).pathname===url.pathname)){
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
   return response;
  })));
 }
});
