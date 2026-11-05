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
  // Daily operating plan: deterministic starter guidance until the AI provider is available.
  const PLAN_TASKS = {
    general:["Review yesterday's results and unresolved issues","Check cash position, costs and obligations","Contact priority customers or partners","Complete the most important revenue or delivery task","Record today's results and tomorrow's priority"],
    retail:["Check opening stock and fast-moving items","Confirm prices, displays and promotions","Review sales and customer requests","Reconcile cash and digital payments","Record low-stock items and reorder needs"],
    supermarket:["Check shelves, expiry dates and cold storage","Review fast-moving and low-stock products","Confirm supplier deliveries and purchase needs","Check till reconciliation and cash controls","Review customer service and closing stock"],
    salon_beauty:["Confirm appointments and staff readiness","Check product and consumable stock","Contact clients due for follow-up","Review service quality and daily sales","Prepare bookings and supplies for tomorrow"],
    restaurant_food:["Check food safety, freshness and preparation stock","Confirm staffing and service readiness","Review orders, wastage and supplier needs","Reconcile sales and payment channels","Record customer feedback and closing checks"],
    transport_logistics:["Confirm vehicle and driver readiness","Review bookings, routes and delivery priorities","Check fuel, maintenance and safety items","Track completed trips and customer updates","Reconcile collections and operating costs"],
    agriculture:["Check crop, livestock or field conditions","Review water, feed, inputs and equipment","Complete the highest-priority field activity","Record production, losses and weather observations","Plan labour, inputs and next-day work"]
  };
  const makePlan = business => {
    const tasks = PLAN_TASKS[business.sector] || PLAN_TASKS.general;
    return { title: business.business_name + " daily operating plan", focus: business.goals || "Keep operations reliable, customers served and records current.", tasks: tasks.map((title,i)=>({id:"task-"+(i+1),title,priority:i===0?"high":"normal",done:false})), review: ["What created value today?","What needs attention or approval?","What is the first priority tomorrow?"] };
  };
  app.get("/api/businesses/:id/daily-plan",wrap("Business daily plan list",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const business=await ownedBusiness(member,req.params.id);if(!business)return fail(res,"Business workspace not found.",404);
    const date=clean(req.query.date)||new Date().toISOString().slice(0,10);
    if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date))return fail(res,"Use a valid plan date (YYYY-MM-DD).");
    const {data,error}=await db.from("jr_business_daily_plans").select("*").eq("business_id",business.id).eq("plan_date",date).maybeSingle();
    if(error)throw error;
    res.json({ok:true,business:{id:business.id,name:business.business_name},plan:data||null,available_template:!data});
  }));
  app.post("/api/businesses/:id/daily-plan",wrap("Business daily plan create",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    if(checkRequestRate&&!checkRequestRate(req,"business-daily-plan",30,3600000).allowed)return fail(res,"Too many plan requests. Try again later.",429);
    const business=await ownedBusiness(member,req.params.id);if(!business)return fail(res,"Business workspace not found.",404);
    if(!business.daily_plan_enabled)return fail(res,"Daily plans are disabled for this workspace.",403);
    const date=clean(req.body.date)||new Date().toISOString().slice(0,10);
    if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date))return fail(res,"Use a valid plan date (YYYY-MM-DD).");
    const {data:existing,error:lookupError}=await db.from("jr_business_daily_plans").select("*").eq("business_id",business.id).eq("plan_date",date).maybeSingle();
    if(lookupError)throw lookupError;
    if(existing)return res.json({ok:true,plan:existing,created:false});
    const {data,error}=await db.from("jr_business_daily_plans").insert({business_id:business.id,plan_date:date,plan:makePlan(business),source:"template",status:"ready",completed_tasks:[]}).select("*").single();
    if(error){if(error.code==="23505"){const retry=await db.from("jr_business_daily_plans").select("*").eq("business_id",business.id).eq("plan_date",date).maybeSingle();if(retry.data)return res.json({ok:true,plan:retry.data,created:false});}throw error;}
    if(logActivity)await logActivity(member.id,"BUSINESS_DAILY_PLAN_CREATED",{business_id:business.id,plan_date:date,source:"template"});
    res.status(201).json({ok:true,plan:data,created:true,note:"Starter plan created from a business-sector template. It is guidance, not AI-generated advice; review and adapt it before use."});
  }));
  app.patch("/api/businesses/:id/daily-plan/:planId/tasks",wrap("Business daily plan task update",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const business=await ownedBusiness(member,req.params.id);if(!business)return fail(res,"Business workspace not found.",404);
    const taskId=clean(req.body.task_id),done=req.body.done;
    if(!/^task-[1-9]\\d?$/.test(taskId)||typeof done!=="boolean")return fail(res,"Provide a valid task ID and completed state.");
    const {data:plan,error}=await db.from("jr_business_daily_plans").select("*").eq("id",req.params.planId).eq("business_id",business.id).maybeSingle();
    if(error)throw error;if(!plan)return fail(res,"Daily plan not found.",404);
    const tasks=Array.isArray(plan.plan&&plan.plan.tasks)?plan.plan.tasks:[];
    if(!tasks.some(t=>t.id===taskId))return fail(res,"Task not found in this plan.",404);
    const completed=new Set(Array.isArray(plan.completed_tasks)?plan.completed_tasks:[]);
    if(done)completed.add(taskId);else completed.delete(taskId);
    const completedTasks=[...completed];
    const status=tasks.length&&completedTasks.length>=tasks.length?"completed":completedTasks.length?"in_progress":"ready";
    const {data:updated,error:updateError}=await db.from("jr_business_daily_plans").update({completed_tasks:completedTasks,status,updated_at:new Date().toISOString()}).eq("id",plan.id).eq("business_id",business.id).select("*").single();
    if(updateError)throw updateError;
    res.json({ok:true,plan:updated});
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
