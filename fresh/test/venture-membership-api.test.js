"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const api = fs.readFileSync("supabase/functions/jr-workspace-api/index.ts", "utf8");

test("venture membership applications require consent and a template-approved role", () => {
  assert.match(api, /action==="list_ventures"/);
  assert.match(api, /action==="get_venture_registration"/);
  assert.match(api, /action==="my_venture_memberships"/);
  assert.match(api, /action==="apply_venture_membership"/);
  assert.match(api, /input\.consent!==true/);
  assert.match(api, /roles\.some\(\(r:any\)=>r&&r\.key===roleKey\)/);
  assert.match(api, /event_type:existing\?"reapplied":"applied"/);
  assert.match(api, /status:"applied"/);
  assert.match(api, /venture_slug,member_id,role_key,status,application_data,consent_version/);
});

test("venture membership review is restricted to the verified founder and audited", () => {
  assert.match(api, /member\.role==="founder"&&member\.jp_number==="JP-01"&&member\.status==="active"/);
  assert.match(api, /action==="founder_list_venture_memberships"/);
  assert.match(api, /action==="founder_review_venture_membership"/);
  assert.match(api, /current\.venture_slug==="jr-pheef"/);
  assert.match(api, /event_type:status/);
  assert.match(api, /reviewed_by:mid/);
  assert.match(api, /status=eq\.\+encodeURIComponent\(current\.status\)/);
});
