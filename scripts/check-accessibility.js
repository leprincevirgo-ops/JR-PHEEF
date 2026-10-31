const fs=require("node:fs"),assert=require("node:assert/strict");
const js=fs.readFileSync("public/accessibility.js","utf8");
const html=fs.readFileSync("public/index.html","utf8");
assert.match(html,/<link rel="stylesheet" href="\/accessibility\.css">/);
assert.match(html,/<script src="\/accessibility\.js"><\/script>/);
for(const token of ["aria-live","aria-expanded","aria-controls","Skip to main content","Larger text","High contrast","Reduce motion","Read this page aloud","Stop reading","Quick communication phrases","speechSynthesis","clipboard.writeText"])assert.ok(js.includes(token),"Missing accessibility feature: "+token);
assert.match(js,/prefers-reduced-motion/);
console.log("JR PHEEF accessibility checks passed.");