"use strict";

// Cross-device continuity and daily business plans.
// All database operations run server-side through the trusted Supabase client.
module.exports = function mountOperations(ctx) {
  const { app, db, clean, requireMember, logActivity } = ctx;
  const wrap = (name, fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(name + ":", clean(e && e.message).slice(0, 180));
      if (!res.headersSent) res.status(500).json({ ok: false, error: "This operation is temporarily unavailable." });
    }
  };
  const bad = (res, error, status = 400) => res.status(status).json({ ok: false, error });
  const PAGE_IDS = new Set([
    "home","ecosystem","universe","lab","library","find","create","rooms","points","flex","profile","assistant",
    "jpconnect","social","economy","vault","devices","voice","scifi","fixedit","mylistings","deals","alerts",
    "delivery","powersale","membership","accessgov","command","projects","ideas","ads","jrsettings","businessgrowth"
  ]);
  const nairobiDate = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    return parts.year + "-" + parts.month + "-" + parts.day;
  };

  // Cross-device member preferences. Only explicitly allowlisted, bounded UI data is accepted.
  const preferenceLimits = { app_hub: 100, discover_saved: 100 };
  function cleanPreferences(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    const out = {};
    if (Object.prototype.hasOwnProperty.call(input, "app_hub")) {
      if (!Array.isArray(input.app_hub) || input.app_hub.length > preferenceLimits.app_hub) return null;
      const apps = [];
      for (const item of input.app_hub) {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const name = clean(item.name).slice(0, 60), url = clean(item.url).slice(0, 2048), category = clean(item.category).slice(0, 60);
        let parsed; try { parsed = new URL(url); } catch { return null; }
        if (!name || !["http:","https:"].includes(parsed.protocol) || parsed.username || parsed.password || !category) return null;
        apps.push({ id: clean(item.id).slice(0, 80), name, url: parsed.href, category, favorite: item.favorite === true, createdAt: clean(item.createdAt).slice(0, 40) });
      }
      out.app_hub = apps;
    }
    if (Object.prototype.hasOwnProperty.call(input, "discover_saved")) {
      if (!Array.isArray(input.discover_saved) || input.discover_saved.length > preferenceLimits.discover_saved) return null;
      const topics = input.discover_saved.map(x => clean(x).trim().slice(0, 120));
      if (topics.some(x => !x)) return null;
      out.discover_saved = [...new Set(topics)];
    }
    if (Object.prototype.hasOwnProperty.call(input, "appearance")) {
      const a = input.appearance;
      if (!a || typeof a !== "object" || Array.isArray(a)) return null;
      const presets = ["Midnight","Royal purple","Emerald","Sunset","Ocean","Rose","Gold","Minimal"];
      const walls = ["aurora","nebula","sunset","waves","geometry","none"];
      const appearance = {};
      if (a.global !== undefined) { if (!presets.includes(a.global)) return null; appearance.global = a.global; }
      if (a.wallpaper !== undefined) { if (!walls.includes(a.wallpaper)) return null; appearance.wallpaper = a.wallpaper; }
      if (a.opacity !== undefined) { const n = Number(a.opacity); if (!Number.isInteger(n) || n < 0 || n > 60) return null; appearance.opacity = n; }
      if (a.section !== undefined) {
        if (!a.section || typeof a.section !== "object" || Array.isArray(a.section) || Object.keys(a.section).length > 40) return null;
        const sections = {};
        for (const [id,v] of Object.entries(a.section)) {
          if (!/^[a-z][a-z0-9_-]{0,40}$/.test(id) || !v || typeof v !== "object" || Array.isArray(v)) return null;
          const item = {};
          if (v.preset !== undefined) { if (!presets.includes(v.preset)) return null; item.preset = v.preset; }
          if (v.accent !== undefined) { if (!/^#[0-9a-f]{6}$/i.test(String(v.accent))) return null; item.accent = v.accent; }
          if (v.wallpaper !== undefined) { if (v.wallpaper !== "" && !walls.includes(v.wallpaper)) return null; item.wallpaper = v.wallpaper; }
          sections[id] = item;
        }
        appearance.section = sections;
      }
      for (const k of ["highContrast","compact","reduceMotion"]) if (a[k] !== undefined) { if (typeof a[k] !== "boolean") return null; appearance[k] = a[k]; }
      out.appearance = appearance;
    }
    return Object.keys(out).length ? out : null;
  }
  app.get("/api/preferences", wrap("Member preferences read", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const { data, error } = await db.from("jr_member_preferences").select("preferences,updated_at").eq("member_id", member.id).maybeSingle();
    if (error) throw error;
    res.json({ ok: true, preferences: data?.preferences || {}, updated_at: data?.updated_at || null });
  }));
  app.put("/api/preferences", wrap("Member preferences save", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const patch = cleanPreferences(req.body);
    if (!patch) return bad(res, "Preferences are invalid or contain unsupported fields.");
    const { data: current, error: readError } = await db.from("jr_member_preferences").select("preferences").eq("member_id", member.id).maybeSingle();
    if (readError) throw readError;
    const merged = { ...(current?.preferences || {}), ...patch };
    const { error } = await db.from("jr_member_preferences").upsert({ member_id: member.id, preferences: merged, updated_at: new Date().toISOString() }, { onConflict: "member_id" });
    if (error) throw error;
    res.json({ ok: true, preferences: merged });
  }));

  // Store only a small navigation checkpoint, never passwords or form contents.
  app.get("/api/continuity", wrap("Continuity read", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const { data, error } = await db.from("jr_member_state")
      .select("state,updated_at").eq("member_id", member.id).maybeSingle();
    if (error) throw error;
    res.json({ ok: true, state: data?.state || null, updated_at: data?.updated_at || null });
  }));
  app.put("/api/continuity", wrap("Continuity save", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const body = req.body || {};
    const page = clean(body.page);
    if (!PAGE_IDS.has(page)) return bad(res, "That page cannot be restored.");
    const scrollY = Number(body.scroll_y || 0);
    if (!Number.isFinite(scrollY) || scrollY < 0 || scrollY > 10000000) return bad(res, "Invalid page position.");
    const state = {
      page,
      scroll_y: Math.round(scrollY),
      saved_at: new Date().toISOString(),
      workspace_id: typeof body.workspace_id === "string" && body.workspace_id.length <= 80 ? body.workspace_id : null
    };
    const { error } = await db.from("jr_member_state").upsert({
      member_id: member.id, state, updated_at: new Date().toISOString()
    }, { onConflict: "member_id" });
    if (error) throw error;
    res.json({ ok: true, state });
  }));

  const DEFAULT_TASKS = {
    supermarket: [
      ["Review fast-moving stock and reorder alerts", "Use today's sales and stock records; verify counts before ordering."],
      ["Check expiry dates and prevent avoidable waste", "Prioritize short-dated items and record any action taken."],
      ["Confirm supplier deliveries and terms", "Compare delivery timing, total cost, and documented supplier terms."],
      ["Choose one customer-growth action", "Use an approved offer or customer service improvement; check margins first."],
      ["Reconcile today's sales and cash", "Compare POS totals, payment settlements, refunds, and cash on hand."]
    ],
    retail: [
      ["Review best sellers and stock gaps", "Use actual sales and stock data where connected."],
      ["Check pricing and product presentation", "Confirm prices and promotions are accurate."],
      ["Follow up on supplier orders", "Record delays, discrepancies, and agreed delivery times."],
      ["Reach one relevant customer group", "Prepare an approved, honest offer or service update."],
      ["Review sales and operating costs", "Compare actual results with your own baseline."]
    ],
    service: [
      ["Review today's bookings and commitments", "Confirm priorities, timing, and required resources."],
      ["Follow up on open customer requests", "Send messages only after approval or within authorized settings."],
      ["Check tools, materials, and readiness", "Resolve likely blockers before scheduled work."],
      ["Identify one customer-experience improvement", "Choose a small action you can measure."],
      ["Review completed work and outstanding invoices", "Reconcile records and schedule appropriate follow-up."]
    ],
    other: [
      ["Choose the three most important outcomes for today", "Prioritize by urgency, impact, effort, and available capacity."],
      ["Review outstanding customer or partner commitments", "Identify deadlines and follow up appropriately."],
      ["Check resources and likely blockers", "Review stock, tools, staff, cash needs, or other relevant inputs."],
      ["Take one measurable growth action", "Test a customer, service, product, or partnership improvement."],
      ["Review today's results and next steps", "Record outcomes and carry unfinished work forward."]
    ]
  };

  function sectorKey(sector) {
    const s = String(sector || "").toLowerCase();
    if (/supermarket|grocery|retail|shop|store/.test(s)) return s.includes("supermarket") || s.includes("grocery") ? "supermarket" : "retail";
    if (/service|repair|consult|professional|transport|delivery|salon|agency/.test(s)) return "service";
    return "other";
  }

  function templatePlan(business, date) {
    const rows = DEFAULT_TASKS[sectorKey(business.sector)] || DEFAULT_TASKS.other;
    return {
      date, business_name: business.business_name,
      headline: "Make measurable progress at " + business.business_name,
      summary: "A practical starting plan based on the business profile. Connect reliable sales, stock, customer, and cost data to make future plans more specific.",
      priorities: rows.map((r, i) => ({
        id: "task_" + (i + 1), title: r[0], detail: r[1],
        status: "pending", evidence: "General template; verify it applies to your business."
      })),
      numbers_to_watch: ["Completed priority tasks", "Customer requests resolved", "Actual sales and costs where records are available"],
      risks: ["No live business data was supplied; validate assumptions before spending money or changing operations."],
      source: "template"
    };
  }

  async function buildPlan(business, date) {
    const fallback = templatePlan(business, date);
    if (!process.env.OPENAI_API_KEY) return fallback;
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-6-astra",
          instructions: "You are JR PHEEF's practical daily business operating planner. Return only valid JSON with keys headline, summary, priorities (5 objects with title and detail), numbers_to_watch (up to 4 strings), risks (up to 3 strings). Use the business profile only; no invented sales, stock, margins, market research, or claims of measured results. Give safe actionable suggestions. Label assumptions and never promise revenue or profit. Do not recommend spending money, changing prices, placing orders, or contacting customers without owner approval.",
          input: JSON.stringify({
            business_name: business.business_name, sector: business.sector,
            location: business.location, goals: business.goals,
            date, constraints: "No sales/inventory/customer data connected yet. Make a useful plan without inventing facts."
          }),
          max_output_tokens: 1000,
          store: false
        }),
        signal: AbortSignal.timeout(18000)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Daily business AI unavailable:", response.status, clean(payload.error?.code || payload.error?.type || "provider_error"));
        return fallback;
      }
      const raw = clean(payload.output_text || (payload.output || []).flatMap(o => (o.content || []).filter(c => c.type === "output_text").map(c => c.text)).join("\n"));
      const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
      if (a < 0 || b <= a) return fallback;
      const j = JSON.parse(raw.slice(a, b + 1));
      if (!Array.isArray(j.priorities) || j.priorities.length < 3) return fallback;
      return {
        date, business_name: business.business_name,
        headline: clean(j.headline).slice(0, 180) || fallback.headline,
        summary: clean(j.summary).slice(0, 800) || fallback.summary,
        priorities: j.priorities.slice(0, 7).map((p, i) => ({
          id: "task_" + (i + 1), title: clean(p.title).slice(0, 180),
          detail: clean(p.detail).slice(0, 600), status: "pending",
          evidence: "AI recommendation based on the supplied business profile; validate before acting."
        })).filter(p => p.title),
        numbers_to_watch: (Array.isArray(j.numbers_to_watch) ? j.numbers_to_watch : fallback.numbers_to_watch).map(x => clean(x).slice(0, 180)).slice(0, 4),
        risks: (Array.isArray(j.risks) ? j.risks : fallback.risks).map(x => clean(x).slice(0, 220)).slice(0, 3),
        source: "ai"
      };
    } catch (e) {
      console.error("Daily business plan fallback:", clean(e.message).slice(0, 120));
      return fallback;
    }
  }

  async function getOwnedBusiness(memberId, businessId) {
    const { data, error } = await db.from("jr_business_workspaces").select("*")
      .eq("id", businessId).eq("owner_member_id", memberId).maybeSingle();
    if (error) throw error;
    return data;
  }

  app.get("/api/business/workspaces", wrap("Business workspaces", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const { data, error } = await db.from("jr_business_workspaces").select("id,business_name,sector,location,goals,plan_tier,daily_plan_enabled,created_at,updated_at")
      .eq("owner_member_id", member.id).order("updated_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ ok: true, businesses: data || [] });
  }));

  app.post("/api/business/workspaces", wrap("Business workspace create", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const business_name = clean(req.body.business_name);
    const sector = clean(req.body.sector || "other").slice(0, 80);
    const location = clean(req.body.location).slice(0, 160);
    const goals = clean(req.body.goals).slice(0, 1000);
    if (business_name.length < 2 || business_name.length > 160) return bad(res, "Enter a business name between 2 and 160 characters.");
    const { count, error: countError } = await db.from("jr_business_workspaces").select("id", { count: "exact", head: true }).eq("owner_member_id", member.id);
    if (countError) throw countError;
    if ((count || 0) >= 20) return bad(res, "You can manage up to 20 business workspaces.", 409);
    const { data, error } = await db.from("jr_business_workspaces").insert({
      owner_member_id: member.id, business_name, sector, location: location || null, goals: goals || null
    }).select("id,business_name,sector,location,goals,plan_tier,daily_plan_enabled,created_at").single();
    if (error) throw error;
    await logActivity(member.id, "BUSINESS_WORKSPACE_CREATED", { business_id: data.id });
    res.status(201).json({ ok: true, business: data });
  }));

  app.get("/api/business/:id/daily-plan", wrap("Daily business plan read", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const business = await getOwnedBusiness(member.id, clean(req.params.id));
    if (!business) return bad(res, "Business workspace not found.", 404);
    const date = nairobiDate();
    const { data, error } = await db.from("jr_business_daily_plans").select("*")
      .eq("business_id", business.id).eq("plan_date", date).maybeSingle();
    if (error) throw error;
    res.json({ ok: true, business, daily_plan: data || null, date });
  }));

  app.post("/api/business/:id/daily-plan", wrap("Daily business plan generate", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const business = await getOwnedBusiness(member.id, clean(req.params.id));
    if (!business) return bad(res, "Business workspace not found.", 404);
    if (!business.daily_plan_enabled) return bad(res, "Daily business plans are paused for this workspace.", 403);
    const date = nairobiDate();
    const { data: existing, error: readError } = await db.from("jr_business_daily_plans").select("*")
      .eq("business_id", business.id).eq("plan_date", date).maybeSingle();
    if (readError) throw readError;
    if (existing) return res.json({ ok: true, daily_plan: existing, reused: true });
    const plan = await buildPlan(business, date);
    const { data, error } = await db.from("jr_business_daily_plans").insert({
      business_id: business.id, plan_date: date, plan, source: plan.source, status: "ready"
    }).select("*").single();
    if (error) {
      if (error.code === "23505") {
        const { data: concurrent } = await db.from("jr_business_daily_plans").select("*")
          .eq("business_id", business.id).eq("plan_date", date).maybeSingle();
        if (concurrent) return res.json({ ok: true, daily_plan: concurrent, reused: true });
      }
      throw error;
    }
    await db.from("jr_notifications").insert({
      member_id: member.id, title: "Your daily business plan is ready",
      message: "JR prepared today's operating plan for " + business.business_name + ". Open your business workspace to review it.",
      type: "business_daily_plan"
    });
    await logActivity(member.id, "BUSINESS_DAILY_PLAN_CREATED", { business_id: business.id, plan_date: date, source: plan.source });
    res.status(201).json({ ok: true, daily_plan: data, reused: false });
  }));

  app.patch("/api/business/:id/daily-plan/tasks/:taskId", wrap("Daily plan task update", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const business = await getOwnedBusiness(member.id, clean(req.params.id));
    if (!business) return bad(res, "Business workspace not found.", 404);
    const date = nairobiDate();
    const { data: row, error } = await db.from("jr_business_daily_plans").select("*")
      .eq("business_id", business.id).eq("plan_date", date).maybeSingle();
    if (error) throw error;
    if (!row) return bad(res, "Generate today's plan first.", 404);
    const plan = row.plan || {};
    const tasks = Array.isArray(plan.priorities) ? plan.priorities : [];
    const task = tasks.find(t => t.id === clean(req.params.taskId));
    if (!task) return bad(res, "Task not found.", 404);
    const status = clean(req.body.status);
    if (!["pending", "completed", "skipped"].includes(status)) return bad(res, "Choose pending, completed, or skipped.");
    task.status = status;
    const completed = tasks.filter(t => t.status === "completed").length;
    const planStatus = completed === tasks.length ? "completed" : completed > 0 ? "in_progress" : "ready";
    const { data: updated, error: updateError } = await db.from("jr_business_daily_plans").update({
      plan, status: planStatus, completed_tasks: tasks.filter(t => t.status === "completed").map(t => t.id),
      updated_at: new Date().toISOString()
    }).eq("id", row.id).select("*").single();
    if (updateError) throw updateError;
    res.json({ ok: true, daily_plan: updated });
  }));

  // Optional scheduler hook. Configure an external scheduler to POST this route with
  // X-JR-CRON-SECRET. Without that secret and scheduler, plans are generated on demand.
  app.post("/api/internal/business-daily-plans/run", wrap("Daily plan scheduler", async (req, res) => {
    const secret = process.env.DAILY_PLAN_CRON_SECRET;
    if (!secret || clean(req.get("x-jr-cron-secret")) !== secret) return bad(res, "Not found.", 404);
    const { data: businesses, error } = await db.from("jr_business_workspaces")
      .select("*").eq("daily_plan_enabled", true).limit(500);
    if (error) throw error;
    const date = nairobiDate();
    let created = 0, reused = 0, failed = 0;
    for (const business of businesses || []) {
      try {
        const { data: existing, error: e } = await db.from("jr_business_daily_plans").select("id")
          .eq("business_id", business.id).eq("plan_date", date).maybeSingle();
        if (e) throw e;
        if (existing) { reused++; continue; }
        const plan = await buildPlan(business, date);
        const { error: insertError } = await db.from("jr_business_daily_plans").insert({
          business_id: business.id, plan_date: date, plan, source: plan.source, status: "ready"
        });
        if (insertError && insertError.code !== "23505") throw insertError;
        await db.from("jr_notifications").insert({
          member_id: business.owner_member_id, title: "Your daily business plan is ready",
          message: "JR prepared today's operating plan for " + business.business_name + ". Open your business workspace to review it.",
          type: "business_daily_plan"
        });
        created++;
      } catch (e) {
        failed++;
        console.error("Daily plan job failed for workspace:", clean(e.message).slice(0, 120));
      }
    }
    res.json({ ok: failed === 0, date, businesses: businesses?.length || 0, created, reused, failed });
  }));
};
