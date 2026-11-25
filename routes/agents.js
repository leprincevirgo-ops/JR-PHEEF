"use strict";

// JR AGENT UNIVERSE — user-scoped agent registry and permissioned orchestration.
// External agents are metadata-only until an explicitly reviewed adapter is installed.
// This module never executes arbitrary agent URLs, code, prompts, or credentials.
module.exports = function mountAgentUniverse(ctx) {
  const { app, db, clean, requireMember, logActivity } = ctx;
  const wrap = (name, fn) => async (req,res) => {
    try { await fn(req,res); }
    catch (e) { console.error(name + ":", clean(e && e.message).slice(0,180)); if(!res.headersSent)res.status(500).json({ok:false,error:"Agent service temporarily unavailable."}); }
  };
  const bad = (res,error,status=400) => res.status(status).json({ok:false,error});
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const TYPES = new Set(["external","jr_managed","human","workflow"]);
  const STATUSES = new Set(["active","paused","disabled"]);
  const CAPABILITIES = new Set(["read_public_data","read_member_data","draft_content","analyze_data","send_message","modify_records","make_purchase","move_money","control_device"]);
  const safeAgent = a => ({
    id:a.id,name:a.name,description:a.description,provider:a.provider,agent_type:a.agent_type,
    endpoint_domain:a.endpoint_domain,capabilities:a.capabilities,status:a.status,
    trust_status:a.trust_status,created_at:a.created_at,updated_at:a.updated_at
  });
  const getOwned = async (memberId,id) => {
    if(!UUID.test(id)) return null;
    const {data,error}=await db.from("jr_agents").select("*").eq("id",id).eq("member_id",memberId).maybeSingle();
    if(error)throw error; return data;
  };

  app.get("/api/agents",wrap("Agent registry list",async(req,res)=>{
    const m=await requireMember(req,res);if(!m)return;
    const {data,error}=await db.from("jr_agents").select("id,name,description,provider,agent_type,endpoint_domain,capabilities,status,trust_status,created_at,updated_at").eq("member_id",m.id).order("updated_at",{ascending:false}).limit(200);
    if(error)throw error;
    res.json({ok:true,agents:data||[],governance:{mode:"permissioned",external_execution:"disabled_until_adapter_review",high_impact_approval_required:true}});
  }));

  app.post("/api/agents",wrap("Agent register",async(req,res)=>{
    const m=await requireMember(req,res);if(!m)return;
    const name=clean(req.body.name).slice(0,100),description=clean(req.body.description).slice(0,1000);
    const provider=clean(req.body.provider).slice(0,100),type=clean(req.body.agent_type||"external");
    const url=clean(req.body.endpoint_url);
    if(name.length<2||!TYPES.has(type))return bad(res,"Provide an agent name and supported agent type.");
    let domain=null;
    if(url){try{const u=new URL(url);if(u.protocol!=="https:"||u.username||u.password||u.port)return bad(res,"Agent endpoints must use HTTPS without embedded credentials or custom ports.");domain=u.hostname.toLowerCase();}catch{return bad(res,"Enter a valid HTTPS endpoint.");}}
    const requested=Array.isArray(req.body.capabilities)?[...new Set(req.body.capabilities.map(x=>clean(x)))]:[];
    if(requested.length>10||requested.some(x=>!CAPABILITIES.has(x)))return bad(res,"One or more requested capabilities are unsupported.");
    const {data,error}=await db.from("jr_agents").insert({
      member_id:m.id,name,description,provider:provider||null,agent_type:type,endpoint_domain:domain,
      capabilities:requested,status:"paused",trust_status:"unverified"
    }).select("id,name,description,provider,agent_type,endpoint_domain,capabilities,status,trust_status,created_at,updated_at").single();
    if(error)throw error;
    await logActivity(m.id,"AGENT_REGISTERED",{agent_id:data.id,agent_type:type});
    res.status(201).json({ok:true,agent:data,note:"Registered in your private directory. The agent is paused and cannot execute tasks until reviewed and explicitly enabled."});
  }));

  app.patch("/api/agents/:id",wrap("Agent update",async(req,res)=>{
    const m=await requireMember(req,res);if(!m)return;
    const current=await getOwned(m.id,req.params.id);if(!current)return bad(res,"Agent not found.",404);
    const patch={updated_at:new Date().toISOString()};
    if(req.body.status!==undefined){const v=clean(req.body.status);if(!STATUSES.has(v))return bad(res,"Invalid agent status.");patch.status=v;}
    if(req.body.description!==undefined)patch.description=clean(req.body.description).slice(0,1000);
    if(req.body.name!==undefined){const v=clean(req.body.name).slice(0,100);if(v.length<2)return bad(res,"Agent name is too short.");patch.name=v;}
    if(req.body.capabilities!==undefined){
      if(!Array.isArray(req.body.capabilities)||req.body.capabilities.length>10)return bad(res,"Invalid capabilities.");
      const caps=[...new Set(req.body.capabilities.map(x=>clean(x)))];if(caps.some(x=>!CAPABILITIES.has(x)))return bad(res,"Unsupported capability.");
      patch.capabilities=caps;
    }
    const {data,error}=await db.from("jr_agents").update(patch).eq("id",current.id).eq("member_id",m.id).select("id,name,description,provider,agent_type,endpoint_domain,capabilities,status,trust_status,created_at,updated_at").single();
    if(error)throw error;
    await logActivity(m.id,"AGENT_UPDATED",{agent_id:data.id,status:data.status});
    res.json({ok:true,agent:data});
  }));

  app.post("/api/agents/:id/tasks",wrap("Agent task proposal",async(req,res)=>{
    const m=await requireMember(req,res);if(!m)return;
    const agent=await getOwned(m.id,req.params.id);if(!agent)return bad(res,"Agent not found.",404);
    if(agent.status!=="active")return bad(res,"Enable the agent before proposing a task.",409);
    const task=clean(req.body.task).slice(0,2000);
    const capability=clean(req.body.capability);
    if(task.length<3||!CAPABILITIES.has(capability))return bad(res,"Provide a task and one supported capability.");
    if(!(agent.capabilities||[]).includes(capability))return bad(res,"This agent has not been granted that capability.",403);
    const highImpact=["send_message","modify_records","make_purchase","move_money","control_device"].includes(capability);
    const {data,error}=await db.from("jr_agent_runs").insert({
      member_id:m.id,agent_id:agent.id,task,capability,status:"awaiting_approval",
      risk:highImpact?"high":"standard",approval_required:true
    }).select("id,agent_id,task,capability,status,risk,approval_required,created_at").single();
    if(error)throw error;
    await logActivity(m.id,"AGENT_TASK_PROPOSED",{agent_id:agent.id,run_id:data.id,capability,risk:data.risk});
    res.status(201).json({ok:true,run:data,note:"Proposal recorded only. No external agent has been invoked and no action has been executed."});
  }));

  app.post("/api/agents/runs/:runId/decision",wrap("Agent task decision",async(req,res)=>{
    const m=await requireMember(req,res);if(!m)return;
    if(!UUID.test(req.params.runId))return bad(res,"Task proposal not found.",404);
    const decision=clean(req.body.decision);
    if(!["approve","reject"].includes(decision))return bad(res,"Choose approve or reject.");
    const {data:run,error:readError}=await db.from("jr_agent_runs").select("id,agent_id,status,capability").eq("id",req.params.runId).eq("member_id",m.id).maybeSingle();
    if(readError)throw readError;if(!run)return bad(res,"Task proposal not found.",404);
    if(run.status!=="awaiting_approval")return bad(res,"This proposal has already been decided.",409);
    // Approval records consent; it does NOT invoke a provider. Execution remains disabled
    // until a reviewed adapter with scoped credentials, timeouts and audit hooks exists.
    const next=decision==="approve"?"approved_not_executed":"rejected";
    const {data,error}=await db.from("jr_agent_runs").update({status:next,decided_at:new Date().toISOString()}).eq("id",run.id).eq("member_id",m.id).eq("status","awaiting_approval").select("id,status,decided_at").maybeSingle();
    if(error)throw error;if(!data)return bad(res,"Proposal changed; refresh and try again.",409);
    await logActivity(m.id,"AGENT_TASK_DECISION",{run_id:run.id,decision,status:next});
    res.json({ok:true,run:data,note:decision==="approve"?"Approval recorded. Execution is not enabled in this release.":"Proposal rejected; nothing was executed."});
  }));

  app.get("/api/agents/activity",wrap("Agent activity",async(req,res)=>{
    const m=await requireMember(req,res);if(!m)return;
    const {data,error}=await db.from("jr_agent_runs").select("id,agent_id,task,capability,status,risk,approval_required,created_at,decided_at").eq("member_id",m.id).order("created_at",{ascending:false}).limit(100);
    if(error)throw error;res.json({ok:true,runs:data||[]});
  }));
};
