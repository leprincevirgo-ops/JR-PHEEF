"use strict";
const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "..", "routes", "operations.js"), "utf8");
const required = [
  ["sales are scoped to the selected business", /from\("pos_sales"\)[\s\S]{0,220}eq\("business_id", businessId\)/],
  ["only completed POS sales are counted", /eq\("status", "completed"\)/],
  ["sales use a bounded 14-day window", /gte\("created_at", since\)/],
  ["active inventory is scoped to the selected business", /from\("pos_products"\)[\s\S]{0,220}eq\("business_id", businessId\)[\s\S]{0,100}eq\("active", true\)/],
  ["sale items are linked only to the selected business sales", /from\("pos_sale_items"\)[\s\S]{0,180}in\("sale_id", saleIds\)/],
  ["low stock is measured against configured reorder levels", source.includes("Number(p.stock_qty || 0) <= Number(p.reorder_level || 0)")],
  ["sales are explicitly not represented as profit", /Sales are not profit/],
  ["AI recommendations require owner approval for external actions", /without owner approval/],
  ["the fallback plan includes a POS data snapshot", /data_snapshot: signals/],
  ["the planner reads only the owner-authorized workspace before generation", /getOwnedBusiness\(member\.id, clean\(req\.params\.id\)\)/]
];
let failed = 0;
for (const [label, check] of required) {
  const ok = typeof check === "boolean" ? check : check.test(source);
  process.stdout.write((ok ? "PASS " : "FAIL ") + label + "\n");
  if (!ok) failed++;
}
if (failed) process.exitCode = 1;
else process.stdout.write("POS-aware business intelligence checks passed.\n");
