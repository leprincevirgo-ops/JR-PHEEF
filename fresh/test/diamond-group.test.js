"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Diamond Group lifecycle migration models parent ownership and future physical companies", () => {
  const sql = fs.readFileSync(path.join(__dirname, "../../supabase/migrations/20261118104150_diamond_group_company_lifecycle.sql"), "utf8");
  for (const column of ["parent_venture_slug", "ownership_percent", "legal_entity_status", "operating_structure", "registration_country", "registered_name", "registration_number", "physical_presence_status", "physical_presence"]) {
    assert.match(sql, new RegExp("add column if not exists " + column));
  }
  assert.match(sql, /references public\.ventures\(slug\)/);
  assert.match(sql, /ownership_percent=100/);
  assert.match(sql, /where slug in \('jr-pheef','family'\)/);
  assert.match(sql, /legal_entity_status='planned'/);
  assert.match(sql, /physical_presence_status='planned'/);
  assert.match(sql, /create index if not exists ventures_parent_venture_slug_idx/);
});

test("FAMILY remains regulated and no licence or company registration is fabricated", () => {
  const sql = fs.readFileSync(path.join(__dirname, "../../supabase/migrations/20261118104150_diamond_group_company_lifecycle.sql"), "utf8");
  assert.doesNotMatch(sql, /set\s+licence_ref\s*=/i);
  assert.doesNotMatch(sql, /set\s+registration_number\s*=/i);
  assert.match(sql, /legal_entity_status='planned'/);
});
