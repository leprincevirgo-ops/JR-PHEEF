"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const freshServer=fs.readFileSync("fresh/server.js","utf8");
const legacyServer=fs.readFileSync("server.js","utf8");
const legacyPayments=fs.readFileSync("routes/payments.js","utf8");
const register=fs.readFileSync("docs/FEATURE-PRESERVATION-REGISTER.md","utf8");

test("listing and matching remain free throughout active and legacy server paths",()=>{
  assert.match(freshServer,/listing and match actions are free/i);
  assert.match(legacyServer,/listings and matching are free/i);
  assert.doesNotMatch(legacyPayments,/deal_fee|matchFee|match_fee|CONNECTION_FEES_ENABLED|connection_fees|STD_FEE|MEMBER_FEE/);
  assert.match(register,/Listing and match fees \| Permanently removed/);
  assert.doesNotMatch(register,/Match fee KSh 30 buyer|Pro\/Prime KSh 20/);
});

test("optional membership subscriptions remain distinct from listing and matching charges",()=>{
  assert.match(legacyPayments,/membership_pro/);
  assert.match(legacyPayments,/membership_prime/);
  assert.doesNotMatch(legacyPayments,/deal_fee/);
});
