"use strict";
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const root=path.resolve(__dirname,"../public");
const port=Number(process.env.PORT||4173);
const types={
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".webmanifest":"application/manifest+json; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".woff2":"font/woff2"
};
http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);}
  catch(_){res.writeHead(400);res.end("Bad request");return;}
  const relative=pathname==="/"?"index.html":pathname.replace(/^\/+/, "");
  let file=path.resolve(root,relative);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end("Forbidden");return;}
  fs.stat(file,(statError,stat)=>{
    if(!statError&&stat.isDirectory())file=path.join(file,"index.html");
    fs.readFile(file,(readError,body)=>{
      if(readError){res.writeHead(404,{"Cache-Control":"no-store"});res.end("Not found");return;}
      res.writeHead(200,{"Content-Type":types[path.extname(file).toLowerCase()]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
      res.end(body);
    });
  });
}).listen(port,"127.0.0.1",()=>console.log("JR PHEEF static browser-test server listening on "+port));
