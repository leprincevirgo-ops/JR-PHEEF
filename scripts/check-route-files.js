const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const serverPath = path.join(root, "server.js");
const routesDir = path.join(root, "routes");
const server = fs.readFileSync(serverPath, "utf8");
let failures = 0;

const imports = [...server.matchAll(/require\(["'](\.\/routes\/[^"']+)["']\)/g)].map(m => m[1]);
for (const request of imports) {
  const target = path.resolve(root, request) + ".js";
  if (!fs.existsSync(target)) {
    failures++;
    console.error("FAIL: server.js imports missing route " + request);
    continue;
  }
  try {
    new vm.Script(fs.readFileSync(target, "utf8"), { filename: path.relative(root, target) });
    console.log("PASS: route exists and parses " + path.relative(root, target));
  } catch (error) {
    failures++;
    console.error("FAIL: route syntax " + path.relative(root, target) + ": " + error.message);
  }
}

if (!fs.existsSync(routesDir)) {
  failures++;
  console.error("FAIL: routes directory is missing");
} else {
  for (const name of fs.readdirSync(routesDir).filter(name => name.endsWith(".js"))) {
    const full = path.join(routesDir, name);
    try {
      new vm.Script(fs.readFileSync(full, "utf8"), { filename: path.relative(root, full) });
    } catch (error) {
      failures++;
      console.error("FAIL: route syntax " + path.relative(root, full) + ": " + error.message);
    }
  }
}

if (imports.length === 0) {
  failures++;
  console.error("FAIL: no route imports found in server.js");
}
if (failures) process.exit(1);
console.log("PASS: all server route imports exist and all route files parse.");
