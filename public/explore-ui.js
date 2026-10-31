(function(){
"use strict";
const items=[
["SCIENCE & LABS","Science & laboratories","Explore research, experiments, materials and scientific discovery.","photo-1532094349884-543bc11b234d","science laboratory experiments research"], 
["INVENTION & ENGINEERING","Inventions & engineering","Discover machines, robotics, engineering and ideas worth developing.","photo-1581091226825-a6a2a5aee158","robotics engineering inventions prototypes"], 
["TECHNOLOGY","Technology & computing","Explore software, electronics, AI, networks and emerging technology.","photo-1518770660439-4636190af475","technology electronics computer science"], 
["ART & DESIGN","Art & design","Explore visual art, industrial design, fashion and creative expression.","photo-1541961017774-22349e4a1262","art design creative studio"], 
["ANIMALS & LIFE","Animals & living systems","Discover wildlife, ecosystems, biology and the natural world.","photo-1474511320723-9a56873867b5","wildlife animals biodiversity biology"], 
["HISTORY & CIVILISATIONS","History & civilisations","Explore ancient worlds, cultures, discoveries and human stories.","photo-1461360370896-922624d12aa1","ancient civilizations history archaeology"], 
["PEOPLE & CULTURE","People & cultures","Explore languages, communities, traditions and ways of life.","photo-1529156069898-49953e39b3ac","world cultures people communities"], 
["FOOD & AGRICULTURE","Food & agriculture","Explore food systems, farming, cooking and sustainable production.","photo-1500382017468-9049fed747ef","agriculture farming food systems"], 
["SPACE & ASTRONOMY","Space & astronomy","Explore planets, galaxies, astronomy and space exploration.","photo-1446776811953-b23d57bd21aa","NASA planets galaxies space exploration"], 
["FUTURE & FICTION","Future & imagination","Explore speculative futures, science fiction and concepts to develop.","photo-1451187580459-43490279c0fa","futuristic technology science fiction concepts"],
["CITY LIGHTS","City skylines","Discover cities, architecture and urban life.","photo-1519501025264-65ba15a82390","beautiful world city skylines"],
["WILD EARTH","Mountains & nature","Explore landscapes, forests, lakes and trails.","photo-1464822759023-fed622ff2c3b","mountains national parks nature destinations"],
["BLUE PLANET","Oceans & islands","Discover coastlines, reefs, islands and marine life.","photo-1518837695005-2083093ee35b","ocean islands coral reefs destinations"],
["BEYOND EARTH","Space & worlds","Explore planets, galaxies and astronomy.","photo-1446776811953-b23d57bd21aa","NASA planets galaxies space exploration"],
["DESIGN & CULTURE","Architecture & culture","Visit landmarks, museums, art and traditions.","photo-1511818966892-d7d671e672a2","world architecture landmarks culture"],
["QUIET PLACES","Peaceful escapes","Find calm scenery and travel inspiration.","photo-1470770841072-f978cf4d019e","beautiful peaceful places to visit worldwide"]
];
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function imageUrl(id,width){return "https://images.unsplash.com/"+id+"?auto=format&fit=crop&w="+width+"&q=82";}
function openSearch(q){window.open("https://www.google.com/search?tbm=isch&q="+encodeURIComponent(q),"_blank","noopener,noreferrer");}
function openWebSearch(q){window.open("https://www.google.com/search?q="+encodeURIComponent(q),"_blank","noopener,noreferrer");}
function mount(){
 const app=document.getElementById("app"),home=document.getElementById("home");if(!app||!home||document.getElementById("explore"))return;
 const tile=el("button","jp-dash-tile");tile.type="button";tile.addEventListener("click",()=>window.show&&window.show("explore"));
 const icon=el("span","jp-dash-icon","✧"),copy=el("span");copy.append(el("span","jp-dash-title","EXPLORE"));copy.append(document.createElement("br"));copy.append(el("span","jp-dash-sub","Places, photography, ideas and discovery"));tile.append(icon,copy);
 const grid=home.querySelector(".jp-dashboard-grid");if(grid)grid.append(tile);
 const page=el("div","page hidden");page.id="explore";page.setAttribute("aria-labelledby","jpExploreTitle");
 const hero=el("section","jp-explore-hero"),copyCol=el("div");
 copyCol.append(el("div","jp-kicker","JR PHEEF · VISUAL DISCOVERY"));
 const h=el("h1",null,"Explore beyond your screen.");h.id="jpExploreTitle";copyCol.append(h);
 copyCol.append(el("p",null,"Discover places, nature, architecture, space, oceans and ideas. Search the wider web for anything that interests you."));
 const orbit=el("div","jp-explore-orbit","EXPLORE");orbit.setAttribute("aria-hidden","true");hero.append(copyCol,orbit);page.append(hero);
 const heading=el("div","jp-section-head");heading.append(el("h2",null,"Visual destinations"));heading.append(el("p","muted","Choose a subject to explore. External image search opens in a separate tab."));page.append(heading);
 const cards=el("div","jp-explore-grid");
 items.forEach(([tag,title,desc,id,query])=>{const card=el("article","jp-explore-card"),img=el("img");img.src=imageUrl(id,760);img.alt=title;img.loading="lazy";img.referrerPolicy="no-referrer";const body=el("section");body.append(el("div","jp-kicker",tag),el("h3",null,title),el("p",null,desc));const wallpaperMap={"CITY LIGHTS":"geometry","WILD EARTH":"aurora","BLUE PLANET":"waves","BEYOND EARTH":"nebula","DESIGN & CULTURE":"geometry","QUIET PLACES":"sunset"};const setWall=el("button","dark jp-explore-wallpaper","USE AS WALLPAPER");setWall.type="button";setWall.addEventListener("click",()=>{const ok=window.JRPheefSetWallpaper&&window.JRPheefSetWallpaper(wallpaperMap[tag]);if(ok){setWall.textContent="WALLPAPER APPLIED ✓";setWall.setAttribute("aria-live","polite");}});const b=el("button","primary","EXPLORE ↗");b.type="button";b.addEventListener("click",()=>openSearch(query));const create=el("button","dark","ASK JR TO DEVELOP THIS");create.type="button";create.addEventListener("click",()=>{const ask=document.getElementById("jrEverywhereLauncher");if(ask)ask.click();const field=document.getElementById("jrEverywhereInput");if(field){field.value="I want to develop something inspired by "+title+". Help me explore what is possible and turn it into a real project.";field.focus();}});body.append(setWall,b,create);card.append(img,body);cards.append(card);});
 page.append(cards);
 const panel=el("div","card"),k=el("div","jp-kicker","YOUR CURIOSITY, COORDINATED");panel.append(k,el("h2",null,"Where should JR take you?"),el("p","muted","Search for a city, country, animal, invention, building, planet, art style or any topic."));
 const form=el("form","jp-explore-search"),label=el("label",null,"Search Explore");label.htmlFor="jpExploreQuery";const input=el("input");input.id="jpExploreQuery";input.type="search";input.placeholder="e.g. Nairobi at night, Mars, wildlife in Kenya";input.required=true;const button=el("button","primary","SEARCH EVERYTHING ↗");button.type="submit";const ask=el("button","dark","ASK JR ABOUT IT");ask.type="button";ask.addEventListener("click",()=>{const launcher=document.getElementById("jrEverywhereLauncher");if(launcher)launcher.click();const field=document.getElementById("jrEverywhereInput");if(field){field.value="Explore this topic widely, including what exists, what is emerging and what could be created: "+input.value;field.focus();}});form.append(label,input,button,ask);form.addEventListener("submit",e=>{e.preventDefault();const q=input.value.trim();if(q)openWebSearch(q);});panel.append(form);page.append(panel);app.append(page);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();