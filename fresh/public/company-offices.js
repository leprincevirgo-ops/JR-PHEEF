"use strict";
(() => {
 const root=document.getElementById("founderCompanyOffices");
 if(!root)return;
 const definitions=[
  {key:"dgbo",name:"DGBO",title:"Group headquarters",summary:"Governance, venture development, opportunities, people and group performance.",view:"dgbo",metrics:[["Approved members","approvedMembers"],["Applications to review","pendingApplications"],["Team members","teamMembers"],["Open opportunities","openDossiers"],["Venture projects","ventureProjects"],["Decisions awaiting you","proposedDecisions"]],roles:["Group executive","Venture development","Research & validation","Partnerships","People & operations","Governance & risk"],daily:["Review new venture ideas and evidence","Check project milestones and blocked work","Review team and partner requests","Record decisions and assign accountable owners"]},
  {key:"jrMove",name:"JR MOVE",title:"Transport operations office",summary:"Provider onboarding, vehicle documents, delivery activity, fleet readiness and safety.",view:"turbex",metrics:[["Approved members","approvedMembers"],["Provider applications","pendingApplications"],["Team members","teamMembers"],["Registered providers","providers"],["Approved providers","approvedProviders"],["Verified providers","verifiedProviders"],["Documents awaiting review","documentsPending"],["Verified documents","documentsVerified"],["Open deliveries","deliveriesOpen"],["Accepted deliveries","deliveriesAccepted"],["Completed deliveries","deliveriesDelivered"]],roles:["Transport operations lead","Dispatch coordinator","Driver & rider relations","Fleet operator","Safety & document review","Customer support"],daily:["Review provider and vehicle-document readiness","Check open delivery requests and service exceptions","Review accepted and completed delivery records","Escalate safety issues before activating dispatch"],note:"Live dispatch, payments and GPS tracking remain disabled until their integrations and safety controls are verified."},
  {key:"family",name:"FAMILY",title:"Member & financial-wellbeing office",summary:"Member services, education, goals, provider readiness, governance and safeguarding.",view:"family",metrics:[["Approved members","approvedMembers"],["Applications to review","pendingApplications"],["Team members","teamMembers"]],roles:["FAMILY director","Member services","Financial education","Provider liaison","Safeguarding & support","Governance & privacy"],daily:["Review member requests and access needs","Check education and wellbeing programme priorities","Review licensed-provider readiness and disclosures","Keep personal financial records private and access-controlled"],note:"FAMILY financial transactions, deposits, lending and investment services are not enabled."},
  {key:"jrPheef",name:"JR PHEEF",title:"Ecosystem operations office",summary:"Global member platform, business activity, communication, agents, security and product health.",view:"home",metrics:[["Member accounts","members"],["Active members","activeMembers"],["Verified accounts","verifiedMembers"],["Listings","listings"],["Opportunities","opportunities"],["Conversations","conversations"],["Business workspaces","businessWorkspaces"],["Your registered agents","agents"],["Active agents","activeAgents"],["Agent tasks awaiting approval","agentRunsPending"],["Completed agent tasks","agentRunsCompleted"]],roles:["Platform operations","Member onboarding","JR LINK & community","Business services","Agent governance","Security & resilience"],daily:["Review member onboarding and account issues","Check platform, communication and business activity","Review agent approvals and execution records","Check security, privacy and service health"],note:"Agent counts are for the founder account. Agent roles do not imply autonomous authority or permission to spend."}
 ];
 const $=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const n=(obj,key)=>typeof obj?.[key]==="number"?obj[key].toLocaleString():"—";
 let selected="dgbo",latest=null;
 function actionButton(label,view,secondary){
  const b=$("button",secondary?"company-office-secondary":"company-office-primary",label);b.type="button";
  b.addEventListener("click",()=>{
   const tab=document.querySelector('.workspace-tab[data-view="'+view+'"]');
   if(tab)tab.click();
   else if(view==="agents"){const fallback=document.querySelector('.workspace-tab[data-view="command"]');if(fallback)fallback.click();}
  });
  return b;
 }
 function render(){
  if(!latest)return;
  const data=latest.companyOperations||{},global=latest.metrics||{};
  const office=definitions.find(x=>x.key===selected)||definitions[0],metricsData=data[office.key]||{};
  root.replaceChildren();
  const heading=$("div","company-office-heading");
  const headingCopy=$("div","");
  headingCopy.append($("span","company-office-eyebrow","PRIVATE FOUNDER OPERATIONS"),$("h3","",office.name+" · "+office.title),$("p","",office.summary));
  const updated=$("small","company-office-updated","Verified staging data · "+new Date().toLocaleString());
  heading.append(headingCopy,updated);root.append(heading);
  const tabs=$("div","company-office-tabs");tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Company operational offices");
  definitions.forEach(item=>{
   const b=$("button",item.key===selected?"is-selected":"",item.name);b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",String(item.key===selected));
   b.addEventListener("click",()=>{selected=item.key;render();});tabs.append(b);
  });root.append(tabs);
  const panel=$("section","company-office-panel");panel.setAttribute("role","tabpanel");
  const statsGrid=$("div","company-office-metrics");
  office.metrics.forEach(([label,key])=>{const card=$("article","company-office-metric");card.append($("strong","",n(metricsData,key)),$("span","",label));statsGrid.append(card);});
  panel.append(statsGrid);
  const body=$("div","company-office-body");
  const people=$("article","company-office-block");people.append($("h4","","People, registration & teams"));
  people.append($("p","",n(metricsData,"approvedMembers")+" approved company members · "+n(metricsData,"pendingApplications")+" applications awaiting review · "+n(metricsData,"teamMembers")+" approved team-role memberships."));
  people.append($("p","company-office-muted","Team role blueprint: "+office.roles.join(" · ")+". These are role definitions, not claims that posts are filled."));
  const agents=$("article","company-office-block");agents.append($("h4","","Agents & controlled assistance"));
  if(office.key==="jrPheef")agents.append($("p","","Your account has "+n(metricsData,"agents")+" registered agents, "+n(metricsData,"activeAgents")+" active, and "+n(metricsData,"agentRunsPending")+" tasks awaiting approval."));
  else agents.append($("p","","Company-specific agent roles are mapped to this office. Agent access must be granted explicitly and limited to the company and task."));
  const progress=$("article","company-office-block");progress.append($("h4","","Daily operating review"));
  const list=$("ul","company-office-checklist");office.daily.forEach(item=>list.append($("li","",item)));progress.append(list);
  if(office.note)progress.append($("p","company-office-note",office.note));
  body.append(people,agents,progress);panel.append(body);
  const actions=$("div","company-office-actions");
  actions.append(actionButton("Open "+office.name+" workspace",office.view,false));
  if(office.key==="dgbo"){actions.append(actionButton("Review venture pipeline","dgbo",true));}
  if(office.key==="jrPheef"){actions.append(actionButton("Open Agent Universe","agents",true));}
  root.append(panel,actions);
  const note=$("p","company-office-footnote","Numbers are read-only aggregates from the connected staging database. A zero means no matching records are currently present; an unavailable value is shown as an em dash. Founder access is verified server-side.");
  root.append(note);
 }
 window.addEventListener("jr:founder-overview",event=>{
  if(!event.detail||!event.detail.ok||!event.detail.founder||event.detail.founder.role!=="founder"||event.detail.founder.jpNumber!=="JP-01")return;
  latest=event.detail;render();
 });
})();
