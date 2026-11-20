/* JR PHEEF public discovery and in-ecosystem company websites.
   Company pages are rendered as branded, navigable worlds inside the JR gateway.
   Operational actions remain clearly gated until their service integrations are live. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const companies={
  dgbo:{name:"DGBO",eyebrow:"THE PARENT ENTERPRISE",tagline:"Ideas become enterprises. Enterprises create possibilities.",intro:"DIME GLOBAL BUSINESS OPERATORS brings people, businesses and practical opportunities together through research, enterprise development and responsible growth.",theme:"dgbo",pill:"Business intelligence · Enterprise building",sections:[
   ["Business intelligence","Research markets, identify needs, assess opportunities and turn evidence into practical business decisions."],
   ["Enterprise development","Shape business concepts, plans, operating models, partnerships and growth strategies."],
   ["Portfolio & governance","Coordinate a family of independent ventures with clear ownership, accountability and long-term stewardship."],
   ["Connect people and businesses","Help founders, operators, partners and customers discover relevant opportunities."]
  ],actions:["Explore business research","Discover enterprise building","Meet the ecosystem"],notice:"DGBO services and company operations will be activated as their own business systems, teams and legal arrangements are established."},
  family:{name:"FAMILY",eyebrow:"FINANCIAL ACCESS & WELLBEING",tagline:"Build a healthier relationship with money and opportunity.",intro:"FAMILY is the ecosystem's financial-access environment for learning, planning, saving and exploring investment participation through lawful, appropriately authorised providers.",theme:"family",pill:"Financial education · Saving access · Planning",sections:[
   ["Understand","Learn about budgeting, saving, risk, financial products and the responsibilities that come with financial decisions."],
   ["Plan","Organise personal goals, track plans and understand the difference between savings, credits, investments and rewards."],
   ["Access","Explore financial services provided by appropriately authorised institutions and partners."],
   ["Stay informed","See clear terms, fees, eligibility, risks and provider identity before choosing a financial product."]
  ],actions:["Explore financial learning","Build a savings plan","Understand investment risks"],notice:"FAMILY does not promise returns or operate as a bank, fund manager or investment intermediary without the required authorisations. Financial transactions remain disabled until compliant providers and controls are connected."},
  "jr-pheef":{name:"JR PHEEF",eyebrow:"THE CONNECTED DIGITAL ECOSYSTEM",tagline:"One place to discover, connect, create and grow.",intro:"JR PHEEF is the gateway and intelligence-led platform connecting people, services, businesses, opportunities and specialist company worlds in one continuous experience.",theme:"jr",pill:"Intelligence · Services · Communication · Opportunity",sections:[
   ["JR CORE","A central intelligence layer that understands requests and coordinates approved capabilities."],
   ["JR LINK","Communication, contacts, messages, sharing and collaboration in one connected environment."],
   ["JR SERVICES","A growing directory of services, providers, opportunities and practical ways to get things done."],
   ["JR COMPANY BUILDER","Tools to research, plan and operate business workspaces while keeping legal registration distinct."]
  ],actions:["Discover JR capabilities","Explore connected worlds","Create your JR account"],notice:"The JR PHEEF gateway and current product areas are being developed in stages. Each feature must show whether it is specified, implemented, tested, connected or released."}
 };
 const css=`
 #jpd-company-world{margin:24px 0 30px;padding:clamp(20px,4vw,42px);border:1px solid var(--world-line);border-radius:26px;background:radial-gradient(ellipse at 88% 5%,var(--world-glow),transparent 38%),linear-gradient(145deg,var(--world-bg),#04101f);box-shadow:0 24px 70px #0006;color:#f3fbff}
 #jpd-company-world[hidden]{display:none!important}
 #jpd-company-world[data-theme="dgbo"]{--world-bg:#211b12;--world-line:#c7a45b88;--world-glow:#d4ad4b33;--world-accent:#e4c477}
 #jpd-company-world[data-theme="family"]{--world-bg:#0b2822;--world-line:#70d6a477;--world-glow:#53dca333;--world-accent:#8de2b4}
 #jpd-company-world[data-theme="jr"]{--world-bg:#071a35;--world-line:#5bdfff88;--world-glow:#16b9ff33;--world-accent:#70eaff}
 #jpd-company-world .jpw-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
 #jpd-company-world .jpw-back,#jpd-company-world .jpw-action{border:1px solid var(--world-line);border-radius:12px;padding:11px 15px;background:#06172bd9;color:#effaff;font-weight:800;cursor:pointer}
 #jpd-company-world .jpw-brand{font-size:12px;letter-spacing:2.4px;color:var(--world-accent);font-weight:900}
 #jpd-company-world .jpw-hero{padding:clamp(28px,5vw,58px) 0 26px;max-width:850px}
 #jpd-company-world .jpw-hero h1{font-size:clamp(38px,6vw,70px);line-height:1.02;letter-spacing:-2px;margin:13px 0}
 #jpd-company-world .jpw-hero p{font-size:clamp(15px,2vw,18px);line-height:1.75;color:#c4d6e7}
 #jpd-company-world .jpw-pill{display:inline-block;padding:8px 12px;border:1px solid var(--world-line);border-radius:99px;color:var(--world-accent);font-size:11px;font-weight:800}
 #jpd-company-world .jpw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}
 #jpd-company-world .jpw-card{padding:18px;border:1px solid var(--world-line);border-radius:16px;background:#031426aa}
 #jpd-company-world .jpw-card h3{margin:0 0 8px;color:var(--world-accent)}
 #jpd-company-world .jpw-card p{margin:0;color:#bdd0e1;line-height:1.65;font-size:13px}
 #jpd-company-world .jpw-actions{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0}
 #jpd-company-world .jpw-notice{padding:15px;border-left:3px solid var(--world-accent);background:#031426aa;color:#bfd2e3;font-size:12px;line-height:1.65}
 #jpd-company-world .jpw-foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:22px;padding-top:16px;border-top:1px solid var(--world-line);font-size:11px;color:#a8bfd3}
 @media(max-width:620px){#jpd-company-world{padding:18px;border-radius:18px}#jpd-company-world .jpw-grid{grid-template-columns:1fr}#jpd-company-world .jpw-hero h1{font-size:42px}}
 @media(prefers-reduced-motion:reduce){#jpd-company-world *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
 `;
 function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function ensureWorld(){
  let node=$("jpd-company-world");if(node)return node;
  const root=$("jr-public-discovery");if(!root)return null;
  if(!$("jpd-company-world-style")){const st=document.createElement("style");st.id="jpd-company-world-style";st.textContent=css;document.head.appendChild(st);}
  node=document.createElement("section");node.id="jpd-company-world";node.hidden=true;node.setAttribute("aria-live","polite");root.appendChild(node);return node;
 }
 function showWorld(slug){
  const world=companies[slug];if(!world)return;
  const root=$("jr-public-discovery"),node=ensureWorld();if(!root||!node)return;
  [...root.children].forEach(child=>{if(child!==node)child.hidden=true;});
  node.hidden=false;node.dataset.theme=world.theme;
  node.innerHTML='<div class="jpw-top"><div class="jpw-brand">JR PHEEF WORLDS <span aria-hidden="true">/</span> '+esc(world.name)+'</div><button type="button" class="jpw-back" data-jpw-back>← ECOSYSTEM HOME</button></div>'+
   '<div class="jpw-hero"><div class="jpw-brand">'+esc(world.eyebrow)+'</div><h1>'+esc(world.tagline)+'</h1><p>'+esc(world.intro)+'</p><span class="jpw-pill">'+esc(world.pill)+'</span></div>'+
   '<div class="jpw-grid">'+world.sections.map(s=>'<article class="jpw-card"><h3>'+esc(s[0])+'</h3><p>'+esc(s[1])+'</p></article>').join("")+'</div>'+
   '<div class="jpw-actions"><button type="button" class="jpw-action" data-jpw-register>CREATE JR ACCOUNT</button><button type="button" class="jpw-action" data-jpw-login>SIGN IN</button></div>'+
   '<p class="jpw-notice">'+esc(world.notice)+'</p>'+
   '<div class="jpw-foot"><span>'+esc(world.name)+' · An independent company/product environment within the connected JR PHEEF ecosystem</span><span>Shared gateway · Separate company records and responsibilities</span></div>';
  node.scrollIntoView({behavior:"smooth",block:"start"});
 }
 function returnToDiscovery(){
  const root=$("jr-public-discovery"),node=$("jpd-company-world");if(node)node.hidden=true;
  if(root)[...root.children].forEach(child=>{if(child!==node)child.hidden=false;});
  document.body.classList.add("jr-public-discovery-mode");document.body.classList.remove("jr-public-auth-mode");
  window.scrollTo({top:0,behavior:"smooth"});
 }
 function enterAuth(mode){
  const node=$("jpd-company-world");if(node)node.hidden=true;
  const root=$("jr-public-discovery");if(root)[...root.children].forEach(child=>{if(child!==node)child.hidden=false;});
  document.body.classList.remove("jr-public-discovery-mode");document.body.classList.add("jr-public-auth-mode");
  const auth=$("auth");if(auth){auth.hidden=false;auth.scrollIntoView({behavior:"smooth",block:"start"});}
  if(mode==="register"&&typeof window.showRegister==="function")window.showRegister();
  else if(typeof window.showLogin==="function")window.showLogin();
 }
 document.addEventListener("click",function(e){
  const el=e.target&&e.target.closest?e.target.closest("[data-jpd-action],[data-jpw-back],[data-jpw-register],[data-jpw-login]"):null;if(!el)return;
  e.preventDefault();
  if(el.hasAttribute("data-jpw-back"))return returnToDiscovery();
  if(el.hasAttribute("data-jpw-register"))return enterAuth("register");
  if(el.hasAttribute("data-jpw-login"))return enterAuth("login");
  const action=el.getAttribute("data-jpd-action");
  if(action==="login")enterAuth("login");
  else if(action==="register")enterAuth("register");
  else if(action==="top")returnToDiscovery();
  else if(action==="world"){
   const slug=el.getAttribute("data-world");
   if(companies[slug])showWorld(slug);
   else{
    const note=$("jpd-world-note");
    const labels={move:"JR MOVE is a JR PHEEF mobility and logistics service world.",link:"JR LINK is JR PHEEF's integrated communication environment."};
    if(note)note.textContent=(labels[slug]||"This environment is part of JR PHEEF.")+" Its own tools and live integrations will be displayed as they are implemented and verified.";
   }
  }
 });
 function initialise(){
  const app=$("app"),auth=$("auth");if(auth)auth.hidden=false;
  if(app&&!app.classList.contains("hidden")){document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");const d=$("jr-public-discovery");if(d)d.hidden=true;}
  else{document.body.classList.add("jr-public-discovery-mode");document.body.classList.remove("jr-public-auth-mode");}
  if(app&&window.MutationObserver){
   const observer=new MutationObserver(function(){if(!app.classList.contains("hidden")){const d=$("jr-public-discovery");if(d)d.hidden=true;document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");observer.disconnect();}});
   observer.observe(app,{attributes:true,attributeFilter:["class"]});
  }
  window.setTimeout(function(){if(app&&!app.classList.contains("hidden")){const d=$("jr-public-discovery");if(d)d.hidden=true;document.body.classList.remove("jr-public-discovery-mode","jr-public-auth-mode");}},1400);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialise);else initialise();
 window.jrPublicEnterAuth=enterAuth;
 window.jrPublicShowCompanyWorld=showWorld;
})();