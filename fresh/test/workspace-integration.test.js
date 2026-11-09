"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const app = fs.readFileSync("fresh/public/app.js", "utf8");
const html = fs.readFileSync("fresh/public/index.html", "utf8");
const server = fs.readFileSync("fresh/server.js", "utf8");

test("workspace browser script parses without syntax errors", () => {
  assert.doesNotThrow(() => new vm.Script(app));
});

test("member workspace exposes connected opportunity, marketplace, messaging and FAMILY workflows", () => {
  for (const action of ["create_listing", "create_opportunity", "express_interest", "create_business", "create_project", "create_family_goal", "create_delivery", "create_room_listing", "create_status", "update_profile", "search_members", "create_conversation", "send_message"]) {
    assert.ok(app.includes(action), "missing workspace action: " + action);
  }
  for (const id of ["liveHub", "marketFeed", "opportunityFeed", "conversationList", "messageList", "myGoals"]) {
    assert.ok(app.includes(id) || html.includes(id), "missing workspace surface: " + id);
  }
});

test("workspace and founder requests are proxied through authenticated server routes", () => {
  assert.match(server, /app\.post\("\/api\/workspace"/);
  assert.match(server, /app\.all\("\/api\/founder\/overview"/);
  assert.match(server, /req\.jrAccessToken/);
  assert.match(server, /HttpOnly/);
});
