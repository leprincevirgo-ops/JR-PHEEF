/* JR PHEEF field-agent directory. Agents are specialist modes of the shared AI service. */
(function(){
"use strict";
const agents=[
["entertainment","Entertainment","Discover media, events and experiences"],
["tools","Tools","Choose and use tools safely"],
["photography","Photography","Composition, lighting and editing"],
["business","Business","Entrepreneurship and business models"],
["shopping","Shopping","Product research and comparison"],
["education","Education","Tutoring and learning plans"],
["religion","Religion","Respectful faith and tradition reference"],
["finance","Finance","Budgeting and financial literacy"],
["fashion","Fashion","Style, fit and wardrobe planning"],
["travel","Travel","Itineraries, budgets and travel research"],
["food","Food","Recipes, food safety and general nutrition"],
["books","Books","Reading discovery and study plans"],
["health","Health","General health information and appointment prep"],
["parenting","Parenting","Family routines and child development information"],
["reference","Reference","Facts, definitions and source finding"],
["communication","Communication","Writing, translation and conversation prep"],
["productivity","Productivity","Goals, plans and workflow improvement"],
["science","Scientific Research","Evidence, methods and research literacy"],
["security","Security","Privacy and defensive security"],
["analytics","Data & Analytics","Metrics, data interpretation and insight"],
["creativity","Creativity","Ideas, concepts and creative development"],
["development","Development Tools","Software architecture, coding and testing"],
["smallbusiness","Small Business","Customer discovery and business setup"],
["operations","Business & Operations","Process, service and operational planning"],
["social","Social","Community building and moderation"],
["sports","Sports","Sports knowledge and performance analysis"],
["jobs","Jobs","Career development and job-search support"],
["news","News","News context and source comparison"],
["media","Music & Video","Media discovery and creator workflows"],
["security_recovery","Security & Succession","Account safety, recovery and continuity"],
["dgbo","DGBO","Governance, strategy and venture coordination"],
["family","FAMILY","Family coordination and financial education"],
["ecosystem","Ecosystem Coordinator","Coordinate work across JR PHEEF modules"],
["shopping_services","Marketplace & Services","Find and safely scope services"]
];
function init(){
 const select=document.getElementById("aiMode");
 if(!select)return;
 const existing=new Set(Array.from(select.options).map(o=>o.value));
 agents.forEach(([value,label])=>{if(!existing.has(value)){const o=document.createElement("option");o.value=value;o.textContent=label+" Agent";select.appendChild(o);}});
 const host=document.getElementById("aiAgentDirectory");
 if(host)host.innerHTML=agents.map(([value,label,desc])=>'<button type="button" class="listing" data-agent="'+value+'" style="text-align:left;color:inherit;background:rgba(3,18,38,.75);border:1px solid rgba(66,245,255,.18)" onclick="selectJRAIAgent(\''+value+'\')"><b>'+label+' Agent</b><p class="muted">'+desc+'</p></button>').join("");
}
window.selectJRAIAgent=function(value){const select=document.getElementById("aiMode");if(select){select.value=value;document.getElementById("aiQuestion").focus();document.getElementById("aiStatus").textContent="Selected "+select.options[select.selectedIndex].text+". Ask your specialist below.";document.getElementById("assistant").scrollIntoView({behavior:"smooth"});}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();