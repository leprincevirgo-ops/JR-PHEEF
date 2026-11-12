/* JR PHEEF — full-screen workspace shell, simple navigation, external service directory. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const catalog=[
["home","Home","Your connected world, organised in one place.","Your Command Center for the things you want to discover, organise and move forward."],
["worlds","Worlds","Explore the connected JR PHEEF ecosystem.","Discover places, knowledge, opportunities, communities, services and the worlds connected to your account."],
["discover","Discover","Find knowledge, products, services, opportunities and people.","Search across JR PHEEF and explore useful information from connected sources."],
["explore","Explore","Visual inspiration from places, nature, cities, architecture and ideas.","Browse visual collections and use supported images as your workspace wallpaper."],
["browser","Browser","Search the web, visit websites and move between pages.","Use the JR PHEEF web workspace. Some websites may open in a separate browser when they do not allow embedding."],
["apphub","App Hub","Keep your favourite apps and services together.","Organise shortcuts to services you already use. External apps open on their own official websites."],
["messages","JR LINK","Private and group conversations, connections and updates.","The communication environment for messages, groups, social connections and supported sharing."],
["social","Social","Share updates and discover your community.","Community tools for posts, connections and conversations."],
["dgbo","DGBO","Business development, governance and opportunity development.","Explore DGBO services and open the tools available to develop your ideas and ventures."],
["ecosystem","Ecosystem Overview","Review how DGBO, JR PHEEF and FAMILY connect.","A shared overview of the ecosystem, its permissions and operating status."],
["companies","My Companies","Open JR PHEEF, DGBO, FAMILY and your authorised business environments.","One member entry point for distinct company services. Each company keeps separate records, permissions and confidential operations."],
["family","FAMILY","Financial Access to Money for Investments & Loving Yourself.","A company environment within the JR PHEEF ecosystem. Open available FAMILY services; financial products remain subject to activation, eligibility and authorised partners."],
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
["library","JR PHEEF LIBRARY","Your organised collection of knowledge and files.","Find saved resources, learning materials and personal files with their access controls."],
["lab","JR PHEEF LAB","Research, experiments, ideas and development.","Investigate questions, organise experiments and develop concepts."],
["command","Command Center","Your overview for operations, intelligence, connections and decisions.","A controlled oversight workspace. Access depends on your account role."],
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
["partners","Partner Centre","Connect companies, institutions and service providers with JR PHEEF.","Review the partner onboarding pathway. The signed-in Developer Portal and limited inbound event gateway are live; general partner registration is not enabled."],
["developers","Developer Centre","Build services and integrations for JR PHEEF.","Use the signed-in Developer Portal and limited inbound event gateway. General public APIs, SDKs, sandbox and two-way integrations are not yet available."],
["discoverhub","Discover & Learn","Search, explore and learn in one place.","Find information, browse the world, study subjects and research ideas in one workspace."],
["workhub","Create & Work","Turn ideas into projects, businesses and finished work.","Create, organise, research and grow from one workspace."],
["connecthub","JR LINK","Your conversations, communities and relationships.","The dedicated communication world inside JR PHEEF."],
["personalhub","My Space & Settings","Your account, personal tools, preferences and security.","Manage your profile, files, devices, appearance, accessibility and privacy."],
["morehub","More Services","Additional JR PHEEF services and ecosystem areas.","Open specialist services without crowding your main navigation."],
["mediahub","JR PHEEF MEDIA","Discover, create, publish and experience media.","A connected media environment. Existing discovery, library and promotion tools are grouped here; dedicated streaming, creator publishing and live broadcasting require further implementation."],
["businesshub","JR PHEEF BUSINESS","Start, organise and grow an enterprise.","A connected business environment for listings, business workspaces, operations, trade and opportunities. Some workflows remain subject to provider, payment and regulatory activation."],
["labhub","JR PHEEF LAB","Research, experiment, invent and develop.","A working entry point for research, projects, idea development and supported web research."],
["libraryhub","JR PHEEF LIBRARY","Collect, organise, retrieve and preserve knowledge.","A connected home for saved learning resources, personal files and reference materials."],
["learnhub","JR PHEEF LEARN","Build knowledge, skills and practical capability.","Connect lessons, learning resources, research and projects."],
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
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function clearChildren(node){while(node&&node.firstChild)node.removeChild(node.firstChild);}
function replaceChildrenCompat(node,...children){clearChildren(node);for(const child of children)if(child)node.appendChild(child);}
function pageFor(id){let p=$(id);if(p)return p;p=document.createElement("section");p.id=id;p.className="page hidden jr-generated-workspace";(function(){var app=$("app");if(app)app.appendChild(p);})();return p;}
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
 function draw(q=""){clearChildren(grid);providers.filter(x=>x.join(" ").toLowerCase().includes(q.toLowerCase())).forEach(([name,desc,url])=>{const card=el("article","card jr-provider-card");card.append(el("span","jr-provider-mark",name.slice(0,1)),el("h3","",name),el("p","",desc),el("span","jr-provider-status","EXTERNAL SERVICE · NOT CONNECTED"));const a=el("a","jr-provider-link","OPEN OFFICIAL SERVICE ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);grid.append(card);});}
 search.addEventListener("input",()=>draw(search.value));draw();p.append(grid);
 const note=el("div","card jr-integration-note");note.append(el("h3","","How connections become active"),el("p","","When a provider offers an approved integration, JR PHEEF will request the minimum permissions needed, explain what data is shared, and let you revoke access. Passwords are never requested or stored by JR PHEEF for another company's account."));p.append(note);
}
function renderMemberSnapshot(host){
 const card=el("section","card jr-member-snapshot");
 card.setAttribute("aria-labelledby","jrMemberSnapshotTitle");
 const loading=el("p","jr-member-snapshot-loading","Loading your personal details…");
 card.append(loading);host.append(card);
 const safePhoto=value=>{try{const u=new URL(String(value||""),location.origin);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}};
 fetch("/api/me",{credentials:"include",cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(new Error("profile unavailable"))).then(data=>{
  if(!data||!data.ok||!data.logged_in||!data.member)throw new Error("session unavailable");
  const m=data.member;clearChildren(card);
  const top=el("div","jr-member-snapshot-top");
  const identity=el("div","jr-member-snapshot-identity");
  const avatar=el("div","jr-member-snapshot-avatar");
  const photo=safePhoto(m.profile_photo||m.avatar_url);
  if(photo){const img=el("img");img.src=photo;img.alt="";img.referrerPolicy="no-referrer";img.onerror=()=>{clearChildren(avatar);avatar.textContent=(m.full_name||"JR").trim().slice(0,2).toUpperCase();};avatar.append(img);}
  else avatar.textContent=(m.full_name||"JR").trim().slice(0,2).toUpperCase();
  const name=el("div","jr-member-snapshot-name");
  name.append(el("span","jp-kicker","YOUR JR PHEEF PROFILE"),el("h2","",""+(m.full_name||"Your profile")),el("p","",m.jp_number?"JP NUMBER · "+m.jp_number:"JP number pending"));
  identity.append(avatar,name);
  const actions=el("div","jr-member-snapshot-actions");
  const edit=el("button","primary","EDIT PROFILE");edit.type="button";edit.addEventListener("click",()=>go("profile"));
  const refresh=el("button","dark","REFRESH");refresh.type="button";refresh.addEventListener("click",()=>{card.dataset.refresh="1";renderMemberSnapshotRefresh(card);});
  actions.append(edit,refresh);top.append(identity,actions);
  const details=el("div","jr-member-snapshot-details");
  const since=m.created_at?new Date(m.created_at):null;
  const sinceLabel=since&&!Number.isNaN(since.getTime())?since.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}):"Not available";
  const values=[
   ["Email",m.email||"Not added"],
   ["Location",m.location||"Not added"],
   ["Membership",m.plan||"Standard"],
   ["Account status",m.status||"Active"],
   ["Verification",m.verified===true?"Verified":"Not verified"],
   ["Member since",sinceLabel],
   ["Points",String(Number(m.reward_points||0))]
  ];
  values.forEach(([label,value])=>{const item=el("div","jr-member-snapshot-item");item.append(el("span","",label),el("strong","",value));details.append(item);});
  const completion=[m.full_name,m.email,m.location,m.bio,m.profile_photo].filter(v=>String(v||"").trim()).length;
  const progress=el("div","jr-member-profile-progress");
  const progressHead=el("div","");progressHead.append(el("strong","","Profile completeness"),el("span","",completion+"/5"));
  const track=el("div","jr-member-profile-track");const fill=el("span","");fill.style.width=(completion/5*100)+"%";track.append(fill);
  progress.append(progressHead,track);
  card.append(top,details,progress);
 }).catch(()=>{
  replaceChildrenCompat(card,el("div","jp-kicker","YOUR JR PHEEF PROFILE"),el("h2","","Your profile"),el("p","jr-member-snapshot-loading","Your personal information could not be loaded right now."));
  const retry=el("button","dark","TRY AGAIN");retry.type="button";retry.addEventListener("click",()=>renderMemberSnapshotRefresh(card));card.append(retry);
 });
}
function renderMemberSnapshotRefresh(card){
 const old=card;const parent=old.parentNode;if(!parent)return;old.remove();renderMemberSnapshot(parent);
}
function renderCommandCentre(p){
 p.innerHTML="";
 renderMemberSnapshot(p);
 const hero=el("section","jr-workspace-hero jr-command-hero");
 hero.append(el("div","jp-kicker","JR PHEEF · YOUR SPACE"),el("h1","","Your Command Center"),el("p","","Your personal starting point for the things you want to manage, discover and move forward."),el("p","jr-workspace-intro","Start with your identity and account information, then move into priorities, daily activity, opportunities and the tools you use."));
 const intro=el("section","jr-command-priority-intro");
 intro.append(el("span","jp-kicker","YOUR PRIORITY ORDER"),el("p","","Protect and resolve first. Execute commitments next. Grow when the essentials are under control. Review and improve continuously."));
 const groups=[
  ["01 · LEAD — URGENT & IMPORTANT","Start here. Resolve items that need your attention, permission or protection.",[["Needs Your Attention","Review important alerts, pending requests and messages needing a response.","alerts"],["Approvals & Decisions","Review proposals and actions that require your explicit approval.","accessgov"],["Security & Account Health","Manage account protection, privacy, sessions and recovery.","jrsettings"],["Identity & Verification","Review your member identity and supported verification details.","jpidentity"],["Notifications & Inbox","Review updates from across your JR PHEEF activity.","messages"]]],
  ["02 · EXECUTE — DAILY OPERATIONS","Keep the work already in motion moving forward.",[["Daily Operations & Projects","Review tasks, milestones, commitments and project progress.","projects"],["Business Operations","Open business workspaces, daily plans and operating activity.","businessgrowth"],["People & Communications","Continue conversations, groups and connection requests.","connecthub"],["Social Community","Review community posts and social activity.","social"],["Listings, Deals & Orders","Manage published offers, negotiations and deal rooms.","mylistings"],["Delivery & Fulfilment","Coordinate delivery requests and service fulfilment.","delivery"],["Rooms & Accommodation","Review accommodation listings and enquiries.","rooms"],["Economy & Transactions","Review supported commercial activity and transaction records.","economy"],["PHEEF Flex","Review supported Flex services and requests.","flex"]]],
  ["03 · GROW — OPPORTUNITIES & INTELLIGENCE","Build new value after urgent matters and current operations are under control.",[["Opportunities & Partnerships","Find opportunities, people and potential partners.","opportunities"],["Research & Intelligence","Compare evidence, investigate questions and develop ideas.","lab"],["Advertising & Audience","Create promotions and manage advertising activity.","ads"],["Customer & Market Discovery","Explore demand, products, services and potential customers.","discover"],["Business Growth Plans","Organise growth priorities and business development work.","businessgrowth"],["Creator & Media Studio","Prepare supported media and advertising content.","ads"],["App Hub & External Tools","Open your organised shortcuts to other services.","apphub"],["Browser & Web Research","Use the JR PHEEF web workspace.","browser"]]],
  ["04 · YOUR RESOURCES — PEOPLE & TOOLS","Look after your own work, resources and connections.",[["My Businesses & Workspaces","Open businesses and projects you are authorised to manage.","businessgrowth"],["People & Communities","Manage your connections and community activity.","connecthub"],["Membership & Points","Review membership, access and eligible activity.","membership"],["Invitations & Referrals","Review invitations and referral activity where enabled.","referrals"],["My Files & Library","Organise personal files and saved knowledge resources.","vault"],["Connected Devices","Review device sessions and continuity settings.","devices"],["External Connections","Review services and authorised integrations.","connections"],["Partner & Developer Centre","Review partner and developer onboarding resources.","partners"]]],
  ["05 · IMPROVE — LEARN & CONFIGURE","Strengthen your knowledge, preferences and the way you work.",[["JR Assistant","Ask JR to research, plan, explain and prepare your next actions.","assistant"],["JR Teacher & Learning","Build knowledge, skills and study plans.","teacher"],["Knowledge Library","Find saved resources and learning materials.","library"],["Research Lab","Explore experiments, concepts and research notes.","lab"],["Voice & Accessibility","Configure supported voice, display and accessibility tools.","voice"],["Settings & Preferences","Manage appearance, notifications and account preferences.","jrsettings"],["Help & Support","Find help and report issues.","ideas"]]]
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
 worlds:[
  ["COMMUNICATION & MEDIA",[["JR LINK","Messages, groups, connections and conversations","connecthub"],["JR PHEEF MEDIA","Discover and organise media; dedicated streaming and creator publishing are still being built","mediahub"]]],
  ["BUSINESS & ENTERPRISE",[["JR PHEEF BUSINESS","Start and manage businesses, listings and operations","businesshub"],["Opportunities & Partnerships","Find products, services, people and partners","opportunities"],["Trade & Fulfilment","Coordinate listings, deals and delivery","find"]]],
  ["RESEARCH, KNOWLEDGE & LEARNING",[["JR PHEEF LAB","Research, experiments and idea development","labhub"],["JR PHEEF LIBRARY","Saved knowledge, files and reference resources","libraryhub"],["JR PHEEF LEARN","Lessons, skills and learning pathways","learnhub"]]],
  ["DISCOVERY & COORDINATION",[["Places & Landscapes","Discover places, nature, cities and destinations","explore"],["Universe & Future","Explore subjects, science and future concepts","universe"],["Projects & Work","Turn goals into organised work","projects"],["Useful Services","Find repair, delivery and specialist services","fixedit"]]],
  ["DGBO ECOSYSTEM",[["DGBO","Business development, governance and ideas","dgbo"],["FAMILY","Private family coordination","family"],["Ecosystem Overview","See how the ventures connect","ecosystem"]]]
 ], discoverhub:[
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
  ["MESSAGES & SHARING",[["Private & Group Messages","Continue private and group conversations","messages"],["Social Updates","Share updates and discover your community","social"],["Notifications","Review communication and account alerts","alerts"]]],
  ["PEOPLE & CONNECTIONS",[["JP Connect","Find people and manage connection requests","jpconnect"],["Opportunities","Connect around work and opportunities","opportunities"],["Invite & Grow","Manage invitations and referrals","referrals"],["Deals & Conversations","Continue buyer and seller discussions","deals"]]],
  ["YOUR IDENTITY & CONTROLS",[["Profile","Manage your personal identity","profile"],["JP Identity","Review your ecosystem identity","jpidentity"],["Devices & Sessions","Review connected devices","devices"],["Settings & Privacy","Manage account and security controls","jrsettings"]]]
 ],
 mediahub:[
  ["DISCOVER & EXPERIENCE",[["Explore","Discover visual inspiration and places","explore"],["JR PHEEF LIBRARY","Find saved media and reference resources","library"],["Universe","Explore knowledge and creative subjects","universe"]]],
  ["PUBLISH & PROMOTE",[["Advertising Centre","Manage supported promotional activity","ads"],["Social Updates","Share community updates and media links","social"]]],
  ["DISCUSS & CONNECT",[["JR LINK","Share and discuss media with people","connecthub"],["Messages","Continue private conversations","messages"]]]
 ],
 businesshub:[
  ["START & BUILD",[["Business Workspaces","Create and manage a business workspace","businessgrowth"],["Business Listings","Publish goods, services and offers","create"],["Projects & Plans","Organise business goals and tasks","projects"]]],
  ["TRADE & OPERATE",[["Discover the Market","Find products, services and opportunities","find"],["My Listings","Manage published offers","mylistings"],["Deals","Coordinate negotiations and deal rooms","deals"],["Delivery","Coordinate fulfilment and delivery","delivery"],["Economy","Review supported economic activity","economy"]]],
  ["GROW & CONNECT",[["Business Opportunities","Find partners and growth opportunities","opportunities"],["Partner Centre","Explore partner onboarding","partners"],["Business Intelligence","Research markets and develop ideas","lab"]]]
 ],
 labhub:[
  ["RESEARCH & INVESTIGATE",[["Research & Ideas","Organise research notes and concepts","lab"],["Discover","Explore information and opportunities","discover"],["Browser","Conduct supported web research","browser"]]],
  ["EXPERIMENT & DEVELOP",[["Projects","Turn experiments into organised work","projects"],["JR Assistant","Plan and coordinate research tasks","assistant"],["Library","Keep research sources and reference materials","library"]]]
 ],
 libraryhub:[
  ["KNOWLEDGE & REFERENCE",[["Learning Resources","Find saved learning materials","library"],["JR Teacher","Study topics and build learning plans","teacher"],["Universe","Explore knowledge and subjects","universe"]]],
  ["PERSONAL COLLECTIONS",[["My Files","Manage your personal documents and files","vault"],["Research Lab","Find and develop research materials","lab"],["Discover","Find additional information and resources","discover"]]]
 ],
 learnhub:[
  ["LEARN & PRACTISE",[["JR Teacher","Lessons, quizzes and study plans","teacher"],["Knowledge Library","Read saved learning resources","library"],["Universe","Explore subjects and learning pathways","universe"]]],
  ["APPLY & BUILD",[["Research Lab","Investigate topics and test ideas","lab"],["Projects","Apply learning through practical projects","projects"],["JR Assistant","Get help planning your learning","assistant"]]]
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
 hero.append(el("div","jp-kicker","JR PHEEF · ORGANIZED WORKSPACE"),el("h1","",(meta&&meta[1])||"Workspace"),el("p","",(meta&&meta[2])||""),el("p","jr-workspace-intro",(meta&&meta[3])||""));
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
 updateNav(id);window.scrollTo(0,0);
 document.dispatchEvent(new CustomEvent("jr:workspacechange",{detail:{id}}));
}
function updateNav(id){
 const destinations={home:"home",worlds:"worlds",assistant:"assistant",mediahub:"worlds",businesshub:"worlds",labhub:"worlds",libraryhub:"worlds",learnhub:"worlds",teacher:"worlds",universe:"worlds",explore:"worlds",discover:"worlds",find:"worlds",create:"worlds",projects:"worlds",delivery:"worlds",dgbo:"worlds",family:"worlds",ecosystem:"worlds",partners:"worlds",social:"worlds",connecthub:"command",messages:"command",jpconnect:"command",profile:"command",jpidentity:"command",vault:"command",library:"command",lab:"command",opportunities:"command",businessgrowth:"command",ads:"command",alerts:"command",accessgov:"command",jrsettings:"command",devices:"command",membership:"command",points:"command",referrals:"command",economy:"command",deals:"command",mylistings:"command",rooms:"command",fixedit:"command",connections:"command",apphub:"command",browser:"command",command:"command"};
 const selected=destinations[id]||"command";
 document.querySelectorAll("#app>.nav [data-page]").forEach(b=>{const active=b.dataset.page===selected;b.classList.toggle("jp-nav-active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current","page");});
}
function navigate(delta){const next=cursor+delta;if(next<0||next>=history.length)return;cursor=next;const id=history[cursor];ensure(id);activateOnlyWorkspace(id);updateNav(id);window.scrollTo(0,0);document.dispatchEvent(new CustomEvent("jr:workspacechange",{detail:{id}}));}
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
 const nav=app.querySelector(".nav");
 if(nav){
  const primary=[["home","⌂","Home"],["worlds","✧","Explore"],["assistant","✦","JR"],["messages","✉","Messages"],["command","▦","Command"]];
  clearChildren(nav);
  primary.forEach(([id,glyph,label],index)=>{
   const b=el("button",index===0?"jp-nav-active":"");b.type="button";b.dataset.page=id;b.setAttribute("aria-label",label);
   const icon=el("span","",glyph);icon.setAttribute("aria-hidden","true");
   const name=el("span","",label);b.append(icon,name);b.addEventListener("click",()=>go(id));nav.append(b);
  });
  var desktopExtra=nav.querySelector(".jr-desktop-extra");if(desktopExtra)desktopExtra.parentNode.removeChild(desktopExtra);
  const home=$("home");
  if(home&&!home.querySelector(".jr-desktop-landscapes")){
   const landscapes=el("section","jr-desktop-landscapes");
   landscapes.innerHTML='<div class="jr-landscape-heading"><div><span>EXPLORE YOUR WORLD</span><h2>Places, possibilities and new horizons</h2></div><button type="button" data-jr-landscape-all>Explore all →</button></div><div class="jr-landscape-grid"><button class="jr-landscape-scene jr-scene-city" data-jr-world-page="explore"><span>01 · PLACES</span><b>Discover places</b><small>Explore cities and destinations</small></button><button class="jr-landscape-scene jr-scene-nature" data-jr-world-page="explore"><span>02 · NATURE</span><b>Find your calm</b><small>Landscapes, nature and inspiration</small></button><button class="jr-landscape-scene jr-scene-future" data-jr-world-page="explore"><span>03 · FUTURE</span><b>Imagine what is next</b><small>Ideas, science and technology</small></button><button class="jr-landscape-scene jr-scene-space" data-jr-world-page="explore"><span>04 · BEYOND</span><b>Go beyond borders</b><small>Explore a wider universe</small></button></div>';
   home.append(landscapes);
   var landscapeAll=landscapes.querySelector("[data-jr-landscape-all]");if(landscapeAll)landscapeAll.addEventListener("click",()=>go("explore"));
   landscapes.querySelectorAll("[data-jr-world-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.jrWorldPage)));
  }
  const wrap=nav.querySelector(".jp-more-wrap");
  const menu=wrap?wrap.querySelector("#jpMoreMenu"):null;
  if(wrap&&menu){
   clearChildren(menu);
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