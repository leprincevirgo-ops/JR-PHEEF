"use strict";
const express=require("express");
const path=require("node:path");
const app=express();
const PORT=Number(process.env.PORT)||10000;
const SUPABASE_URL=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||"";
const ACCESS_COOKIE="jr_access";
const REFRESH_COOKIE="jr_refresh";
const AUTH_ORIGIN="https://"+(process.env.RENDER_EXTERNAL_HOSTNAME||"jr-pheef-foundation.onrender.com");
const ALLOWED_ORIGINS=new Set([AUTH_ORIGIN,...(process.env.JR_ALLOWED_ORIGINS||"").split(",")]
  .map(value=>{try{return new URL(value.trim()).origin;}catch{return "";}})
  .filter(Boolean));

app.disable("x-powered-by");
app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy","camera=(self), microphone=(self), geolocation=(self)");
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");
  if(req.secure||req.headers["x-forwarded-proto"]==="https") res.setHeader("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  next();
});
app.use(express.json({limit:"12mb",type:"application/json"}));

const rateBuckets=new Map();
function rateLimit(req,res,next){
  const now=Date.now(),key=(req.ip||"unknown")+":"+req.path;
  const entry=rateBuckets.get(key)||{start:now,count:0};
  if(now-entry.start>60000){entry.start=now;entry.count=0;}
  entry.count++;rateBuckets.set(key,entry);
  if(entry.count>12)return res.status(429).json({ok:false,error:"Too many attempts. Please wait a minute and try again."});
  next();
}
function cookies(req){
  const out={};
  for(const part of (req.headers.cookie||"").split(";")){
    const i=part.indexOf("=");
    if(i>0){const k=part.slice(0,i).trim();try{out[k]=decodeURIComponent(part.slice(i+1).trim());}catch{}}
  }
  return out;
}
function setCookie(res,name,value,maxAge){
  res.append("Set-Cookie",name+"="+encodeURIComponent(value)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge);
}
function clearAuthCookies(res){
  for(const name of [ACCESS_COOKIE,REFRESH_COOKIE])res.append("Set-Cookie",name+"=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
}
function sameOrigin(req,res,next){
  const origin=req.headers.origin;
  if(origin){
    let normalized;
    try{normalized=new URL(origin).origin;}catch{}
    if(!normalized||!ALLOWED_ORIGINS.has(normalized))
      return res.status(403).json({ok:false,error:"Request origin was not accepted."});
  }else{
    const fetchSite=String(req.headers["sec-fetch-site"]||"").toLowerCase();
    if(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="none")
      return res.status(403).json({ok:false,error:"Cross-site requests are not accepted."});
  }
  next();
}
async function supabaseAuth(pathname,body,accessToken){
  if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error("Account service is not configured yet.");
  const headers={"Content-Type":"application/json","apikey":SUPABASE_KEY};
  if(accessToken)headers.Authorization="Bearer "+accessToken;
  const response=await fetch(SUPABASE_URL+"/auth/v1/"+pathname,{method:"POST",headers,body:JSON.stringify(body||{})});
  let data={};try{data=await response.json();}catch{}
  return {ok:response.ok,status:response.status,data};
}
function authError(data){
  const msg=String(data?.msg||data?.message||data?.error_description||data?.error||"");
  if(/already registered|already exists/i.test(msg))return "An account with this email already exists. Try logging in.";
  if(/invalid login credentials/i.test(msg))return "Email or password is incorrect.";
  if(/email not confirmed/i.test(msg))return "Please verify your email before logging in.";
  if(/password/i.test(msg)&&/weak|short|least/i.test(msg))return "Choose a stronger password with at least 8 characters.";
  if(/rate limit/i.test(msg))return "Too many attempts. Please wait and try again.";
  return "We could not complete that request. Check your details and try again.";
}
async function provisionMember(accessToken){
  const response=await fetch(SUPABASE_URL+"/functions/v1/jr-member-provision",{
    method:"POST",
    headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+accessToken,"Content-Type":"application/json"}
  });
  let data={};try{data=await response.json();}catch{}
  if(!response.ok||!data.ok)throw new Error(data.error||"Could not prepare your member profile.");
  return data.member;
}
function saveSession(res,data){
  if(data?.access_token)setCookie(res,ACCESS_COOKIE,data.access_token,Math.max(60,Number(data.expires_in)||3600));
  if(data?.refresh_token)setCookie(res,REFRESH_COOKIE,data.refresh_token,60*60*24*30);
}
async function currentUser(req,res){
  const c=cookies(req);
  if(!c[ACCESS_COOKIE]&&!c[REFRESH_COOKIE])return null;
  if(c[ACCESS_COOKIE]){
    const headers={apikey:SUPABASE_KEY,Authorization:"Bearer "+c[ACCESS_COOKIE]};
    const response=await fetch(SUPABASE_URL+"/auth/v1/user",{headers});
    if(response.ok){const user=await response.json();req.jrAccessToken=c[ACCESS_COOKIE];return user;}
    if(response.status!==401)throw new Error("Could not check your session.");
  }
  if(c[REFRESH_COOKIE]){
    const refreshed=await supabaseAuth("token?grant_type=refresh_token",{refresh_token:c[REFRESH_COOKIE]});
    if(refreshed.ok&&refreshed.data.access_token){saveSession(res,refreshed.data);req.jrAccessToken=refreshed.data.access_token;return refreshed.data.user||null;}
  }
  clearAuthCookies(res);
  return null;
}

