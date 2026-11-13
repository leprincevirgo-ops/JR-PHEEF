import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://jr-pheef-foundation.onrender.com",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:corsHeaders});
const clean=(v:unknown,max=1000)=>typeof v==="string"?v.trim().slice(0,max):"";
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async (req: Request) => {
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(!["GET","POST"].includes(req.method))return json({ok:false,error:"Method not allowed."},405);
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer /,"");
  const url=Deno.env.get("SUPABASE_URL")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SECRET_KEY")||"";
  const publishableKey=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
  if(!token||!url||!serviceKey||!publishableKey)return json({ok:false,error:"Founder service is not configured."},503);
  try{
    const auth=await fetch(url+"/auth/v1/user",{headers:{apikey:publishableKey,Authorization:"Bearer "+token}});
    if(!auth.ok)return json({ok:false,error:"Your session has expired. Sign in again."},401);
    const user=await auth.json();
    if(!user.email_confirmed_at)return json({ok:false,error:"Verify your email before continuing."},403);
    const headers={apikey:serviceKey,Authorization:"Bearer "+serviceKey,"Content-Type":"application/json"};
    const profileResponse=await fetch(url+"/rest/v1/members?auth_user_id=eq."+encodeURIComponent(user.id)+"&select=id,full_name,email,jp_number,role,account_type,verified,status",{headers});
    if(!profileResponse.ok)throw new Error("Could not verify founder permissions.");
    const profiles=await profileResponse.json(),member=profiles[0];
    if(!member||member.role!=="founder"||member.jp_number!=="JP-01"||member.status!=="active")return json({ok:false,error:"This account does not have founder access."},403);
    const rest=async(path:string,method="GET",body?:unknown,prefer="return=representation")=>{
      const response=await fetch(url+"/rest/v1/"+path,{method,headers:{...headers,Prefer:prefer},body:body===undefined?undefined:JSON.stringify(body)});
      const raw=await response.text();let data:any=null;try{data=raw?JSON.parse(raw):null;}catch{}
      if(!response.ok)throw new Error("Founder data operation failed ("+response.status+").");
      return data;
    };
    if(req.method==="POST"){
      const input=await req.json().catch(()=>({})),action=clean(input.action,50);
      if(action==="create_opportunity_dossier"){
        const title=clean(input.title,180),summary=clean(input.summary,5000),sector=clean(input.sector,80)||"general",sourceName=clean(input.sourceName,180),sourceUrl=clean(input.sourceUrl,1000),sourceType=clean(input.sourceType,30);
        if(title.length<3||summary.length<20||sourceName.length<2)return json({ok:false,error:"Enter a title, detailed summary and source name."},400);
        if(sourceType!=="public_research"||!/^https:\/\//i.test(sourceUrl))return json({ok:false,error:"DGBO research dossiers must cite a public HTTPS source. Member ideas use the separate consent-based submission form."},400);
        const created=await rest("dgbo_opportunity_dossiers","POST",{title,summary,sector,target_market:clean(input.targetMarket,240),source_type:"public_research",source_name:sourceName,source_url:sourceUrl,customer_problem:clean(input.customerProblem,3000),proposed_solution:clean(input.proposedSolution,3000),revenue_model:clean(input.revenueModel,3000),startup_requirements:clean(input.startupRequirements,3000),startup_cost_estimate:clean(input.startupCostEstimate,500),risks:clean(input.risks,3000),research_notes:clean(input.researchNotes,6000),confidence_score:input.confidenceScore===""||input.confidenceScore===undefined?null:Number(input.confidenceScore),source_evidence:Array.isArray(input.sourceEvidence)?input.sourceEvidence.slice(0,20):[],consent_to_dgbo:true,status:"ready_for_review",created_by_member_id:member.id});
        const dossier=created?.[0];if(!dossier?.id)throw new Error("Research dossier could not be saved.");
        await rest("dgbo_opportunity_events","POST",{dossier_id:dossier.id,actor_member_id:member.id,actor_type:"founder",event_type:"submitted",details:{source_type:"public_research",source_name:sourceName,source_url:sourceUrl}});
        return json({ok:true,data:dossier,note:"Public-source research dossier saved to DGBO's private review queue. It is not yet approved."});
      }
      if(action==="review_opportunity_dossier"){
        const id=clean(input.id,50),decision=clean(input.decision,30),notes=clean(input.notes,4000),nextSteps=clean(input.nextSteps,3000);
        if(!uuid(id)||!["approved","rejected","needs_research"].includes(decision))return json({ok:false,error:"Choose a valid dossier and review decision."},400);
        const existing=await rest("dgbo_opportunity_dossiers?id=eq."+id+"&status=in.(ready_for_review,in_review,needs_research)&select=id,title,status,source_type,submitted_by_member_id,consent_to_dgbo&limit=1");
        if(!existing?.length)return json({ok:false,error:"This dossier is not awaiting review."},409);
        const dossier=existing[0];if(dossier.source_type==="member_submission"&&(!dossier.submitted_by_member_id||!dossier.consent_to_dgbo))return json({ok:false,error:"Member consent is missing; this idea cannot enter DGBO review."},403);
        const updated=await rest("dgbo_opportunity_dossiers?id=eq."+id,"PATCH",{status:decision==="needs_research"?"needs_research":decision,reviewed_by_member_id:member.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()});
        await rest("dgbo_opportunity_reviews","POST",{dossier_id:id,reviewer_member_id:member.id,decision,notes,next_steps:nextSteps});
        await rest("dgbo_opportunity_events","POST",{dossier_id:id,actor_member_id:member.id,actor_type:"founder",event_type:decision==="needs_research"?"research_requested":"reviewed",details:{decision,notes,next_steps:nextSteps}});
        if(decision==="approved"){
          const existingProject=await rest("dgbo_venture_projects?dossier_id=eq."+id+"&select=id&limit=1");
          if(!existingProject?.length){
            const project=await rest("dgbo_venture_projects","POST",{dossier_id:id,venture_name:dossier.title,stage:"validation",business_model:"",validation_plan:nextSteps,created_by_member_id:member.id});
            if(project?.[0]?.id)await rest("dgbo_opportunity_events","POST",{dossier_id:id,actor_member_id:member.id,actor_type:"founder",event_type:"venture_started",details:{venture_project_id:project[0].id,stage:"validation"}});
          }
        }
        return json({ok:true,data:updated?.[0]||{id,status:decision},note:decision==="approved"?"Approved. A DGBO venture project has been opened at the validation stage.":decision==="needs_research"?"Returned for further research.":"Rejected and retained in the private audit trail."});
      }
      if(action==="update_venture_stage"){
        const id=clean(input.id,50),stage=clean(input.stage,30);
        const allowed=["validation","business_plan","pilot","partnership","operations","paused","closed"];
        if(!uuid(id)||!allowed.includes(stage))return json({ok:false,error:"Choose a valid venture project and stage."},400);
        const existing=await rest("dgbo_venture_projects?id=eq."+id+"&select=id,dossier_id,stage,venture_name&limit=1");
        if(!existing?.length)return json({ok:false,error:"Venture project not found."},404);
        const updated=await rest("dgbo_venture_projects?id=eq."+id,"PATCH",{stage,business_model:clean(input.businessModel,4000),validation_plan:clean(input.validationPlan,4000),next_milestone:clean(input.nextMilestone,1000),target_date:clean(input.targetDate,10)||null,owner_member_id:uuid(input.ownerMemberId)?input.ownerMemberId:null,updated_at:new Date().toISOString()});
        await rest("dgbo_opportunity_events","POST",{dossier_id:existing[0].dossier_id,actor_member_id:member.id,actor_type:"founder",event_type:"stage_changed",details:{from:existing[0].stage,to:stage,venture_project_id:id}});
        if(stage==="operations"||stage==="closed")await rest("dgbo_opportunity_dossiers?id=eq."+existing[0].dossier_id,"PATCH",{status:stage==="operations"?"launched":"archived",updated_at:new Date().toISOString()});
        return json({ok:true,data:updated?.[0]||{id,stage}});
      }
      if(action==="create_decision"){
        const title=clean(input.title,160),venture=clean(input.venture,80),details=clean(input.details,3000);
        if(title.length<3)return json({ok:false,error:"Decision title must be at least three characters."},400);
        if(venture){const v=await rest("ventures?slug=eq."+encodeURIComponent(venture)+"&select=slug&limit=1");if(!v?.length)return json({ok:false,error:"Choose an existing venture."},400);}
        const created=await rest("dgbo_decisions","POST",{title,venture:venture||null,details:details||null,status:"proposed",proposed_by:member.id});
        return json({ok:true,data:created?.[0]||created});
      }
      if(action==="decide_decision"){
        const id=clean(input.id,50),status=clean(input.status,20);
        if(!uuid(id)||!["approved","rejected"].includes(status))return json({ok:false,error:"Choose a valid decision and approve or reject it."},400);
        const updated=await rest("dgbo_decisions?id=eq."+id+"&status=eq.proposed","PATCH",{status,decided_by:member.id,decided_at:new Date().toISOString()});
        if(!updated?.length)return json({ok:false,error:"Decision was not found or could not be changed."},404);
        return json({ok:true,data:updated[0]});
      }
      if(action==="review_ad_campaign"){
        const id=clean(input.id,50),status=clean(input.status,20),reviewNote=clean(input.reviewNote,500);
        if(!uuid(id)||!["approved","rejected"].includes(status))return json({ok:false,error:"Choose a campaign and approve or reject it."},400);
        const existing=await rest("ad_campaigns?id=eq."+id+"&status=eq.pending&select=id,paid&limit=1");
        if(!existing?.length)return json({ok:false,error:"This campaign is no longer awaiting review."},409);
        const updated=await rest("ad_campaigns?id=eq."+id+"&status=eq.pending","PATCH",{status,review_note:reviewNote||null,updated_at:new Date().toISOString()});
        return json({ok:true,data:updated?.[0]||{id,status},note:status==="approved"&&!existing[0].paid?"Approved for advertising review; it will not appear in feeds until payment is separately verified.":"Campaign review updated."});
      }
      if(action==="create_capability"){
        const capabilityKey=clean(input.capabilityKey,80),name=clean(input.name,120),category=clean(input.category,60)||"general",description=clean(input.description,2000);
        if(!/^[a-z][a-z0-9_.:-]{1,79}$/.test(capabilityKey)||name.length<2||category.length<2)return json({ok:false,error:"Enter a valid capability key, name and category."},400);
        const created=await rest("dgbo_capabilities","POST",{capability_key:capabilityKey,name,category,description,status:"proposed",created_by:member.id});
        return json({ok:true,data:created?.[0]||created,note:"Capability added to the founder registry as a proposal. It is not activated in the live product."});
      }
      if(action==="update_capability"){
        const id=clean(input.id,50),status=clean(input.status,30);
        if(!uuid(id))return json({ok:false,error:"Choose a valid capability."},400);
        const allowed=["proposed","approved","in_development","available","paused","retired"];
        const patch:any={updated_at:new Date().toISOString()};
        if(input.status!==undefined){if(!allowed.includes(status))return json({ok:false,error:"Choose a valid capability lifecycle status."},400);patch.status=status;}
        if(input.name!==undefined){const name=clean(input.name,120);if(name.length<2)return json({ok:false,error:"Capability name must be at least two characters."},400);patch.name=name;}
        if(input.category!==undefined){const category=clean(input.category,60);if(category.length<2)return json({ok:false,error:"Capability category must be at least two characters."},400);patch.category=category;}
        if(input.description!==undefined)patch.description=clean(input.description,2000);
        if(Object.keys(patch).length===1)return json({ok:false,error:"There are no capability changes to save."},400);
        const updated=await rest("dgbo_capabilities?id=eq."+id,"PATCH",patch);
        if(!updated?.length)return json({ok:false,error:"Capability not found."},404);
        return json({ok:true,data:updated[0]});
      }
      return json({ok:false,error:"Unknown founder action."},400);
    }
    const count=async(table:string)=>{
      const response=await fetch(url+"/rest/v1/"+table+"?select=id",{method:"HEAD",headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey,Prefer:"count=exact",Range:"0-0"}});
      if(!response.ok)return null;const range=response.headers.get("content-range")||"",total=range.slice(range.lastIndexOf("/")+1),parsed=Number(total);return Number.isFinite(parsed)?parsed:0;
    };
    const [members,ventures,opportunities,listings,conversations,deliveries,businesses,ventureRows,decisions,capabilities,adCampaigns,dossiers,ventureProjects]=await Promise.all([
      count("members"),count("ventures"),count("jr_opportunities"),count("jr_listings"),count("jr_conversations"),count("jr_delivery_requests"),count("jr_business_workspaces"),
      rest("ventures?select=slug,name,kind,status,regulated,licence_ref,description&order=kind.asc,name.asc"),
      rest("dgbo_decisions?select=id,title,venture,details,status,created_at,decided_at&order=created_at.desc&limit=30"),
      rest("dgbo_capabilities?select=id,capability_key,name,category,description,status,created_at,updated_at&order=category.asc,name.asc&limit=200"),
      rest("ad_campaigns?status=eq.pending&select=id,member_id,title,body,category,location,budget_ksh,paid,status,created_at,media_urls&order=created_at.asc&limit=100"),
      rest("dgbo_opportunity_dossiers?select=id,title,summary,sector,target_market,source_type,source_name,source_url,customer_problem,proposed_solution,revenue_model,startup_requirements,startup_cost_estimate,risks,research_notes,confidence_score,submitted_by_member_id,consent_to_dgbo,status,created_at&status=in.(ready_for_review,in_review,needs_research,approved,rejected)&order=created_at.desc&limit=100"),
      rest("dgbo_venture_projects?select=id,dossier_id,venture_name,stage,business_model,validation_plan,next_milestone,target_date,owner_member_id,created_at,updated_at&order=updated_at.desc&limit=100")
    ]);
    return json({ok:true,founder:{fullName:member.full_name,jpNumber:member.jp_number,role:member.role,accountType:member.account_type,verified:Boolean(member.verified),status:member.status},environment:"STAGING",metrics:{memberAccounts:members,registeredVentures:ventures,opportunities,listings,conversations,deliveryRequests:deliveries,businessWorkspaces:businesses},ventures:ventureRows,decisions,capabilities,adCampaigns,dossiers,ventureProjects,controls:{paymentsEnabled:false,productionConnected:false,liveAiConnected:false},principles:{purpose:"The ecosystem serves humanity; people contribute to its growth; companies strengthen one another and adapt to human needs.",dgbo:"Parent governance and stewardship",jrPheef:"Flagship human-facing technology ecosystem",family:"Financial access and participation serving the entire ecosystem"}});
  }catch(error){
    console.error("Founder overview failed:",error instanceof Error?error.message:"unknown");
    return json({ok:false,error:"Founder overview is temporarily unavailable."},500);
  }
});
