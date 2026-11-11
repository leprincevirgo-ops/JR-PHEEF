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
    const [members,ventures,opportunities,listings,conversations,deliveries,businesses,ventureRows,decisions,capabilities]=await Promise.all([
      count("members"),count("ventures"),count("jr_opportunities"),count("jr_listings"),count("jr_conversations"),count("jr_delivery_requests"),count("jr_business_workspaces"),
      rest("ventures?select=slug,name,kind,status,regulated,licence_ref,description&order=kind.asc,name.asc"),
      rest("dgbo_decisions?select=id,title,venture,details,status,created_at,decided_at&order=created_at.desc&limit=30"),
      rest("dgbo_capabilities?select=id,capability_key,name,category,description,status,created_at,updated_at&order=category.asc,name.asc&limit=200")
    ]);
    return json({ok:true,founder:{fullName:member.full_name,jpNumber:member.jp_number,role:member.role,accountType:member.account_type,verified:Boolean(member.verified),status:member.status},environment:"STAGING",metrics:{memberAccounts:members,registeredVentures:ventures,opportunities,listings,conversations,deliveryRequests:deliveries,businessWorkspaces:businesses},ventures:ventureRows,decisions,capabilities,controls:{paymentsEnabled:false,productionConnected:false,liveAiConnected:false},principles:{purpose:"The ecosystem serves humanity; people contribute to its growth; companies strengthen one another and adapt to human needs.",dgbo:"Parent governance and stewardship",jrPheef:"Flagship human-facing technology ecosystem",family:"Financial access and participation serving the entire ecosystem"}});
  }catch(error){
    console.error("Founder overview failed:",error instanceof Error?error.message:"unknown");
    return json({ok:false,error:"Founder overview is temporarily unavailable."},500);
  }
});
