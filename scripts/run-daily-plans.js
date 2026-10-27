"use strict";

const base = String(process.env.JR_PHEEF_BASE_URL || "https://jr-pheef-marketplace.onrender.com").replace(/\/$/, "");
const secret = process.env.DAILY_PLAN_CRON_SECRET;
if (!secret) {
  console.error("DAILY_PLAN_CRON_SECRET is required.");
  process.exit(1);
}
(async () => {
  const response = await fetch(base + "/api/internal/business-daily-plans/run", {
    method: "POST",
    headers: { "X-JR-CRON-SECRET": secret, "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(25 * 60 * 1000)
  });
  const data = await response.json().catch(() => ({}));
  console.log(JSON.stringify({ status: response.status, result: data }));
  if (!response.ok || data.ok !== true) process.exitCode = 1;
})().catch(error => {
  console.error("Daily business plans job failed:", String(error && error.message || error).slice(0, 180));
  process.exitCode = 1;
});
