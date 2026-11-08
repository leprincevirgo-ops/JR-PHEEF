"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const route=fs.readFileSync("routes/business-os.js","utf8"),migration=fs.readFileSync("supabase/migrations/20261104113505_jr_global_business_workspaces.sql","utf8");
for(const x of ["supermarket","salon_beauty","barber","transport_logistics","professional_services","manufacturing"])assert.ok(route.includes(x),"Missing industry "+x);
for(const x of ["/api/businesses","/api/businesses/:id","/api/businesses/:id/imports","consent_confirmed","jr_business_workspaces","jr_business_workspace_members"])assert.ok(route.includes(x),"Missing route/security feature "+x);
for(const x of ["jr_business_workspaces","jr_business_workspace_members","jr_business_import_jobs","owner_member_id","enable row level security"])assert.ok(migration.includes(x),"Missing schema feature "+x);
assert.ok(!migration.includes("create table if not exists public.jr_businesses"),"Do not create a duplicate business registry");
new Function("module","exports","require",route);
console.log("PASS: existing global business workspace extension, owner-scoped APIs, import consent and database access controls.");
