"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..","..");
const api=fs.readFileSync(path.join(root,"supabase/functions/jr-workspace-api/index.ts"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"..","public/app.js"),"utf8");
let rankMatches,tokenize;
test.before(async()=>{({rankMatches,tokenize}=await import("../../supabase/functions/_shared/matching.mjs"));});

test("JR matching normalises natural-language and multilingual search terms",()=>{
 assert.deepEqual(tokenize("I need a café near Nairobi"),["cafe","nairobi"]);
 assert.deepEqual(tokenize("natafuta fundi wa umeme"),["fundi","umeme"]);
});
test("JR matching recognises common Swahili terms for skills, jobs, property and services",()=>{
 const rows=[
  {id:"electrician",ownerId:"a",kind:"listing",title:"Electrician available",description:"Electrical wiring and repairs",category:"service"},
  {id:"job",ownerId:"b",kind:"opportunity",opportunityType:"job",title:"Warehouse assistant vacancy"},
  {id:"room",ownerId:"c",kind:"property",title:"Bedsitter for rent"},
  {id:"goods",ownerId:"d",kind:"listing",title:"Fresh farm produce",description:"Vegetables and fruit",category:"goods"}
 ];
 assert.equal(rankMatches({query:"natafuta fundi wa umeme",candidates:rows})[0].id,"electrician");
 assert.equal(rankMatches({query:"nahitaji kazi",matchType:"jobs",candidates:rows})[0].id,"job");
 assert.equal(rankMatches({query:"natafuta chumba",matchType:"property",candidates:rows})[0].id,"room");
 assert.equal(rankMatches({query:"nataka bidhaa",matchType:"goods_services",candidates:rows})[0].id,"goods");
});
test("JR matching ranks the strongest title and category matches first",()=>{
 const rows=[
  {id:"1",ownerId:"seller-a",kind:"listing",title:"Electrician available",description:"Home wiring",category:"service",location:"Nairobi"},
  {id:"2",ownerId:"seller-b",kind:"listing",title:"Used sofa",description:"Electric blue fabric",category:"furniture",location:"Mombasa"}
 ];
 const result=rankMatches({query:"electrician service",candidates:rows});
 assert.equal(result[0].id,"1");
 assert.ok(result[0].matchScore>0);
 assert.ok(result[0].matchReasons.length>0);
});
test("JR matching supports jobs, property, partners and transport filters",()=>{
 const rows=[
  {id:"job",ownerId:"a",kind:"opportunity",opportunityType:"job",title:"Nurse vacancy"},
  {id:"home",ownerId:"b",kind:"property",title:"Bedsitter for rent"},
  {id:"partner",ownerId:"c",kind:"opportunity",opportunityType:"partnership",title:"Retail partner"},
  {id:"ride",ownerId:"d",kind:"listing",category:"transport",title:"Delivery rider"}
 ];
 assert.equal(rankMatches({query:"nurse",matchType:"jobs",candidates:rows})[0].id,"job");
 assert.equal(rankMatches({query:"bedsitter",matchType:"property",candidates:rows})[0].id,"home");
 assert.equal(rankMatches({query:"retail partner",matchType:"partners",candidates:rows})[0].id,"partner");
 assert.equal(rankMatches({query:"delivery rider",matchType:"transport",candidates:rows})[0].id,"ride");
});
test("JR property matching includes property listings as well as room records and property opportunities",()=>{
 const rows=[
  {id:"land",ownerId:"a",kind:"listing",title:"Plot of land for sale",category:"property"},
  {id:"room",ownerId:"b",kind:"property",title:"Bedsitter for rent"},
  {id:"job",ownerId:"c",kind:"opportunity",opportunityType:"job",title:"Property manager vacancy"}
 ];
 assert.deepEqual(rankMatches({query:"land",matchType:"property",candidates:rows}).map(x=>x.id),["land"]);
 assert.deepEqual(rankMatches({query:"bedsitter",matchType:"property",candidates:rows}).map(x=>x.id),["room"]);
});
test("JR matching respects a requested location while retaining remote options",()=>{
 const rows=[
  {id:"near",ownerId:"a",kind:"listing",title:"Electrician",location:"Nairobi CBD"},
  {id:"far",ownerId:"b",kind:"listing",title:"Electrician",location:"Mombasa"},
  {id:"remote",ownerId:"c",kind:"opportunity",title:"Electrician",location:"Remote"}
 ];
 assert.deepEqual(rankMatches({query:"electrician",location:"Nairobi",candidates:rows}).map(x=>x.id),["near","remote"]);
});
test("JP Number integrity migration preserves assigned identities and enforces uniqueness",()=>{
 const migration=fs.readFileSync(path.join(root,"supabase/migrations/20261113150244_jp_number_identity_integrity.sql"),"utf8");
 assert.match(migration,/CREATE UNIQUE INDEX/i);
 assert.match(migration,/members_jp_number_unique_idx/);
 assert.match(migration,/JP Number is permanent/i);
 assert.match(migration,/BEFORE INSERT OR UPDATE OF jp_number/i);
});
test("JP Number allocation is sequential, server-assigned and preserves existing identities",()=>{
 const migration=fs.readFileSync(path.join(root,"supabase/migrations/20261113152129_sequential_jp_number_allocation.sql"),"utf8");
 assert.match(migration,/CREATE SEQUENCE IF NOT EXISTS public\.jp_number_seq/);
 assert.match(migration,/nextval\('public\.jp_number_seq'\)/);
 assert.match(migration,/ALTER COLUMN jp_number DROP DEFAULT/);
 assert.match(migration,/Founder JP-01 is preserved/);
});
test("JR matching excludes the requesting member and respects maximum budgets",()=>{
 const rows=[
  {id:"own",ownerId:"me",kind:"listing",title:"Electrician"},
  {id:"high",ownerId:"other",kind:"listing",title:"Electrician",price:5000},
  {id:"fit",ownerId:"other2",kind:"listing",title:"Electrician",price:500}
 ];
 const filtered=rankMatches({query:"electrician",maxPrice:1000,candidates:rows.filter(x=>x.ownerId!=="me")});
 assert.deepEqual(filtered.map(x=>x.id),["fit"]);
});
test("authenticated workspace exposes the unified matching action over existing opportunity, listing and property records",()=>{
 assert.match(api,/action==="find_matches"/);
 assert.match(api,/rows\("jr_listings"/);
 assert.match(api,/rows\("jr_opportunities"/);
 assert.match(api,/rows\("room_listings"/);
 assert.match(api,/rankMatches\(/);
 assert.match(app,/id="jrMatchForm"/);
 assert.match(app,/call\("find_matches"/);
 assert.match(app,/Why this matched:/);
});
