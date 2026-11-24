"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const server = fs.readFileSync("fresh/server.js", "utf8");
const html = fs.readFileSync("fresh/public/index.html", "utf8");
const app = fs.readFileSync("fresh/public/app.js", "utf8");
const provision = fs.readFileSync("supabase/functions/jr-member-provision/index.ts", "utf8");

test("personal invitation links are captured and passed only with account creation", () => {
  assert.match(app, /new URLSearchParams\(window\.location\.search\)\.get\("ref"\)/);
  assert.match(app, /sessionStorage\.setItem\("jr_referral_code"/);
  assert.match(app, /payload\.referralCode=invite\.toUpperCase\(\)/);
  assert.match(server, /referral_code:typeof referralCode==="string"/);
  assert.match(html, /records that invitation when you complete sign-up/);
});

test("each signed-in member receives a personal invitation code for sharing", () => {
  assert.match(provision, /referral_code/);
  assert.match(provision, /referralCode: member\.referral_code/);
  assert.match(app, /signedInUser\?\.referralCode/);
  assert.match(app, /\?ref=/);
});

test("referral attribution validates codes, blocks self-referral and issues no reward", () => {
  assert.match(provision, /\^JR-\[A-F0-9\]\{12\}\$/);
  assert.match(provision, /createdMember &&/);
  assert.match(provision, /referrer\.status === "active"/);
  assert.match(provision, /referrer\.id !== member\.id/);
  assert.match(provision, /reward: 0/);
  assert.match(provision, /resolution=ignore-duplicates/);
  assert.match(provision, /JR referral attribution could not be recorded/);
  assert.match(provision, /referralCode: member\.referral_code \|\| null/);
});
