/* JR PHEEF — open ecosystem partner and developer entry points. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const partners=[
["Safaricom","Payments and mobile-money services","Integration candidate · Kenya"],
["Airtel","Mobile-money and connectivity services","Integration candidate · regional"],
["Stripe","Online payment infrastructure","Integration candidate · supported markets"],
["PayPal","Digital payments","Integration candidate · supported markets"],
["Shopify","Commerce and store operations","Integration candidate · global"],
["Google Maps Platform","Maps, places and route capabilities","Integration candidate · global"],
["OpenStreetMap","Open geographic data and mapping","External resource · API review required"],
["Twilio","Messaging, voice and communication APIs","Integration candidate · global"]
];
function card(title,desc,status,action,label){
 const c=el("article","card jr-open-card");
 c.append(el("span","jr-open-status",status),el("h3","",title),el("p","",desc));
 if(action){const b=el("button","dark",label||"OPEN CONNECTIONS");b.type="button";b.addEventListener("click",action);c.append(b);}
 return c;
}
function openPage(id,label,kicker,title,lead){
 const app=$("app");if(!app||$(id))return;
 const p=el("section","page hidden");p.id=id;p.setAttribute("aria-label",label);
 const hero=el("section","jr-open-hero");
 hero.append(el("span","jp-kicker",kicker),el("h1","",title),el("p","",lead));
 p.append(hero);
 app.append(p);
 return p;
}
function navigate(id){if(typeof window.show==="function")window.show(id);else if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(id);}
function mount(){
 const companiesPage=openPage("companies","My companies","JR PHEEF · CONNECTED COMPANY ECOSYSTEM","Your companies and services","One JR PHEEF account gives you a clear way to enter participating company environments. Each company keeps its own brand, records, permissions and services.");
 if(companiesPage){
  const intro=el("section","card jr-open-note");
  intro.append(el("h2","","One ecosystem. Distinct companies."),el("p","","Open a company to access the services it makes available to you. Company ownership, finances, internal strategy and private records remain visible only to authorised people. A company card does not mean every service is activated or that you have management permission."));
  const grid=el("div","jr-open-grid");
  grid.append(
   card("JR PHEEF","Your central environment for discovery, people, learning, work, business and coordination.","CORE ECOSYSTEM",()=>navigate("home"),"OPEN JR PHEEF"),
   card("DIAMOND GLOBAL BUSINESS OPERATORS","DGBO · Business development, ventures, governance and authorised company opportunities.","COMPANY PORTAL",()=>navigate("dgbo"),"OPEN DGBO"),
   card("FAMILY","Financial Access to Money for Investments & Loving Yourself. Access its available ecosystem services and family coordination.","COMPANY PORTAL · SERVICES SUBJECT TO ACTIVATION",()=>navigate("family"),"OPEN FAMILY"),
   card("My businesses","Open business workspaces you own or are authorised to manage, including new and existing businesses.","YOUR AUTHORISED WORKSPACES",()=>navigate("businessgrowth"),"OPEN MY BUSINESSES")
  );
  const note=el("section","card jr-open-note");
  note.append(el("h2","","Private by design"),el("p","","Customers and members see the services they are allowed to use—not company ownership records, internal finances, confidential plans, staff records or another company's private data. Access is enforced by server-side permissions, not by hiding buttons."));
  companiesPage.append(intro,grid,note);
 }
 const partnersPage=openPage("partners","JR PHEEF Partner Centre","JR PHEEF · OPEN ECOSYSTEM NETWORK","Partner Centre","A structured route for companies, institutions and service providers to make their capabilities discoverable and, when approved, connect them to JR PHEEF.");
 if(partnersPage){
  const intro=el("section","card jr-open-note");
  intro.append(el("h2","","A two-way ecosystem"),el("p","","JR PHEEF can connect people to external services, while approved organisations can expose their own services, products and capabilities through documented integrations. Partners keep control of their systems and customer terms."));
  const steps=el("div","jr-open-steps");
  [["01","Register organisation","Identity and business verification, authorised representatives and service ownership."],["02","Describe capabilities","List services, regions, supported actions, availability, pricing and operational limits."],["03","Connect securely","Use approved APIs, scoped credentials, signed webhooks and a sandbox before production."],["04","Review and publish","Complete security, privacy, legal and operational checks; publish only verified capabilities."],["05","Monitor and improve","Track uptime, consent, failures, disputes, versions and partner changes."]];
  steps.append(...stepsData(steps));
  const grid=el("div","jr-open-grid");
  partners.forEach(([name,desc,status])=>grid.append(card(name,desc,status,()=>navigate("connections"),"VIEW SERVICE DIRECTORY")));
  const note=el("section","card jr-open-note");
  note.append(el("h2","","Current release status"),el("p","","This is the initial Partner Centre foundation. The Developer Portal and limited inbound event gateway are available to signed-in account owners. Public partner registration, automated organisation verification, sandbox provisioning and production provider integrations are not yet enabled. The services listed below are integration candidates or external resources, not connected partners."));
  const actions=el("div","jr-open-actions");
  const dir=el("button","primary","OPEN CONNECTIONS DIRECTORY");dir.type="button";dir.addEventListener("click",()=>navigate("connections"));
  const dev=el("button","dark","OPEN DEVELOPER CENTRE");dev.type="button";dev.addEventListener("click",()=>navigate("developers"));
  actions.append(dir,dev);
  partnersPage.append(intro,steps,el("div","jp-section-head"),grid,note,actions);
 }
 const devPage=openPage("developers","JR PHEEF Developer Centre","JR PHEEF · BUILD WITH US","Developer Centre","A future-facing integration workspace for developers and technology teams who want to build services that work with JR PHEEF.");
 if(devPage){
  const grid=el("div","jr-open-grid");
  [["API platform","Versioned APIs with documented resources, authentication, scopes, rate limits and consistent error formats."],["SDKs and examples","Maintained client libraries, starter projects, webhook examples and integration guides."],["Sandbox and testing","Test credentials, simulated events, conformance checks and isolated partner environments."],["Webhooks and events","Signed, replay-protected event delivery with retries, idempotency and delivery logs."],["Identity and permissions","OAuth 2.0 / OpenID Connect where appropriate, least-privilege scopes, revocation and audit trails."],["Publishing and operations","Version lifecycle, security review, status monitoring, incident response and partner support."]];
  grid.append(...gridData(grid));
  const note=el("section","card jr-open-note");
  note.append(el("h2","","Developer access is not open yet"),el("p","","The signed-in Developer Portal is live at /developers/. The current gateway supports member-owned integration records, scoped bearer tokens and inbound event ingestion. It is not yet a general public read/write API, OAuth platform, outbound webhook service, SDK, partner sandbox or full two-way business-system synchronisation. External providers are not considered connected until an authorised end-to-end test succeeds."));
  const actions=el("div","jr-open-actions");
  const p=el("button","primary","OPEN PARTNER CENTRE");p.type="button";p.addEventListener("click",()=>navigate("partners"));
  const c=el("button","dark","VIEW CONNECTIONS");c.type="button";c.addEventListener("click",()=>navigate("connections"));
  actions.append(p,c);devPage.append(grid,note,actions);
 }
 function stepsData(){return [["01","Register organisation","Identity and business verification, authorised representatives and service ownership."],["02","Describe capabilities","List services, regions, supported actions, availability, pricing and operational limits."],["03","Connect securely","Use approved APIs, scoped credentials, signed webhooks and a sandbox before production."],["04","Review and publish","Complete security, privacy, legal and operational checks; publish only verified capabilities."],["05","Monitor and improve","Track uptime, consent, failures, disputes, versions and partner changes."]].map(([n,t,d])=>{const a=el("article","jr-open-step");a.append(el("b","",n),el("h3","",t),el("p","",d));return a;});}
 function gridData(){return [["API platform","Versioned APIs with documented resources, authentication, scopes, rate limits and consistent error formats."],["SDKs and examples","Maintained client libraries, starter projects, webhook examples and integration guides."],["Sandbox and testing","Test credentials, simulated events, conformance checks and isolated partner environments."],["Webhooks and events","Signed, replay-protected event delivery with retries, idempotency and delivery logs."],["Identity and permissions","OAuth 2.0 / OpenID Connect where appropriate, least-privilege scopes, revocation and audit trails."],["Publishing and operations","Version lifecycle, security review, status monitoring, incident response and partner support."]].map(([t,d])=>card(t,d,"PLANNED CAPABILITY"));}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();