/* JR PHEEF — full-screen workspace shell, simple navigation, external service directory. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const catalog=[
["home","Home","Your connected world, organised in one place.","Your Command Centre for the things you want to discover, organise and move forward."],
["discover","Discover","Find knowledge, products, services, opportunities and people.","Search across JR PHEEF and explore useful information from connected sources."],
["explore","Explore","Visual inspiration from places, nature, cities, architecture and ideas.","Browse visual collections and use supported images as your workspace wallpaper."],
["browser","Browser","Search the web, visit websites and move between pages.","Use the JR PHEEF web workspace. Some websites may open in a separate browser when they do not allow embedding."],
["apphub","App Hub","Keep your favourite apps and services together.","Organise shortcuts to services you already use. External apps open on their own official websites."],
["messages","Messages & Status","Private chats, group conversations and 24-hour updates.","Connect with people through your JR PHEEF account. Calls and media features are added only when secure and supported."],
["social","Social","Share updates and discover your community.","Community tools for posts, connections and conversations."],
["dgbo","DGBO","Business development, governance and opportunity development.","Explore DGBO services and open the tools available to develop your ideas and ventures."],
["ecosystem","Ecosystem Overview","Review how DGBO, JR PHEEF and FAMILY connect.","A shared overview of the ecosystem, its permissions and operating status."],
["family","FAMILY","Private family coordination and long-term planning.","A separate family space. Financial services require regulated partners and explicit authorisation."],
["create","Business","Create and manage a business listing.","Publish an offer, product or service and coordinate the next steps."],
["find","Discover Opportunities","Explore products, services and opportunities.","Review opportunities and coordinate next steps. Availability and provider details must be confirmed."],
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
["command","Command Centre","Your overview for operations, intelligence, connections and decisions.","A controlled oversight workspace. Access depends on your account role."],
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
["connections","Connections","Bring your external services into one organised place.","Browse official services and manage approved integrations when provider authorisation becomes available."],
["partners","Partner Centre","Connect companies, institutions and service providers with JR PHEEF.","Review the partner onboarding and integration pathway. Partner registration is not enabled in this release."],
["developers","Developer Centre","Build services and integrations for JR PHEEF.","Review the planned API, SDK, sandbox and publishing capabilities. Developer access is not open yet."],
["discoverhub","Discover & Learn","Search, explore and learn in one place.","Find information, browse the world, study subjects and research ideas in one workspace."],
["workhub","Create & Work","Turn ideas into projects, businesses and finished work.","Create, organise, research and grow from one workspace."],
["connecthub","People & Connect","Your conversations, community and relationships.","Bring messages, social activity, JP Connect and opportunities together."],
["personalhub","My Space & Settings","Your account, personal tools, preferences and security.","Manage your profile, files, devices, appearance, accessibility and privacy."],
["morehub","More Services","Additional JR PHEEF services and ecosystem areas.","Open specialist services without crowding your main navigation."],
["discoverhub","Discover & Learn","Search, explore and learn in one place.","Find information, browse the world, study subjects and research ideas without switching between competing tabs."],
["workhub","Create & Work","Turn ideas into projects, businesses and finished work.","Create, organise, research and grow from one workspace."],
["connecthub","People & Connect","Your conversations, community and relationships.","Bring messages, social activity, JP Connect and opportunities together."],
["personalhub","My Space & Settings","Your account, personal tools, preferences and security.","Manage your profile, files, devices, appearance, accessibility and privacy in one place."],
["morehub","More Services","Additional JR PHEEF services, ecosystem areas and support.","Open specialist services when you need them without crowding your main navigation."]

];
// Keep one canonical destination record for each workspace ID.
const catalogSeen=new Set();
for(let i=catalog.length-1;i>=0;i--){
 if(catalogSeen.has(catalog[i][0]))catalog.splice(i,1);
 else catalogSeen.add(catalog[i][0]);
}
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
function makeChrome(p,id){return;}
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
function renderCommandCentre(p){
 p.innerHTML="";
 const hero=el("section","jr-workspace-hero jr-command-hero");
 hero.append(el("div","jp-kicker","JR PHEEF · COMMAND CENTRE"),el("h1","","Your Command Centre"),el("p","","The place to oversee what matters, decide what happens next and follow progress across your JR PHEEF world."),el("p","jr-workspace-intro","Prioritised by urgency and importance. Operational figures appear only when verified live data is available."));
 const intro=el("section","jr-command-priority-intro");
 intro.append(el("span","jp-kicker","YOUR OPERATING ORDER"),el("p","","First protect and resolve. Then execute. Then grow. Finally review and improve."));
 const groups=[
  ["01 · LEAD — ATTENTION & DECISIONS","Resolve urgent matters before starting new work.",[["Needs Your Attention","Review alerts, pending requests and important updates.","alerts"],["Approvals & Governance","Review permissions, proposals and decisions requiring your authorisation.","accessgov"],["Security & Account Health","Manage identity, privacy, devices and access controls.","jrsettings"]]],
  ["02 · EXECUTE — DAILY OPERATIONS","Keep commitments, projects and services moving.",[["Daily Operations","Open your projects, tasks, milestones and ongoing work.","projects"],["Business Operations","Review business workspaces, daily plans and growth activities.","businessgrowth"],["People & Communications","Continue conversations, connection requests and team coordination.","connecthub"],["Delivery & Service Activity","Coordinate fulfilment, service requests and deal progress.","delivery"]]],
  ["03 · GROW — OPPORTUNITIES & INTELLIGENCE","Build new value after essential operations are under control.",[["Opportunities & Partnerships","Find new opportunities, people and potential partners.","opportunities"],["Intelligence & Research","Research, compare evidence, identify risks and develop ideas.","lab"],["Advertising & Audience","Create promotions and review advertising activity.","ads"],["Customer & Market Discovery","Explore demand, listings, services and potential customers.","discover"]]],
  ["04 · STEWARD — ECOSYSTEM & RESOURCES","Review the wider organisation, connections and long-term direction.",[["DGBO","Open the parent business development environment.","dgbo"],["FAMILY","Open the separate family coordination environment.","family"],["Ecosystem Overview","Review how DGBO, JR PHEEF and FAMILY are structured.","ecosystem"],["Connected Services","Review available external services and their connection status.","connections"],["Reports & Activity","Review available records and operational history.","alerts"]]],
  ["05 · IMPROVE — LEARN & CONFIGURE","Strengthen the system and prepare for what comes next.",[["JR Assistant","Ask JR to research, plan and prepare your next actions.","assistant"],["Learning & Knowledge","Build knowledge and skills for future decisions.","teacher"],["Settings & Preferences","Configure your experience, notifications and accessibility.","jrsettings"]]]
 ];
 const content=el("div","jr-command-sections");
 groups.forEach(([heading,description,items])=>{
  const section=el("section","jr-command-group");
  const head=el("div","jr-command-group-heading");head.append(el("span","jp-kicker",heading),el("p","",description));
  const grid=el("div","jr-workspace-grid jr-command-grid");
  items.forEach(([title,body,target])=>{const card=el("article","card jr-workspace-card jr-command-card");card.append(el("h3","",title),el("p","",body));const b=el("button","dark","OPEN "+title.toUpperCase());b.type="button";b.addEventListener("click",()=>go(target));card.append(b);grid.append(card);});
  section.append(head,grid);content.append(section);
 });
 p.append(hero,intro,content);
}

const hubGroups={
 discoverhub:[
  ["SEARCH & BROWSE",[["Search","Search JR PHEEF","find"],["Discover","Find products, services and information","discover"],["Browser","Browse the wider web","browser"],["App Hub","Open your other apps","apphub"]]],
  ["EXPLORE & LEARN",[["Explore","Places, nature, cities and inspiration","explore"],["JR Teacher","Lessons and study plans","teacher"],["Library","Saved learning resources","library"],["Future Worlds","Ideas and future concepts","scifi"]]],
  ["RESEARCH & KNOWLEDGE",[["Research & Ideas","Experiments, notes and concepts","lab"],["Universe","Explore subjects and knowledge","universe"]]]
 ],
 workhub:[
  ["PLAN & CREATE",[["JR Assistant","Plan and coordinate a goal","assistant"],["Projects","Tasks, milestones and progress","projects"],["Business","Create a business listing","create"],["Business Growth","Business plans and operations","businessgrowth"]]],
  ["BUY & SELL",[["Discover Opportunities","Find products and services","find"],["My Listings","Manage your offers","mylistings"],["Deals","Negotiations and deal rooms","deals"],["PowerSale","Supported sales workflows","powersale"]]],
  ["RUN & GROW",[["Opportunities","Find and coordinate opportunities","opportunities"],["Delivery","Delivery and fulfilment coordination","delivery"],["Advertising Centre","Promotions and campaigns","ads"],["PHEEF Flex","Supported Flex services","flex"]]]
 ],
 connecthub:[
  ["COMMUNICATE",[["Messages & Status","Private and group conversations","messages"],["Social","Community posts and updates","social"]]],
  ["PEOPLE & NETWORK",[["JP Connect","JP identity connections","jpconnect"],["Opportunities","People, work and opportunities","opportunities"],["Invite & Grow","Referrals and invitations","referrals"]]],
  ["YOUR IDENTITY & SPACE",[["Profile","Your personal identity and details","profile"],["JP Identity","Your ecosystem identity","jpidentity"],["Membership & Points","Membership and eligible activity","membership"],["My Files & Library","Your documents and saved resources","vault"],["Devices","Your connected devices","devices"],["Settings & Privacy","Account and security controls","jrsettings"],["Appearance Studio","Themes and display preferences","themes"],["Notifications","Your alerts and preferences","alerts"],["Voice & Type","Speak or type to JR","voice"]]]
 ],
 personalhub:[
  ["YOUR IDENTITY & SPACE",[["Open Connect","Your profile, tools and preferences now live in Connect","connecthub"]]]
 ],
 morehub:[
  ["ECOSYSTEM SPACES",[["DGBO","Business development and ideas","dgbo"],["FAMILY","Family coordination","family"],["Ecosystem Overview","How the ecosystem connects","ecosystem"],["Economy","Business and economic coordination","economy"],["Control Centre","Restricted operational oversight","command"]]],
  ["SERVICES & SUPPORT",[["Repair Services","Repair and maintenance","fixedit"],["Advertising Centre","Advertising services","ads"],["Library","Authorised learning and media resources","library"],["Shape JR","Suggest features and improvements","ideas"],["Settings & Help","Account controls and support","jrsettings"]]],
  ["BUILD & CONNECT",[["Connections","External services","connections"],["Partner Centre","Partner onboarding information","partners"],["Developer Centre","Developer resources","developers"],["App Hub","Your external app shortcuts","apphub"]]]
 ]
};
function renderHub(p,id){
 const meta=catalog.find(x=>x[0]===id);
 const groups=hubGroups[id]||[];
 p.innerHTML="";
 const hero=el("section","jr-workspace-hero jr-parent-hub");
 hero.append(el("div","jp-kicker","JR PHEEF · ORGANIZED WORKSPACE"),el("h1","",meta?.[1]||"Workspace"),el("p","",meta?.[2]||""),el("p","jr-workspace-intro",meta?.[3]||""));
 const content=el("div","jr-hub-categories");
 groups.forEach(([heading,items])=>{
  const section=el("section","jr-hub-category");
  const title=el("div","jr-hub-category-heading");
  title.append(el("span","jp-kicker",heading),el("span","jr-hub-category-count",String(items.length)+" destinations"));
  const grid=el("div","jr-workspace-grid jr-child-workspace-grid");
  items.forEach(([name,desc,target])=>{
   const card=el("article","card jr-workspace-card jr-child-workspace-card");
   card.append(el("span","jp-kicker","JR PHEEF · SECTION"),el("h3","",name),el("p","",desc));
   const b=el("button","dark","OPEN "+name.toUpperCase());b.type="button";b.addEventListener("click",()=>go(target));
   card.append(b);grid.append(card);
  });
  section.append(title,grid);content.append(section);
 });
 p.append(hero,content);
}
function ensure(id){
 if(id==="personalhub")id="connecthub";
 let p=pageFor(id);
 if(hubGroups[id]){renderHub(p,id);return p;}
 if(id==="command"){p.classList.remove("jr-generated-workspace");renderCommandCentre(p);}
 else if(p.classList.contains("jr-generated-workspace"))renderGenerated(p,id);
 if(id==="connections")renderConnections(p);
 return p;
}
function activateOnlyWorkspace(id){
 const pages=Array.from(document.querySelectorAll("#app .page"));
 pages.forEach(page=>{
  const active=page.id===id;
  page.classList.toggle("hidden",!active);
  page.hidden=!active;
  page.setAttribute("aria-hidden",String(!active));
  if("inert" in page)page.inert=!active;
 });
 const activePage=$(id);
 if(activePage){
  activePage.hidden=false;
  activePage.classList.remove("hidden");
  activePage.setAttribute("aria-hidden","false");
  if("inert" in activePage)activePage.inert=false;
 }
 return activePage;
}
function go(id,replace=false){
 if(id==="personalhub")id="connecthub";
 if(!id)return;
 const p=ensure(id);
 if(cursor<0||history[cursor]!==id){history=history.slice(0,cursor+1);history.push(id);cursor=history.length-1;}
 activateOnlyWorkspace(id);
 updateNav(id);window.scrollTo({top:0,behavior:"instant"});
 document.dispatchEvent(new CustomEvent("jr:workspacechange",{detail:{id}}));
}
function updateNav(id){document.querySelectorAll("#app>.nav [data-page]").forEach(b=>{const active=b.dataset.page===id;b.classList.toggle("jp-nav-active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});}
function navigate(delta){const next=cursor+delta;if(next<0||next>=history.length)return;cursor=next;const id=history[cursor];ensure(id);activateOnlyWorkspace(id);updateNav(id);window.scrollTo({top:0,behavior:"instant"});document.dispatchEvent(new CustomEvent("jr:workspacechange",{detail:{id}}));}
function concealInternalOrchestration(){
 const architecture=$("connectedArchitecture");if(architecture)architecture.hidden=true;
 const directory=$("aiAgentDirectory");if(directory){const card=directory.closest(".card");if(card)card.hidden=true;}
 const mode=$("aiMode"),modeLabel=document.querySelector('label[for="aiMode"]');if(mode)mode.hidden=true;if(modeLabel)modeLabel.hidden=true;
 document.querySelectorAll(".page h2,.page h3").forEach(node=>{if(/specialist ai agents|jr pheef intelligence capabilities|intelligence · command · operations · control/i.test(node.textContent||"")){const card=node.closest(".card");if(card)card.hidden=true;}});
}
function mount(){
 const app=$("app");if(!app||wrapped)return;
 if(!$("jrEverywhereStyles")){const l=document.createElement("link");l.id="jrEverywhereStyles";l.rel="stylesheet";l.href="/jr-everywhere.css";document.head.append(l);}
 if(!$("jrEverywhereScript")){const sc=document.createElement("script");sc.id="jrEverywhereScript";sc.src="/jr-everywhere.js";sc.defer=true;document.body.append(sc);}
 concealInternalOrchestration();
 const observer=new MutationObserver(()=>concealInternalOrchestration());observer.observe(app,{childList:true,subtree:true});
 // Keep the primary navigation limited to Home, Explore, JR Assistant, Connect and More.
 // The ecosystem group order ["dgbo","family","ecosystem"] stays together inside More.
 // All other destinations are grouped inside More; never append workspace buttons to the primary bar.
 const nav=app.querySelector(":scope > .nav");
 if(nav){
  nav.querySelector(".jr-desktop-extra")?.remove();
  const home=$("home");
  if(home&&!home.querySelector(".jr-desktop-landscapes")){
   const landscapes=el("section","jr-desktop-landscapes");
   landscapes.innerHTML='<div class="jr-landscape-heading"><div><span>EXPLORE YOUR WORLD</span><h2>Places, possibilities and new horizons</h2></div><button type="button" data-jr-landscape-all>Explore all →</button></div><div class="jr-landscape-grid"><button class="jr-landscape-scene jr-scene-city" data-jr-world-page="explore"><span>01 · PLACES</span><b>Discover places</b><small>Explore cities and destinations</small></button><button class="jr-landscape-scene jr-scene-nature" data-jr-world-page="explore"><span>02 · NATURE</span><b>Find your calm</b><small>Landscapes, nature and inspiration</small></button><button class="jr-landscape-scene jr-scene-future" data-jr-world-page="explore"><span>03 · FUTURE</span><b>Imagine what is next</b><small>Ideas, science and technology</small></button><button class="jr-landscape-scene jr-scene-space" data-jr-world-page="explore"><span>04 · BEYOND</span><b>Go beyond borders</b><small>Explore a wider universe</small></button></div>';
   home.append(landscapes);
   landscapes.querySelector("[data-jr-landscape-all]")?.addEventListener("click",()=>go("explore"));
   landscapes.querySelectorAll("[data-jr-world-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.jrWorldPage)));
  }
  const wrap=nav.querySelector(".jp-more-wrap");
  const menu=wrap?.querySelector("#jpMoreMenu");
  if(wrap&&menu){
   menu.replaceChildren();
   const existing=new Set([...nav.querySelectorAll("[data-page]")].map(b=>b.dataset.page));
   const sections=[
    ["DISCOVER & LEARN",["discoverhub"]],
    ["CREATE & WORK",["workhub"]],
    ["PEOPLE & CONNECT",["connecthub"]],
    ["MORE SERVICES",["morehub"]]
   ];
   sections.forEach(([label,ids])=>{
    const missing=ids.map(id=>catalog.find(item=>item[0]===id)).filter(item=>item&&!existing.has(item[0]));
    if(!missing.length)return;
    const heading=el("div","jp-more-heading",label);
    const group=el("div","jp-more-group");
    missing.forEach(item=>{
     const b=el("button","","");
     b.type="button";b.dataset.page=item[0];b.setAttribute("role","menuitem");b.textContent=item[1];
     b.addEventListener("click",()=>{go(item[0]);jrCloseMoreMenu();});
     group.append(b);existing.add(item[0]);
    });
    menu.append(heading,group);
   });
  }
 }
 const original=window.show;
 if(typeof original==="function"){
  window.show=function(id){const p=ensure(id);if(original)original(id);if(!$(id)&&p.id!==id)return;go(id);};
  wrapped=true;
 }
 // One global navigation only; duplicate page-level navigation bars are disabled.
 const active=document.querySelector("#app .page:not(.hidden)")||$("home");
 if(active){const id=active.id||"home";history=[id];cursor=0;ensure(id);updateNav(id);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
window.jrWorkspaceNavigate=go;
})();