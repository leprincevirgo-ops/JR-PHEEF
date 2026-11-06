"use strict";
const VERSION="jr-shell-v12";
const SHELL_CACHE=VERSION+"-shell";
const ASSET_CACHE=VERSION+"-assets";
const OFFLINE_URL="/offline.html";
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL_CACHE);
  await cache.addAll(["/",OFFLINE_URL]);
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith("jr-shell-")||key.startsWith("jr-assets-")).filter(key=>key!==SHELL_CACHE&&key!==ASSET_CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
 if(request.mode==="navigate"){
  event.respondWith((async()=>{
   try{
    const response=await fetch(request);
    if(response.ok){const cache=await caches.open(SHELL_CACHE);cache.put("/",response.clone());}
    return response;
   }catch{
    return (await caches.match(request))||(await caches.match("/"))||(await caches.match(OFFLINE_URL));
   }
  })());
  return;
 }
 if(["script","style","image","font"].includes(request.destination)){
  event.respondWith((async()=>{
   const cache=await caches.open(ASSET_CACHE),cached=await cache.match(request);
   const network=fetch(request).then(response=>{if(response.ok&&response.type==="basic")cache.put(request,response.clone());return response;}).catch(()=>null);
   return cached||await network||Response.error();
  })());
 }
});