app.get("/healthz",(_req,res)=>res.status(200).json({
  ok:true,product:"JR PHEEF",identity:"JR",stage:"foundation-auth",
  authConfigured:Boolean(SUPABASE_URL&&SUPABASE_KEY),paymentsEnabled:false,
  timestamp:new Date().toISOString()
}));
app.post("/api/auth/signup",rateLimit,sameOrigin,async(req,res)=>{
  try{
    const {fullName,email,password,phone,birthYear}=req.body||{};
    if(typeof fullName!=="string"||fullName.trim().length<2||fullName.trim().length>100)return res.status(400).json({ok:false,error:"Enter your full name."});
    if(typeof email!=="string"||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({ok:false,error:"Enter a valid email address."});
    if(typeof password!=="string"||password.length<8||password.length>128)return res.status(400).json({ok:false,error:"Password must be between 8 and 128 characters."});
    if(typeof phone!=="string"||phone.trim().length<7||phone.trim().length>25)return res.status(400).json({ok:false,error:"Enter your phone number, including country code."});
    const year=Number(birthYear),currentYear=new Date().getUTCFullYear();
    if(!Number.isInteger(year)||year<1900||year>currentYear-18)return res.status(400).json({ok:false,error:"You must be at least 18 to create an account."});
    const result=await supabaseAuth("signup?redirect_to="+encodeURIComponent(AUTH_ORIGIN+"/"),{email:email.trim().toLowerCase(),password,data:{full_name:fullName.trim(),phone:phone.trim(),birth_year:year}});
    if(!result.ok)return res.status(result.status===429?429:400).json({ok:false,error:authError(result.data)});
    if(result.data.access_token&&result.data.user?.email_confirmed_at){
      const member=await provisionMember(result.data.access_token);
      saveSession(res,result.data);
      return res.status(201).json({ok:true,authenticated:true,user:{id:result.data.user?.id,email:result.data.user?.email,fullName:member.fullName,jpNumber:member.jpNumber,role:member.role,accountType:member.accountType,verified:member.verified,emailVerified:member.emailVerified},message:"Your JR PHEEF account has been created."});
    }
    return res.status(201).json({ok:true,authenticated:false,emailVerificationRequired:true,message:"Check your email for a verification link to activate your JR PHEEF account."});
  }catch(err){console.error("JR PHEEF signup service:",err.message);return res.status(503).json({ok:false,error:"Account service is temporarily unavailable. Please try again shortly."});}
});
app.post("/api/auth/login",rateLimit,sameOrigin,async(req,res)=>{
  try{
    const {email,password}=req.body||{};
    if(typeof email!=="string"||typeof password!=="string"||!email.trim()||!password)return res.status(400).json({ok:false,error:"Enter your email and password."});
    const result=await supabaseAuth("token?grant_type=password",{email:email.trim().toLowerCase(),password});
    if(!result.ok)return res.status(result.status===429?429:401).json({ok:false,error:authError(result.data)});
    if(!result.data.user?.email_confirmed_at)return res.status(403).json({ok:false,error:"Please verify your email before logging in."});
    const member=await provisionMember(result.data.access_token);
    saveSession(res,result.data);
    return res.json({ok:true,user:{id:result.data.user?.id,email:result.data.user?.email,fullName:member.fullName,jpNumber:member.jpNumber,role:member.role,accountType:member.accountType,verified:member.verified,emailVerified:member.emailVerified},message:"Welcome back to JR PHEEF."});
  }catch(err){console.error("JR PHEEF login service:",err.message);return res.status(503).json({ok:false,error:"Account service is temporarily unavailable. Please try again shortly."});}
});
app.post("/api/auth/session/establish",sameOrigin,async(req,res)=>{
  try{
    const {access_token,refresh_token}=req.body||{};
    if(typeof access_token!=="string"||access_token.length<20||access_token.length>8192)return res.status(400).json({ok:false,error:"The email confirmation link is invalid or expired."});
    const response=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+access_token}});
    if(!response.ok)return res.status(401).json({ok:false,error:"Your email confirmation could not be verified. Please request a new link."});
    const user=await response.json();
    if(!user.email_confirmed_at)return res.status(403).json({ok:false,error:"Your email address is not confirmed yet."});
    const member=await provisionMember(access_token);
    saveSession(res,{access_token,refresh_token:typeof refresh_token==="string"?refresh_token:undefined,expires_in:3600});
    return res.json({ok:true,user:{id:user.id,email:user.email,fullName:member.fullName,jpNumber:member.jpNumber,role:member.role,accountType:member.accountType,verified:member.verified,emailVerified:member.emailVerified}});
  }catch(err){console.error("JR PHEEF email confirmation:",err.message);return res.status(503).json({ok:false,error:"Could not complete email confirmation. Please try again."});}
});
app.get("/api/auth/session",async(req,res)=>{
  try{
    if(!SUPABASE_URL||!SUPABASE_KEY)return res.status(503).json({ok:false,configured:false});
    const user=await currentUser(req,res);
    if(!user)return res.json({ok:true,authenticated:false,user:null});
    if(!user.email_confirmed_at)return res.json({ok:true,authenticated:false,emailVerificationRequired:true,user:null});
    const member=await provisionMember(req.jrAccessToken);
    return res.json({ok:true,authenticated:true,user:{id:user.id,email:user.email,fullName:member.fullName,jpNumber:member.jpNumber,role:member.role,accountType:member.accountType,verified:member.verified,emailVerified:member.emailVerified}});
  }catch(err){console.error("JR PHEEF session service:",err.message);return res.status(503).json({ok:false,error:"Could not verify your session."});}
});
app.post("/api/partner-inquiry",rateLimit,sameOrigin,async(req,res)=>{
  try{
    const user=await currentUser(req,res);
    if(!user||!user.email_confirmed_at||!req.jrAccessToken)return res.status(401).json({ok:false,error:"Sign in with a verified JR PHEEF account before sending an enquiry."});
    const response=await fetch(SUPABASE_URL+"/functions/v1/jr-partner-inquiry",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+req.jrAccessToken,"Content-Type":"application/json"},body:JSON.stringify(req.body||{})});
    let data={};try{data=await response.json();}catch{}
    return res.status(response.status).json(data);
  }catch(err){console.error("JR PHEEF partner enquiry:",err.message);return res.status(503).json({ok:false,error:"Partner enquiry service is temporarily unavailable."});}
});

