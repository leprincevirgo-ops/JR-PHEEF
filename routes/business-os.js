"use strict";

// JR PHEEF — universal business workspace API, extending the existing workspace model.
module.exports = function mountBusinessOS(ctx) {
  const { app, db, requireMember, clean, logActivity, checkRequestRate } = ctx;
  const INDUSTRIES = new Set(["general","retail","supermarket","salon_beauty","barber","hospitality","restaurant_food","healthcare","education","construction","real_estate","transport_logistics","professional_services","manufacturing","agriculture","technology","creative_media","nonprofit","financial_services","other"]);
  const DOMAINS = new Set(["customers","contacts","employees","suppliers","products","services","inventory","sales","purchases","invoices","payments","bookings","documents","projects","appointments","assets","other"]);
  const TYPES = new Set(["csv","xlsx","json","xml","database_backup","api_connector","documents","other"]);
  const slugify = value => clean(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70) || "business";
  const fail = (res,message,status=400) => res.status(status).json({ok:false,error:message});
  const wrap = (label,fn) => async(req,res)=>{try{await fn(req,res);}catch(e){console.error(label+":",clean(e&&e.message).slice(0,180));if(!res.headersSent)res.status(500).json({ok:false,error:"JR could not complete this business operation."});}};
  async function ownedBusiness(member,id){
    const {data,error}=await db.from("jr_business_workspaces").select("*").eq("id",id).eq("owner_member_id",member.id).maybeSingle();
    if(error)throw error;return data;
  }
  app.get("/api/businesses",wrap("Business workspace list",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const {data,error}=await db.from("jr_business_workspaces").select("id,business_name,slug,sector,location,goals,plan_tier,daily_plan_enabled,registration_country,operating_countries,base_currency,timezone,primary_language,status,created_at,updated_at").eq("owner_member_id",member.id).order("updated_at",{ascending:false}).limit(100);
    if(error)throw error;res.json({ok:true,businesses:data||[],global_access:true});
  }));
  app.post("/api/businesses",wrap("Business workspace create",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    if(checkRequestRate&&!checkRequestRate(req,"business-create",20,3600000).allowed)return fail(res,"Too many business workspace requests. Try again later.",429);
    const name=clean(req.body.name).slice(0,140),industry=clean(req.body.industry_key||"general").toLowerCase();
    if(name.length<2)return fail(res,"Enter a business or organisation name.");
    if(!INDUSTRIES.has(industry))return fail(res,"Choose a supported business category.");
    const country=clean(req.body.registration_country).toUpperCase().slice(0,2);
    if(country&&!/^[A-Z]{2}$/.test(country))return fail(res,"Use a two-letter country code for registration country.");
    const countries=Array.isArray(req.body.operating_countries)?[...new Set(req.body.operating_countries.map(x=>clean(x).toUpperCase()).filter(x=>/^[A-Z]{2}$/.test(x)))].slice(0,100):[];
    const currency=clean(req.body.base_currency).toUpperCase();if(currency&&!/^[A-Z]{3}$/.test(currency))return fail(res,"Use a three-letter ISO currency code.");
    const slug=slugify(name);
    const {data,error}=await db.from("jr_business_workspaces").insert({
      owner_member_id:member.id,business_name:name,slug,sector:industry,location:clean(req.body.location).slice(0,180)||null,
      goals:clean(req.body.goals||req.body.description).slice(0,2000)||null,plan_tier:"free",daily_plan_enabled:true,
      description:clean(req.body.description).slice(0,2000)||null,legal_entity_name:clean(req.body.legal_entity_name).slice(0,180)||null,
      registration_country:country||null,operating_countries:countries,base_currency:currency||null,
      timezone:clean(req.body.timezone).slice(0,80)||null,primary_language:clean(req.body.primary_language).slice(0,35)||null,
      status:"setup",template_version:"1.0",workspace_config:{template_version:"1.0",global_access:true,modules:["people","services","goods","operations","documents","finance","integrations","insights"]}
    }).select("id,business_name,slug,sector,registration_country,operating_countries,base_currency,timezone,primary_language,status,workspace_config,created_at").single();
    if(error){if(error.code==="23505")return fail(res,"You already have a business with this name. Choose a distinct name.",409);throw error;}
    const {error:memberError}=await db.from("jr_business_workspace_members").insert({business_id:data.id,member_id:member.id,role_key:"owner",permissions:["business:manage","people:manage","data:import","data:export","integrations:manage","documents:manage","finance:view","approvals:manage"],status:"active"});
    if(memberError)throw memberError;
    if(logActivity)await logActivity(member.id,"BUSINESS_WORKSPACE_CREATED",{business_id:data.id,industry_key:industry});
    res.status(201).json({ok:true,business:data,template:{industry_key:industry,adaptive:true},note:"Workspace created in setup mode. No external system has been connected and no imported data has been changed."});
  }));
  app.get("/api/businesses/:id",wrap("Business workspace detail",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const business=await ownedBusiness(member,req.params.id);if(!business)return fail(res,"Business workspace not found.",404);
    const {data:imports,error}=await db.from("jr_business_import_jobs").select("id,source_system,source_type,data_domains,status,validation_summary,created_at,updated_at").eq("business_id",business.id).order("created_at",{ascending:false}).limit(30);
    if(error)throw error;res.json({ok:true,business,imports:imports||[]});
  }));
  app.patch("/api/businesses/:id",wrap("Business workspace update",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const current=await ownedBusiness(member,req.params.id);if(!current)return fail(res,"Business workspace not found.",404);
    const update={updated_at:new Date().toISOString()};
    if(req.body.name!==undefined){const v=clean(req.body.name).slice(0,140);if(v.length<2)return fail(res,"Business name is too short.");update.business_name=v;}
    if(req.body.description!==undefined)update.description=clean(req.body.description).slice(0,2000)||null;
    if(req.body.status!==undefined){const v=clean(req.body.status);if(!["setup","active","paused","closed"].includes(v))return fail(res,"Invalid business status.");update.status=v;}
    if(req.body.operating_countries!==undefined){if(!Array.isArray(req.body.operating_countries))return fail(res,"Operating countries must be a list.");update.operating_countries=[...new Set(req.body.operating_countries.map(x=>clean(x).toUpperCase()).filter(x=>/^[A-Z]{2}$/.test(x)))].slice(0,100);}
    if(req.body.base_currency!==undefined){const v=clean(req.body.base_currency).toUpperCase();if(v&&!/^[A-Z]{3}$/.test(v))return fail(res,"Use a three-letter ISO currency code.");update.base_currency=v||null;}
    if(req.body.timezone!==undefined)update.timezone=clean(req.body.timezone).slice(0,80)||null;
    if(req.body.primary_language!==undefined)update.primary_language=clean(req.body.primary_language).slice(0,35)||null;
    if(Object.keys(update).length===1)return fail(res,"No business changes supplied.");
    const {data,error}=await db.from("jr_business_workspaces").update(update).eq("id",current.id).eq("owner_member_id",member.id).select("id,business_name,slug,sector,registration_country,operating_countries,base_currency,timezone,primary_language,status,updated_at").single();
    if(error)throw error;res.json({ok:true,business:data});
  }));
  app.post("/api/businesses/:id/imports",wrap("Business import request",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const business=await ownedBusiness(member,req.params.id);if(!business)return fail(res,"Business workspace not found.",404);
    const type=clean(req.body.source_type).toLowerCase();if(!TYPES.has(type))return fail(res,"Choose a supported source type.");
    const domains=Array.isArray(req.body.data_domains)?[...new Set(req.body.data_domains.map(x=>clean(x).toLowerCase()).filter(x=>DOMAINS.has(x)))].slice(0,30):[];
    if(!domains.length)return fail(res,"Select at least one type of business information to import.");
    if(req.body.consent_confirmed!==true)return fail(res,"Confirm that you are authorised to transfer this business data.");
    const {data,error}=await db.from("jr_business_import_jobs").insert({business_id:business.id,requested_by:member.id,source_system:clean(req.body.source_system).slice(0,120)||null,source_type:type,data_domains:domains,status:"draft",consent_confirmed:true}).select("id,source_system,source_type,data_domains,status,created_at").single();
    if(error)throw error;if(logActivity)await logActivity(member.id,"BUSINESS_IMPORT_DRAFT_CREATED",{business_id:business.id,import_id:data.id,source_type:type});
    res.status(201).json({ok:true,import:data,note:"Import request recorded. File transfer, format parsing, field mapping and data writes are not active yet; no records have been imported."});
  }));
};
