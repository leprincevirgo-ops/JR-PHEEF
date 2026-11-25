"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {buildContentSecurityPolicy,httpsOrigin}=require("../security-policy");

test("Supabase signed media origin is allowed for images and video",()=>{
  const policy=buildContentSecurityPolicy("https://jr-project.supabase.co/storage/v1");
  assert.match(policy,/img-src[^;]*https:\/\/jr-project\.supabase\.co/);
  assert.match(policy,/media-src[^;]*https:\/\/jr-project\.supabase\.co/);
  assert.match(policy,/https:\/\/images\.unsplash\.com/);
});

test("only HTTPS origins are accepted and URL paths are not copied into policy",()=>{
  assert.equal(httpsOrigin("http://jr-project.supabase.co"),"");
  assert.equal(httpsOrigin("https://jr-project.supabase.co/path/to/storage"),"https://jr-project.supabase.co");
  assert.equal(httpsOrigin("not a url"),"");
});

test("malformed origin input cannot inject additional policy directives",()=>{
  const policy=buildContentSecurityPolicy("https://media.example.test/path; script-src *");
  assert.match(policy,/img-src[^;]*https:\/\/media\.example\.test/);
  assert.doesNotMatch(policy,/script-src \*|path;/);
});

test("security policy retains restrictive script, form, frame and object rules",()=>{
  const policy=buildContentSecurityPolicy("https://jr-project.supabase.co");
  assert.match(policy,/script-src 'self'/);
  assert.match(policy,/form-action 'self'/);
  assert.match(policy,/frame-ancestors 'none'/);
  assert.match(policy,/object-src 'none'/);
  assert.doesNotMatch(policy,/unsafe-inline|unsafe-eval/);
});
