import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders={
  "Access-Control-Allow-Origin":"https://jr-pheef-foundation.onrender.com",
  "Access-Control-Allow-Headers":"authorization, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Vary":"Origin",
};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:corsHeaders});
const clean=(value:unknown,max=3000)=>typeof value==="string"?value.trim().slice(0,max):"";
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({ok:false,error:"Method not allowed."},405);
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer /,"");
  const url=Deno.env.get("SUPABASE_URL")||"";
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SECRET_KEY")||"";
  const publish=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
  if(!token||!url||!service||!publish)return json({ok:false,error:"Partner enquiry service is not configured."},503);
  try{
    const auth=await fetch(url+"/auth/v1/user",{headers:{apikey:publish,Authorization:"Bearer "+token}});
    if(!auth.ok)return json({ok:false,error:"Please sign in again."},401);
    const user=await auth.json();
    if(!user.email_confirmed_at)return json({ok:false,error:"Confirm your email before sending a partnership enquiry."},403);
    const headers={apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"};
    const memberResponse=await fetch(url+"/rest/v1/members?auth_user_id=eq."+encodeURIComponent(user.id)+"&select=id,status&limit=1",{headers});
    if(!memberResponse.ok)return json({ok:false,error:"Could not verify your member profile."},503);
    const members=await memberResponse.json(),member=members[0];
    if(!member||member.status!=="active")return json({ok:false,error:"Your JR PHEEF member profile is not active."},403);
    const input=await req.json().catch(()=>({}));
    const organizationName=clean(input.organizationName,140);
    const partnerType=clean(input.partnerType,40);
    const details=clean(input.details,3000);
    const allowed=["business","technology","education","community","delivery","financial_services","public_sector","other"];
    if(organizationName.length<2||!allowed.includes(partnerType)||details.length<20)return json({ok:false,error:"Add your organisation, partnership area and at least 20 characters describing the proposal."},400);
    const saved=await fetch(url+"/rest/v1/jr_partner_inquiries",{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify({member_id:member.id,organization_name:organizationName,partner_type:partnerType,details,status:"received"})});
    if(!saved.ok)return json({ok:false,error:"Your enquiry could not be recorded. Please try again."},503);
    const rows=await saved.json();
    return json({ok:true,message:"Your partnership enquiry has been received for review. It is not a partnership agreement or investment offer.",inquiryId:rows?.[0]?.id||null});
  }catch(error){
    console.error("Partner enquiry failed:",error instanceof Error?error.message:"unknown");
    return json({ok:false,error:"The partner enquiry service is temporarily unavailable."},500);
  }
});