// JR PHEEF live conversation runtime. Provider secrets remain server-side.
// The assistant can reason and research, but cannot execute account, payment,
// messaging, or external actions from a chat response.
const JR_SYSTEM_PROMPT = [
  "You are JR, the conversational intelligence at the centre of JR PHEEF.",
  "JR PHEEF is a connected environment for learning, creating, connecting and getting things done.",
  "Welcome open-ended questions, curiosity, imagination, everyday conversation and practical requests.",
  "Understand the user's intent before suggesting a world or feature. Do not force fixed command words or categories.",
  "Respond in the language and register the user uses where possible, including natural multilingual conversation.",
  "Be honest about uncertainty, current capabilities and whether external information has been verified.",
  "Never claim to have taken an action, sent a message, made a booking, moved money, published content or changed an account unless a separate authorised service confirms it.",
  "Do not reveal private founder, DGBO, FAMILY, other-member or internal system information to unauthorised users.",
  "Respect consent, privacy, human dignity and user ownership of their original ideas. Do not promise investment returns or provide regulated financial, legal or medical determinations.",
  "For consequential actions, explain the proposed action and require explicit confirmation through the relevant JR PHEEF workflow.",
  "Be warm, curious, useful and concise. Ask only the most important clarification when necessary."
].join(" ");

