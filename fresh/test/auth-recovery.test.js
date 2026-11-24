"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const server = fs.readFileSync("fresh/server.js", "utf8");
const app = fs.readFileSync("fresh/public/app.js", "utf8");
const html = fs.readFileSync("fresh/public/index.html", "utf8");

test("password recovery request uses Supabase recovery endpoint and same-site redirect", () => {
  assert.match(server, /app\.post\("\/api\/auth\/recover"/);
  assert.match(server, /supabaseAuth\("recover\?redirect_to="/);
  assert.match(server, /If an account exists for that address/);
});

test("password update requires a recovery access token and validates password length", () => {
  assert.match(server, /app\.post\("\/api\/auth\/password\/update"/);
  assert.match(server, /Authorization:"Bearer "\+access_token/);
  assert.match(server, /method:"PUT"/);
  assert.match(server, /password\.length<8\|\|password\.length>128/);
});

test("recovery link is handled separately from signup email confirmation", () => {
  assert.match(app, /confirmationType==="recovery"/);
  assert.match(app, /api\("\/api\/auth\/password\/update"/);
  assert.match(app, /showAuth\("recovery"\)/);
});

test("login screen exposes a forgot-password action", () => {
  assert.match(html, /id="forgotPassword"/);
  assert.match(app, /api\("\/api\/auth\/recover"/);
});
