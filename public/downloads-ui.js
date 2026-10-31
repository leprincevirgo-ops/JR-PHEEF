(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SOURCES=[
 {kind:"MUSIC",name:"Bandcamp",desc:"Discover independent artists and download releases when the artist offers downloads.",url:"https://bandcamp.com/"},
 {kind:"MUSIC",name:"SoundCloud",desc:"Listen to tracks; download only when the creator enables an official download.",url:"https://soundcloud.com/"},
 {kind:"MUSIC",name:"Jamendo",desc:"Explore music with creator-defined licensing and permitted downloads.",url:"https://www.jamendo.com/"},
 {kind:"VIDEO",name:"YouTube",desc:"Watch videos and use the creator/platform's permitted offline or download options.",url:"https://www.youtube.com/"},
 {kind:"VIDEO",name:"Vimeo",desc:"Discover films and creator videos; downloads depend on the owner's settings.",url:"https://vimeo.com/"},
 {kind:"VIDEO",name:"Internet Archive",desc:"Find public-domain and rights-cleared media; check each item's rights and download options.",url:"https://archive.org/details/movies"},
 {kind:"GAMES",name:"Google Play Games",desc:"Discover and install Android games from the official store.",url:"https://play.google.com/store/games"},
 {kind:"GAMES",name:"Apple App Store",desc:"Discover games for Apple devices from the official store.",url:"https://www.apple.com/app-store/"},
 {kind:"GAMES",name:"Steam",desc:"Discover PC games and install through the official Steam client.",url:"https://store.steampowered.com/"},
 {kind:"GAMES",name:"itch.io",desc:"Find independent games, including free and creator-authorised downloads.",url:"https://itch.io/games"},
 {kind:"FREE & OPEN",name:"F-Droid",desc:"Browse free and open-source Android apps from their project maintainers.",url:"https://f-droid.org/"},
 {kind:"FREE & OPEN",name:"Wikimedia Commons",desc:"Download media where each file's licence permits your intended use.",url:"https://commons.wikimedia.org/"} 
];
function addStyles(){if($("jrDownloadsStyles"))return;const l=document.createElement("link");l.id="jrDownloadsStyles";l.rel="stylesheet";l.href="/downloads-play.css";document.head.append(l);}
function card(x){const a=document.createElement("article");a.className="jr-download-card";a.dataset.kind=x.kind;a.innerHTML='<span class="jr-download-kind">'+esc(x.kind)+'</span><h3>'+esc(x.name)+'</h3><p>'+esc(x.desc)+'</p><a class="jr-download-open" href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">OPEN OFFICIAL SOURCE ↗</a>';return a;}
function mount(){
 const app=$("app"),home=$("home");if(!app||!home||$("downloads"))return;
 addStyles();
 const page=document.createElement("section");page.id="downloads";page.className="page hidden";page.setAttribute("aria-label","Downloads and entertainment");
 page.innerHTML='<section class="jr-download-hero"><span class="jp-kicker">JR PHEEF · ENTERTAINMENT & DOWNLOADS</span><h1>Find it. Enjoy it. Keep it organised.</h1><p>Discover music, videos, games and useful downloads from their official creators and trusted stores.</p><form id="jrDownloadSearch" class="jr-download-search"><input id="jrDownloadQuery" type="search" maxlength="100" placeholder="Search music, videos, games or apps…" aria-label="Search entertainment and downloads"><button class="primary" type="submit">SEARCH</button></form><p class="jr-download-note">Downloads are available only where the creator or provider permits them. JR PHEEF never bypasses DRM, paywalls or access controls.</p></section><section class="jr-download-tools"><button type="button" class="jr-download-filter is-active" data-filter="ALL">ALL</button><button type="button" class="jr-download-filter" data-filter="MUSIC">MUSIC</button><button type="button" class="jr-download-filter" data-filter="VIDEO">VIDEO</button><button type="button" class="jr-download-filter" data-filter="GAMES">GAMES</button><button type="button" class="jr-download-filter" data-filter="FREE & OPEN">FREE & OPEN</button></section><div id="jrDownloadResults" class="jr-download-grid"></div><section class="jr-download-own"><div><span class="jp-kicker">YOUR COLLECTION</span><h2>Keep your files together</h2><p>Store your own music, videos and game files in My Files when supported, or manage device downloads in your phone's Downloads folder.</p></div><button type="button" class="primary" id="jrOpenVault">OPEN MY FILES</button></section><p class="jr-download-footnote">Always check file licences, age ratings, device compatibility, storage requirements and regional availability before downloading.</p>';
 app.append(page);
 const grid=$("jrDownloadResults"),search=$("jrDownloadSearch"),input=$("jrDownloadQuery");let filter="ALL";
 function draw(q=""){grid.replaceChildren();const rows=SOURCES.filter(x=>(filter==="ALL"||x.kind===filter)&&(!q||(x.name+" "+x.desc+" "+x.kind).toLowerCase().includes(q.toLowerCase())));rows.forEach(x=>grid.append(card(x)));if(!rows.length){const p=document.createElement("p");p.className="muted";p.textContent="No matching source in this starter directory. Try another search.";grid.append(p);}}
 document.querySelectorAll(".jr-download-filter").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll(".jr-download-filter").forEach(x=>x.classList.toggle("is-active",x===b));draw(input.value.trim());}));
 search.addEventListener("submit",e=>{e.preventDefault();draw(input.value.trim());});
 $("jrOpenVault").addEventListener("click",()=>window.show&&window.show("vault"));
 draw();
 const tile=document.createElement("button");tile.type="button";tile.className="jp-quick-card q-downloads";tile.innerHTML='<span>♫</span><b>Downloads & Play</b><small>Music, video & games</small>';tile.addEventListener("click",()=>window.show&&window.show("downloads"));
 const quick=home.querySelector(".jp-quick-grid");if(quick)quick.append(tile);
 const group=[...document.querySelectorAll("#app .jr-nav-group")].find(g=>g.querySelector(".jr-nav-group-label")?.textContent.trim()==="YOUR WORLD");
 const navButton=document.createElement("button");navButton.type="button";navButton.dataset.page="downloads";navButton.innerHTML="<span>⇩</span> Downloads & Play";navButton.addEventListener("click",()=>window.show&&window.show("downloads"));if(group)group.append(navButton);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
