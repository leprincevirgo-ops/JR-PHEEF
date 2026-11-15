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
  welcome.innerHTML='<div class="jr-cosmic-home-copy"><span class="jr-cosmic-kicker">YOUR UNIVERSE · JR PHEEF</span><span class="jr-cosmic-time-label" aria-live="polite"> <span id="jrCosmicTimeLabel">Your local sky</span></span><h2>There is more to discover.</h2><p>Explore new places, learn something interesting, meet people and create things. JR is here whenever you need a hand.</p><div class="jr-cosmic-actions"><button type="button" data-cosmic-open="explorer">Explore the universe</button><button type="button" data-cosmic-open="jr">Talk to JR</button></div></div><div class="jr-cosmic-planet-wrap" aria-hidden="true"><span class="jr-cosmic-moon"></span><span class="jr-cosmic-planet"></span></div><button type="button" class="jr-cosmic-pause" aria-pressed="false">Pause movement</button>';
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
  explorer.innerHTML='<p class="eyebrow">EXPLORE THE UNIVERSE</p><h3 id="jrCosmicExplorerTitle">Where would you like to go?</h3><p class="jr-cosmic-explorer-intro">Travel through big ideas, meet new interests and explore places inspired by our world and imagination. You can move between them freely.</p><div class="jr-cosmic-section-head"><div><p class="eyebrow">THE GALAXIES</p><h3>Big places to discover</h3></div></div><div class="jr-cosmic-galaxy-grid"><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="knowledge"><span class="jr-cosmic-card-icon">🔭</span><strong>Knowledge</strong><small>Science, learning, nature and discovery.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="human"><span class="jr-cosmic-card-icon">🤝</span><strong>Human</strong><small>People, friendships and communities.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="creation"><span class="jr-cosmic-card-icon">🎨</span><strong>Creation</strong><small>Art, music, stories and entertainment.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="living"><span class="jr-cosmic-card-icon">🌱</span><strong>Living</strong><small>Everyday life, homes and the outdoors.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="opportunity"><span class="jr-cosmic-card-icon">🌟</span><strong>Opportunity</strong><small>Work, business and useful connections.</small></button><button class="jr-cosmic-galaxy" type="button" data-cosmic-place="innovation"><span class="jr-cosmic-card-icon">⚙️</span><strong>Innovation</strong><small>Technology, ideas and inventions.</small></button></div><div class="jr-cosmic-section-head"><div><p class="eyebrow">NATURAL & IMAGINED PLACES</p><h3>Explore different environments</h3></div></div><div class="jr-cosmic-environment-grid"><button class="jr-cosmic-environment" data-scene="space" type="button" data-cosmic-place="space"><span class="jr-cosmic-card-icon">🌌</span><strong>Space</strong><small>Stars and planets</small></button><button class="jr-cosmic-environment" data-scene="forest" type="button" data-cosmic-place="forest"><span class="jr-cosmic-card-icon">🌳</span><strong>Forests</strong><small>Trees and wildlife</small></button><button class="jr-cosmic-environment" data-scene="ocean" type="button" data-cosmic-place="ocean"><span class="jr-cosmic-card-icon">🐬</span><strong>Oceans</strong><small>Sea life and water</small></button><button class="jr-cosmic-environment" data-scene="mountain" type="button" data-cosmic-place="mountain"><span class="jr-cosmic-card-icon">🏔️</span><strong>Mountains</strong><small>High places and snow</small></button><button class="jr-cosmic-environment" data-scene="city" type="button" data-cosmic-place="city"><span class="jr-cosmic-card-icon">🏙️</span><strong>Cities</strong><small>People and places</small></button><button class="jr-cosmic-environment" data-scene="underwater" type="button" data-cosmic-place="underwater"><span class="jr-cosmic-card-icon">🪸</span><strong>Underwater</strong><small>Life beneath the sea</small></button><button class="jr-cosmic-environment" data-scene="desert" type="button" data-cosmic-place="desert"><span class="jr-cosmic-card-icon">🏜️</span><strong>Deserts</strong><small>Land, sand and survival</small></button><button class="jr-cosmic-environment" data-scene="garden" type="button" data-cosmic-place="garden"><span class="jr-cosmic-card-icon">🌼</span><strong>Gardens</strong><small>Plants and growing things</small></button><button class="jr-cosmic-environment" data-scene="volcano" type="button" data-cosmic-place="volcano"><span class="jr-cosmic-card-icon">🌋</span><strong>Volcanoes</strong><small>Fire, rock and new land</small></button></div><div id="jrCosmicPlaceDetail" class="jr-cosmic-place-detail" hidden aria-live="polite"><div class="jr-cosmic-scene-art" id="jrCosmicSceneArt" data-scene="space" role="img" aria-label="A changing landscape"><span class="jr-cosmic-scene-sun"></span><span class="jr-cosmic-scene-ridge"></span><span class="jr-cosmic-scene-ground"></span><span class="jr-cosmic-scene-glow"></span></div><div class="jr-cosmic-place-copy"><h4 id="jrCosmicPlaceTitle"></h4><p id="jrCosmicPlaceCopy"></p><div id="jrCosmicConnections" class="jr-cosmic-connections" aria-label="Related places"></div></div><div class="jr-cosmic-place-actions"><button type="button" id="jrCosmicAsk">Explore with JR</button><button type="button" id="jrCosmicClose">Close</button></div></div>';
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
  garden:["Garden","Discover plants, soil, insects, food growing and the small worlds found in a garden."],
  volcano:["Volcano","Explore how volcanoes form, how eruptions change landscapes and how life returns to volcanic ground."]
 };
 let selectedPlace="";
 const detail=$("jrCosmicPlaceDetail");
 function openJr(prompt){
  const tab=document.querySelector('.workspace-tab[data-view="jr"]');
  if(tab)tab.click();
  const input=$("workspacePrompt");
  if(input){input.value=prompt;input.focus();}
  const form=$("workspacePromptForm");
  if(prompt&&form&&typeof form.requestSubmit==="function")form.requestSubmit();
  const view=$("view-jr");
  if(view)view.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 }
 function showPlace(key){
  const place=places[key];if(!place||!detail)return;
  const worldsView=$("view-worlds");
  if(worldsView?.hidden){const tab=document.querySelector('.workspace-tab[data-view="worlds"]');if(tab)tab.click();}
  selectedPlace=key;
  $("jrCosmicPlaceTitle").textContent=place[0];
  $("jrCosmicPlaceCopy").textContent=place[1]+" Explore the landscape, then follow a connection or ask JR to go deeper.";
  const art=$("jrCosmicSceneArt");
  if(art){art.dataset.scene=key;art.setAttribute("aria-label",place[0]+" landscape");}
  const related={
   knowledge:["forest","ocean","volcano"],human:["city","garden","creation"],creation:["human","space","garden"],
   living:["forest","ocean","city"],opportunity:["city","living","innovation"],innovation:["space","volcano","knowledge"],
   space:["mountain","knowledge","innovation"],forest:["garden","mountain","knowledge"],ocean:["underwater","forest","knowledge"],
   mountain:["volcano","forest","space"],city:["human","opportunity","innovation"],underwater:["ocean","knowledge","living"],
   desert:["mountain","garden","knowledge"],garden:["forest","living","human"],volcano:["mountain","knowledge","innovation"]
  };
  const links=$("jrCosmicConnections");
  if(links){links.replaceChildren();(related[key]||[]).forEach(next=>{
   if(!places[next])return;
   const button=document.createElement("button");button.type="button";button.dataset.cosmicPlace=next;button.textContent="Explore "+places[next][0];links.append(button);
  });}
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
   const place=places[selectedPlace];openJr("Take me on an exploration of "+place[0]+". Help me discover what is there, explain it clearly, and connect it to related subjects and places.");
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
  const phase=hour>=6&&hour<10?"morning":hour>=10&&hour<16?"day":hour>=16&&hour<19?"sunset":"night";
  body.dataset.jrCosmicTime=phase;
  const label=$("jrCosmicTimeLabel");
  if(label)label.textContent=phase==="morning"?"Morning":phase==="sunset"?"Sunset":phase==="night"?"Night":"Daytime";
 };
 updateSky();
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateSky();});

 // A JR PHEEF environment is a place to enter, not a prompt to send.
 const worldCopy={
  knowledge:{tag:"LEARN · DISCOVER · UNDERSTAND",intro:"Follow a question, explore a subject and connect ideas across science, history, nature and everyday life.",tiles:[["🧭","Start with a question","Choose a topic and follow its connections."],["🔬","Science in action","Explore experiments, discoveries and how things work."],["📚","Learning paths","Build understanding one step at a time."],["🌍","The living planet","See how nature, people and technology connect."]],activities:["Why do volcanoes create new land?","How does a forest support an entire ecosystem?","Explore the science behind sound and music."]},
  human:{tag:"PEOPLE · COMMUNITIES · CONNECTION",intro:"Find shared interests, conversations, communities and meaningful ways to connect. People and posts shown here are sample content until live community features are connected.",tiles:[["💬","Community conversations","Join a topic or start a thoughtful discussion."],["👥","Shared interests","Find groups around learning, creativity and everyday life."],["📣","Community updates","See announcements and contributions from communities you join."],["🤝","Make a connection","Build relationships with consent and privacy respected."]],activities:["Introduce an interest or skill you would like to share.","Explore a community around nature, technology or creativity.","Start a discussion and invite others to contribute."]},
  creation:{tag:"MAKE · SHARE · EXPERIENCE",intro:"A space for music, photography, art, stories, video and ideas—where inspiration can become something you create.",tiles:[["🎵","Music room","Discover sounds, artists and music-making."],["📷","Photography studio","Capture, organise and share visual stories."],["🎨","Art & design","Explore styles, techniques and creative projects."],["✍️","Stories & writing","Create stories, notes and collaborative work."]],activities:["Create a photo story from a place you know.","Explore how sound shapes a film scene.","Start a small creative project and build on it."]},
  living:{tag:"EVERYDAY LIFE · PLACES · EXPERIENCES",intro:"Explore practical parts of life: homes, food, travel, nature, transport and services that help people get things done.",tiles:[["🏡","Places to live","Explore rooms, homes and living spaces."],["🍲","Food & culture","Discover meals, ingredients and food traditions."],["🧳","Travel & movement","Explore destinations and ways to get around."],["🌿","Nature around us","Connect everyday life with the natural world."]],activities:["Explore Rooms Near Me when listings are available.","Plan a journey and compare ways to travel.","Discover a local food tradition and its story."]},
  opportunity:{tag:"WORK · BUSINESS · OPPORTUNITY",intro:"Connect people, skills, goods, services and ideas. Explore opportunities without confusing discovery with a confirmed deal.",tiles:[["🛍️","Find & trade","Discover goods and services when listings are available."],["💼","Work & skills","Explore jobs, skills and ways to contribute."],["🚀","Build a business","Shape an idea into a practical plan."],["🔗","Make connections","Bring buyers, sellers, providers and partners together."]],activities:["Turn a practical problem into a business idea.","Explore how a service could reach the people who need it.","Prepare a clear offer before sharing it."]},
  innovation:{tag:"TECHNOLOGY · IDEAS · THE FUTURE",intro:"Explore inventions, digital tools, engineering and emerging ideas, with clear distinctions between proven facts and possibilities.",tiles:[["⚙️","How things work","Understand systems, machines and technology."],["🧪","Experiment & test","Explore ideas through safe, practical experiments."],["🛰️","Connected technology","Discover networks, devices and space systems."],["💡","Invent something","Develop an idea and examine how it could work."]],activities:["Explore how satellites help people on Earth.","Discover how renewable energy systems work.","Sketch a useful invention for everyday life."]},
  forest:{tag:"TRAILS · WILDLIFE · NATURE",intro:"Walk through forest layers, discover plants and wildlife, follow trails and learn how soil, water, trees and animals sustain one another.",tiles:[["🥾","Forest trails","Choose a trail theme: canopy, river, woodland or open clearing."],["🌳","Trees & plants","Explore leaves, roots, seeds and forest layers."],["🦋","Wildlife watch","Learn about habitats, tracks, insects and animal behaviour."],["📷","Nature photography","Build a visual journal of textures, light and life."]],activities:["Follow the journey of a raindrop through a forest.","Discover why fallen leaves matter to the soil.","Create a nature observation journal."]},
  ocean:{tag:"REEFS · CURRENTS · SEA LIFE",intro:"Explore ocean habitats, coral reefs, currents, deep water and the connections between the sea and life on land.",tiles:[["🪸","Coral reefs","Discover reef habitats and their delicate balance."],["🐋","Marine life","Learn about ocean animals and how they live."],["🌊","Ocean currents","Explore waves, tides and moving water."],["🔬","Ocean science","Discover research and ocean protection."]],activities:["Explore how coral reefs support marine life.","Follow how ocean currents move heat around Earth.","Discover the journey of plastic through waterways."]},
  mountain:{tag:"PEAKS · ROCKS · WEATHER",intro:"Explore mountain landscapes, geology, changing weather, high-altitude habitats and the people who live and work in mountain regions.",tiles:[["⛰️","Mountain trails","Explore ridges, valleys and passes."],["🪨","Rocks & geology","Discover how mountains form and change."],["🌦️","Mountain weather","Understand clouds, snow, wind and altitude."],["🌱","Life at altitude","Explore plants and animals adapted to high places."]],activities:["Discover how a mountain range is formed.","Explore why weather changes with altitude.","Learn how mountain forests protect water sources."]},
  city:{tag:"STREETS · CULTURE · DAILY LIFE",intro:"Explore how neighbourhoods, transport, buildings, public spaces, businesses and communities make a city work.",tiles:[["🚶","Neighbourhoods","Explore the character and design of places."],["🚍","Transport","Discover how people and goods move."],["🏛️","Culture & history","Explore stories, landmarks and shared spaces."],["🏪","Local enterprise","See how shops and services serve communities."]],activities:["Trace how a product reaches a neighbourhood shop.","Explore what makes a public space welcoming.","Discover how city transport connects communities."]},
  underwater:{tag:"BENEATH THE SURFACE",intro:"Dive into underwater landscapes, coral gardens, marine habitats and the science of life below the surface.",tiles:[["🐠","Reef life","Discover colourful underwater habitats."],["🫧","Deep water","Explore pressure, darkness and deep-sea adaptations."],["🪸","Underwater gardens","Learn how reefs and seagrass support life."],["🔦","Ocean exploration","Discover tools used to study underwater places."]],activities:["Explore how deep-sea animals make or use light.","Discover why seagrass beds matter.","Compare shallow reefs and deep ocean habitats."]},
  desert:{tag:"DUNES · ADAPTATION · SURVIVAL",intro:"Explore desert landscapes and the remarkable ways plants, animals and people adapt to limited water and extreme conditions.",tiles:[["🏜️","Desert landscapes","Explore dunes, rock formations and dry valleys."],["🌵","Desert plants","Discover water-saving adaptations."],["🦎","Desert wildlife","Learn how animals manage heat and water."],["🌌","Desert skies","Explore stars and night environments."]],activities:["Discover how a cactus stores and conserves water.","Explore how desert animals avoid daytime heat.","Learn how wind shapes dunes."]},
  garden:{tag:"SOIL · PLANTS · GROWING",intro:"Explore growing spaces, soil life, pollinators, food gardens and the small ecosystems that thrive around plants.",tiles:[["🌱","Grow something","Explore seeds, planting and plant care."],["🪱","Life in soil","Discover decomposers and healthy soil."],["🐝","Pollinators","Learn how insects and flowers connect."],["🥬","Food garden","Explore edible plants and growing cycles."]],activities:["Follow a seed from germination to flowering.","Discover how compost returns nutrients to soil.","Plan a small container garden."]},
  volcano:{tag:"GEOLOGY · ERUPTIONS · RENEWAL",intro:"Explore how volcanoes form, what happens during eruptions, how landscapes are transformed and how life can return to volcanic ground.",tiles:[["🌋","Inside a volcano","Explore magma, vents and volcanic structure."],["🔥","Eruptions","Understand lava, ash and different eruption styles."],["🪨","New landscapes","Discover how volcanic rock and soil form."],["🌿","Life returns","Explore succession and ecosystems after eruptions."]],activities:["Compare lava flows and ash deposits.","Discover why volcanic soils can become fertile.","Explore how scientists monitor volcanic activity."]},
  space:{tag:"PLANETS · STARS · EXPLORATION",intro:"Travel through our solar system and beyond, exploring planets, stars, galaxies, space science and the questions researchers are investigating.",tiles:[["🪐","Solar system","Explore planets, moons and small bodies."],["✨","Stars & galaxies","Discover how stars form and galaxies evolve."],["🚀","Space exploration","Explore spacecraft, missions and telescopes."],["🌍","Earth from space","Discover how satellites observe our planet."]],activities:["Compare the conditions on two planets.","Explore how a telescope gathers light.","Discover how satellites help track weather."]}
 };
 const worldRelated={knowledge:["forest","ocean","volcano"],human:["city","creation","garden"],creation:["human","space","knowledge"],living:["forest","city","ocean"],opportunity:["city","innovation","living"],innovation:["space","knowledge","volcano"],space:["knowledge","mountain","innovation"],forest:["garden","mountain","knowledge"],ocean:["underwater","forest","knowledge"],mountain:["volcano","forest","space"],city:["human","opportunity","living"],underwater:["ocean","knowledge","living"],desert:["mountain","garden","knowledge"],garden:["forest","living","human"],volcano:["mountain","knowledge","innovation"]};
 let activeWorldSection="Explore";
 function openWorldPage(key){
  const item=places[key],data=worldCopy[key]; if(!item||!data)return;
  const workspace=$("workspace"); if(!workspace)return;
  const prior=$("jrCosmicWorldPage"); if(prior)prior.remove();
  const page=document.createElement("section");page.id="jrCosmicWorldPage";page.className="jr-world-page";page.dataset.world=key;
  const nav=["Explore","Social","Create","Discover"];
  const tileHtml=data.tiles.map((t,i)=>'<button class="jr-world-tile" type="button" data-world-tile="'+i+'"><span>'+t[0]+'</span><strong>'+t[1]+'</strong><small>'+t[2]+'</small></button>').join("");
  const activityHtml=data.activities.map((a,i)=>'<article class="jr-world-activity"><span>✦</span><div><strong>'+a+'</strong><small>Starter activity · explore at your own pace</small></div><button type="button" data-world-activity="'+i+'">Open</button></article>').join("");
  page.innerHTML='<div class="jr-world-top"><button type="button" class="jr-world-back" data-world-back>← Back to JR PHEEF</button><span class="jr-world-status">WORLD · '+item[0].toUpperCase()+'</span></div><header class="jr-world-hero"><div><span class="jr-world-kicker">'+data.tag+'</span><h1>'+item[0]+'</h1><p>'+data.intro+'</p><div class="jr-world-hero-actions"><button type="button" data-world-section="Explore">Explore this place</button><button type="button" data-world-ask>Ask JR (optional)</button></div></div><div class="jr-world-orb" aria-hidden="true"><span>'+({forest:"🌳",ocean:"🌊",space:"🪐",volcano:"🌋",human:"🤝",creation:"🎨",knowledge:"🔭",living:"🌱",opportunity:"🌟",innovation:"⚙️",mountain:"🏔️",city:"🏙️",underwater:"🪸",desert:"🏜️",garden:"🌼"}[key]||"✦")+'</span></div></header><nav class="jr-world-nav" aria-label="'+item[0]+' navigation">'+nav.map(n=>'<button type="button" data-world-section="'+n+'"'+(n==="Explore"?' aria-current="page"':'')+'>'+n+'</button>').join("")+'</nav><div class="jr-world-content"><section class="jr-world-main"><div class="jr-world-content-heading"><span class="jr-world-kicker" id="jrWorldSectionKicker">START EXPLORING</span><h2 id="jrWorldSectionTitle">Choose where to begin</h2><p id="jrWorldSectionIntro">Pick an area below. You can move freely and return whenever you like.</p></div><div class="jr-world-tiles">'+tileHtml+'</div><div class="jr-world-activity-list"><h3>Things to explore</h3>'+activityHtml+'</div><p class="jr-world-demo-note">Starter experiences are ready to explore. Live community posts, external services and real-time events appear only when connected and verified.</p></section><aside class="jr-world-side"><h3>Connections</h3><p>This place connects naturally with:</p><div class="jr-world-related">'+(worldRelated[key]||[]).map(k=>'<button type="button" data-cosmic-place="'+k+'">'+places[k][0]+' →</button>').join("")+'</div><div class="jr-world-side-card"><strong>JR is here when you need help</strong><p>Ask a question, get an explanation or connect ideas. You choose when to open JR.</p><button type="button" data-world-ask>Talk to JR</button></div></aside></div>';
  const navBar=workspace.querySelector(".workspace-nav"); if(navBar)navBar.hidden=true;
  workspace.querySelectorAll(".workspace-view").forEach(v=>v.hidden=true);
  const cosmicHome=workspace.querySelector(".jr-cosmic-home"); if(cosmicHome)cosmicHome.hidden=true;
  const discover=workspace.querySelector(".jr-cosmic-discoveries");if(discover)discover.hidden=true;
  workspace.append(page); body.classList.add("jr-world-open"); page.scrollIntoView({behavior:"auto",block:"start"});
  activeWorldSection="Explore";
 }
 function closeWorldPage(){
  const page=$("jrCosmicWorldPage");if(page)page.remove();
  const workspace=$("workspace");if(!workspace)return;
  const navBar=workspace.querySelector(".workspace-nav");if(navBar)navBar.hidden=false;
  const cosmicHome=workspace.querySelector(".jr-cosmic-home");if(cosmicHome)cosmicHome.hidden=false;
  const discover=workspace.querySelector(".jr-cosmic-discoveries");if(discover)discover.hidden=false;
  body.classList.remove("jr-world-open");
  const tab=document.querySelector('.workspace-tab[data-view="worlds"]');if(tab)tab.click();
 }
 function renderWorldSection(name){
  activeWorldSection=name;
  const page=$("jrCosmicWorldPage");if(!page)return;
  page.querySelectorAll("[data-world-section]").forEach(b=>{if(b.tagName==="BUTTON")b.setAttribute("aria-current",String(b.dataset.worldSection===name));});
  const title=$("jrWorldSectionTitle"),intro=$("jrWorldSectionIntro"),kicker=$("jrWorldSectionKicker");
  const data={Explore:["Choose where to begin","Pick an area below. You can move freely and return whenever you like.","START EXPLORING"],Social:["Connect around this place","Join a discussion, share an observation or explore shared interests. Live people and posts appear only when available and verified.","COMMUNITY"],Create:["Make something here","Start a journal, photo story, collection, project or contribution connected to this place.","CREATE"],Discover:["Fresh paths to follow","Explore questions, surprising connections and useful knowledge from this place.","DISCOVER"]}[name];
  if(title)title.textContent=data[0];if(intro)intro.textContent=data[1];if(kicker)kicker.textContent=data[2];
  page.dataset.section=name.toLowerCase();
  const list=page.querySelector(".jr-world-activity-list");if(list)list.querySelector("h3").textContent=({Explore:"Things to explore",Social:"Ways to connect",Create:"Creative starting points",Discover:"Questions worth exploring"})[name];
 }
 document.addEventListener("click",event=>{
  const worldCard=event.target.closest("[data-cosmic-place]");
  if(worldCard){event.preventDefault();openWorldPage(worldCard.dataset.cosmicPlace);return;}
  if(event.target.closest("[data-world-back]")){closeWorldPage();return;}
  const section=event.target.closest("[data-world-section]");if(section){renderWorldSection(section.dataset.worldSection);return;}
  if(event.target.closest("[data-world-ask]")){
   const page=$("jrCosmicWorldPage");const key=page?.dataset.world;const item=places[key];
   if(item){closeWorldPage();openJr("Help me explore "+item[0]+". Start with useful discoveries and connect related ideas.");}
   return;
  }
  const tile=event.target.closest("[data-world-tile]");if(tile){const page=$("jrCosmicWorldPage");if(page){const section=page.dataset.section||"explore";const heading=page.querySelector("#jrWorldSectionTitle");const intro=page.querySelector("#jrWorldSectionIntro");if(heading)heading.textContent=tile.querySelector("strong").textContent;if(intro)intro.textContent=tile.querySelector("small").textContent+" Choose a related activity below to continue.";}return;}
  const activity=event.target.closest("[data-world-activity]");if(activity){const title=activity.closest(".jr-world-activity")?.querySelector("strong")?.textContent;const intro=$("jrWorldSectionIntro");if(intro&&title)intro.textContent=title+" — this starter activity is ready to explore. Ask JR if you want guided help.";return;}
 });
 // Add a cross-platform discovery layer so the workspace feels connected beyond its tabs.
 if(home){
  const pulse=document.createElement("section");pulse.className="jr-pulse-board";pulse.innerHTML='<div class="jr-pulse-heading"><div><span class="jr-world-kicker">THE JR PHEEF UNIVERSE</span><h2>Find something to do</h2><p>Explore, connect, create or get something done. Start anywhere.</p></div><span class="jr-pulse-live">Your space</span></div><div class="jr-pulse-actions"><button type="button" data-pulse-action="worlds"><span>🌌</span><strong>Explore places</strong><small>Enter worlds and environments</small></button><button type="button" data-pulse-action="command"><span>💬</span><strong>JR LINK & people</strong><small>Open your conversations and connections</small></button><button type="button" data-pulse-action="dgbo"><span>◇</span><strong>Business & ideas</strong><small>Explore business support and opportunities</small></button><button type="button" data-pulse-action="family"><span>✧</span><strong>FAMILY</strong><small>Explore financial learning and family goals</small></button><button type="button" data-pulse-action="jr"><span>✦</span><strong>Ask JR</strong><small>Get help when you choose</small></button></div><div class="jr-pulse-stream"><article><span>DISCOVER</span><strong>Follow a question into a new subject</strong><small>Knowledge connects with nature, science and everyday life.</small></article><article><span>CREATE</span><strong>Turn an idea into something tangible</strong><small>Start with a photo story, a project or a business idea.</small></article><article><span>CONNECT</span><strong>Bring people and useful things together</strong><small>Communities, conversations and opportunities belong in one connected space.</small></article></div>';
  const insert=home.querySelector(".jr-cosmic-discoveries");if(insert)insert.after(pulse);else home.append(pulse);
 }
 document.addEventListener("click",event=>{
  const action=event.target.closest("[data-pulse-action]");if(!action)return;
  const key=action.dataset.pulseAction;
  if(key==="worlds"){document.querySelector('.workspace-tab[data-view="worlds"]')?.click();$("jrCosmicExplorer")?.scrollIntoView({behavior:"smooth",block:"start"});}
  else if(key==="jr")openJr("");
  else if(key==="dgbo"||key==="family"){const button=document.querySelector('[data-company-open="'+key+'"]');if(button)button.click();}
  else if(key==="command")document.querySelector('.workspace-tab[data-view="command"]')?.click();
 });


 // Web access is a separate destination from internal Worlds and JR conversations.
 function installWebSpace(){
  const workspace=$("workspace"),home=$("view-home"),nav=workspace?.querySelector(".workspace-nav");
  if(!workspace||!home||!nav||$("jrWebSpace"))return;
  const tab=document.createElement("button");tab.type="button";tab.className="workspace-tab";tab.dataset.view="web";tab.textContent="WEB";nav.append(tab);
  const page=document.createElement("section");page.id="jrWebSpace";page.className="jr-web-space";page.hidden=true;
  page.innerHTML='<div class="jr-web-head"><div><span class="jr-world-kicker">THE OPEN INTERNET</span><h2>Explore the web</h2><p>Search the internet or enter a website address. External pages open in a separate browser tab so you can use the full website safely.</p></div><div class="jr-web-orbit" aria-hidden="true">◎</div></div><form id="jrWebSearchForm" class="jr-web-search"><label class="sr-only" for="jrWebAddress">Search or enter a website address</label><input id="jrWebAddress" name="address" type="text" inputmode="url" autocomplete="url" maxlength="2048" placeholder="Search the web or enter a website address" required><button type="submit">Go ↗</button></form><p id="jrWebFeedback" class="jr-web-feedback" aria-live="polite">Choose a destination or search for anything.</p><div class="jr-web-shortcuts"><button type="button" data-web-site="https://www.google.com/">Google</button><button type="button" data-web-site="https://www.wikipedia.org/">Wikipedia</button><button type="button" data-web-site="https://www.youtube.com/">YouTube</button><button type="button" data-web-site="https://www.bbc.com/">BBC</button><button type="button" data-web-site="https://www.openstreetmap.org/">OpenStreetMap</button></div><div class="jr-web-note"><strong>Web access, not yet a built-in browser engine.</strong><span>Some websites cannot be embedded inside other apps. JR PHEEF opens them separately rather than displaying a broken or misleading page. Full in-app tabs, bookmarks, downloads and browser history remain future browser features.</span></div><button type="button" class="jr-web-back" data-web-back>← Back to JR PHEEF</button>';
  workspace.append(page);
  function openWeb(){
   workspace.querySelectorAll(".workspace-view").forEach(v=>v.hidden=true);
   workspace.querySelectorAll(".workspace-tab").forEach(b=>b.classList.toggle("selected",b===tab));
   const cosmicHome=workspace.querySelector(".jr-cosmic-home");if(cosmicHome)cosmicHome.hidden=true;
   const discover=workspace.querySelector(".jr-cosmic-discoveries");if(discover)discover.hidden=true;
   const pulse=workspace.querySelector(".jr-pulse-board");if(pulse)pulse.hidden=true;
   const worldPage=$("jrCosmicWorldPage");if(worldPage)worldPage.remove();
   nav.hidden=false;page.hidden=false;body.classList.remove("jr-world-open");
   page.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function closeWeb(){
   page.hidden=true;
   workspace.querySelectorAll(".workspace-tab").forEach(b=>b.classList.remove("selected"));
   const homeTab=workspace.querySelector('.workspace-tab[data-view="home"]');if(homeTab)homeTab.click();
  }
  function destination(value){
   const raw=String(value||"").trim();if(!raw)return null;
   if(/^https?:\/\//i.test(raw)){try{const u=new URL(raw);return ["http:","https:"].includes(u.protocol)?u.href:null;}catch{return null;}}
   if(/^[\w-]+(?:\.[\w-]+)+(?:[/:?#][^\s]*)?$/i.test(raw)){try{return new URL("https://"+raw).href;}catch{return null;}}
   return "https://www.google.com/search?q="+encodeURIComponent(raw);
  }
  tab.addEventListener("click",openWeb);
  page.querySelector("#jrWebSearchForm").addEventListener("submit",event=>{
   event.preventDefault();const input=$("jrWebAddress"),feedback=$("jrWebFeedback"),url=destination(input?.value);
   if(!url){if(feedback)feedback.textContent="Please enter a valid website address or search phrase.";return;}
   const opened=window.open(url,"_blank","noopener,noreferrer");
   if(feedback)feedback.textContent=opened===null?"Your browser blocked the new tab. Allow pop-ups for JR PHEEF, then try again.":"Opened "+url+" in a new browser tab.";
  });
  page.addEventListener("click",event=>{
   const site=event.target.closest("[data-web-site]");
   if(site){const url=destination(site.dataset.webSite);const opened=window.open(url,"_blank","noopener,noreferrer");const feedback=$("jrWebFeedback");if(feedback)feedback.textContent=opened===null?"Allow pop-ups to open this website.":"Opened "+site.textContent+" in a new browser tab.";return;}
   if(event.target.closest("[data-web-back]"))closeWeb();
  });
  document.addEventListener("click",event=>{
   const action=event.target.closest('[data-pulse-action="web"]');if(action)openWeb();
  });
  const pulse=$("view-home")?.querySelector(".jr-pulse-actions");
  if(pulse&&!pulse.querySelector('[data-pulse-action="web"]')){
   const button=document.createElement("button");button.type="button";button.dataset.pulseAction="web";button.innerHTML="<span>🌐</span><strong>Explore the web</strong><small>Search and open internet websites</small>";pulse.insertBefore(button,pulse.lastElementChild);
  }
 }
 installWebSpace();

})();