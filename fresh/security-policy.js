"use strict";

function httpsOrigin(value){
  try{
    const parsed=new URL(String(value||""));
    if(parsed.protocol!=="https:"||parsed.username||parsed.password)return "";
    return parsed.origin;
  }catch{return "";}
}

function buildContentSecurityPolicy(supabaseUrl){
  const mediaSources=["'self'","data:","blob:","https://images.unsplash.com",httpsOrigin(supabaseUrl)]
    .filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src "+mediaSources,
    "media-src "+mediaSources,
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");
}

module.exports={buildContentSecurityPolicy,httpsOrigin};
