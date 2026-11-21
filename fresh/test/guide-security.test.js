"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("Welcome Guide explains the user journey and account boundaries",()=>{
 const h=read("public/guide.html");
 for(const phrase of ["How JR PHEEF works","Create your account","Meet JR","confirm your email","does not automatically create a company","JR PHEEF Foundation staging"])assert.ok(h.toLowerCase().includes(phrase.toLowerCase()),"missing "+phrase);
});
test("Ecosystem Explorer distinguishes the worlds and their maturity",()=>{
 const h=read("public/guide.html");
 for(const phrase of ["JR LINK","JR MOVE","FAMILY","DGBO","Partially implemented","Financial transactions disabled","dispatch and tracking not connected"])assert.ok(h.includes(phrase),"missing "+phrase);
});
test("Personal learning contains six lessons and local-only progress",()=>{
 const h=read("public/guide.html"),j=read("public/guide.js");
 assert.equal((h.match(/class="lesson" data-lesson=/g)||[]).length,6);
 assert.match(j,/localStorage/);assert.match(j,/jr-pheef-guide-progress-v1/);
});
test("Guide assets avoid inline scripts and load under the self-only CSP",()=>{
 const h=read("public/guide.html"),s=read("server.js");
 assert.match(h,/<script src="\/guide\.js" defer><\/script>/);
 assert.doesNotMatch(h,/<script(?! src=)/i);
 assert.match(s,/object-src 'none'/);assert.match(s,/frame-ancestors 'none'/);assert.match(read("public/styles.css"),/\.guide-callout/);
});
test("authenticated workspace and founder endpoints have burst rate limiting",()=>{
 const s=read("server.js");
 assert.match(s,/app\.post\("\/api\/workspace",rateLimit,sameOrigin/);
 assert.match(s,/app\.all\("\/api\/founder\/overview",rateLimit,sameOrigin/);
 assert.match(s,/rateBuckets\.size>12000/);
});
test("public guide routes are served without exposing private workspace routes",()=>{
 const s=read("server.js");
 assert.match(s,/app\.get\("\/guide",sendGuide\)/);
 assert.match(s,/app\.get\("\/learn",sendGuide\)/);
 assert.match(s,/app\.post\("\/api\/workspace",rateLimit,sameOrigin/);
});
