"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const sql=fs.readFileSync("supabase/migrations/20261124103000_jr_dr_schema_fingerprint.sql","utf8");

test("cross-region fingerprint inventories schema objects required for recovery parity",()=>{
  assert.match(sql,/jr_dr_schema_fingerprint/);
  for(const object of ["pg_class","pg_attribute","pg_constraint","pg_index","pg_policies"])
    assert.ok(sql.includes(object),"missing schema inventory object "+object);
  for(const field of ["tables","columns","constraints","indexes","policies","rls_enabled","rls_forced","fingerprint"])
    assert.ok(sql.includes("'"+field+"'"),"missing fingerprint field "+field);
});

test("schema fingerprint function is read-only, stable, and uses a fixed search path",()=>{
  assert.match(sql,/language sql\s+stable\s+security invoker\s+set search_path = ''/i);
  assert.doesNotMatch(sql,/\b(insert|update|delete|truncate|drop)\s+(into\s+)?/i);
});

test("schema fingerprint cannot be executed by public client roles",()=>{
  assert.match(sql,/revoke all on function public\.jr_dr_schema_fingerprint\(\) from public/i);
  assert.match(sql,/revoke all on function public\.jr_dr_schema_fingerprint\(\) from anon/i);
  assert.match(sql,/revoke all on function public\.jr_dr_schema_fingerprint\(\) from authenticated/i);
  assert.match(sql,/grant execute on function public\.jr_dr_schema_fingerprint\(\) to service_role/i);
});
