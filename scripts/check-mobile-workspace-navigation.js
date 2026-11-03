"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("public/index.html","utf8"),js=fs.readFileSync("public/universe-home.js","utf8");
assert.ok(html.includes('id="jpUniversalForm"')&&html.includes('id="jpUniversalRequest"'),"One universal request composer must remain available.");
assert.ok(!html.includes('id="jpMoreMenu"')&&!html.includes('class="jp-more-wrap"'),"The old More menu must stay removed.");
assert.ok(js.includes("submitUniversalRequest")&&js.includes("goToAssistant"),"Universal requests must continue into JR.");
assert.ok(html.includes('data-page="home"')&&html.includes('data-page="explore"')&&html.includes('data-page="assistant"')&&html.includes('data-page="messages"'),"Core destinations must remain accessible.");
console.log("PASS: natural-language-first navigation with no technical More menu.");
