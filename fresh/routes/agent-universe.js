"use strict";
const dns=require("node:dns").promises;
const https=require("node:https");
const net=require("node:net");
const crypto=require("node:crypto");

module.exports=function mountAgentUniverse(app,deps){
 const {currentUser,provisionMember,sameOrigin,rateLimit,supabaseUrl,supabaseKey}=deps;
 const types=new Set(["external","jr_managed","human","workflow"]);
 const protocols=new Set(["mcp","a2a","openai_compatible","https_api","webhook","human","manual"]);
 const caps=new Set(["read_public_data","read_member_data","draft_content","analyze_data","send_message","modify_records","make_purchase","move_money","control_device"]);
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const clean=(v,n=2000)=>String(v??"").trim().slice(0,n);
 const agentFields="id,name,description,provider,agent_type,protocol,endpoint_domain,endpoint_url,agent_card_url,capabilities,status,trust_status,connection_status,mcp_protocol_version,mcp_tools,a2a_skills,a2a_protocol_version,last_checked_at,last_error,created_at,updated_at";
 const privateAgentFields=agentFields+",mcp_session_id,encrypted_credentials";
 const runFields="id,agent_id,task,capability,status,risk,approval_required,tool_name,tool_arguments,execution_state,execution_result,a2a_task_id,created_at,decided_at,execution_started_at,completed_at";

 function vaultKey(){const raw=String(process.env.JR_AGENT_VAULT_KEY||"");const key=Buffer.from(raw,"base64");if(key.length!==32)throw new Error("Agent credential vault is not configured.");return key;}
 function encryptCredentials(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",vaultKey(),iv);const body=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);return [iv.toString("base64"),cipher.getAuthTag().toString("base64"),body.toString("base64")].join(".");}
 function decryptCredentials(value){if(!value)return {};const parts=String(value).split(".");if(parts.length!==3)throw new Error("Stored agent credential is invalid.");const iv=Buffer.from(parts[0],"base64"),tag=Buffer.from(parts[1],"base64"),body=Buffer.from(parts[2],"base64");if(iv.length!==12||tag.length!==16)throw new Error("Stored agent credential is invalid.");const decipher=crypto.createDecipheriv("aes-256-gcm",vaultKey(),iv);decipher.setAuthTag(tag);return JSON.parse(Buffer.concat([decipher.update(body),decipher.final()]).toString("utf8"));}
 function authHeaders(credentials){const token=clean(credentials?.bearerToken,4096);return token?{Authorization:"Bearer "+token}:{};}
 async function auth(req,res){
  const user=await currentUser(req,res);
  if(!user||!user.email_confirmed_at||!req.jrAccessToken){res.status(401).json({ok:false,error:"Sign in with a verified JR PHEEF account."});return null;}
  const member=await provisionMember(req.jrAccessToken);
  if(!member?.id){res.status(403).json({ok:false,error:"Your member profile is not ready."});return null;}
  return {user,member,token:req.jrAccessToken};
 }
 async function db(token,table,method="GET",query="",body){
  const r=await fetch(supabaseUrl+"/rest/v1/"+table+(query?"?"+query:""),{
   method,headers:{apikey:supabaseKey,Authorization:"Bearer "+token,"Content-Type":"application/json",Prefer:"return=representation"},
   body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)
  });
  return {ok:r.ok,status:r.status,data:await r.json().catch(()=>[])};
 }
 function fail(res,r,msg){
  const detail=Array.isArray(r.data)?r.data[0]?.message:r.data?.message;
  return res.status(r.status||502).json({ok:false,error:msg,detail:detail?String(detail).slice(0,180):undefined});
 }
 async function ownedAgent(token,memberId,id){
  if(!uuid.test(id))return null;
  const r=await db(token,"jr_agents","GET","select="+privateAgentFields+"&id=eq."+id+"&member_id=eq."+memberId+"&limit=1");
  if(!r.ok)throw new Error("Could not load the agent record.");
  return r.data[0]||null;
 }

 function publicIp(ip){
  if(net.isIP(ip)===4){
   const a=ip.split(".").map(Number),x=a[0],y=a[1];
   return !(x===0||x===10||x===127||x>=224||x===169&&y===254||x===172&&y>=16&&y<=31||x===192&&y===168||x===100&&y>=64&&y<=127||x===192&&y===0||x===192&&y===2||x===198&&(y===18||y===19||y===51)||x===203&&y===0&&a[2]===113);
  }
  if(net.isIP(ip)===6){
   const x=ip.toLowerCase();
   return !(x==="::"||x==="::1"||x.startsWith("fc")||x.startsWith("fd")||x.startsWith("fe8")||x.startsWith("fe9")||x.startsWith("fea")||x.startsWith("feb")||x.startsWith("ff")||x.startsWith("::ffff:")||x.startsWith("2001:db8:"));
  }
  return false;
 }
 async function publicHost(host){
  if(net.isIP(host)||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local"))throw new Error("Private and literal IP addresses are not accepted.");
  const records=await dns.lookup(host,{all:true,verbatim:true});
  if(!records.length||records.some(x=>!publicIp(x.address)))throw new Error("The service host must resolve only to public IP addresses.");
  return records[0];
 }
 function responseJson(contentType,body){
  if(!body.trim())return null;
  if(String(contentType||"").includes("text/event-stream")){
   const events=body.split(/\r?\n\r?\n/);
   for(let i=events.length-1;i>=0;i--){
    const data=events[i].split(/\r?\n/).filter(x=>x.startsWith("data:")).map(x=>x.slice(5).trim()).join("\n");
    if(data)try{return JSON.parse(data);}catch{}
   }
   throw new Error("The MCP server returned an invalid event-stream response.");
  }
  try{return JSON.parse(body);}catch{throw new Error("The MCP server returned invalid JSON.");}
 }
 async function pinnedHttps(url,body,headers={},maxBytes=1048576){
  const u=new URL(url);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash)throw new Error("Agent endpoints must use HTTPS on the standard port without embedded credentials or fragments.");
  const pin=await publicHost(u.hostname);
  return await new Promise((resolve,reject)=>{
   let settled=false;
   const done=(fn,value)=>{if(settled)return;settled=true;fn(value);};
   const req=https.request({
    protocol:"https:",hostname:u.hostname,servername:u.hostname,port:443,path:u.pathname+u.search,method:"POST",agent:false,
    headers:{Accept:"application/json, text/event-stream", "Content-Type":"application/json",...headers},
    timeout:10000,maxHeaderSize:8192,
    lookup:(_host,opts,cb)=>opts?.all?cb(null,[pin]):cb(null,pin.address,pin.family)
   },res=>{
    const chunks=[];let size=0;
    res.on("data",chunk=>{size+=chunk.length;if(size>maxBytes){req.destroy(new Error("Agent response exceeded the allowed size."));return;}chunks.push(chunk);});
    res.on("end",()=>{
     const raw=Buffer.concat(chunks).toString("utf8");
     if(res.statusCode>=300&&res.statusCode<400)return done(reject,new Error("Agent redirects are not followed."));
     if(res.statusCode!==200&&res.statusCode!==202)return done(reject,new Error("Agent returned HTTP "+res.statusCode+". Authentication may be required."));
     try{done(resolve,{status:res.statusCode,headers:res.headers,data:responseJson(res.headers["content-type"],raw)});}catch(e){done(reject,e);}
    });
   });
   req.on("timeout",()=>req.destroy(new Error("Agent request timed out.")));
   req.on("error",e=>done(reject,e));
   req.end(body);
  });
 }

 async function fetchA2aCard(cardUrl,credentials){
  const u=new URL(cardUrl);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash||!(u.pathname==="/.well-known/agent-card.json"||u.pathname==="/.well-known/agent.json"))throw new Error("Use a valid public HTTPS A2A Agent Card URL.");
  const pin=await publicHost(u.hostname);
  const card=await new Promise((resolve,reject)=>{
   const req=https.request({protocol:"https:",hostname:u.hostname,servername:u.hostname,port:443,path:u.pathname+u.search,method:"GET",agent:false,headers:{Accept:"application/json",...authHeaders(credentials)},timeout:8000,maxHeaderSize:8192,lookup:(_h,opts,cb)=>opts?.all?cb(null,[pin]):cb(null,pin.address,pin.family)},res=>{
    const chunks=[];let size=0;
    res.on("data",b=>{size+=b.length;if(size>65536){req.destroy(new Error("Agent Card exceeds the 64 KB limit."));return;}chunks.push(b);});
    res.on("end",()=>{if(res.statusCode!==200)return reject(new Error("Agent Card returned HTTP "+res.statusCode+"."));try{resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));}catch{reject(new Error("Agent Card is not valid JSON."));}});
   });
   req.on("timeout",()=>req.destroy(new Error("Agent Card request timed out.")));req.on("error",reject);req.end();
  });
  const schemes=card.securitySchemes&&typeof card.securitySchemes==="object"?Object.values(card.securitySchemes):[];const bearerOnly=schemes.length>0&&schemes.every(x=>String(x?.type||"").toLowerCase()==="http"&&String(x?.scheme||"").toLowerCase()==="bearer");if((Array.isArray(card.security)&&card.security.length||schemes.length)&&(!bearerOnly||!credentials?.bearerToken))throw new Error("This A2A agent requires an unsupported authentication scheme or a missing bearer token.");
  const endpoint=clean(card.url||card.supportedInterfaces?.find(x=>x.protocolBinding==="JSONRPC"||String(x.protocolBinding||"").toLowerCase().includes("json-rpc"))?.url||"",700);
  if(!endpoint)throw new Error("Agent Card does not publish a JSON-RPC endpoint.");
  const eu=new URL(endpoint);
  if(eu.protocol!=="https:"||eu.username||eu.password||eu.port||eu.hash)throw new Error("A2A service endpoint must use HTTPS on the standard port.");
  await publicHost(eu.hostname);if(credentials?.bearerToken&&eu.hostname.toLowerCase()!==u.hostname.toLowerCase())throw new Error("For safety, a bearer token may only be sent when the A2A card and task endpoint use the same hostname.");
  const skills=Array.isArray(card.skills)?card.skills.slice(0,30).map(x=>({id:clean(x.id,80),name:clean(x.name,100),description:clean(x.description,300)})).filter(x=>x.id||x.name):[];
  if(!skills.length)throw new Error("Agent Card does not publish any usable skills.");
  return {card,endpoint,skills,protocolVersion:clean(card.protocolVersion||"",40)};
 }
 async function mcpCall(url,method,params,sessionId,protocolVersion,id,credentials){
  const headers={};
  if(sessionId)headers["Mcp-Session-Id"]=sessionId;
  if(protocolVersion)headers["MCP-Protocol-Version"]=protocolVersion;
  Object.assign(headers,authHeaders(credentials));
  const payload={jsonrpc:"2.0",id,method};
  if(params!==undefined)payload.params=params;
  const response=await pinnedHttps(url,JSON.stringify(payload),headers);
  if(response.data?.error)throw new Error(clean(response.data.error.message||"MCP request failed.",300));
  return response;
 }
 async function connectMcp(url,credentials){
  const init=await mcpCall(url,"initialize",{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"JR PHEEF Agent Gateway",version:"1.0.0"}},null,null,1,credentials);
  const result=init.data?.result;
  if(!result?.protocolVersion)throw new Error("The server did not complete MCP initialization.");
  const sessionId=clean(init.headers["mcp-session-id"]||"",300)||null;
  await mcpCall(url,"notifications/initialized",undefined,sessionId,result.protocolVersion,undefined,credentials).catch(e=>{
   if(!String(e.message).includes("HTTP 202"))throw e;
  });
  let cursor=null,requestId=2;const list=[];for(let page=0;page<5;page++){const tools=await mcpCall(url,"tools/list",cursor?{cursor}:{},sessionId,result.protocolVersion,requestId++,credentials);const batch=Array.isArray(tools.data?.result?.tools)?tools.data.result.tools:[];list.push(...batch);cursor=clean(tools.data?.result?.nextCursor||"",500)||null;if(!cursor||list.length>=100)break;}
  const safe=list.slice(0,100).map(t=>({
   name:clean(t.name,100),description:clean(t.description,700),
   inputSchema:t.inputSchema&&typeof t.inputSchema==="object"?t.inputSchema:{type:"object",properties:{}}
  })).filter(t=>t.name&&Buffer.byteLength(JSON.stringify(t.inputSchema))<=20000);
  return {sessionId,protocolVersion:clean(result.protocolVersion,40),tools:safe,serverInfo:result.serverInfo||null};
 }
 function validateSchema(value,schema,path="arguments",depth=0){
  if(depth>8||!schema||typeof schema!=="object")return null;
  const type=schema.type;
  if(type==="object"){
   if(!value||typeof value!=="object"||Array.isArray(value))return path+" must be an object.";
   for(const key of schema.required||[])if(!(key in value))return path+" is missing "+key+".";
   const props=schema.properties&&typeof schema.properties==="object"?schema.properties:{};
   if(schema.additionalProperties===false)for(const key of Object.keys(value))if(!(key in props))return path+" contains unsupported field "+key+".";
   for(const [key,sub] of Object.entries(props)){if(key in value){const e=validateSchema(value[key],sub,path+"."+key,depth+1);if(e)return e;}}
  }else if(type==="array"){
   if(!Array.isArray(value))return path+" must be an array.";
   if(schema.maxItems&&value.length>schema.maxItems)return path+" has too many items.";
   if(schema.items)for(let i=0;i<value.length;i++){const e=validateSchema(value[i],schema.items,path+"["+i+"]",depth+1);if(e)return e;}
  }else if(type==="string"){
   if(typeof value!=="string")return path+" must be text.";
   if(schema.minLength&&value.length<schema.minLength)return path+" is too short.";
   if(schema.maxLength&&value.length>schema.maxLength)return path+" is too long.";
  }else if(type==="integer"){if(!Number.isInteger(value))return path+" must be an integer.";}
  else if(type==="number"){if(typeof value!=="number"||!Number.isFinite(value))return path+" must be a number.";}
  else if(type==="boolean"){if(typeof value!=="boolean")return path+" must be true or false.";}
  else if(type==="null"){if(value!==null)return path+" must be null.";}
  if(Array.isArray(schema.enum)&&!schema.enum.some(x=>JSON.stringify(x)===JSON.stringify(value)))return path+" is not an allowed value.";
  if(typeof value==="number"&&schema.minimum!==undefined&&value<schema.minimum)return path+" is below the minimum.";
  if(typeof value==="number"&&schema.maximum!==undefined&&value>schema.maximum)return path+" is above the maximum.";
  return null;
 }

 app.get("/api/agents",rateLimit,sameOrigin,async(req,res)=>{
  try{const a=await auth(req,res);if(!a)return;const r=await db(a.token,"jr_agents","GET","select="+agentFields+"&order=updated_at.desc&limit=200");if(!r.ok)return fail(res,r,"Could not load agent directory.");res.set("Cache-Control","private, no-store");res.json({ok:true,agents:r.data,governance:{mode:"permissioned",external_execution:"explicit_approval_required",user_scoped:true}});}
  catch(e){console.error("Agents list",e.message);res.status(503).json({ok:false,error:"Agent directory unavailable."});}
 });

 app.get("/api/agents/discover/mcp",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const q=clean(req.query?.q,80),cursor=clean(req.query?.cursor,500);
   if(q.length<3)return res.status(400).json({ok:false,error:"Enter at least 3 characters to search the official MCP Registry."});
   const u=new URL("https://registry.modelcontextprotocol.io/v0.1/servers");
   u.searchParams.set("search",q);u.searchParams.set("version","latest");u.searchParams.set("limit","20");
   if(cursor)u.searchParams.set("cursor",cursor);
   const response=await fetch(u,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(8000),redirect:"error"});
   if(!response.ok)return res.status(502).json({ok:false,error:"The official MCP Registry is temporarily unavailable."});
   const payload=await response.json();
   const servers=(Array.isArray(payload.servers)?payload.servers:[]).filter(x=>{const m=x?._meta?.["io.modelcontextprotocol.registry/official"];return !m||m.status==="active";}).map(x=>{
    const s=x.server||{},m=x._meta?.["io.modelcontextprotocol.registry/official"]||{};
    return {name:clean(s.name,180),description:clean(s.description,600),version:clean(s.version,40),registry_status:clean(m.status||"listed",20),repository_url:clean(s.repository?.url||"",300)};
   }).filter(x=>x.name);
   res.set("Cache-Control","private, max-age=30");
   res.json({ok:true,source:"Official Model Context Protocol Registry",servers,next_cursor:clean(payload.metadata?.nextCursor||"",500)||null,note:"Registry listings are third-party metadata, not a security certification. Imported agents remain paused until connected and explicitly enabled."});
  }catch(e){console.error("MCP registry discovery",e.message);res.status(502).json({ok:false,error:"Could not reach the official MCP Registry. Try again shortly."});}
 });

 app.post("/api/agents/discover/a2a",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const cardUrl=clean(req.body?.card_url,700),credentials={bearerToken:clean(req.body?.bearer_token,4096)},connection=await fetchA2aCard(cardUrl,credentials);
   res.set("Cache-Control","no-store");
   res.json({ok:true,source:"A2A Agent Card",agent:{name:clean(connection.card.name||connection.card.displayName,100),description:clean(connection.card.description,1000),endpoint_url:connection.endpoint,endpoint_host:new URL(connection.endpoint).hostname,card_url:cardUrl,protocol_version:connection.protocolVersion,skills:connection.skills}});
  }catch(e){console.error("A2A Agent Card discovery",e.message);res.status(400).json({ok:false,error:clean(e.message||"Agent Card discovery failed.",220)});}
 });
 app.post("/api/agents",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const name=clean(req.body?.name,100),type=clean(req.body?.agent_type||"external",30),protocol=clean(req.body?.protocol||"manual",30),description=clean(req.body?.description,1000),provider=clean(req.body?.provider,100);
   if(name.length<2||!types.has(type)||!protocols.has(protocol))return res.status(400).json({ok:false,error:"Enter an agent name, supported type and protocol."});
   const endpoint=clean(req.body?.endpoint_url,700),cardUrl=clean(req.body?.agent_card_url,700);
   let domain=null;
   if(endpoint){
    try{const u=new URL(endpoint);if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash)return res.status(400).json({ok:false,error:"Use an HTTPS endpoint on the standard port without credentials or fragments."});if(protocol==="mcp"&&u.search)return res.status(400).json({ok:false,error:"MCP endpoint URLs cannot contain query parameters."});domain=u.hostname.toLowerCase();}
    catch{return res.status(400).json({ok:false,error:"Enter a valid HTTPS endpoint."});}
   }
   if(protocol==="mcp"&&!endpoint)return res.status(400).json({ok:false,error:"An HTTPS MCP server endpoint is required before connecting."});
   if(cardUrl){try{const u=new URL(cardUrl);if(protocol!=="a2a"||u.protocol!=="https:"||u.username||u.password||u.port||!(u.pathname==="/.well-known/agent-card.json"||u.pathname==="/.well-known/agent.json"))return res.status(400).json({ok:false,error:"A2A Agent Card URL is invalid."});}catch{return res.status(400).json({ok:false,error:"A2A Agent Card URL is invalid."});}}
   const cs=Array.isArray(req.body?.capabilities)?[...new Set(req.body.capabilities.map(x=>clean(x,50)))]:[];
   if(cs.length>10||cs.some(x=>!caps.has(x)))return res.status(400).json({ok:false,error:"Unsupported capability."});
   const r=await db(a.token,"jr_agents","POST","select="+agentFields,{member_id:a.member.id,name,description,provider:provider||null,agent_type:type,protocol,endpoint_domain:domain,endpoint_url:endpoint||null,agent_card_url:cardUrl||null,capabilities:cs,status:"paused",trust_status:"unverified",connection_status:"unconnected",mcp_tools:[]});
   if(!r.ok)return fail(res,r,"Could not register agent.");
   res.status(201).json({ok:true,agent:r.data[0],note:"Registered privately. Paused until JR tests the connection and you explicitly enable it."});
  }catch(e){console.error("Agent create",e.message);res.status(503).json({ok:false,error:"Agent registration unavailable."});}
 });

 app.post("/api/agents/:id/credentials",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const agent=await ownedAgent(a.token,a.member.id,req.params.id);if(!agent)return res.status(404).json({ok:false,error:"Agent not found."});
   if(!["mcp","a2a"].includes(agent.protocol))return res.status(400).json({ok:false,error:"Credentials are supported only for MCP and A2A agents."});
   const token=typeof req.body?.bearer_token==="string"?req.body.bearer_token.trim():"";
   if(token.length>4096||token&&/[\r\n]/.test(token))return res.status(400).json({ok:false,error:"Enter a valid bearer token under 4096 characters."});
   if(!token){
    const r=await db(a.token,"jr_agents","PATCH","id=eq."+agent.id+"&member_id=eq."+a.member.id,{encrypted_credentials:null,credential_updated_at:null,connection_status:"unconnected",status:"paused",mcp_session_id:null,mcp_tools:[],a2a_skills:[],updated_at:new Date().toISOString()});
    if(!r.ok)return fail(res,r,"Could not remove the saved credential.");
    return res.json({ok:true,credential_saved:false,note:"Saved provider credential removed. Agent paused."});
   }
   const encrypted=encryptCredentials({bearerToken:token});
   const r=await db(a.token,"jr_agents","PATCH","id=eq."+agent.id+"&member_id=eq."+a.member.id,{encrypted_credentials:encrypted,credential_updated_at:new Date().toISOString(),connection_status:"unconnected",status:"paused",mcp_session_id:null,mcp_tools:[],a2a_skills:[],updated_at:new Date().toISOString()});
   if(!r.ok)return fail(res,r,"Could not save the encrypted provider credential.");
   res.json({ok:true,credential_saved:true,note:"Credential encrypted and saved. It is never returned to the browser. Reconnect to verify it."});
  }catch(e){console.error("Agent credential vault",e.message);res.status(503).json({ok:false,error:"Secure credential storage is unavailable."});}
 });
 app.post("/api/agents/:id/connect",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const agent=await ownedAgent(a.token,a.member.id,req.params.id);
   if(!agent)return res.status(404).json({ok:false,error:"Agent not found."});
   try{
    if(agent.protocol==="mcp"&&agent.endpoint_url){
     const credentials=decryptCredentials(agent.encrypted_credentials);const connection=await connectMcp(agent.endpoint_url,credentials);
     const saved=await db(a.token,"jr_agents","PATCH","id=eq."+agent.id+"&member_id=eq."+a.member.id+"&select="+agentFields,{connection_status:"connected",mcp_protocol_version:connection.protocolVersion,mcp_session_id:connection.sessionId,mcp_tools:connection.tools,a2a_skills:[],last_checked_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()});
     if(!saved.ok)return fail(res,saved,"MCP connection succeeded but its status could not be saved.");
     return res.json({ok:true,agent:saved.data[0],server_info:connection.serverInfo,note:"MCP connection verified. Review its tools, then explicitly enable the agent before proposing a tool call."});
    }
    if(agent.protocol==="a2a"&&agent.agent_card_url){
     const credentials=decryptCredentials(agent.encrypted_credentials);const connection=await fetchA2aCard(agent.agent_card_url,credentials);
     const saved=await db(a.token,"jr_agents","PATCH","id=eq."+agent.id+"&member_id=eq."+a.member.id+"&select="+agentFields,{endpoint_url:connection.endpoint,endpoint_domain:new URL(connection.endpoint).hostname,connection_status:"connected",a2a_protocol_version:connection.protocolVersion,a2a_skills:connection.skills,mcp_tools:[],mcp_session_id:null,last_checked_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()});
     if(!saved.ok)return fail(res,saved,"A2A Agent Card verified but its status could not be saved.");
     return res.json({ok:true,agent:saved.data[0],note:"A2A Agent Card verified. Review its skills, then explicitly enable the agent before proposing a task."});
    }
    return res.status(400).json({ok:false,error:"This agent needs a valid MCP endpoint or A2A Agent Card before connecting."});
   }catch(e){
    await db(a.token,"jr_agents","PATCH","id=eq."+agent.id+"&member_id=eq."+a.member.id,{connection_status:"error",last_checked_at:new Date().toISOString(),last_error:clean(e.message,240),mcp_session_id:null,mcp_tools:[],a2a_skills:[],updated_at:new Date().toISOString()}).catch(()=>{});
    res.status(502).json({ok:false,error:clean(e.message||"Agent connection failed.",240)});
   }
  }catch(e){console.error("MCP connect",e.message);res.status(503).json({ok:false,error:"MCP connection service unavailable."});}
 });

 app.patch("/api/agents/:id",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const current=await ownedAgent(a.token,a.member.id,req.params.id);if(!current)return res.status(404).json({ok:false,error:"Agent not found."});
   const p={updated_at:new Date().toISOString()};
   if(req.body?.status!==undefined){
    const v=clean(req.body.status,20);
    if(!["paused","disabled","active"].includes(v))return res.status(400).json({ok:false,error:"Invalid agent status."});
    const mcpReady=current.protocol==="mcp"&&current.connection_status==="connected"&&Array.isArray(current.mcp_tools)&&current.mcp_tools.length>0;const a2aReady=current.protocol==="a2a"&&current.connection_status==="connected"&&Array.isArray(current.a2a_skills)&&current.a2a_skills.length>0;if(v==="active"&&!mcpReady&&!a2aReady)return res.status(403).json({ok:false,error:"Connect the agent and review its available tools or skills before enabling it."});
    p.status=v;
   }
   if(req.body?.name!==undefined){const v=clean(req.body.name,100);if(v.length<2)return res.status(400).json({ok:false,error:"Name too short."});p.name=v;}
   if(req.body?.description!==undefined)p.description=clean(req.body.description,1000);
   if(req.body?.capabilities!==undefined){if(!Array.isArray(req.body.capabilities)||req.body.capabilities.length>10)return res.status(400).json({ok:false,error:"Invalid capabilities."});const cs=[...new Set(req.body.capabilities.map(x=>clean(x,50)))];if(cs.some(x=>!caps.has(x)))return res.status(400).json({ok:false,error:"Unsupported capability."});p.capabilities=cs;}
   const r=await db(a.token,"jr_agents","PATCH","id=eq."+current.id+"&member_id=eq."+a.member.id+"&select="+agentFields,p);
   if(!r.ok)return fail(res,r,"Could not update agent.");if(!r.data.length)return res.status(404).json({ok:false,error:"Agent not found."});
   res.json({ok:true,agent:r.data[0]});
  }catch(e){console.error("Agent update",e.message);res.status(503).json({ok:false,error:"Agent update unavailable."});}
 });

 app.get("/api/agents/activity",rateLimit,sameOrigin,async(req,res)=>{
  try{const a=await auth(req,res);if(!a)return;const r=await db(a.token,"jr_agent_runs","GET","select="+runFields+"&order=created_at.desc&limit=100");if(!r.ok)return fail(res,r,"Could not load agent activity.");res.json({ok:true,runs:r.data});}
  catch(e){console.error("Agent activity",e.message);res.status(503).json({ok:false,error:"Agent activity unavailable."});}
 });

 app.post("/api/agents/:id/a2a/proposals",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const agent=await ownedAgent(a.token,a.member.id,req.params.id);if(!agent)return res.status(404).json({ok:false,error:"Agent not found."});
   if(agent.protocol!=="a2a"||agent.connection_status!=="connected"||agent.status!=="active"||!agent.endpoint_url)return res.status(409).json({ok:false,error:"Connect and explicitly enable this A2A agent first."});
   const text=clean(req.body?.text,4000),skillId=clean(req.body?.skill_id,80);
   if(text.length<3)return res.status(400).json({ok:false,error:"Describe the task in at least 3 characters."});
   if(skillId&&!(agent.a2a_skills||[]).some(x=>x.id===skillId))return res.status(400).json({ok:false,error:"Choose a skill published by this agent."});
   const args={text,skill_id:skillId||null};
   const r=await db(a.token,"jr_agent_runs","POST","select="+runFields,{member_id:a.member.id,agent_id:agent.id,task:"A2A task: "+text,capability:"a2a_message",status:"awaiting_approval",risk:"high",approval_required:true,tool_name:"a2a_message/send",tool_arguments:args,execution_state:"not_started"});
   if(!r.ok)return fail(res,r,"Could not create A2A task proposal.");
   res.status(201).json({ok:true,run:r.data[0],note:"The A2A agent has not been contacted. Review and approve the exact task before executing."});
  }catch(e){console.error("A2A proposal",e.message);res.status(503).json({ok:false,error:"A2A task proposal unavailable."});}
 });
 app.post("/api/agents/:id/tasks",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const agent=await ownedAgent(a.token,a.member.id,req.params.id);if(!agent)return res.status(404).json({ok:false,error:"Agent not found."});
   if(agent.status!=="active")return res.status(409).json({ok:false,error:"Agent is paused. Connect and explicitly enable it first."});
   const task=clean(req.body?.task,2000),cap=clean(req.body?.capability,50);
   if(task.length<3||!caps.has(cap))return res.status(400).json({ok:false,error:"Enter task and supported capability."});
   if(!(agent.capabilities||[]).includes(cap))return res.status(403).json({ok:false,error:"Capability not granted."});
   const r=await db(a.token,"jr_agent_runs","POST","select="+runFields,{member_id:a.member.id,agent_id:agent.id,task,capability:cap,status:"awaiting_approval",risk:["send_message","modify_records","make_purchase","move_money","control_device"].includes(cap)?"high":"standard",approval_required:true});
   if(!r.ok)return fail(res,r,"Could not create task proposal.");
   res.status(201).json({ok:true,run:r.data[0],note:"Proposal only. No agent invoked."});
  }catch(e){console.error("Agent task",e.message);res.status(503).json({ok:false,error:"Task proposal unavailable."});}
 });

 app.post("/api/agents/:id/tools/:toolName/proposals",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   const agent=await ownedAgent(a.token,a.member.id,req.params.id);if(!agent)return res.status(404).json({ok:false,error:"Agent not found."});
   if(agent.protocol!=="mcp"||agent.connection_status!=="connected"||agent.status!=="active")return res.status(409).json({ok:false,error:"Connect and explicitly enable this MCP agent first."});
   const tool=(agent.mcp_tools||[]).find(x=>x.name===req.params.toolName);
   if(!tool)return res.status(404).json({ok:false,error:"Tool not found in the latest MCP tool list."});
   const args=req.body?.arguments??{};
   if(!args||typeof args!=="object"||Array.isArray(args)||Buffer.byteLength(JSON.stringify(args))>32768)return res.status(400).json({ok:false,error:"Tool arguments must be a JSON object under 32 KB."});
   const schemaError=validateSchema(args,tool.inputSchema||{type:"object",properties:{}});
   if(schemaError)return res.status(400).json({ok:false,error:schemaError});
   const task="MCP tool call: "+tool.name+(tool.description?" — "+clean(tool.description,250):"");
   const r=await db(a.token,"jr_agent_runs","POST","select="+runFields,{member_id:a.member.id,agent_id:agent.id,task,capability:"mcp_tool",status:"awaiting_approval",risk:"high",approval_required:true,tool_name:tool.name,tool_arguments:args,execution_state:"not_started"});
   if(!r.ok)return fail(res,r,"Could not create MCP tool proposal.");
   res.status(201).json({ok:true,run:r.data[0],note:"The tool has not been called. Review the exact arguments and approve the proposal first."});
  }catch(e){console.error("MCP tool proposal",e.message);res.status(503).json({ok:false,error:"MCP tool proposal unavailable."});}
 });

 app.post("/api/agents/runs/:runId/decision",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   if(!uuid.test(req.params.runId))return res.status(404).json({ok:false,error:"Proposal not found."});
   const d=clean(req.body?.decision,10);if(!["approve","reject"].includes(d))return res.status(400).json({ok:false,error:"Choose approve or reject."});
   const status=d==="approve"?"approved_not_executed":"rejected";
   const r=await db(a.token,"jr_agent_runs","PATCH","id=eq."+req.params.runId+"&member_id=eq."+a.member.id+"&status=eq.awaiting_approval&select="+runFields,{status,decided_at:new Date().toISOString()});
   if(!r.ok)return fail(res,r,"Could not record decision.");if(!r.data.length)return res.status(409).json({ok:false,error:"Proposal not found or already decided."});
   res.json({ok:true,run:r.data[0],note:d==="approve"?"Approval recorded. Execution still requires a separate command.":"Proposal rejected; nothing executed."});
  }catch(e){console.error("Agent decision",e.message);res.status(503).json({ok:false,error:"Decision service unavailable."});}
 });

 app.post("/api/agents/runs/:runId/execute",rateLimit,sameOrigin,async(req,res)=>{
  let a,run;
  try{
   a=await auth(req,res);if(!a)return;
   if(!uuid.test(req.params.runId))return res.status(404).json({ok:false,error:"Proposal not found."});
   const rr=await db(a.token,"jr_agent_runs","GET","select="+runFields+"&id=eq."+req.params.runId+"&member_id=eq."+a.member.id+"&limit=1");
   if(!rr.ok)return fail(res,rr,"Could not load the approved proposal.");run=rr.data[0];
   if(!run||run.status!=="approved_not_executed"||run.execution_state!=="not_started"||!run.tool_name)return res.status(409).json({ok:false,error:"Only an approved, unexecuted agent proposal can run."});
   const agent=await ownedAgent(a.token,a.member.id,run.agent_id);
   if(!agent||agent.status!=="active"||agent.connection_status!=="connected"||!agent.endpoint_url)return res.status(409).json({ok:false,error:"The agent is no longer connected and enabled. Reconnect and review it before executing."});
   if(agent.protocol==="mcp"){
    if(run.capability!=="mcp_tool")return res.status(409).json({ok:false,error:"This proposal is not an MCP tool call."});
    const currentTool=(agent.mcp_tools||[]).find(x=>x.name===run.tool_name);
    if(!currentTool)return res.status(409).json({ok:false,error:"This tool is no longer in the agent catalogue. Refresh and create a new proposal."});
    const schemaError=validateSchema(run.tool_arguments||{},currentTool.inputSchema||{type:"object",properties:{}});
    if(schemaError)return res.status(409).json({ok:false,error:"The tool input schema changed. Review and create a new proposal."});
   }else if(agent.protocol==="a2a"){
    if(run.tool_name!=="a2a_message/send"||run.capability!=="a2a_message")return res.status(409).json({ok:false,error:"This proposal is not an A2A task."});
    const text=clean(run.tool_arguments?.text,4000),skillId=clean(run.tool_arguments?.skill_id,80);
    if(text.length<3||skillId&&!(agent.a2a_skills||[]).some(x=>x.id===skillId))return res.status(409).json({ok:false,error:"The A2A skill or task changed. Review and create a new proposal."});
   }else return res.status(409).json({ok:false,error:"This agent protocol does not have an execution adapter."});
   const claim=await db(a.token,"jr_agent_runs","PATCH","id=eq."+run.id+"&member_id=eq."+a.member.id+"&status=eq.approved_not_executed&execution_state=eq.not_started&select=id",{execution_state:"running",execution_started_at:new Date().toISOString()});
   if(!claim.ok)return fail(res,claim,"Could not claim the approved proposal.");if(!claim.data.length)return res.status(409).json({ok:false,error:"This proposal is already being executed or has already been used."});
   try{
    let packed,taskId=null,failed=false,stillRunning=false;
    if(agent.protocol==="mcp"){
     const credentials=decryptCredentials(agent.encrypted_credentials);const response=await mcpCall(agent.endpoint_url,"tools/call",{name:run.tool_name,arguments:run.tool_arguments||{}},agent.mcp_session_id,agent.mcp_protocol_version,crypto.randomInt(1,2147483647),credentials);
     const result=response.data?.result;if(!result)throw new Error("The MCP server returned no tool result; execution outcome is unknown.");
     packed=JSON.parse(JSON.stringify(result));failed=Boolean(packed.isError);
    }else{
     const args=run.tool_arguments||{},message={messageId:crypto.randomUUID(),role:"user",parts:[{kind:"text",text:args.text}]};
     const payload={jsonrpc:"2.0",id:crypto.randomInt(1,2147483647),method:"message/send",params:{message,configuration:{acceptedOutputModes:["text/plain"],blocking:false,historyLength:5}}};
     const credentials=decryptCredentials(agent.encrypted_credentials);const response=await pinnedHttps(agent.endpoint_url,JSON.stringify(payload),authHeaders(credentials),1048576);
     if(response.data?.error)throw new Error(clean(response.data.error.message||"A2A request failed.",300));
     const result=response.data?.result;if(!result)throw new Error("The A2A agent returned no task or message; outcome is unknown.");
     packed=JSON.parse(JSON.stringify(result));
     const task=packed.task||packed;
     if(task&&typeof task==="object"&&task.id&&task.status?.state){
      taskId=clean(task.id,200);
      const state=String(task.status.state).toLowerCase();
      failed=["failed","rejected","canceled","cancelled"].includes(state);
      stillRunning=!["completed","failed","rejected","canceled","cancelled"].includes(state);
     }
    }
    if(Buffer.byteLength(JSON.stringify(packed))>32768)throw new Error("Remote result exceeded the 32 KB storage limit; execution outcome is unknown.");
    const nextState=failed?"failed":stillRunning?"running":"completed";
    const saved=await db(a.token,"jr_agent_runs","PATCH","id=eq."+run.id+"&member_id=eq."+a.member.id,{status:failed?"failed":"approved_not_executed",execution_state:nextState,execution_result:packed,a2a_task_id:taskId,completed_at:stillRunning?null:new Date().toISOString()});
    if(!saved.ok)throw new Error("The agent responded, but JR could not save the result. Check the external service before retrying.");
    res.json({ok:!failed,run:saved.data[0],note:failed?"The remote agent reported a failed task.":stillRunning?"The A2A task is still running. JR will monitor it when you request a status refresh.":"The approved agent task completed."});
   }catch(e){
    await db(a.token,"jr_agent_runs","PATCH","id=eq."+run.id+"&member_id=eq."+a.member.id,{status:"failed",execution_state:"unknown",execution_result:{error:clean(e.message,300),outcome:"unknown_remote_execution_may_have_occurred"},completed_at:new Date().toISOString()}).catch(()=>{});
    res.status(502).json({ok:false,error:"Remote execution outcome is uncertain. JR will not retry automatically. Check the external service before proposing another call."});
   }
  }catch(e){console.error("Agent execution",e.message);res.status(503).json({ok:false,error:"Agent execution service unavailable."});}
 });;
 app.post("/api/agents/runs/:runId/poll",rateLimit,sameOrigin,async(req,res)=>{
  try{
   const a=await auth(req,res);if(!a)return;
   if(!uuid.test(req.params.runId))return res.status(404).json({ok:false,error:"Task not found."});
   const rr=await db(a.token,"jr_agent_runs","GET","select="+runFields+"&id=eq."+req.params.runId+"&member_id=eq."+a.member.id+"&limit=1");
   if(!rr.ok)return fail(res,rr,"Could not load the A2A task.");const run=rr.data[0];
   if(!run||run.execution_state!=="running"||!run.a2a_task_id)return res.status(409).json({ok:false,error:"This proposal has no active A2A task to poll."});
   const agent=await ownedAgent(a.token,a.member.id,run.agent_id);
   if(!agent||agent.protocol!=="a2a"||agent.connection_status!=="connected"||!agent.endpoint_url)return res.status(409).json({ok:false,error:"The A2A agent is no longer connected."});
   const payload={jsonrpc:"2.0",id:crypto.randomInt(1,2147483647),method:"tasks/get",params:{id:run.a2a_task_id,historyLength:5}};
   const credentials=decryptCredentials(agent.encrypted_credentials);const response=await pinnedHttps(agent.endpoint_url,JSON.stringify(payload),authHeaders(credentials),1048576);
   if(response.data?.error)return res.status(502).json({ok:false,error:clean(response.data.error.message||"A2A task status request failed.",240)});
   const result=response.data?.result;if(!result)return res.status(502).json({ok:false,error:"A2A agent returned no task status."});
   const packed=JSON.parse(JSON.stringify(result));if(Buffer.byteLength(JSON.stringify(packed))>32768)return res.status(502).json({ok:false,error:"A2A task result exceeds the storage limit."});
   const state=String((packed.task||packed).status?.state||"").toLowerCase();
   const failed=["failed","rejected","canceled","cancelled"].includes(state),completed=state==="completed";
   const saved=await db(a.token,"jr_agent_runs","PATCH","id=eq."+run.id+"&member_id=eq."+a.member.id,{status:failed?"failed":"approved_not_executed",execution_state:failed?"failed":completed?"completed":"running",execution_result:packed,completed_at:failed||completed?new Date().toISOString():null});
   if(!saved.ok)return fail(res,saved,"Could not save A2A task status.");
   res.json({ok:true,run:saved.data[0],note:completed?"A2A task completed.":failed?"A2A task failed.":"A2A task is still "+(state||"in progress")+". No duplicate task was sent."});
  }catch(e){console.error("A2A task poll",e.message);res.status(502).json({ok:false,error:"Could not refresh A2A task status."});}
 });

};