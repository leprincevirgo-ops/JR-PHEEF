"use strict";
const express=require("express");
const path=require("node:path");
const app=express();
const PORT=Number(process.env.PORT)||10000;

app.disable("x-powered-by");
app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy","camera=(self), microphone=(self), geolocation=(self)");
  next();
});
app.get("/healthz",(_req,res)=>res.status(200).json({
  ok:true,product:"JR PHEEF",identity:"JR",stage:"foundation",
  timestamp:new Date().toISOString()
}));
app.use(express.static(path.join(__dirname,"public"),{extensions:["html"]}));
// Express 5 uses path-to-regexp v8; a bare "*" route is invalid.
// A final middleware provides the SPA fallback without wildcard syntax.
app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,_req,res,_next)=>{
  console.error("JR PHEEF request error:",err.message);
  res.status(500).json({ok:false,error:"JR PHEEF could not complete that request."});
});
app.listen(PORT,"0.0.0.0",()=>console.log("JR PHEEF foundation listening on "+PORT));
