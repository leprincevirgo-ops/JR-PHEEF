"use strict";
(() => {
 const configs = {
  dgbo:{id:"view-dgbo",name:"DIAMOND GLOBAL BUSINESS OPERATORS",short:"DGBO",eyebrow:"THE DIAMOND GROUP · THE UMBRELLA",slogan:"Building businesses beyond borders.",intro:"A group-level company designed to bring people and businesses together, evaluate opportunities, develop ventures and steward a growing portfolio of companies.",hero:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",sections:[["overview","Overview"],["group","Our group"],["work","What we do"],["opportunities","Opportunities"],["governance","Governance"],["connect","Connect"]]},
  family:{id:"view-family",name:"FAMILY",short:"FAMILY",eyebrow:"FINANCIAL ACCESS TO MONEY FOR INVESTMENTS & LOVING YOURSELF",slogan:"Build your financial wellbeing together.",intro:"A people-centred environment for financial education, personal and family goals, responsible participation and discovery of authorised financial providers.",hero:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=85",sections:[["overview","Overview"],["learn","Learn"],["goals","Goals"],["access","Financial access"],["community","Community"],["connect","Connect"]]}
 };
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const img=(url,alt)=>'<img loading="lazy" src="'+url+'" alt="'+esc(alt||"")+'">';
 function feature(title,copy,url,tag){return '<article class="diamond-content-card">'+img(url,"")+'<div class="diamond-content-card-copy"><span class="diamond-tag">'+tag+'</span><h3>'+title+'</h3><p>'+copy+'</p></div></article>';}
 function section(id,kicker,title,copy,body){return '<section class="diamond-section" data-diamond-section="'+id+'"><div class="diamond-section-heading"><span>'+kicker+'</span><h2>'+title+'</h2><p>'+copy+'</p></div>'+body+'</section>';}
 function cards(items){return '<div class="diamond-feature-grid">'+items.map(x=>feature(...x)).join("")+'</div>';}
 function principles(items){return '<div class="diamond-principles">'+items.map(x=>'<article><b>'+x[0]+'</b><p>'+x[1]+'</p></article>').join("")+'</div>';}
 function body(key){
  if(key==="dgbo"){
   return section("overview","01 · THE GROUP","An umbrella for companies with a shared direction.","DGBO provides group identity, stewardship, governance and strategic coordination. Its companies retain their own operations, leadership, records and responsibilities.",cards([
    ["A group built to grow","Developing businesses, partnerships and practical opportunities across borders.","https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80","GROUP VISION"],
    ["People and businesses","Connecting founders, teams, customers, partners and ideas through a shared ecosystem.","https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80","CONNECTION"],
    ["Long-term stewardship","Building structures that can be responsibly managed and passed to future generations.","https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80","GENERATIONS"]
   ]))+
   section("group","02 · COMPANY RELATIONSHIPS","One Diamond umbrella. Distinct companies.","These are intended group relationships. Legal incorporation, ownership records and operating status must be updated only when formally completed.",'<div class="diamond-relations"><div class="diamond-parent"><strong>DGBO</strong><small>Parent group · governance & stewardship</small></div><div class="diamond-branches"><article><b>JR PHEEF</b><p>Technology, intelligence, communication, marketplace and connected services.</p><small>Planned group company</small></article><article><b>FAMILY</b><p>Financial education, access pathways and community participation.</p><small>Planned group company · regulated activity not activated</small></article></div></div><p class="diamond-note">Future ventures can join through reviewed ownership, governance and operating arrangements. Group reporting does not mean companies share private customer records.</p>')+
   section("work","03 · WHAT DGBO DOES","From an idea to a responsibly operated business.","Research, validate, build and govern.",cards([
    ["Opportunity research","Research markets, identify problems, validate demand and prepare evidence-based opportunity dossiers.","https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80","RESEARCH"],
    ["Venture development","Shape business models, operating plans, milestones, teams and resource requirements.","https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80","BUILD"],
    ["Partnerships","Develop relationships with businesses, institutions, technology providers and communities.","https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80","PARTNER"]
   ]))+
   section("opportunities","04 · OPPORTUNITIES & UPDATES","Ideas deserve research before investment.","Approved company news, venture updates, opportunities and public research will appear here after review.",'<div class="diamond-live-panel"><i class="diamond-live-dot pending"></i><div><strong>Publication feed is being prepared</strong><p>No unverified opportunities or invented company announcements are displayed.</p></div></div>')+
   section("governance","05 · GOVERNANCE","Clear responsibilities. Protected boundaries.","The group should coordinate without suffocating the independence of its companies.",principles([["Group oversight","Strategy, ownership records, group policies and consolidated reporting."],["Company autonomy","Each company manages its own people, customers, budgets and daily operations."],["Responsible approvals","Material decisions, financial activity and public statements follow authorised review."],["Privacy by design","Access is based on role and purpose, not simply membership of the group."]]))+
   section("connect","06 · CONNECT WITH DGBO","Bring a practical idea or partnership proposal.","Use JR PHEEF to prepare a business research request, venture plan or partnership enquiry. A submission is not a funding promise or acceptance.",'<div class="diamond-actions"><button class="diamond-primary" type="button" data-diamond-jr>Continue with JR</button><button class="diamond-secondary" type="button" data-venture-apply="dgbo">Apply to join DGBO</button></div><p class="diamond-application-status" data-venture-status="dgbo" aria-live="polite"></p>');
  }
  return section("overview","01 · PEOPLE FIRST","Financial confidence starts with understanding.","FAMILY is designed to support people as they learn, plan and explore responsible ways to participate in financial opportunities.",cards([
   ["Understand your money","Build practical knowledge around income, spending, budgeting, saving and financial risk.","https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80","LEARN"],
   ["Plan together","Set personal and family goals, prepare for milestones and coordinate shared priorities.","https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80","WELLBEING"],
   ["Explore responsibly","Understand investment concepts, risks, disclosures and the role of authorised providers.","https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80","ACCESS"]
  ]))+
  section("learn","02 · FINANCIAL EDUCATION","Knowledge before decisions.","Build the foundations before committing money.",principles([["Budgeting","Understand what comes in, what goes out and how to plan within your means."],["Saving","Set realistic targets, build consistency and understand emergency reserves."],["Borrowing","Compare costs, repayment obligations and the risks of unaffordable debt."],["Investing","Learn about risk, diversification, time horizons, fees and regulated products."]]))+
  section("goals","03 · PERSONAL & FAMILY GOALS","Turn intentions into practical plans.","Use JR to create a budget, savings target, education plan, emergency-preparedness checklist or family milestone plan.",'<button class="diamond-primary" type="button" data-diamond-jr>Plan a goal with JR</button>')+
  section("access","04 · FINANCIAL ACCESS","Connect to properly authorised services.","Future savings, payment, lending and investment products must be offered by appropriately licensed institutions through approved integrations.",'<div class="diamond-live-panel"><i class="diamond-live-dot pending"></i><div><strong>Financial transactions are not active</strong><p>FAMILY does not currently accept deposits, hold customer funds, lend, transfer or invest money. No returns are promised.</p></div></div>')+
  section("community","05 · COMMUNITY","Grow with knowledge, dignity and care.","A community for shared learning and practical financial wellbeing.",cards([
   ["Shared learning","Community education and practical conversations about financial wellbeing.","https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80","COMMUNITY"],
   ["Family milestones","Prepare for education, health, housing and other important life goals.","https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80","LIFE"],
   ["Opportunity literacy","Learn how to assess claims, avoid scams and verify providers before committing.","https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80","SAFETY"]
  ]))+
  section("connect","06 · GET STARTED","Start with a question. Build a plan.","JR can help explain financial concepts and organise personal goals. It cannot replace qualified advice or an authorised financial provider.",'<div class="diamond-actions"><button class="diamond-primary" type="button" data-diamond-jr>Talk to JR</button><button class="diamond-secondary" type="button" data-venture-apply="family">Apply to join FAMILY</button></div><p class="diamond-application-status" data-venture-status="family" aria-live="polite"></p>');
 }
 function mount(key,c){
  const root=document.getElementById(c.id);if(!root||root.dataset.diamondMounted)return;
  root.dataset.diamondMounted="true";root.classList.add("diamond-company-world",key==="family"?"diamond-green":"diamond-gold");
  const nav=c.sections.map((s,i)=>'<button type="button" data-diamond-nav="'+s[0]+'" '+(i===0?'aria-current="page"':'')+'>'+s[1]+'</button>').join("");
  root.innerHTML='<div class="diamond-site-shell"><header class="diamond-site-top"><span class="diamond-brand-mark">'+c.short+'</span><span>'+c.eyebrow+'</span><button type="button" class="diamond-return" data-diamond-return>← JR PHEEF</button></header><section class="diamond-hero">'+img(c.hero,c.name)+'<div class="diamond-hero-shade"></div><div class="diamond-hero-copy"><span class="diamond-overline">'+c.eyebrow+'</span><h1>'+c.slogan+'</h1><p>'+c.intro+'</p><span class="diamond-status">COMPANY ENVIRONMENT · INFORMATION & SERVICES</span></div></section><nav class="diamond-company-nav" aria-label="'+c.short+' sections">'+nav+'</nav><main class="diamond-company-content">'+body(key)+'</main><footer class="diamond-site-footer"><strong>'+c.name+'</strong><span>Part of the connected Diamond ecosystem · Powered by JR PHEEF</span><button type="button" data-diamond-return>Return to JR PHEEF</button></footer></div>';
  root.querySelectorAll("[data-diamond-nav]").forEach(b=>b.addEventListener("click",()=>{const t=root.querySelector('[data-diamond-section="'+b.dataset.diamondNav+'"]');if(!t)return;root.querySelectorAll("[data-diamond-nav]").forEach(x=>x.removeAttribute("aria-current"));b.setAttribute("aria-current","page");t.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});}));
  root.querySelectorAll("[data-diamond-return]").forEach(b=>b.addEventListener("click",()=>document.querySelector('.workspace-tab[data-view="home"]')?.click()));
  root.querySelectorAll("[data-diamond-jr]").forEach(b=>b.addEventListener("click",()=>{document.querySelector('.workspace-tab[data-view="jr"]')?.click();const p=document.getElementById("workspacePrompt");if(p){p.value=key==="dgbo"?"Help me explore DGBO business research, venture development or partnership services.":"Help me create a practical FAMILY financial education or personal savings goal plan.";p.focus();}}));

  function clearMemberships(){
   for(const slug of ["dgbo","family"]){
    const button=root.querySelector('[data-venture-apply="'+slug+'"]');
    const status=root.querySelector('[data-venture-status="'+slug+'"]');
    if(status)status.textContent="";
    if(button){button.disabled=false;button.textContent="Apply to join "+(slug==="dgbo"?"DGBO":"FAMILY");}
   }
  }
  async function refreshMemberships(event){
   if(event&&!event.detail){clearMemberships();return;}
   if(typeof window.jrWorkspaceAction!=="function"){clearMemberships();return;}
   clearMemberships();
   try{
    const items=await window.jrWorkspaceAction("list_ventures");
    for(const slug of ["dgbo","family"]){
     const venture=(items||[]).find(x=>x.slug===slug);
     const button=root.querySelector('[data-venture-apply="'+slug+'"]');
     const status=root.querySelector('[data-venture-status="'+slug+'"]');
     if(!venture||!button||!status)continue;
     const membership=venture.membership;
     if(membership){
      status.textContent="Membership status: "+membership.status.replace(/_/g," ")+(membership.role_key?" · "+membership.role_key.replace(/_/g," "):"");
      if(["applied","approved","suspended"].includes(membership.status)){
       button.disabled=true;
       button.textContent=membership.status==="approved"?"Membership approved":"Application "+membership.status;
      }else{
       button.disabled=false;
       button.textContent="Reapply to "+(slug==="dgbo"?"DGBO":"FAMILY");
      }
     }
    }
   }catch{clearMemberships();}
  }
  root.querySelectorAll("[data-venture-apply]").forEach(button=>button.addEventListener("click",async()=>{
   const slug=button.getAttribute("data-venture-apply");
   button.disabled=true;button.textContent="Loading application…";
   try{
    const result=await window.jrWorkspaceAction("get_venture_registration",{ventureSlug:slug});
    const template=result.template||{},roles=Array.isArray(template.roles)?template.roles:[],fields=Array.isArray(template.fields)?template.fields:[];
    const dialog=document.createElement("dialog");dialog.className="diamond-application-dialog";
    const form=document.createElement("form");form.method="dialog";form.className="diamond-application-form";
    const heading=document.createElement("h2");heading.textContent="Apply to "+(result.venture?.name||template.label||slug.toUpperCase());
    const notice=document.createElement("p");notice.className="diamond-application-notice";notice.textContent=template.notice||"Your application will be reviewed before access is granted.";
    const roleLabel=document.createElement("label");roleLabel.textContent="How would you like to participate?";
    const role=document.createElement("select");role.required=true;
    const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent="Choose a role";role.append(placeholder);
    roles.forEach(item=>{const option=document.createElement("option");option.value=item.key;option.textContent=item.label;role.append(option);});
    roleLabel.append(role);form.append(heading,notice,roleLabel);
    const controls=[];
    fields.forEach(field=>{
     const label=document.createElement("label");label.textContent=field.label||field.key;
     const input=field.type==="textarea"?document.createElement("textarea"):document.createElement("input");
     if(input.tagName==="INPUT")input.type="text";
     input.name=field.key;input.maxLength=2000;input.required=!!field.required;
     label.append(input);form.append(label);controls.push(input);
    });
    const consentLabel=document.createElement("label");consentLabel.className="diamond-consent";
    const consent=document.createElement("input");consent.type="checkbox";consent.required=true;
    const consentText=document.createElement("span");consentText.textContent="I have read and agree to the venture-specific notice above.";
    consentLabel.append(consent,consentText);form.append(consentLabel);
    const feedback=document.createElement("p");feedback.className="diamond-application-status";feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
    const actions=document.createElement("div");actions.className="diamond-actions";
    const close=document.createElement("button");close.type="button";close.className="diamond-secondary";close.textContent="Cancel";close.addEventListener("click",()=>dialog.close());
    const submit=document.createElement("button");submit.type="submit";submit.className="diamond-primary";submit.textContent="Submit application";
    actions.append(close,submit);form.append(feedback,actions);dialog.append(form);document.body.append(dialog);
    form.addEventListener("submit",async event=>{
     event.preventDefault();if(!form.reportValidity())return;submit.disabled=true;feedback.textContent="Submitting your application…";
     const applicationData={};controls.forEach(input=>{if(input.value.trim())applicationData[input.name]=input.value.trim();});
     try{
      const saved=await window.jrWorkspaceAction("apply_venture_membership",{ventureSlug:slug,roleKey:role.value,consent:consent.checked,applicationData});
      feedback.textContent=saved.message||"Application received. Access remains pending approval.";
      submit.textContent="Application received";submit.disabled=true;close.textContent="Close";
      const status=root.querySelector('[data-venture-status="'+slug+'"]');if(status)status.textContent="Membership status: applied · "+role.value.replace(/_/g," ");
      const cardButton=root.querySelector('[data-venture-apply="'+slug+'"]');if(cardButton){cardButton.disabled=true;cardButton.textContent="Application pending";}
     }catch(error){feedback.textContent=error.message;submit.disabled=false;}
    });
    dialog.addEventListener("close",()=>dialog.remove());dialog.showModal();button.textContent="Open application";
   }catch(error){
    button.textContent="Apply to "+(slug==="dgbo"?"DGBO":"FAMILY");
    const status=root.querySelector('[data-venture-status="'+slug+'"]');if(status)status.textContent=error.message;
   }finally{button.disabled=false;}
  }));
  window.addEventListener("jr:member-signed-in",refreshMemberships);
  refreshMemberships();
 }
 Object.entries(configs).forEach(([k,c])=>mount(k,c));
})();