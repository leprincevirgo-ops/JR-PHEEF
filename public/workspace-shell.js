/* JR PHEEF — full-screen workspace shell, simple navigation, external service directory. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const catalog=[
["home","Home","Your connected world, organised in one place.","Your command centre for the things you want to discover, organise and move forward."],
["discover","Discover","Find knowledge, products, services, opportunities and people.","Search across JR PHEEF and explore useful information from connected sources."],
["explore","Explore","Visual inspiration from places, nature, cities, architecture and ideas.","Browse visual collections and use supported images as your workspace wallpaper."],
["browser","Browser","Search the web, visit websites and move between pages.","Use the JR PHEEF web workspace. Some websites may open in a separate browser when they do not allow embedding."],
["apphub","App Hub","Keep your favourite apps and services together.","Organise shortcuts to services you already use. External apps open on their own official websites."],
["messages","Messages & Status","Private chats, group conversations and 24-hour updates.","Connect with people through your JR PHEEF account. Calls and media features are added only when secure and supported."],
["social","Social","Share updates and discover your community.","Community tools for posts, connections and conversations."],
["ecosystem","DGBO","Business development, governance and ecosystem oversight.","A dedicated environment for protecting ideas, developing ventures and coordinating opportunities."],
["family","FAMILY","Private family coordination and long-term planning.","A separate family space. Financial services require regulated partners and explicit authorisation."],
["create","Business","Create and manage a business listing.","Publish an offer, product or service and coordinate the next steps."],
["find","Marketplace","Discover products, services and opportunities.","Browse listings. Availability, seller identity and fulfilment must be independently confirmed."],
["economy","Economy","Coordinate business and economic activity.","Organise opportunities, partners, services and transactions. JR PHEEF does not hold customer funds."],
["projects","Projects","Turn goals into organised work.","Create projects, break them into tasks and follow progress."],
["assistant","JR Assistant","Ask for help, research, planning and coordination.","Describe what you want to achieve. JR Assistant can help prepare next steps while consequential actions remain under your control."],
["teacher","JR Teacher","Learn a topic, practise and build study plans.","Choose a subject and learning level, then ask for a lesson, quiz or study plan."],
["universe","Universe","Explore knowledge and possibilities.","Discover subjects, ideas and learning pathways across the world."],
["opportunities","Opportunities","Find and coordinate opportunities.","Review available opportunities and prepare introductions or next steps."],
["jpconnect","JP Connect","Find people and build trusted connections.","Manage connection requests using JP identities and privacy controls."],
["profile","Profile","Your member identity and personal details.","Manage the information other members can see about you."],
["jpidentity","JP Identity","Your JP identity and ecosystem continuity.","JP-01 is a protected ecosystem identity. Identity and succession actions require verification and safeguards."],
["vault","My Files","Keep your documents and personal files organised.","Manage supported files and review access and privacy before sharing."],
["library","Library","Knowledge and learning resources.","Search saved resources and learning materials."],
["lab","Research & Ideas","Explore experiments, research and concepts.","Organise research notes, experiments and early ideas."],
["command","Control Centre","Review ecosystem operations and coordination.","A controlled oversight workspace. Access depends on your account role."],
["referrals","Invite & Grow","Invite people and review referral activity.","Share your invitation and track activity where referral features are enabled."],
["points","Points","Review your JR PHEEF points.","See your points balance and eligible activity. Points are not cash unless a programme explicitly says so."],
["flex","PHEEF Flex","Review Flex requests and supported services.","Availability depends on active service partners and programme rules."],
["rooms","Rooms","Explore accommodation listings.","Review listing details and contact providers through supported channels."],
["devices","Devices","Review devices connected to your account.","Manage account sessions and device records where available."],
["voice","Voice & Type","Speak or type to JR PHEEF.","Use voice input where your browser supports it, or type normally."],
["scifi","Future Worlds","Explore future concepts and creative technology.","A space for future-facing topics, concepts and creative exploration."],
["fixedit","Repair Services","Find repair and maintenance services.","Explore service listings and send connection requests."],
["ideas","Shape JR","Suggest improvements and new features.","Tell JR PHEEF what should be improved. Requests are reviewed before release."],
["ads","Advertising Centre","Manage advertising and promotions.","Sponsored content must be labelled and campaign tools depend on approved advertising features."],
["mylistings","My Listings","Manage your published offers.","Review and update listings connected to your account."],
["deals","Deals","Organise negotiations and deal rooms.","Keep deal details, participants and next steps organised with appropriate access controls."],
["alerts","Notifications","Review important updates.","See notifications and choose which alerts you want to receive."],
["delivery","Delivery","Coordinate delivery requests and fulfilment.","Delivery depends on participating providers and confirmed service areas."],
["powersale","PowerSale","Coordinate supported sales flows.","Manage eligible sales activity; payment processing requires approved payment partners."],
["membership","Membership","Review your membership and access.","See the features and terms available to your account."],
["accessgov","Access Governance","Review permissions and governance.","Sensitive access and ownership changes require verification, audit and appropriate approvals."],
["businessgrowth","Business Growth","Organise business goals and operating plans.","Plan growth activities, track tasks and coordinate business support."],
["jrsettings","Settings","One place for account, security, privacy, appearance and help.","Manage your JR PHEEF experience and account controls."],
["connections","Connections","Bring your external services into one organised place.","Browse official services and manage approved integrations when provider authorisation becomes available."]
];
const providers=[
["Google","Search, maps, email and productivity","https://www.google.com"],
["Microsoft","Work, productivity and cloud services","https://www.microsoft.com"],
["Apple","Devices, services and account ecosystem","https://www.apple.com"],
["Meta","Social and communication services","https://www.meta.com"],
["WhatsApp","Messaging and business communication","https://www.whatsapp.com"],
["Amazon","Shopping, cloud and business services","https://www.amazon.com"],
["Shopify","Online stores and commerce tools","https://www.shopify.com"],
["Stripe","Payment infrastructure for approved businesses","https://stripe.com"],
["PayPal","Digital payments and merchant services","https://www.paypal.com"],
["GitHub","Software projects and developer collaboration","https://github.com"],
["Zoom","Meetings and video communication","https://zoom.us"],
["Slack","Team communication and collaboration","https://slack.com"],
["Uber","Mobility and delivery services","https://www.uber.com"],
["Booking.com","Travel and accommodation","https://www.booking.com"],
["Airbnb","Stays and experiences","https://www.airbnb.com"],
["LinkedIn","Professional identity and opportunities","https://www.linkedin.com"],
["YouTube","Video and learning content","https://www.youtube.com"],
["OpenStreetMap","Open map data and geographic tools","https://www.openstreetmap.org"]
];
let history=[],cursor=-1,wrapped=false;
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function pageFor(id){let p=$(id);if(p)return p;p=document.createElement("section");p.id=id;p.className="page hidden jr-generated-workspace";$("app")?.append(p);return p;}
function makeChrome(p,id){
 if(p.querySelector(":scope > .jr-page-chrome"))return;
 const meta=catalog.find(x=>x[0]===id)||[id,id.replace(/[-_]/g," "), "JR PHEEF workspace","Organise this area and continue with the relevant next step."];
 const chrome=el("div","jr-page-chrome");
 const left=el("div","jr-page-crumbs");left.append(el("span","jr-page-brand","JR PHEEF"),el("span","jr-page-separator","/"),el("span","jr-page-current",meta[1]));
 const actions=el("div","jr-page-actions");
 [["←","Back",()=>navigate(-1)],["→","Forward",()=>navigate(1)],["⌂","Home",()=>go("home",true)]].forEach(([icon,label,fn])=>{const b=el("button","jr-page-nav",icon+" "+label);b.type="button";b.addEventListener("click",fn);actions.append(b);});
 chrome.append(left,actions);p.prepend(chrome);
}
function renderGenerated(p,id){
 const meta=catalog.find(x=>x[0]===id)||[id,id.replace(/[-_]/g," "),"JR PHEEF workspace","Organise this area and continue with the relevant next step."];
 p.innerHTML="";
 const hero=el("section","jr-workspace-hero");
 hero.append(el("div","jp-kicker","JR PHEEF · WORKSPACE"),el("h1","",meta[1]),el("p","",meta[2]),el("p","jr-workspace-intro",meta[3]));
 const actions=el("div","jr-workspace-actions");
 const back=el("button","primary","OPEN JR ASSISTANT");back.type="button";back.addEventListener("click",()=>go("assistant"));
 const discover=el("button","dark","GO TO DISCOVER");discover.type="button";discover.addEventListener("click",()=>go("discover"));
 actions.append(back,discover);hero.append(actions);p.append(hero);
 const details=el("div","jr-workspace-grid");
 const cards=[
 ["Your workspace","Use this area to organise the work, information and people related to "+meta[1]+".","Workspace"],
 ["Connected ecosystem","JR PHEEF coordinates across its own areas while keeping DGBO, FAMILY and personal data access separated.","Coordination"],
 ["External services","Use Connections to discover official services. Account integrations are enabled only through approved provider authorisation.","Connections"]
 ];
 cards.forEach(([title,body,link])=>{const c=el("article","card jr-workspace-card");c.append(el("h3","",title),el("p","",body));const b=el("button","dark","OPEN "+link.toUpperCase());b.type="button";b.addEventListener("click",()=>go(link==="Connections"?"connections":"ecosystem"));c.append(b);details.append(c);});
 p.append(details);
}
function renderConnections(p){
 p.innerHTML="";
 const hero=el("section","jr-workspace-hero jr-connections-hero");hero.append(el("div","jp-kicker","JR PHEEF · EXTERNAL CONNECTIONS"),el("h1","","Your services, organised."),el("p","","A single place to find the external services you already use and prepare secure connections to JR PHEEF."),el("p","jr-workspace-intro","A service appearing here does not mean its account is connected. Secure integrations require the provider's official API, your authorisation and any required partner approval."));
 const search=el("input","jr-provider-search");search.type="search";search.placeholder="Search companies and services…";search.setAttribute("aria-label","Search external services");hero.append(search);p.append(hero);
 const grid=el("div","jr-provider-grid");grid.id="jrProviderGrid";
 function draw(q=""){grid.replaceChildren();providers.filter(x=>x.join(" ").toLowerCase().includes(q.toLowerCase())).forEach(([name,desc,url])=>{const card=el("article","card jr-provider-card");card.append(el("span","jr-provider-mark",name.slice(0,1)),el("h3","",name),el("p","",desc),el("span","jr-provider-status","EXTERNAL SERVICE · NOT CONNECTED"));const a=el("a","jr-provider-link","OPEN OFFICIAL SERVICE ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);grid.append(card);});}
 search.addEventListener("input",()=>draw(search.value));draw();p.append(grid);
 const note=el("div","card jr-integration-note");note.append(el("h3","","How connections become active"),el("p","","When a provider offers an approved integration, JR PHEEF will request the minimum permissions needed, explain what data is shared, and let you revoke access. Passwords are never requested or stored by JR PHEEF for another company's account."));p.append(note);
}
function ensure(id){
 let p=pageFor(id);
 if(p.classList.contains("jr-generated-workspace"))renderGenerated(p,id);
 if(id==="connections")renderConnections(p);
 makeChrome(p,id);
 return p;
}
function go(id,replace=false){
 if(!id)return;
 const p=ensure(id);
 if(cursor<0||history[cursor]!==id){history=history.slice(0,cursor+1);history.push(id);cursor=history.length-1;}
 document.querySelectorAll("#app .page").forEach(x=>x.classList.add("hidden"));
 p.classList.remove("hidden");
 updateNav(id);window.scrollTo({top:0,behavior:"instant"});
}
function updateNav(id){document.querySelectorAll("#app>.nav [data-page]").forEach(b=>{const active=b.dataset.page===id;b.classList.toggle("jp-nav-active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});}
function navigate(delta){const next=cursor+delta;if(next<0||next>=history.length)return;cursor=next;const id=history[cursor],p=ensure(id);document.querySelectorAll("#app .page").forEach(x=>x.classList.add("hidden"));p.classList.remove("hidden");updateNav(id);window.scrollTo({top:0,behavior:"instant"});}
function concealInternalOrchestration(){
 const architecture=$("connectedArchitecture");if(architecture)architecture.hidden=true;
 const directory=$("aiAgentDirectory");if(directory){const card=directory.closest(".card");if(card)card.hidden=true;}
 const mode=$("aiMode"),modeLabel=document.querySelector('label[for="aiMode"]');if(mode)mode.hidden=true;if(modeLabel)modeLabel.hidden=true;
 document.querySelectorAll(".page h2,.page h3").forEach(node=>{if(/specialist ai agents|jr pheef intelligence capabilities|intelligence · command · operations · control/i.test(node.textContent||"")){const card=node.closest(".card");if(card)card.hidden=true;}});
}
function mount(){
 const app=$("app");if(!app||wrapped)return;
 concealInternalOrchestration();
 const observer=new MutationObserver(()=>concealInternalOrchestration());observer.observe(app,{childList:true,subtree:true});
 // Add Connections to the main navigation without duplicating entries.
 const nav=app.querySelector(":scope > .nav");
 if(nav&&!nav.querySelector('[data-page="connections"]')){const b=el("button","","⇄  Connections");b.dataset.page="connections";b.addEventListener("click",()=>go("connections"));nav.append(b);}
 if(nav&&!nav.querySelector(".jr-nav-group")){
  const groups=[
   ["YOUR WORLD",["home","discover","explore","browser","apphub"]],
   ["CONNECT",["messages","social","jpconnect","connections"]],
   ["CREATE & GROW",["create","find","opportunities","projects","economy","businessgrowth","ads","mylistings","deals","delivery","powersale"]],
   ["ECOSYSTEM",["ecosystem","family","command","accessgov","jpidentity"]],
   ["PERSONAL",["profile","vault","library","teacher","universe","assistant","voice","lab","points","flex","rooms","devices","referrals","membership","scifi","fixedit","ideas","alerts","themes","jrsettings"]]
  ];
  const buttons=[...nav.querySelectorAll(":scope > button")],used=new Set();
  nav.replaceChildren();
  groups.forEach(([label,ids])=>{const group=el("div","jr-nav-group"),heading=el("div","jr-nav-group-label",label);group.append(heading);ids.forEach(id=>{const b=buttons.find(x=>x.dataset.page===id);if(b){group.append(b);used.add(b);}});if(group.querySelector("button"))nav.append(group);});
  const rest=buttons.filter(b=>!used.has(b));if(rest.length){const group=el("div","jr-nav-group");group.append(el("div","jr-nav-group-label","MORE"));rest.forEach(b=>group.append(b));nav.append(group);}
 }
 const original=window.show;
 if(typeof original==="function"){
  window.show=function(id){const p=ensure(id);if(original)original(id);if(!$(id)&&p.id!==id)return;go(id);};
  wrapped=true;
 }
 // Make every existing page a true workspace and apply page-level chrome.
 document.querySelectorAll("#app .page").forEach(p=>makeChrome(p,p.id));
 const active=document.querySelector("#app .page:not(.hidden)")||$("home");
 if(active){const id=active.id||"home";history=[id];cursor=0;ensure(id);updateNav(id);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
window.jrWorkspaceNavigate=go;
})();