(function(){
"use strict";
const GROUPS=[
{key:"jr",name:"JR PHEEF",subtitle:"Group headquarters · Universal coordination, technology and development",chief:"Founder / Group Executive",divisions:["Strategy & Group Governance","Technology, Intelligence & Product","Global Operations & Coordination","Commerce & Partnerships","People, Community & Accessibility","Trust, Safety, Risk & Resilience","Knowledge, Research & Future Systems","Finance, Performance & Corporate Services"],agents:[
["Chief of Staff Agent","Turns your priorities into an executive agenda, decisions, owners and follow-ups."],
["Strategy & Foresight Agent","Maintains strategy, scenarios, market intelligence and long-range plans."],
["Operations Director Agent","Maps cross-company processes, service standards, bottlenecks and operating reviews."],
["Universal Coordination Agent","Decomposes requests into people, providers, resources, steps, dependencies and outcomes."],
["Technology & Architecture Agent","Owns technical architecture proposals, integration maps, standards and technical debt."],
["AI Systems Orchestrator","Routes work to specialist agents, tracks handoffs and prevents conflicting instructions."],
["Product & Experience Agent","Maintains product requirements, user journeys, accessibility and release priorities."],
["Engineering Delivery Agent","Plans implementation, reviews changes, runs checks and reports release readiness."],
["Cybersecurity & Privacy Agent","Reviews threat models, access, data handling, vulnerabilities and incident playbooks."],
["Trust & Safety Agent","Designs verification, fraud prevention, moderation, safeguarding and appeals."],
["Global Partnerships Agent","Maps potential providers, institutions, businesses and partnership opportunities."],
["Market & Competitive Intelligence Agent","Researches sectors, customer needs, competitors and expansion opportunities."],
["Commercial & Growth Agent","Builds ethical growth, positioning, distribution and revenue experiments."],
["Finance & Performance Analyst","Prepares budgets, forecasts, cash-flow scenarios and performance dashboards; cannot move funds."],
["Legal & Compliance Research Agent","Flags jurisdictional requirements and prepares questions for qualified legal advisers."],
["People & Organisation Agent","Designs future roles, hiring plans, onboarding, policies and team capability maps."],
["Accessibility & Inclusion Agent","Audits inclusive design across disability, language, literacy, age and connectivity."],
["Knowledge & Research Agent","Curates sourced knowledge, evidence status, research briefs and learning assets."],
["Innovation & Future Systems Agent","Coordinates JR Labs, science, biomimicry, simulation and future-technology research."],
["Resilience & Continuity Agent","Plans backups, outage response, disaster recovery, offline operation and continuity tests."]
]},
{key:"dgbo",name:"DGBO",subtitle:"Venture studio & business development office",chief:"DGBO Director",divisions:["Idea Intake & Confidentiality","Venture Design & Validation","Intellectual Property Coordination","Investment Readiness & Introductions","Business Formation & Operations","Portfolio, Risk & Outcomes"],agents:[
["DGBO Chief of Staff Agent","Runs the DGBO agenda, venture pipeline, decision register and founder briefings."],
["Idea Intake & Triage Agent","Structures submitted ideas, identifies needs and prepares confidential review summaries."],
["Venture Architect Agent","Turns ideas into business models, operating models, milestones and validation plans."],
["Market Validation Agent","Researches customers, competitors, demand, pricing and evidence gaps."],
["Business Plan & Financial Model Agent","Drafts business plans, unit economics, scenarios and funding requirements."],
["IP Research & Records Agent","Organises invention disclosures, timestamps, access logs and IP-adviser checklists; does not guarantee legal protection."],
["Legal & Entity Formation Liaison Agent","Maps incorporation, contracts, licences and professional-adviser requirements by jurisdiction."],
["Investor Readiness Agent","Prepares pitch materials, data-room checklists, valuation scenarios and due-diligence gaps."],
["Investor & Partner Mapping Agent","Researches relevant investors, grant programmes, strategic partners and introduction pathways."],
["Venture Operations Agent","Tracks suppliers, recruitment, delivery, KPIs, risks and venture execution."],
["Portfolio & Impact Agent","Monitors venture milestones, outcomes, portfolio health and lessons learned."]
]},
{key:"family",name:"FAMILY",subtitle:"Family coordination, member services & financial-services readiness",chief:"FAMILY Director",divisions:["Family & Member Services","Financial Coordination & Planning","Payments Partner Operations","Member Support & Wellbeing","Risk, Safeguarding & Compliance","FAMILY Governance & Continuity"],agents:[
["FAMILY Chief of Staff Agent","Coordinates the FAMILY agenda, service priorities, action register and reporting."],
["Family Services Coordinator Agent","Organises family goals, shared responsibilities, events, care needs and service requests."],
["Member Experience Agent","Maps member journeys, support needs, service quality and accessibility."],
["Financial Planning Analyst Agent","Builds budgets, savings scenarios and financial education; never provides unqualified personalised financial advice."],
["Payments & Provider Liaison Agent","Maps licensed payment providers, settlement flows and partner requirements; cannot initiate payments."],
["Risk & Financial Crime Agent","Designs fraud controls, AML/KYC readiness, sanctions-screening questions and escalation processes."],
["Safeguarding & Wellbeing Agent","Supports safe referrals, emergency planning and consent-based care coordination."],
["Member Support Agent","Drafts responses, categorises cases and tracks resolution without exposing private member data."],
["Governance & Policy Agent","Maintains policy drafts, permissions, decision records and regulatory change watchlists."],
["FAMILY Data & Privacy Agent","Defines data minimisation, family/member access boundaries, retention and consent rules."],
["Continuity & Legacy Agent","Plans family records, succession workflows, recovery and continuity with verified human approval."]
]}
];
const $=id=>document.getElementById(id);
let current="jr",query="";
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
 const g=GROUPS.find(x=>x.key===current)||GROUPS[0],host=$("jpFounderContent");if(!host)return;
 const q=query.toLowerCase();
 const agents=g.agents.filter(a=>(a[0]+" "+a[1]).toLowerCase().includes(q));
 host.innerHTML='<div class="jpf-overview"><div><span class="jpf-eyebrow">PRIVATE EXECUTIVE WORKSPACE</span><h2>'+esc(g.name)+' · Command Centre</h2><p>'+esc(g.subtitle)+'</p></div><div class="jpf-chief"><small>EXECUTIVE LEAD</small><strong>'+esc(g.chief)+'</strong><span>Founder-controlled · You retain final authority</span></div></div>'+
 '<div class="jpf-stats"><article><b>'+g.divisions.length+'</b><span>Operating divisions</span></article><article><b>'+g.agents.length+'</b><span>Designed AI roles</span></article><article><b>0</b><span>Autonomous agents verified live</span></article><article><b>Founder</b><span>Final decision authority</span></article></div>'+
 '<section class="jpf-block"><div class="jpf-block-head"><div><span class="jpf-eyebrow">COMPANY STRUCTURE</span><h3>Executive divisions</h3></div></div><div class="jpf-divisions">'+g.divisions.map((d,i)=>'<div class="jpf-division"><small>DIVISION '+String(i+1).padStart(2,"0")+'</small><strong>'+esc(d)+'</strong><span>Accountable executive function · Human lead to be appointed</span></div>').join("")+'</div></section>'+
 '<section class="jpf-block"><div class="jpf-block-head"><div><span class="jpf-eyebrow">AI WORKFORCE BLUEPRINT</span><h3>Specialist agents <span class="jpf-count">'+agents.length+'</span></h3><p>Designed roles, responsibilities and boundaries. These are not yet connected autonomous agents.</p></div><input id="jpfAgentSearch" type="search" placeholder="Search agents…" aria-label="Search AI agents" value="'+esc(query)+'"></div><div class="jpf-agents">'+agents.map((a,i)=>'<article class="jpf-agent"><div class="jpf-agent-top"><span class="jpf-agent-icon">✦</span><span class="jpf-agent-state">ROLE DESIGNED · NOT CONNECTED</span></div><h4>'+esc(a[0])+'</h4><p>'+esc(a[1])+'</p><small>Reports to '+esc(g.chief)+' · Requires approved data access and task permissions</small></article>').join("")+'</div></section>'+
 '<section class="jpf-block jpf-governance"><span class="jpf-eyebrow">OPERATING SAFEGUARDS</span><h3>Founder control & accountability</h3><ul><li>AI agents may research, draft, analyse, plan, monitor and prepare recommendations.</li><li>Human approval is required for payments, contracts, hiring, public statements, external commitments and data disclosures.</li><li>No agent may transfer ownership, change founder access, grant itself permissions or override another company’s data boundary.</li><li>Confidential venture, family and member records remain segregated by company and least-privilege access.</li><li>Every future agent action must be attributable, logged, reviewable and reversible where technically possible.</li><li>Legal, financial, medical and regulated decisions require qualified human professionals and authorised providers.</li></ul></section>';
 const input=$("jpfAgentSearch");if(input)input.addEventListener("input",()=>{query=input.value;render();const n=$("jpfAgentSearch");if(n){n.focus();n.setSelectionRange(query.length,query.length);}});
 document.querySelectorAll("[data-jpf-group]").forEach(b=>{b.classList.toggle("active",b.dataset.jpfGroup===current);b.setAttribute("aria-pressed",String(b.dataset.jpfGroup===current));});
}
function removeFounderAccess(){
 const button=document.querySelector(".jp-founder-top-access");if(button)button.remove();
 const page=$("founder-command");if(page){const wasVisible=!page.hidden&&!page.classList.contains("hidden");page.remove();if(wasVisible&&typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate("home");}
}
async function open(){
 try{
  const response=await fetch("/api/me",{credentials:"include",cache:"no-store"});
  const data=response.ok?await response.json():null;
  if(!data||!data.ok||!data.logged_in||data.member?.is_owner!==true){removeFounderAccess();return;}
  install(data.member);
  const pages=document.querySelectorAll("#app .page");pages.forEach(p=>{p.classList.add("hidden");p.hidden=true;p.setAttribute("aria-hidden","true");if("inert" in p)p.inert=true;});
  const p=$("founder-command");if(!p)return;
  p.classList.remove("hidden");p.hidden=false;p.setAttribute("aria-hidden","false");if("inert" in p)p.inert=false;
  const m=$("jpMoreMenu");if(m)m.hidden=true;
  document.querySelectorAll("#app .jp-primary-nav [data-page]").forEach(b=>b.classList.remove("jp-nav-active"));
  const trigger=$("jpMoreTrigger");if(trigger)trigger.classList.remove("jp-nav-active");
  render();window.scrollTo({top:0,behavior:"instant"});
 }catch(e){removeFounderAccess();}
}
function install(member){
 if(!member||member.is_owner!==true)return;
 const app=$("app"),headerActions=document.querySelector(".jp-header-actions");if(!app||!headerActions)return;
 if(!$("founder-command")){
  const page=document.createElement("section");page.id="founder-command";page.className="page hidden jpf-page";page.hidden=true;page.setAttribute("aria-hidden","true");page.inert=true;
  page.innerHTML='<div class="jpf-top"><div><span class="jpf-eyebrow">PRIVATE · OWNER ACCESS ONLY</span><h1>Founder Command Structure</h1><p>Three companies. One founder-led group. Distinct mandates, teams, records and accountability.</p></div><span class="jpf-private">🔒 PRIVATE</span></div><div class="jpf-tabs" role="group" aria-label="Choose company command centre">'+GROUPS.map(g=>'<button type="button" data-jpf-group="'+g.key+'" aria-pressed="false">'+g.name+'</button>').join("")+'</div><div id="jpFounderContent" aria-live="polite"></div>';
  app.append(page);
  page.querySelectorAll("[data-jpf-group]").forEach(b=>b.addEventListener("click",()=>{current=b.dataset.jpfGroup;query="";render();}));
 }
 if(!document.querySelector(".jp-founder-top-access")){
  const btn=document.createElement("button");btn.type="button";btn.className="jp-header-icon jp-founder-top-access";btn.textContent="⌘";btn.title="PRIVATE FOUNDER ACCESS · Private Founder Command Centre";btn.dataset.accessLabel="PRIVATE FOUNDER ACCESS";btn.setAttribute("aria-label","Open private Founder Command Centre");btn.addEventListener("click",open);btn.style.display="inline-flex";headerActions.prepend(btn);
 }
}
async function checkOwner(){
 try{
  const r=await fetch("/api/me",{credentials:"include",cache:"no-store"});
  const d=r.ok?await r.json():null;
  if(d&&d.ok&&d.logged_in&&d.member?.is_owner===true)install(d.member);
  else removeFounderAccess();
 }catch(e){removeFounderAccess();}
}
function boot(){
 checkOwner();
 const app=$("app");if(app){new MutationObserver(()=>{if(app.classList.contains("hidden"))removeFounderAccess();else checkOwner();}).observe(app,{attributes:true,attributeFilter:["class"]});document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkOwner();});}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
