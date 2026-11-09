"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("fresh/public/command-layout.js", "utf8");
const html = fs.readFileSync("fresh/public/index.html", "utf8");
test("Command Center layout script parses", () => {
  assert.doesNotThrow(() => new vm.Script(source));
});
test("Command Center presents profile, chats, contacts, status, updates and JR access", () => {
  for (const label of ["Profile", "Chats", "Contacts", "Status", "Updates", "Talk to JR"]) assert.ok(source.includes(label));
  assert.ok(html.includes("command-layout.js"));
});
