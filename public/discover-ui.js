(function(){
"use strict";
const KEY="jr-pheef-discover-saved-v1";
const CATEGORIES=[
["Entertainment","♫","Movies, shows, events, games and culture"],
["Tools","⚒","Useful tools, software and everyday utilities"],
["Photography","▧","Photographers, cameras, techniques and visual stories"],
["Business","▣","Companies, markets, ideas and services"],
["Shopping","◇","Products, shops, comparisons and buying guides"],
["Education","⌘","Courses, schools, skills and learning resources"],
["Religion","✧","Faith traditions, places, texts and communities"],
["Finance","＄","Financial education, markets and money tools"],
["Fashion","✦","Style, designers, clothing and trends"],
["Travel","✈","Destinations, stays, routes and experiences"],
["Food","♨","Recipes, restaurants, ingredients and food culture"],
["Books","▤","Books, authors, reading lists and reviews"],
["Health","♡","Health information, care services and wellbeing"],
["Parenting","⌂","Family resources, child development and support"],
["Reference","◎","Dictionaries, encyclopedias and trusted references"],
["Communication","◉","Messaging, calling, collaboration and communities"],
["Productivity","◷","Planning, organisation and work tools"],
["Scientific Research","⚛","Research, discoveries, papers and institutions"],
["Security","⛨","Digital safety, privacy and protection"],
["Data & Analytics","▥","Data tools, visualisation and insights"],
["Popular","★","Popular topics and widely explored subjects"],
["Creativity","✎","Art, design, writing and creative tools"],
["Development Tools","⌘","Developer platforms, code and APIs"],
["New & Noteworthy","✧","New ideas, launches and emerging topics"],
["Small Business","▦","Local businesses, founders and practical guides"],
["Business & Operations","⚙","Operations, supply chains and management"],
["Social","☻","Social platforms, groups and communities"],
["Download","⇩","Official downloads, software and resources"],
["Sports","⚽","Teams, athletes, events and training"],
["Job","▤","Careers, vacancies, skills and employers"],
["News","▤","Current affairs, reporting and analysis"],
["Music / Video","▶","Artists, songs, films and video channels"],
["Other","＋","Anything that does not fit another category"]
];
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const safeText=v=>String(v||"").trim().slice(0,120);
function searchUrl(kind,q){const query=encodeURIComponent(q);const urls={web:"https://www.google.com/search?q="+query,images:"https://www.google.com/search?tbm=isch&q="+query,videos:"https://www.youtube.com/results?search_query="+query,shopping:"https://www.google.com/search?tbm=shop&q="+query,maps:"https://www.google.com/maps/search/"+query};return urls[kind]}
function open(url){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.click()}
function readSaved(){try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a.filter(x=>typeof x==="string").slice(0,100):[]}catch(e){return[]}}
let saved=readSaved();
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved));return true}catch(e){return false}}
function mount(){
 const app=$("app"),home=$("home");if(!app||!home||$("discover"))return;
 const tile=el("button","jp-dash-tile");tile.type="button";tile.append(el("span","jp-dash-icon","⌕"));const copy=el("span");copy.append(el("span","jp-dash-title","DISCOVER"),document.createElement("br"),el("span","jp-dash-sub","Explore subjects, images, videos and ideas"));tile.append(copy);tile.addEventListener("click",()=>window.show&&window.show("discover"));home.querySelector(".jp-dashboard-grid")?.append(tile);
 const page=el("section","page hidden");page.id="discover";page.setAttribute("aria-label","JR PHEEF Discover");
 const hero=el("section","jp-discover-hero");hero.append(el("div","jp-kicker","JR PHEEF · UNIVERSAL DISCOVERY"),el("h1","","What are you curious about today?"),el("p","muted","Discover places, people, products, ideas and possibilities. Start with a word or a question; JR helps you explore the wider world."));
 const form=el("form","jp-discover-search");const input=document.createElement("input");input.id="jpDiscoverQuery";input.type="search";input.required=true;input.maxLength=120;input.placeholder="What would you like to discover? Try a place, idea, product or question";input.setAttribute("aria-label","Search any subject");const go=el("button","primary","DISCOVER");go.type="submit";form.append(input,go);hero.append(form);page.append(hero);
 const result=el("section","card jp-discover-results");result.id="jpDiscoverResults";result.setAttribute("aria-live","polite");result.append(el("h2","","Explore a subject"),el("p","muted","Your discovery starts here. Search a subject to explore websites, images, videos, products and places."));page.append(result);
 const section=el("div","jp-section-head");section.append(el("h2","","Explore by category"),el("p","muted","Browse the JR PHEEF discovery categories."));page.append(section);
 const grid=el("div","jp-discover-grid");CATEGORIES.forEach(([name,icon,desc])=>{const b=el("button","jp-discover-category");b.type="button";b.append(el("span","jp-discover-icon",icon),el("strong","",name),el("small","",desc));b.addEventListener("click",()=>showSubject(name));grid.append(b)});page.append(grid);
 const savedPanel=el("section","card jp-discover-saved");savedPanel.id="jpDiscoverSaved";savedPanel.append(el("h2","","Saved subjects"),el("p","muted","Keep the subjects you want to return to."),el("div","jp-discover-saved-list"));page.append(savedPanel);
 app.append(page);
 form.addEventListener("submit",e=>{e.preventDefault();showSubject(input.value)});
 function showSubject(raw){
  const q=safeText(raw);if(!q)return;input.value=q;result.replaceChildren();result.append(el("div","jp-kicker","SUBJECT DESTINATION"),el("h2","",q),el("p","muted","Choose a result type. Search results are supplied by the original external provider and may vary by region, availability and provider terms."));
  const actions=el("div","jp-discover-actions");[["web","WEB"],["images","PHOTOS & IMAGES"],["videos","VIDEOS"],["shopping","PRODUCTS & SHOPPING"],["maps","PLACES & MAPS"]].forEach(([kind,label])=>{const b=el("button",kind==="web"?"primary":"dark",label+" ↗");b.type="button";b.addEventListener("click",()=>open(searchUrl(kind,q)));actions.append(b)});result.append(actions);
  const isSaved=saved.includes(q.toLowerCase());const saveBtn=el("button","dark",isSaved?"REMOVE FROM SAVED":"SAVE SUBJECT");saveBtn.type="button";saveBtn.addEventListener("click",()=>{const key=q.toLowerCase();if(saved.includes(key))saved=saved.filter(x=>x!==key);else if(saved.length<100)saved.unshift(key);if(!save())result.append(el("p","muted","Could not save in this browser."));renderSaved();saveBtn.textContent=saved.includes(key)?"REMOVE FROM SAVED":"SAVE SUBJECT"});result.append(saveBtn);
 }
 function renderSaved(){const host=$("jpDiscoverSaved")?.querySelector(".jp-discover-saved-list");if(!host)return;host.replaceChildren();if(!saved.length){host.append(el("p","muted","No saved subjects yet."));return}saved.forEach(q=>{const b=el("button","dark",q);b.type="button";b.addEventListener("click",()=>showSubject(q));host.append(b)})}
 renderSaved();
}
document.addEventListener("jr:preferences-restored",()=>{saved=readSaved();renderSaved();});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();