app.post("/api/ai/chat",rateLimit,sameOrigin,async(req,res)=>{
  try{
    const user=await currentUser(req,res);
    if(!user||!user.email_confirmed_at||!req.jrAccessToken)
      return res.status(401).json({ok:false,error:"Sign in with a verified JR PHEEF account to talk with JR."});
    if(!process.env.OPENAI_API_KEY)
      return res.status(503).json({ok:false,error:"JR's live intelligence service is not activated on this server yet."});
    const body=req.body||{};
    const message=typeof body.message==="string"?body.message.trim().slice(0,5000):"";
    if(!message)return res.status(400).json({ok:false,error:"Tell JR what is on your mind."});
    const allowedModes=new Set(["universe","business","learning","research","personal","opportunities"]);
    const mode=allowedModes.has(body.mode)?body.mode:"universe";
    const history=Array.isArray(body.history)?body.history.slice(-8).map(item=>({
      role:item?.role==="assistant"?"assistant":"user",
      content:typeof item?.content==="string"?item.content.trim().slice(0,2500):""
    })).filter(item=>item.content):[];
    const input=[...history,{role:"user",content:message}];
    const payload={
      model:process.env.OPENAI_MODEL||"gpt-5.4",
      instructions:JR_SYSTEM_PROMPT+"\nCurrent focus: "+mode+". Answer the user's actual request first; offer relevant JR PHEEF capabilities only when they genuinely help.",
      input,
      max_output_tokens:1400,
      store:false
    };
    if(body.use_web===true)payload.tools=[{type:"web_search"}];
    const upstream=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify(payload),
      signal:AbortSignal.timeout(30000)
    });
    const result=await upstream.json().catch(()=>({}));
    if(!upstream.ok){
      const providerCode=String(result?.error?.code||result?.error?.type||"provider_error").slice(0,80);
      console.error("JR AI provider error:",upstream.status,providerCode);
      return res.status(upstream.status===429?429:502).json({
        ok:false,
        error:upstream.status===429?"JR is temporarily at its AI provider's usage limit. Please try again shortly.":"JR could not reach its intelligence service. Please try again shortly."
      });
    }
    let answer=typeof result.output_text==="string"?result.output_text:"";
    if(!answer&&Array.isArray(result.output)){
      answer=result.output.flatMap(item=>Array.isArray(item.content)?item.content:[])
        .filter(part=>part.type==="output_text"&&typeof part.text==="string")
        .map(part=>part.text).join("\n");
    }
    if(!answer.trim())return res.status(502).json({ok:false,error:"JR did not receive a usable answer. Please try again."});
    res.setHeader("Cache-Control","no-store");
    return res.json({ok:true,answer:answer.trim(),model:process.env.OPENAI_MODEL||"gpt-5.4",webResearch:body.use_web===true});
  }catch(error){
    console.error("JR AI request failed:",String(error?.message||error).slice(0,160));
    if(!res.headersSent)return res.status(503).json({ok:false,error:"JR's intelligence service is temporarily unavailable."});
  }
});

app.post("/api/workspace",sameOrigin,async(req,res)=>{
  try{
    const user=await currentUser(req,res);
    if(!user||!user.email_confirmed_at||!req.jrAccessToken)return res.status(401).json({ok:false,error:"Please sign in with a verified email first."});
    const response=await fetch(SUPABASE_URL+"/functions/v1/jr-workspace-api",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+req.jrAccessToken,"Content-Type":"application/json"},body:JSON.stringify(req.body||{})});
    let data={};try{data=await response.json();}catch{}
    return res.status(response.status).json(data);
  }catch(err){console.error("JR PHEEF workspace service:",err.message);return res.status(503).json({ok:false,error:"Workspace service is temporarily unavailable."});}
});
app.all("/api/founder/overview",sameOrigin,async(req,res)=>{
  try{
    const user=await currentUser(req,res);
    if(!user||!user.email_confirmed_at||!req.jrAccessToken)return res.status(401).json({ok:false,error:"Sign in with your verified founder account."});
    const response=await fetch(SUPABASE_URL+"/functions/v1/jr-founder-overview",{method:req.method==="POST"?"POST":"GET",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+req.jrAccessToken,"Content-Type":"application/json"},body:req.method==="POST"?JSON.stringify(req.body||{}):undefined});
    let data={};try{data=await response.json();}catch{}
    if(!response.ok||!data.ok)return res.status(response.status||502).json({ok:false,error:data.error||"Founder service is unavailable."});
    return res.json(data);
  }catch(err){console.error("JR PHEEF founder overview:",err.message);return res.status(503).json({ok:false,error:"Founder overview is temporarily unavailable."});}
});
app.post("/api/auth/logout",sameOrigin,async(req,res)=>{
  try{
    const c=cookies(req);
    if(c[ACCESS_COOKIE]){
      try{await fetch(SUPABASE_URL+"/auth/v1/logout",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+c[ACCESS_COOKIE]}});}catch{}
    }
    clearAuthCookies(res);
    return res.json({ok:true,message:"You have been logged out."});
  }catch{clearAuthCookies(res);return res.json({ok:true});}
});
app.use(express.static(path.join(__dirname,"public"),{extensions:["html"]}));
app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,_req,res,_next)=>{
  console.error("JR PHEEF request error:",err.message);
  res.status(500).json({ok:false,error:"JR PHEEF could not complete that request."});
});
app.listen(PORT,"0.0.0.0",()=>console.log("JR PHEEF foundation listening on "+PORT));
