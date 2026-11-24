"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const migration=fs.readFileSync("supabase/migrations/20261124090000_create_private_jr_member_media_bucket.sql","utf8");
const api=fs.readFileSync("supabase/functions/jr-workspace-api/index.ts","utf8");

test("JR member media upload bucket exists as private storage",()=>{
  assert.match(migration,/insert into storage\.buckets/i);
  assert.match(migration,/'jr-pheef-member-media'/);
  assert.match(migration,/public\s*=\s*false/i);
  assert.match(migration,/8388608/);
  for(const mime of ["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"])
    assert.ok(migration.includes("'"+mime+"'"),"missing allowed MIME type "+mime);
  assert.match(migration,/on conflict \(id\) do update/i);
});

test("workspace media uploads and signed downloads use the provisioned private bucket",()=>{
  assert.match(api,/storage\/v1\/object\/jr-pheef-member-media\//);
  assert.match(api,/storage\/v1\/object\/sign\/jr-pheef-member-media\//);
  assert.match(api,/expiresIn:3600/);
  assert.match(api,/upload_media/);
});
