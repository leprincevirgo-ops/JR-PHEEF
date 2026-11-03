"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("routes/jr.js", "utf8");
const start = source.indexOf("  const INTENT_ROUTES = [");
const end = source.indexOf("\n\n  function ruleParse", start);
assert.ok(start >= 0 && end > start, "Natural intent route registry must exist.");
const snippet = source.slice(start, end) + "\nglobalThis.routeByIntent = routeByIntent;";
const context = { clean: value => String(value || "").trim(), PAGES: ["home","ecosystem","universe","lab","library","find","create","rooms","points","flex","profile","assistant","discover","explore","apphub","browser","messages","businessgrowth","jpconnect","social","economy","vault","devices","voice","scifi","fixedit","mylistings","deals","alerts","delivery","powersale","membership","accessgov","command","projects","ideas","ads","jrsettings","teacher","family","dgbo","connections"] };
vm.createContext(context);
vm.runInContext(snippet, context);
const cases = [
  ["JR, I want to become a rider", "delivery"],
  ["Where is the rider with my parcel?", "delivery"],
  ["Track my delivery", "delivery"],
  ["I want to join the ecosystem", "ecosystem"],
  ["Open my status", "social"],
  ["Show my chats", "messages"],
  ["Open my messages", "messages"],
  ["Open my browser", "browser"],
  ["Review my daily business plan", "businessgrowth"],
  ["Open JR Library", "library"],
  ["Let's see my gallery", "vault"],
  ["Share my documents", "vault"],
  ["Show my companies", "command"],
  ["Explain the meaning of life", null],
  ["Teach me science", "teacher"],
  ["Open my projects", "projects"],
  ["Find me a bedsitter", "rooms"],
  ["Show my notifications", "alerts"],
  ["Open FAMILY", "family"],
  ["Show my rewards", "economy"],
  ["Find a repair technician", "fixedit"]
];
for (const [input, expected] of cases) assert.equal(context.routeByIntent(input), expected, input);
console.log("PASS: JR natural-language examples route only to existing workspaces; unrelated questions remain with JR Assistant.");
