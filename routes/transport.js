"use strict";
const makeHelpers = require("./helpers");

const MODES = {
  motorbike: { label:"Boda / motorcycle", base:90, km:17, minute:0, min:90, avg:28, commission:0.10, services:["passenger","parcel","business_delivery"] },
  bicycle: { label:"Bicycle courier", base:100, km:12, minute:0, min:100, avg:15, commission:0.10, services:["parcel","business_delivery"] },
  tuk_tuk: { label:"Tuk-tuk", base:150, km:30, minute:0, min:150, avg:20, commission:0.10, services:["passenger","parcel","business_delivery"] },
  car: { label:"Standard car", base:180, km:40, minute:4, min:250, avg:30, commission:0.10, services:["passenger","parcel","business_delivery"] },
  van: { label:"Van", base:500, km:75, minute:0, min:500, avg:35, commission:0.10, services:["parcel","cargo","moving","business_delivery"] },
  pickup: { label:"Pickup", base:500, km:75, minute:0, min:500, avg:32, commission:0.10, services:["cargo","moving","business_delivery"] },
  small_truck: { label:"Small truck", base:1500, km:105, minute:0, min:1500, avg:30, commission:0.10, services:["cargo","moving","business_delivery"] },
  truck: { label:"Truck / lorry", base:2500, km:120, minute:0, min:2500, avg:28, commission:0.10, services:["cargo","moving","business_delivery"] }
};
const TYPES = ["rider","driver","courier","vehicle_owner","fleet_operator"];
const SERVICES = ["passenger","parcel","cargo","moving","business_delivery"];
const CITIES = ["Nairobi","Kiambu","Machakos","Kajiado","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Other"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = function mountTransport(ctx) {
  const { app, db, clean, requireMember, checkRequestRate, logActivity } = ctx;
  const { wrap, bad, requireOwner, notify } = makeHelpers(ctx);

  function fare(mode, km, minutes, extras = {}) {
    const m = MODES[mode];
    const distance = km * m.km;
    const time = minutes * m.minute;
    const load = Math.max(0, Number(extras.load_surcharge || 0));
    const urgency = extras.urgent ? Math.min(250, Math.round(distance * 0.15)) : 0;
    const raw = m.base + distance + time + load + urgency;
    const total = Math.max(m.min, Math.ceil(raw / 5) * 5);
    const commission = Math.round(total * m.commission);
    return {
      mode, label:m.label, estimated_total_ksh:total,
      provider_estimated_earnings_ksh:total-commission,
      jr_service_fee_ksh:commission,
      breakdown:{ base_ksh:m.base, distance_ksh:Math.round(distance), time_ksh:Math.round(time), load_surcharge_ksh:load, urgency_surcharge_ksh:urgency, commission_pct:10 },
      estimated_duration_minutes:Math.max(1,Math.ceil(km/m.avg*60)),
      estimate_only:true
    };
  }

  app.get("/api/transport/config", (req,res) => res.json({
    ok:true, markets:{ initial_live_pilot:"Nairobi", registration_markets:"Kenya and international interest" },
    vehicle_modes:Object.entries(MODES).map(([key,m])=>({key,label:m.label,services:m.services})),
    provider_types:TYPES, service_types:SERVICES, service_areas:CITIES,
    pricing:{currency:"KES",commission_pct:10,commission_status:"proposed_pilot_rate",live_maps:false,live_provider_dispatch:false,payments_enabled:false}
  }));

  app.get("/api/transport/provider", wrap("Transport provider profile", async(req,res)=>{
    const member=await requireMember(req,res); if(!member)return;
    const [{data:provider,error:pErr},{data:vehicles,error:vErr}]=await Promise.all([
      db.from("jr_riders").select("id,member_id,company_name,vehicle_type,vehicle_number,location,online,verified,approved,provider_type,service_types,service_area_city,country_code,has_vehicle,vehicle_owner_member_id,verification_status,licence_status,insurance_status,created_at").eq("member_id",member.id).maybeSingle(),
      db.from("jr_transport_vehicles").select("id,owner_member_id,vehicle_type,make,model,registration_number,capacity_value,capacity_unit,service_area_city,verification_status,active,created_at").eq("owner_member_id",member.id).order("created_at",{ascending:false})
    ]);
    if(pErr)throw pErr;if(vErr)throw vErr;
    let access=[];
    if(provider){const r=await db.from("jr_transport_vehicle_access").select("id,vehicle_id,owner_member_id,driver_member_id,status,requested_at,responded_at").eq("driver_member_id",member.id).order("requested_at",{ascending:false});if(r.error)throw r.error;access=r.data||[];}
    res.json({ok:true,provider:provider||null,vehicles:vehicles||[],vehicle_access:access});
  }));

  app.post("/api/transport/provider", wrap("Transport provider registration", async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const rate=checkRequestRate(req,"transport-provider-register",5,3600000);
    if(!rate.allowed){res.setHeader("Retry-After",String(rate.retryAfter));return bad(res,"Too many registration attempts. Try again later.",429);}
    const provider_type=clean(req.body.provider_type);
    const service_types=Array.isArray(req.body.service_types)?[...new Set(req.body.service_types.map(clean))]:[];
    const service_area_city=clean(req.body.service_area_city);
    const country_code=(clean(req.body.country_code)||"KE").toUpperCase();
    const vehicle_type=clean(req.body.vehicle_type);
    const has_vehicle=req.body.has_vehicle===true;
    const company_name=clean(req.body.company_name).slice(0,100);
    const vehicle_number=clean(req.body.vehicle_number).toUpperCase().slice(0,24);
    const terms=req.body.accept_terms===true;
    if(!TYPES.includes(provider_type))return bad(res,"Choose a valid provider role.");
    if(!service_types.length||service_types.length>5||service_types.some(x=>!SERVICES.includes(x)))return bad(res,"Choose at least one valid service.");
    if(!CITIES.includes(service_area_city))return bad(res,"Choose your main service area.");
    if(!/^[A-Z]{2}$/.test(country_code))return bad(res,"Enter a valid two-letter country code.");
    if(!MODES[vehicle_type])return bad(res,"Choose a vehicle type.");
    if(has_vehicle&&!vehicle_number)return bad(res,"Enter the vehicle registration number.");
    if(!has_vehicle&&provider_type!=="driver"&&provider_type!=="courier")return bad(res,"A vehicle owner or fleet operator must register at least one vehicle.");
    if(!terms)return bad(res,"Accept the provider terms to submit your application.");
    if([company_name,vehicle_number,service_area_city].some(x=>x.length>0&&/(https?:\/\/|@)/i.test(x)))return bad(res,"Enter plain details without links or email addresses.");
    const {data:existing,error:existingError}=await db.from("jr_riders").select("id,verification_status").eq("member_id",member.id).maybeSingle();
    if(existingError)throw existingError;
    if(existing)return bad(res,"You already have a provider profile. Open your provider centre to review it.",409);
    const {data:provider,error}=await db.from("jr_riders").insert({
      member_id:member.id,provider_type,service_types,service_area_city,country_code,
      vehicle_type,vehicle_number:has_vehicle?vehicle_number:null,company_name:company_name||null,
      location:service_area_city,has_vehicle,online:false,verified:false,approved:false,
      verification_status:"pending_review",licence_status:"not_submitted",insurance_status:"not_submitted",
      registration_submitted_at:new Date().toISOString(),terms_accepted_at:new Date().toISOString()
    }).select("id,member_id,provider_type,service_types,service_area_city,country_code,vehicle_type,has_vehicle,verification_status,approved,verified,created_at").single();
    if(error)throw error;
    if(has_vehicle){
      const {error:vErr}=await db.from("jr_transport_vehicles").insert({
        owner_member_id:member.id,vehicle_type,registration_number:vehicle_number,service_area_city,country_code,
        verification_status:"pending_review",active:false
      });
      if(vErr)throw vErr;
    }
    await logActivity(member.id,"TRANSPORT_PROVIDER_APPLIED",{provider_type,service_types,service_area_city});
    res.status(201).json({ok:true,provider,message:"Application submitted. You are registered as pending review, not yet approved to accept real jobs."});
  }));


  app.get("/api/transport/documents",wrap("Transport document list",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const {data:provider,error:pErr}=await db.from("jr_riders").select("id").eq("member_id",member.id).maybeSingle();
    if(pErr)throw pErr;if(!provider)return res.json({ok:true,documents:[]});
    const {data,error}=await db.from("jr_transport_documents").select("id,provider_id,file_vault_id,document_type,status,review_note,created_at,reviewed_at").eq("provider_id",provider.id).order("created_at",{ascending:false});
    if(error)throw error;res.json({ok:true,documents:data||[]});
  }));

  app.post("/api/transport/documents",wrap("Transport secure document link",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const file_vault_id=clean(req.body.file_vault_id),document_type=clean(req.body.document_type);
    if(!UUID.test(file_vault_id)||!["identity","driving_licence","vehicle_logbook","insurance","inspection","business_permit","other"].includes(document_type))return bad(res,"Choose a valid secure file and document type.");
    const {data:provider,error:pErr}=await db.from("jr_riders").select("id").eq("member_id",member.id).maybeSingle();
    if(pErr)throw pErr;if(!provider)return bad(res,"Submit your provider application first.",409);
    const {data:file,error:fErr}=await db.from("file_vault").select("id,member_id,category").eq("id",file_vault_id).eq("member_id",member.id).maybeSingle();
    if(fErr)throw fErr;if(!file)return bad(res,"The secure file was not found in your private vault.",404);
    if(file.category!=="transport")return bad(res,"Upload this document to your private vault using the Transport category.");
    const {data,error}=await db.from("jr_transport_documents").insert({provider_id:provider.id,member_id:member.id,file_vault_id,document_type,status:"pending_review"}).select("id,document_type,status,created_at").single();
    if(error){if(error.code==="23505")return bad(res,"This file is already submitted for this provider.",409);throw error;}
    await logActivity(member.id,"TRANSPORT_DOCUMENT_SUBMITTED",{document_type});
    res.status(201).json({ok:true,document:data,message:"Document uploaded to your private vault and submitted for restricted review."});
  }));

  app.post("/api/transport/vehicles",wrap("Transport vehicle registration",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const vehicle_type=clean(req.body.vehicle_type),registration_number=clean(req.body.registration_number).toUpperCase();
    const service_area_city=clean(req.body.service_area_city),country_code=(clean(req.body.country_code)||"KE").toUpperCase();
    if(!MODES[vehicle_type]||!registration_number||registration_number.length>24||!CITIES.includes(service_area_city)||!/^[A-Z]{2}$/.test(country_code))return bad(res,"Complete the vehicle details.");
    const {data,error}=await db.from("jr_transport_vehicles").insert({
      owner_member_id:member.id,vehicle_type,registration_number,make:clean(req.body.make).slice(0,50),
      model:clean(req.body.model).slice(0,50),service_area_city,country_code,
      capacity_value:req.body.capacity_value?Number(req.body.capacity_value):null,
      capacity_unit:clean(req.body.capacity_unit)||"passengers",verification_status:"pending_review",active:false
    }).select("*").single();
    if(error){if(error.code==="23505")return bad(res,"That vehicle registration is already on JR PHEEF.",409);throw error;}
    await logActivity(member.id,"TRANSPORT_VEHICLE_ADDED",{vehicle_id:data.id});
    res.status(201).json({ok:true,vehicle:data,message:"Vehicle added for verification. It cannot receive jobs until approved."});
  }));

  app.post("/api/transport/vehicles/:id/link-driver",wrap("Transport vehicle link",async(req,res)=>{
    const owner=await requireMember(req,res);if(!owner)return;
    if(!UUID.test(req.params.id)||!UUID.test(clean(req.body.driver_member_id)))return bad(res,"Enter a valid vehicle and JR member ID.");
    const {data:vehicle,error:vErr}=await db.from("jr_transport_vehicles").select("id,owner_member_id,verification_status").eq("id",req.params.id).eq("owner_member_id",owner.id).maybeSingle();
    if(vErr)throw vErr;if(!vehicle)return bad(res,"Vehicle not found.",404);
    if(vehicle.verification_status!=="verified")return bad(res,"The vehicle must be verified before a driver can be linked.",409);
    const {data,error}=await db.from("jr_transport_vehicle_access").upsert({
      vehicle_id:vehicle.id,owner_member_id:owner.id,driver_member_id:req.body.driver_member_id,status:"pending_driver_consent",requested_at:new Date().toISOString()
    },{onConflict:"vehicle_id,driver_member_id"}).select("id,vehicle_id,driver_member_id,status").single();
    if(error)throw error;
    res.status(201).json({ok:true,access:data,message:"Driver invitation sent. The driver must consent before using this vehicle."});
  }));

  app.post("/api/transport/vehicle-access/:id/respond",wrap("Transport vehicle access consent",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    if(!UUID.test(req.params.id))return bad(res,"Invitation not found.",404);
    const accept=req.body.accept===true;
    const {data,error}=await db.from("jr_transport_vehicle_access").update({
      status:accept?"active":"rejected",responded_at:new Date().toISOString()
    }).eq("id",req.params.id).eq("driver_member_id",member.id).eq("status","pending_driver_consent").select("id,vehicle_id,status").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Invitation not found or already answered.",404);
    res.json({ok:true,access:data});
  }));

  app.post("/api/transport/fare-estimate",wrap("Transport fare estimate",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const rate=checkRequestRate(req,"transport-fare-estimate",30,60000);
    if(!rate.allowed){res.setHeader("Retry-After",String(rate.retryAfter));return bad(res,"Please slow down and try again.",429);}
    const service_kind=clean(req.body.service_kind);
    const pickup=clean(req.body.pickup).slice(0,180),destination=clean(req.body.destination).slice(0,180);
    const distance_km=Number(req.body.distance_km),duration_minutes=Number(req.body.duration_minutes);
    const service_area_city=CITIES.includes(clean(req.body.service_area_city))?clean(req.body.service_area_city):"Nairobi";
    const load_surcharge=Math.max(0,Math.min(50000,Number(req.body.load_surcharge||0)));
    if(!SERVICES.includes(service_kind)||pickup.length<3||destination.length<3)return bad(res,"Choose the service and enter pickup and destination.");
    if(!Number.isFinite(distance_km)||distance_km<=0||distance_km>3000||!Number.isInteger(duration_minutes)||duration_minutes<1||duration_minutes>2880)return bad(res,"Enter a valid route distance and estimated duration.");
    if([pickup,destination].some(x=>/(https?:\/\/|@)/i.test(x)))return bad(res,"Enter place names, not links or contact details.");
    const suitable=Object.entries(MODES).filter(([key,m])=>m.services.includes(service_kind));
    const estimates=suitable.map(([key])=>fare(key,distance_km,duration_minutes,{load_surcharge,urgent:req.body.urgent===true}));
    const cheapest=[...estimates].sort((a,b)=>a.estimated_total_ksh-b.estimated_total_ksh)[0];
    const fastest=[...estimates].sort((a,b)=>a.estimated_duration_minutes-b.estimated_duration_minutes||a.estimated_total_ksh-b.estimated_total_ksh)[0];
    const recommended=[...estimates].sort((a,b)=>{
      const score=x=>x.estimated_total_ksh*0.55+x.estimated_duration_minutes*4+(x.mode==="motorbike"?0:10);
      return score(a)-score(b);
    })[0];
    const recommendations=[
      {...cheapest,choice:"cheapest",title:"Cheapest suitable"},
      {...fastest,choice:"fastest",title:"Fastest estimated"},
      {...recommended,choice:"recommended",title:"JR recommends"}
    ].filter((x,i,a)=>a.findIndex(y=>y.mode===x.mode)===i);
    const payload={service_kind,pickup,destination,distance_km,duration_minutes,service_area_city,load_surcharge,urgent:req.body.urgent===true};
    const {data:quote,error}=await db.from("jr_transport_fare_quotes").insert({
      requester_id:member.id,service_kind,pickup,destination,distance_km,duration_minutes,service_area_city,
      details:payload,recommendations,status:"estimate_only"
    }).select("id,service_kind,pickup,destination,distance_km,duration_minutes,service_area_city,recommendations,status,expires_at,created_at").single();
    if(error)throw error;
    res.status(201).json({ok:true,quote,pricing_disclaimer:"Indicative estimate only. Route distance and duration were supplied for this estimate; live map routing, traffic and provider availability are not connected yet.",live_provider_availability:false,recommendations});
  }));

  app.post("/api/transport/book-from-quote",wrap("Transport request",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const quote_id=clean(req.body.quote_id),mode=clean(req.body.mode);
    if(!UUID.test(quote_id)||!MODES[mode])return bad(res,"Select a valid fare quote and transport mode.");
    const {data:quote,error:qErr}=await db.from("jr_transport_fare_quotes").select("*").eq("id",quote_id).eq("requester_id",member.id).eq("status","estimate_only").gt("expires_at",new Date().toISOString()).maybeSingle();
    if(qErr)throw qErr;if(!quote)return bad(res,"This estimate has expired. Please calculate a new one.",409);
    const selected=(quote.recommendations||[]).find(x=>x.mode===mode)||fare(mode,Number(quote.distance_km),Number(quote.duration_minutes),quote.details||{});
    if(!MODES[mode].services.includes(quote.service_kind))return bad(res,"That vehicle is not suitable for this service.");
    const activeCount=await db.from("jr_delivery_requests").select("id",{count:"exact",head:true}).eq("requester_id",member.id).in("status",["open","accepted","picked_up"]);
    if(activeCount.error)throw activeCount.error;if((activeCount.count||0)>=10)return bad(res,"Complete or cancel an existing request before creating another.",409);
    const commission=selected.jr_service_fee_ksh;
    const {data:job,error}=await db.from("jr_delivery_requests").insert({
      requester_id:member.id,pickup:quote.pickup,destination:quote.destination,
      description:quote.service_kind+" request",price:selected.estimated_total_ksh,commission,
      provider_earnings:selected.provider_estimated_earnings_ksh,status:"open",
      service_mode:mode,service_kind:quote.service_kind,quote_id:quote.id,
      distance_km:quote.distance_km,duration_minutes:quote.duration_minutes,
      fare_breakdown:selected.breakdown
    }).select("id,pickup,destination,price,commission,provider_earnings,status,service_mode,service_kind,distance_km,duration_minutes,created_at").single();
    if(error)throw error;
    await db.from("jr_transport_fare_quotes").update({status:"request_submitted"}).eq("id",quote.id);
    await logActivity(member.id,"TRANSPORT_REQUEST_CREATED",{request_id:job.id,service_kind:quote.service_kind,mode,quoted_total:selected.estimated_total_ksh});
    res.status(201).json({ok:true,request:job,message:"Request recorded. It is awaiting a verified and available provider; dispatch is not yet live."});
  }));

  app.get("/api/transport/requests/mine",wrap("Transport requests",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const {data,error}=await db.from("jr_delivery_requests").select("id,requester_id,rider_id,pickup,destination,price,commission,provider_earnings,status,service_mode,service_kind,distance_km,duration_minutes,fare_breakdown,created_at,accepted_at,delivered_at")
      .eq("requester_id",member.id).order("created_at",{ascending:false}).limit(50);
    if(error)throw error;res.json({ok:true,requests:data||[]});
  }));


  app.post("/api/transport/provider/availability",wrap("Transport provider availability",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    if(typeof req.body.online!=="boolean")return bad(res,"Choose whether you want to go online.");
    const {data:provider,error:pErr}=await db.from("jr_riders").select("id,approved,verified,has_vehicle,vehicle_type,service_types").eq("member_id",member.id).maybeSingle();
    if(pErr)throw pErr;if(!provider||!provider.approved||!provider.verified)return bad(res,"Your provider profile must be approved and verified before going online.",403);
    if(req.body.online){
      let modes=[];
      if(provider.has_vehicle){
        const v=await db.from("jr_transport_vehicles").select("vehicle_type").eq("owner_member_id",member.id).eq("verification_status","verified").eq("active",true);
        if(v.error)throw v.error;modes=(v.data||[]).map(x=>x.vehicle_type);
      }else{
        const a=await db.from("jr_transport_vehicle_access").select("vehicle_id").eq("driver_member_id",member.id).eq("status","active");
        if(a.error)throw a.error;
        if(a.data&&a.data.length){const v=await db.from("jr_transport_vehicles").select("vehicle_type").in("id",a.data.map(x=>x.vehicle_id)).eq("verification_status","verified").eq("active",true);if(v.error)throw v.error;modes=(v.data||[]).map(x=>x.vehicle_type);}
      }
      if(!modes.length)return bad(res,"No verified active vehicle is linked to your provider profile.",409);
    }
    const {data,error}=await db.from("jr_riders").update({online:req.body.online,updated_at:new Date().toISOString()}).eq("id",provider.id).select("id,online,approved,verified").single();
    if(error)throw error;res.json({ok:true,provider:data});
  }));

  app.get("/api/transport/provider/jobs",wrap("Transport provider jobs",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    const {data:provider,error:pErr}=await db.from("jr_riders").select("id,approved,verified,online,has_vehicle,vehicle_type,service_types").eq("member_id",member.id).maybeSingle();
    if(pErr)throw pErr;if(!provider||!provider.approved||!provider.verified)return bad(res,"Provider approval is required.",403);
    if(!provider.online)return res.json({ok:true,jobs:[],earnings:{completed_jobs:0,total_ksh:0},message:"Go online to see suitable open requests."});
    let modes=[];
    if(provider.has_vehicle){
      const v=await db.from("jr_transport_vehicles").select("vehicle_type").eq("owner_member_id",member.id).eq("verification_status","verified").eq("active",true);
      if(v.error)throw v.error;modes=(v.data||[]).map(x=>x.vehicle_type);
    }else{
      const a=await db.from("jr_transport_vehicle_access").select("vehicle_id").eq("driver_member_id",member.id).eq("status","active");
      if(a.error)throw a.error;
      if(a.data&&a.data.length){const v=await db.from("jr_transport_vehicles").select("vehicle_type").in("id",a.data.map(x=>x.vehicle_id)).eq("verification_status","verified").eq("active",true);if(v.error)throw v.error;modes=(v.data||[]).map(x=>x.vehicle_type);}
    }
    const serviceTypes=provider.service_types||[];
    const {data:jobs,error}=await db.from("jr_delivery_requests").select("id,pickup,destination,description,price,provider_earnings,service_mode,service_kind,distance_km,duration_minutes,created_at")
      .eq("status","open").in("service_mode",modes).in("service_kind",serviceTypes).neq("requester_id",member.id).order("created_at",{ascending:false}).limit(50);
    if(error)throw error;
    const completed=await db.from("jr_delivery_requests").select("provider_earnings").eq("rider_id",member.id).eq("status","delivered");
    if(completed.error)throw completed.error;
    const total=(completed.data||[]).reduce((sum,x)=>sum+Number(x.provider_earnings||0),0);
    res.json({ok:true,jobs:jobs||[],earnings:{completed_jobs:(completed.data||[]).length,total_ksh:total}});
  }));

  app.post("/api/transport/provider/jobs/:id/accept",wrap("Transport job accept",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    if(!UUID.test(req.params.id))return bad(res,"Request not found.",404);
    const {data:provider,error:pErr}=await db.from("jr_riders").select("id,approved,verified,online,has_vehicle,vehicle_type,service_types").eq("member_id",member.id).maybeSingle();
    if(pErr)throw pErr;if(!provider||!provider.approved||!provider.verified||!provider.online)return bad(res,"Your verified provider profile must be online to accept a job.",403);
    const {data:job,error:jErr}=await db.from("jr_delivery_requests").select("id,requester_id,service_mode,service_kind,status").eq("id",req.params.id).maybeSingle();
    if(jErr)throw jErr;if(!job||job.status!=="open")return bad(res,"This request is no longer available.",409);
    if(!(provider.service_types||[]).includes(job.service_kind))return bad(res,"This job does not match your registered service.");
    let modes=[];
    if(provider.has_vehicle){
      const v=await db.from("jr_transport_vehicles").select("vehicle_type").eq("owner_member_id",member.id).eq("verification_status","verified").eq("active",true);
      if(v.error)throw v.error;modes=(v.data||[]).map(x=>x.vehicle_type);
    }else{
      const a=await db.from("jr_transport_vehicle_access").select("vehicle_id").eq("driver_member_id",member.id).eq("status","active");
      if(a.error)throw a.error;
      if(a.data&&a.data.length){const v=await db.from("jr_transport_vehicles").select("vehicle_type").in("id",a.data.map(x=>x.vehicle_id)).eq("verification_status","verified").eq("active",true);if(v.error)throw v.error;modes=(v.data||[]).map(x=>x.vehicle_type);}
    }
    if(!modes.includes(job.service_mode))return bad(res,"No verified vehicle linked to you is suitable for this job.",403);
    const {count}=await db.from("jr_delivery_requests").select("id",{count:"exact",head:true}).eq("rider_id",member.id).in("status",["accepted","picked_up"]);
    if((count||0)>=3)return bad(res,"Finish your current jobs before accepting more.",409);
    const {data,error}=await db.from("jr_delivery_requests").update({rider_id:member.id,status:"accepted",accepted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",job.id).eq("status","open").is("rider_id",null).select("id,status,service_mode,service_kind,price,provider_earnings").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Another provider already accepted this request.",409);
    await notify(job.requester_id,"Provider found","A verified JR PHEEF provider accepted your request.","delivery");
    await logActivity(member.id,"TRANSPORT_JOB_ACCEPTED",{request_id:job.id});
    res.json({ok:true,request:data});
  }));

  app.post("/api/transport/provider/jobs/:id/status",wrap("Transport job status",async(req,res)=>{
    const member=await requireMember(req,res);if(!member)return;
    if(!UUID.test(req.params.id))return bad(res,"Request not found.",404);
    const next=clean(req.body.status),from=next==="picked_up"?"accepted":next==="delivered"?"picked_up":null;
    if(!from)return bad(res,"Choose picked_up or delivered.");
    const patch={status:next,updated_at:new Date().toISOString()};if(next==="delivered")patch.delivered_at=new Date().toISOString();
    const {data,error}=await db.from("jr_delivery_requests").update(patch).eq("id",req.params.id).eq("rider_id",member.id).eq("status",from).select("id,status,provider_earnings").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Only the assigned provider can move this job to that stage.",403);
    res.json({ok:true,request:data});
  }));

  app.get("/api/transport/admin/providers",wrap("Transport provider review queue",async(req,res)=>{
    const owner=await requireOwner(req,res);if(!owner)return;
    const status=clean(req.query.status)||"pending_review";
    let query=db.from("jr_riders").select("id,member_id,provider_type,service_types,service_area_city,country_code,vehicle_type,vehicle_number,company_name,has_vehicle,verification_status,licence_status,insurance_status,approved,verified,created_at").order("created_at",{ascending:false}).limit(100);
    if(status!=="all")query=query.eq("verification_status",status);
    const {data,error}=await query;if(error)throw error;
    const ids=(data||[]).map(x=>x.member_id);
    let members=[];
    if(ids.length){const r=await db.from("members").select("id,full_name,phone,email").in("id",ids);if(r.error)throw r.error;members=r.data||[];}
    const byId=Object.fromEntries(members.map(x=>[x.id,x]));
    const vr=ids.length?await db.from("jr_transport_vehicles").select("id,owner_member_id,vehicle_type,registration_number,service_area_city,verification_status,active").in("owner_member_id",ids):{data:[],error:null};
    if(vr.error)throw vr.error;
    const vehiclesByOwner={};for(const v of (vr.data||[])){(vehiclesByOwner[v.owner_member_id]||(vehiclesByOwner[v.owner_member_id]=[])).push(v);}
    res.json({ok:true,providers:(data||[]).map(x=>({...x,member:byId[x.member_id]||null,vehicles:vehiclesByOwner[x.member_id]||[]}))});
  }));


  app.get("/api/transport/admin/documents",wrap("Transport document review queue",async(req,res)=>{
    const owner=await requireOwner(req,res);if(!owner)return;
    const {data,error}=await db.from("jr_transport_documents").select("id,provider_id,member_id,file_vault_id,document_type,status,created_at").eq("status","pending_review").order("created_at",{ascending:false}).limit(100);
    if(error)throw error;
    const providerIds=[...new Set((data||[]).map(x=>x.provider_id))],fileIds=[...new Set((data||[]).map(x=>x.file_vault_id))];
    const [pr,fr]=await Promise.all([
      providerIds.length?db.from("jr_riders").select("id,provider_type,service_area_city").in("id",providerIds):Promise.resolve({data:[],error:null}),
      fileIds.length?db.from("file_vault").select("id,file_name,mime_type,size_bytes,member_id").in("id",fileIds):Promise.resolve({data:[],error:null})
    ]);
    if(pr.error)throw pr.error;if(fr.error)throw fr.error;
    const providers=Object.fromEntries((pr.data||[]).map(x=>[x.id,x])),files=Object.fromEntries((fr.data||[]).map(x=>[x.id,x]));
    res.json({ok:true,documents:(data||[]).map(x=>({...x,provider:providers[x.provider_id]||null,file:files[x.file_vault_id]||null}))});
  }));

  app.patch("/api/transport/admin/documents/:id",wrap("Transport document review",async(req,res)=>{
    const owner=await requireOwner(req,res);if(!owner)return;
    if(!UUID.test(req.params.id))return bad(res,"Document not found.",404);
    const status=clean(req.body.status);
    if(!["verified","rejected","expired"].includes(status))return bad(res,"Choose a valid document review result.");
    const {data,error}=await db.from("jr_transport_documents").update({status,reviewed_by:owner.id,review_note:clean(req.body.review_note).slice(0,1000)||null,reviewed_at:new Date().toISOString()}).eq("id",req.params.id).eq("status","pending_review").select("id,provider_id,document_type,status").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Document not found or already reviewed.",404);
    await logActivity(owner.id,"TRANSPORT_DOCUMENT_REVIEWED",{document_id:data.id,status});
    res.json({ok:true,document:data});
  }));

  app.patch("/api/transport/admin/providers/:id",wrap("Transport provider review",async(req,res)=>{
    const owner=await requireOwner(req,res);if(!owner)return;
    if(!UUID.test(req.params.id))return bad(res,"Provider application not found.",404);
    const next=clean(req.body.verification_status);
    if(!["approved","rejected","more_info_required","suspended"].includes(next))return bad(res,"Choose a valid review outcome.");
    const verified=next==="approved";
    const {data:providerRow,error:providerError}=await db.from("jr_riders").select("member_id,has_vehicle").eq("id",req.params.id).maybeSingle();
    if(providerError)throw providerError;if(!providerRow)return bad(res,"Provider application not found.",404);
    let requiredDocs=["identity","driving_licence"];
    if(providerRow.has_vehicle)requiredDocs=requiredDocs.concat(["vehicle_logbook","insurance"]);
    if(verified){const docs=await db.from("jr_transport_documents").select("document_type,status").eq("provider_id",req.params.id).eq("status","verified");if(docs.error)throw docs.error;const valid=new Set((docs.data||[]).map(x=>x.document_type));const missing=requiredDocs.filter(x=>!valid.has(x));if(missing.length)return bad(res,"Required documents have not been verified: "+missing.join(", "),409);}
    const patch={verification_status:next,verified,approved:verified,online:false,licence_status:verified?"verified":"pending_review",insurance_status:verified&&providerRow.has_vehicle?"verified":"pending_review",updated_at:new Date().toISOString()};
    if(req.body.licence_status!==undefined){const x=clean(req.body.licence_status);if(!["pending_review","verified","rejected","not_required"].includes(x))return bad(res,"Invalid licence status.");patch.licence_status=x;}
    if(req.body.insurance_status!==undefined){const x=clean(req.body.insurance_status);if(!["pending_review","verified","rejected","not_required"].includes(x))return bad(res,"Invalid insurance status.");patch.insurance_status=x;}
    const {data,error}=await db.from("jr_riders").update(patch).eq("id",req.params.id).select("id,member_id,verification_status,verified,approved,licence_status,insurance_status").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Provider application not found.",404);
    if(!verified)await db.from("jr_transport_vehicles").update({active:false}).eq("owner_member_id",data.member_id);
    await notify(data.member_id,verified?"Transport provider approved":"Transport application update",verified?"Your provider profile has passed JR PHEEF's platform review. Service-specific legal licences and insurance must still be valid before operating.": "Your transport application needs attention. Please check your provider centre.", "delivery");
    await logActivity(owner.id,"TRANSPORT_PROVIDER_REVIEWED",{provider_id:data.id,verification_status:next});
    res.json({ok:true,provider:data});
  }));

  app.patch("/api/transport/admin/vehicles/:id",wrap("Transport vehicle review",async(req,res)=>{
    const owner=await requireOwner(req,res);if(!owner)return;
    if(!UUID.test(req.params.id))return bad(res,"Vehicle not found.",404);
    const verification_status=clean(req.body.verification_status);
    if(!["verified","rejected","suspended"].includes(verification_status))return bad(res,"Choose a valid vehicle review status.");
    const {data,error}=await db.from("jr_transport_vehicles").update({verification_status,active:verification_status==="verified",updated_at:new Date().toISOString()}).eq("id",req.params.id).select("*").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Vehicle not found.",404);
    res.json({ok:true,vehicle:data});
  }));
};
