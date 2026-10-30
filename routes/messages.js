// JR PHEEF Connect: authenticated private and group text messaging.
module.exports = function mountMessages({ app, db, requireMember, checkRequestRate, clean }) {
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const fail=(res,error,status=400)=>res.status(status).json({ok:false,error});
  const wrap=(fn)=>async(req,res)=>{try{await fn(req,res);}catch(e){console.error("JR Connect:",clean(e?.message).slice(0,180));if(!res.headersSent)fail(res,"Messaging is temporarily unavailable.",500);}};
  async function member(req,res){return await requireMember(req,res);}
  async function conversation(id,userId){
    if(!UUID.test(id))return null;
    const {data:part,error}=await db.from("jr_conversation_participants").select("conversation_id").eq("conversation_id",id).eq("member_id",userId).maybeSingle();
    if(error)throw error;if(!part)return null;
    const {data,error:e}=await db.from("jr_conversations").select("id,title,is_group,updated_at,created_at").eq("id",id).maybeSingle();
    if(e)throw e;return data||null;
  }
  // Authenticated server-sent updates. Browser clients never receive database credentials.
  app.get("/api/messages/stream",async(req,res)=>{
    const m=await member(req,res);if(!m)return;
    res.setHeader("Content-Type","text/event-stream");
    res.setHeader("Cache-Control","no-cache, no-transform");
    res.setHeader("Connection","keep-alive");
    res.flushHeaders?.();
    let closed=false, last="";
    const send=(event,data)=>{if(!closed)res.write("event: "+event+"\\ndata: "+JSON.stringify(data)+"\\n\\n");};
    const tick=async()=>{
      try{
        const {data:parts,error}=await db.from("jr_conversation_participants").select("conversation_id").eq("member_id",m.id).limit(200);
        if(error)throw error;
        const ids=(parts||[]).map(x=>x.conversation_id);
        if(!ids.length){if(last!=="none"){last="none";send("refresh",{reason:"conversations"});}return;}
        const {data:rooms,error:e}=await db.from("jr_conversations").select("id,updated_at").in("id",ids).order("updated_at",{ascending:false}).limit(200);
        if(e)throw e;
        const stamp=(rooms||[]).map(x=>x.id+":"+x.updated_at).join("|");
        if(last&&stamp!==last)send("refresh",{reason:"messages"});
        last=stamp;
      }catch(e){console.error("JR Connect stream:",clean(e?.message||"stream error").slice(0,160));}
    };
    send("ready",{ok:true});
    await tick();
    const timer=setInterval(tick,3000);
    const heartbeat=setInterval(()=>send("ping",{at:Date.now()}),20000);
    req.on("close",()=>{closed=true;clearInterval(timer);clearInterval(heartbeat);});
  });
  app.get("/api/messages/conversations",wrap(async(req,res)=>{
    const m=await member(req,res);if(!m)return;
    const {data:parts,error}=await db.from("jr_conversation_participants").select("conversation_id,last_read_at").eq("member_id",m.id).limit(200);
    if(error)throw error;
    const ids=(parts||[]).map(x=>x.conversation_id);if(!ids.length)return res.json({ok:true,conversations:[]});
    const [{data:rooms,error:e1},{data:allParts,error:e2}]=await Promise.all([
      db.from("jr_conversations").select("id,title,is_group,updated_at").in("id",ids).order("updated_at",{ascending:false}).limit(100),
      db.from("jr_conversation_participants").select("conversation_id,member_id").in("conversation_id",ids)
    ]);
    if(e1||e2)throw e1||e2;
    const others=[...new Set((allParts||[]).filter(p=>String(p.member_id)!==String(m.id)).map(p=>p.member_id))];
    const {data:people,error:e3}=others.length?await db.from("members").select("id,jp_number,full_name,profile_visibility").in("id",others):{data:[],error:null};
    if(e3)throw e3;
    const names=new Map((people||[]).map(p=>[p.id,p.profile_visibility==="private"?"JR PHEEF Member":(p.full_name||p.jp_number||"Member")]));
    res.json({ok:true,conversations:(rooms||[]).map(r=>({...r,participants:(allParts||[]).filter(p=>p.conversation_id===r.id).map(p=>({id:p.member_id,name:String(p.member_id)===String(m.id)?"You":names.get(p.member_id)||"Member"}))}))});
  }));
  app.post("/api/messages/conversations",wrap(async(req,res)=>{
    const m=await member(req,res);if(!m)return;
    const rate=checkRequestRate(req,"connect-create",20,3600000);if(!rate.allowed){res.setHeader("Retry-After",String(rate.retryAfter));return fail(res,"Too many new conversations. Try again later.",429);}
    const raw=Array.isArray(req.body.member_jp_numbers)?req.body.member_jp_numbers:[req.body.member_jp_number];
    const numbers=[...new Set(raw.map(x=>clean(typeof x==="string"?x:"").toUpperCase()).filter(Boolean))].slice(0,30);
    if(!numbers.length)return fail(res,"Enter at least one member JP number.");
    const {data:found,error}=await db.from("members").select("id,jp_number,status").in("jp_number",numbers);
    if(error)throw error;
    const recipients=(found||[]).filter(x=>String(x.id)!==String(m.id)&&!["blocked","suspended","disabled"].includes(String(x.status||"").toLowerCase()));
    if(recipients.length!==numbers.length)return fail(res,"One or more JP numbers could not be matched to active members.",404);
    if(recipients.length===1){
      const {data:mine,error:e1}=await db.from("jr_conversation_participants").select("conversation_id").eq("member_id",m.id);
      if(e1)throw e1;
      const ids=(mine||[]).map(x=>x.conversation_id);
      if(ids.length){const {data:matches,error:e2}=await db.from("jr_conversation_participants").select("conversation_id").eq("member_id",recipients[0].id).in("conversation_id",ids);if(e2)throw e2;
        for(const x of matches||[]){const c=await conversation(x.conversation_id,m.id);if(!c||c.is_group)continue;const {count,error:e3}=await db.from("jr_conversation_participants").select("member_id",{count:"exact",head:true}).eq("conversation_id",c.id);if(e3)throw e3;if(count===2)return res.json({ok:true,conversation:c,already_exists:true});}
      }
    }
    const isGroup=recipients.length>1;
    const title=clean(req.body.title || "").slice(0,80);
    if(isGroup&&!title)return fail(res,"Give your group a name.");
    const {data:room,error:ce}=await db.from("jr_conversations").insert({created_by:m.id,title:isGroup?title:null,is_group:isGroup}).select("id,title,is_group,updated_at").single();
    if(ce)throw ce;
    const rows=[m.id,...recipients.map(x=>x.id)].map(member_id=>({conversation_id:room.id,member_id}));
    const {error:pe}=await db.from("jr_conversation_participants").insert(rows);if(pe)throw pe;
    res.status(201).json({ok:true,conversation:room});
  }));
  app.get("/api/messages/conversations/:id",wrap(async(req,res)=>{
    const m=await member(req,res);if(!m)return;
    const room=await conversation(req.params.id,m.id);if(!room)return fail(res,"Conversation not found.",404);
    const [{data:msgs,error:me},{data:parts,error:pe}]=await Promise.all([
      db.from("jr_messages").select("id,sender_id,body,created_at").eq("conversation_id",room.id).order("created_at",{ascending:true}).limit(300),
      db.from("jr_conversation_participants").select("member_id").eq("conversation_id",room.id)
    ]);
    if(me||pe)throw me||pe;
    const ids=(parts||[]).map(x=>x.member_id);
    const {data:people,error:e}=await db.from("members").select("id,jp_number,full_name,profile_visibility").in("id",ids);if(e)throw e;
    const names=new Map((people||[]).map(p=>[p.id,p.profile_visibility==="private"?"JR PHEEF Member":(p.full_name||p.jp_number||"Member")]));
    await db.from("jr_conversation_participants").update({last_read_at:new Date().toISOString()}).eq("conversation_id",room.id).eq("member_id",m.id);
    res.json({ok:true,conversation:room,participants:ids.map(id=>({id,name:String(id)===String(m.id)?"You":names.get(id)||"Member"})),messages:(msgs||[]).map(x=>({...x,sender_name:String(x.sender_id)===String(m.id)?"You":names.get(x.sender_id)||"Member"}))});
  }));
  app.post("/api/messages/conversations/:id",wrap(async(req,res)=>{
    const m=await member(req,res);if(!m)return;
    const rate=checkRequestRate(req,"connect-send",60,60000);if(!rate.allowed){res.setHeader("Retry-After",String(rate.retryAfter));return fail(res,"You're sending messages too quickly.",429);}
    const room=await conversation(req.params.id,m.id);if(!room)return fail(res,"Conversation not found.",404);
    const body=clean(typeof req.body.body==="string"?req.body.body:"");if(!body||body.length>4000)return fail(res,"Messages must contain 1–4000 characters.");
    const {data:parts,error:pe}=await db.from("jr_conversation_participants").select("member_id").eq("conversation_id",room.id);if(pe)throw pe;
    const ids=(parts||[]).map(x=>x.member_id).filter(id=>String(id)!==String(m.id));
    if(!ids.length)return fail(res,"There are no other participants in this conversation.",409);
    const {data,error}=await db.from("jr_messages").insert({conversation_id:room.id,sender_id:m.id,body}).select("id,sender_id,body,created_at").single();if(error)throw error;
    await db.from("jr_conversations").update({updated_at:new Date().toISOString()}).eq("id",room.id);
    res.status(201).json({ok:true,message:{...data,sender_name:"You"}});
  }));
};
