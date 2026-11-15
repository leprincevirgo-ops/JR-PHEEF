"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const body=document.body;
 if(!body||body.dataset.jrCosmicReady==="true")return;
 body.dataset.jrCosmicReady="true";
 body.classList.add("jr-cosmic-enabled");

 // A light star field gives the entry screen a living sky without large images.
 const sky=document.createElement("div");
 sky.className="jr-cosmic-sky";
 sky.setAttribute("aria-hidden","true");
 for(let i=0;i<54;i++){
  const star=document.createElement("i");
  star.className="jr-cosmic-star";
  star.style.left=((i*37)%100)+"%";
  star.style.top=((i*61+7)%100)+"%";
  star.style.setProperty("--star-opacity",String(.28+((i*13)%60)/100));
  star.style.setProperty("--star-speed",(3+(i%7))+"s");
  star.style.animationDelay=(-(i%9))+"s";
  sky.append(star);
 }
 body.prepend(sky);

 const home=$("view-home"),worlds=$("view-worlds");
 if(home){
  const welcome=document.createElement("section");
  welcome.className="jr-cosmic-home";
  welcome.setAttribute("aria-label","Welcome to the JR PHEEF universe");
  welcome.innerHTML='<div class="jr-cosmic-home-copy"><span class="jr-cosmic-kicker">YOUR UNIVERSE · JR PHEEF</span><h2>There is more to discover.</h2><p>Explore new places, learn something interesting, meet people and create things. JR is here whenever you need a hand.</p><div class="jr-cosmic-actions"><button type="button" data-cosmic-open="explorer">Explore the universe</button><button type="button" data-cosmic-open="jr">Talk to JR</button></div></div><div class="jr-cosmic-planet-wrap" aria-hidden="true"><span class="jr-cosmic-moon"></span><span class="jr-cosmic-planet"></span></div><button type="button" class="jr-cosmic-pause" aria-pressed="false">Pause movement</button>';
  const heading=home.querySelector(".section-heading");
  home.insertBefore(welcome,heading||home.firstChild);
  const discoveries=document.createElement("section");
  discoveries.className="jr-cosmic-discoveries";
  discoveries.innerHTML='<div class="jr-cosmic-section-head"><div><p class="eyebrow">A LITTLE INSPIRATION</p><h3>Places to explore</h3></div><p>Choose a place and see where it takes you.</p></div><div class="jr-cosmic-discovery-grid"><button class="jr-cosmic-discovery" type="button" data-cosmic-place="forest"><span class="jr-cosmic-card-icon">🌿</span><strong>Find a forest</strong><small>Explore trees, wildlife and the world around them.</small></button><button class="jr-cosmic-discovery" type="button" data-cosmic-place="ocean"><span class="jr-cosmic-card-icon">🌊</span><strong>Dive into the ocean</strong><small>Discover sea life, deep water and ocean science.</small></button><button class="jr-cosmic-discovery" type="button" data-cosmic-place="space"><span class="jr-cosmic-card-icon">✨</span><strong>Look into space</strong><small>Explore stars, planets and big questions.</small></button></div>';
  if(welcome.nextSibling)home.insertBefore(discoveries,welcome.nextSibling);else home.append(discoveries);
 }
 if(worlds){
  const explorer=document.createElement("section");
  explorer.className="jr-cosmic-explorer";
  explorer.id="jrCosmicExplorer";
  explorer.setAttribute("aria-labelledby","jrCosmicExplorerTitle");
  explorer.innerHTML='<p class="eyebrow">EXPLORE THE UNIVERSE</p><h3 id="jrCosmicExplorerTitle">Where would you like to go?</h3><p class="jr-cosmic-explorer-intro">Travel through big ideas, meet new interests and explore places inspired by our world and imagination. You can move between them freely.</p><div class="jr-cosmic-section-head"><div><p class="eyebrow">THE GALAXIES</p><h3>Big places to discover</h3></div></div><div class="jr-cosmic-galaxy-grid"><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="knowledge"><span class="jr-cosmic-card-icon">🔭</span><strong>Knowledge</strong><small>Science, learning, nature and discovery.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="human"><span class="jr-cosmic-card-icon">🤝</span><strong>Human</strong><small>People, friendships and communities.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="creation"><span class="jr-cosmic-card-icon">🎨</span><strong>Creation</strong><small>Art, music, stories and entertainment.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="living"><span class="jr-cosmic-card-icon">🌱</span><strong>Living</strong><small>Everyday life, homes and the outdoors.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="opportunity"><span class="jr-cosmic-card-icon">🌟</span><strong>Opportunity</strong><small>Work, business and useful connections.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="innovation"><span class="jr-cosmic-card-icon">⚙️</span><strong>Innovation</strong><small>Technology, ideas and inventions.</small></button></div><div class="jr-cosmic-section-head"><div><p class="eyebrow">NATURAL & IMAGINED PLACES</p><h3>Explore different environments</h3></div></div><div class="jr-cosmic-environment-grid"><button class="jr-cosmic-environment" data-scene="space" type="button" data-cosmic-place="space"><span class="jr-cosmic-card-icon">🌌</span><strong>Space</strong><small>Stars and planets</small></button><button class="jr-cosmic-environment" data-scene="forest" type="button" data-cosmic-place="forest"><span class="jr-cosmic-card-icon">🌳</span><strong>Forests</strong><small>Trees and wildlife</small></button><button class="jr-cosmic-environment" data-scene="ocean" type="button" data-cosmic-place="ocean"><span class="jr-cosmic-card-icon">🐬</span><strong>Oceans</strong><small>Sea life and water</small></button><button class="jr-cosmic-environment" data-scene="mountain" type="button" data-cosmic-place="mountain"><span class="jr-cosmic-card-icon">🏔️</span><strong>Mountains</strong><small>High places and snow</small></button><button class="jr-cosmic-environment" data-scene="city" type="button" data-cosmic-place="city"><span class="jr-cosmic-card-icon">🏙️</span><strong>Cities</strong><small>People and places</small></button><button class="jr-cosmic-environment" data-scene="underwater" type="button" data-cosmic-place="underwater"><span class="jr-cosmic-card-icon">🪸</span><strong>Underwater</strong><small>Life beneath the sea</small></button><button class="jr-cosmic-environment" data-scene="desert" type="button" data-cosmic-place="desert"><span class="jr-cosmic-card-icon">🏜️</span><strong>Deserts</strong><small>Land, sand and survival</small></button><button class="jr-cosmic-environment" data-scene="garden" type="button" data-cosmic-place="garden"><span class="jr-cosmic-card-icon">🌼</span><strong>Gardens</strong><small>Plants and growing things</small></button></div><div id="jrCosmicPlaceDetail" class="jr-cosmic-place-detail" hidden aria-live="polite"><div><h4 id="jrCosmicPlaceTitle"></h4><p id="jrCosmicPlaceCopy"></p></div><div class="jr-cosmic-place-actions"><button type="button" id="jrCosmicAsk">Ask JR about this</button><button type="button" id="jrCosmicClose">Close</button></div></div>';
  const container=worlds.querySelector(".worlds-workspace");
  worlds.insertBefore(explorer,container||worlds.firstChild);
 }
 const places={
  knowledge:["Knowledge","Explore science, nature, history and new things to learn."],
  human:["Human","Discover ways to meet people, share interests and build communities."],
  creation:["Creation","Explore music, art, photography, stories and ways to make something new."],
  living:["Living","Discover homes, food, travel, nature and useful everyday experiences."],
  opportunity:["Opportunity","Explore work, business ideas and ways people can help one another."],
  innovation:["Innovation","Discover technology, inventions, machines and new ideas."],
  space:["Space","Look beyond Earth. Explore stars, planets, space science and the questions people are still trying to answer."],
  forest:["Forest","Explore trees, wildlife, weather, plants and how a forest supports life."],
  ocean:["Ocean","Discover sea life, coral reefs, ocean currents, deep water and the people who study and protect them."],
  mountain:["Mountains","Explore high places, rocks, snow, weather, plants and the life found on mountain slopes."],
  city:["City","Explore buildings, streets, transport, culture, people and how a city works."],
  underwater:["Underwater world","Discover coral, fish, underwater landscapes and the hidden life beneath the surface."],
  desert:["Desert","Explore sand, rocks, plants, animals and how life adapts to dry places."],
  garden:["Garden","Discover plants, soil, insects, food growing and the small worlds found in a garden."]
 };
 let selectedPlace="";
 const detail=$("jrCosmicPlaceDetail");
 function openJr(prompt){
  const tab=document.querySelector('.workspace-tab[data-view="jr"]');
  if(tab)tab.click();
  const input=$("workspacePrompt");
  if(input){input.value=prompt;input.focus();}
  const view=$("view-jr");
  if(view)view.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 }
 function showPlace(key){
  const place=places[key];if(!place||!detail)return;
  selectedPlace=key;
  $("jrCosmicPlaceTitle").textContent=place[0];
  $("jrCosmicPlaceCopy").textContent=place[1]+" Choose “Ask JR about this” to explore it further.";
  detail.hidden=false;
  detail.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});
 }
 document.addEventListener("click",event=>{
  const placeButton=event.target.closest("[data-cosmic-place]");
  if(placeButton){showPlace(placeButton.dataset.cosmicPlace);return;}
  const openButton=event.target.closest("[data-cosmic-open]");
  if(openButton){
   if(openButton.dataset.cosmicOpen==="explorer"){
    const tab=document.querySelector('.workspace-tab[data-view="worlds"]');if(tab)tab.click();
    $("jrCosmicExplorer")?.scrollIntoView({behavior:"smooth",block:"start"});
   }else openJr("");
   return;
  }
  if(event.target.closest("#jrCosmicAsk")&&selectedPlace){
   const place=places[selectedPlace];openJr("Take me on an exploration of "+place[0]+". Help me discover what is there and how it connects to other things.");
  }
  if(event.target.closest("#jrCosmicClose")&&detail)detail.hidden=true;
  const pause=event.target.closest(".jr-cosmic-pause");
  if(pause){
   const paused=body.classList.toggle("jr-cosmic-paused");
   pause.textContent=paused?"Resume movement":"Pause movement";
   pause.setAttribute("aria-pressed",String(paused));
  }
 });
 // Keep the welcome experience respectful of the visitor's local time.
 const updateSky=()=>{
  const hour=new Date().getHours();
  body.dataset.jrCosmicTime=hour>=6&&hour<18?"day":"night";
 };
 updateSky();
})();
