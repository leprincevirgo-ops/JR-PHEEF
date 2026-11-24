"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const server = fs.readFileSync("fresh/server.js", "utf8");
const app = fs.readFileSync("fresh/public/app.js", "utf8");

test("confirmation links are verified by token hash only after the user opens JR PHEEF", () => {
  assert.match(server, /app\.post\("\/api\/auth\/verify-link",rateLimit,sameOrigin/);
  assert.match(server, /supabaseAuth\("verify",\{type:"email",token_hash:tokenHash\}\)/);
  assert.match(server, /provisionMember\(result\.data\.access_token\)/);
  assert.match(server, /saveSession\(res,result\.data\)/);
  assert.match(app, /queryParams\.get\("token_hash"\)/);
  assert.match(app, /api\("\/api\/auth\/verify-link",\{token_hash:emailTokenHash\}\)/);
  assert.match(app, /window\.history\.replaceState/);
});

test("confirmation-link verification accepts only supported email token types", () => {
  assert.match(app, /\["email","signup"\]\.includes\(emailTokenType\)/);
  assert.match(server, /tokenHash\.length<20\|\|tokenHash\.length>512/);
});
