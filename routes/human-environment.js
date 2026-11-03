"use strict";

// JR PHEEF — universal human environment foundation.
// This route deliberately records progress and proposes navigation only.
// It does not claim to perform external or high-impact actions.
module.exports = function mountHumanEnvironment(ctx) {
  const { app, db, clean, requireMember, logActivity } = ctx;
  const wrap = (label, fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(label + ":", clean(e && e.message).slice(0, 180));
      if (!res.headersSent) res.status(500).json({ ok: false, error: "JR could not complete that step. Please try again." });
    }
  };
  const bad = (res, message, status = 400) => res.status(status).json({ ok: false, error: message });
  const WORLDS = {
    personal: { title: "Your life", page: "profile", terms: /\b(my life|personal|myself|my goals|my profile|organise my life)\b/i },
    learning: { title: "Learning & knowledge", page: "teacher", terms: /\b(learn|teach|study|lesson|course|understand|explain|school|university|skill|practice a language)\b/i },
    creative: { title: "Creation & imagination", page: "scifi", terms: /\b(create|design|invent|imagine|write|draw|music|story|prototype|build an idea)\b/i },
    work: { title: "Work & projects", page: "projects", terms: /\b(work|job|career|project|task|plan my day|organise my day|resume|cv)\b/i },
    business: { title: "Business & enterprise", page: "businessgrowth", terms: /\b(business|company|shop|supermarket|customers|sales|stock|supplier|grow my business|operate)\b/i },
    opportunities: { title: "Opportunities & exchange", page: "find", terms: /\b(find|search|buy|sell|trade|opportunit|marketplace|product|service|job opening)\b/i },
    relationships: { title: "People & relationships", page: "connections", terms: /\b(connect|friend|people|relationship|contact|network|message|chat)\b/i },
    community: { title: "Community & society", page: "social", terms: /\b(community|society|volunteer|group|social|share a status)\b/i },
    family: { title: "Family", page: "family", terms: /\b(family|household|relatives|family goals)\b/i },
    civic: { title: "Civic & public services", page: "accessgov", terms: /\b(government|public service|county|citizen|civic|permit|public office)\b/i },
    exploration: { title: "Explore the world", page: "explore", terms: /\b(explore|discover|world|country|travel|where is|research|what is happening)\b/i },
    health: { title: "Health & wellbeing", page: "explore", terms: /\b(health|wellbeing|well-being|fitness|exercise|nutrition|sleep)\b/i },
    culture: { title: "Culture & expression", page: "explore", terms: /\b(culture|language|tradition|art|history|heritage)\b/i }
  };
  const CAPABILITIES = [
    ["learning", "Learn, practise and build skills", "ready"],
    ["discovery", "Explore information and possibilities", "ready"],
    ["creation", "Develop ideas and original work", "ready"],
    ["projects", "Turn goals into projects and tasks", "ready"],
    ["marketplace", "Find, match and trade", "ready"],
    ["business_operations", "Plan and improve a business", "ready"],
    ["connections", "Connect with other people", "ready"],
    ["private_files", "Keep and organise private files", "ready"],
    ["notifications", "Receive updates and reminders", "ready"]
  ];
  const STAGES = new Set(["discovering", "learning", "practising", "building", "contributing", "paused"]);
  const EVENT_KINDS = new Set(["interaction", "milestone", "reflection", "learning", "creation", "work", "connection", "resume"]);
  function infer(text) {
    for (const [key, world] of Object.entries(WORLDS)) if (world.terms.test(text)) return { key, ...world };
    return { key: "personal", title: "Your life", page: "assistant" };
  }
  function stageFor(key, text) {
    if (/\b(learn|teach|study|practis|understand|lesson)\b/i.test(text)) return "learning";
    if (/\b(create|build|make|write|design|launch|start)\b/i.test(text)) return "building";
    if (/\b(help|how|what|where|explore|find|show|tell)\b/i.test(text)) return "discovering";
    return key === "learning" ? "learning" : "practising";
  }
  app.get("/api/jr/environment", wrap("JR environment overview", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const [worlds, journal, permissions] = await Promise.all([
      db.from("jr_world_progress").select("world_key,stage,progress,last_position,last_interaction_at,updated_at").eq("member_id", member.id).order("last_interaction_at", { ascending: false }),
      db.from("jr_growth_journal").select("id,event_kind,world_key,title,detail,created_at").eq("member_id", member.id).order("created_at", { ascending: false }).limit(12),
      db.from("jr_capability_permissions").select("capability_key,enabled,scope,updated_at").eq("member_id", member.id)
    ]);
    for (const r of [worlds, journal, permissions]) if (r.error) throw r.error;
    const worldRows = worlds.data || [];
    const active = worldRows[0] || null;
    res.json({
      ok: true,
      principle: "JR PHEEF GROWS. IT DOES NOT FORGET.",
      identity: { jp_number: member.jp_number || null, display_name: member.full_name || "Member" },
      active_world: active,
      worlds: worldRows,
      journal: journal.data || [],
      capabilities: CAPABILITIES.map(([key, description, availability]) => {
        const setting = (permissions.data || []).find(p => p.capability_key === key);
        return { key, description, availability, enabled: setting ? setting.enabled : false, scope: setting?.scope || {} };
      }),
      boundaries: { external_connections: "not_connected", high_impact_actions: "confirmation_required", money_movement: "disabled_until_payment_activation" }
    });
  }));
  app.post("/api/jr/environment/interact", wrap("JR universal interaction", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const text = clean(req.body.text).slice(0, 1200);
    if (text.length < 2) return bad(res, "Tell JR what you would like to do, learn, create or explore.");
    const world = infer(text);
    const stage = stageFor(world.key, text);
    const explicit = clean(req.body.world_key);
    const worldKey = Object.hasOwn(WORLDS, explicit) ? explicit : world.key;
    const selected = WORLDS[worldKey];
    const title = text.length > 110 ? text.slice(0, 107) + "..." : text;
    const { error: upsertError } = await db.from("jr_world_progress").upsert({
      member_id: member.id, world_key: worldKey, stage,
      progress: { last_intent: text, last_page: selected.page },
      last_position: { page: selected.page },
      last_interaction_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }, { onConflict: "member_id,world_key" });
    if (upsertError) throw upsertError;
    const eventKind = stage === "learning" ? "learning" : stage === "building" ? "creation" : "interaction";
    const { data: journal, error: journalError } = await db.from("jr_growth_journal").insert({
      member_id: member.id, event_kind: eventKind, world_key: worldKey,
      title, detail: "JR recorded this interaction as part of your ongoing journey.", metadata: { stage, source: "universal_interaction" }
    }).select("id,event_kind,world_key,title,detail,created_at").single();
    if (journalError) throw journalError;
    await logActivity(member.id, "JR_WORLD_INTERACTION", { world_key: worldKey, stage });
    const page = selected.page;
    res.json({
      ok: true, understood: true, world: { key: worldKey, title: selected.title, stage },
      navigation: page === "assistant" ? null : { page, label: selected.title },
      response: page === "assistant"
        ? "I’m here. Tell me a little more about what you want to achieve, and we’ll work through it together."
        : "I’ve understood the direction and opened the space where we can work on it. Your progress is now part of your JR journey.",
      journal
    });
  }));
  app.post("/api/jr/environment/journal", wrap("JR growth journal entry", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const kind = clean(req.body.event_kind);
    const world = clean(req.body.world_key) || null;
    const title = clean(req.body.title).slice(0, 140);
    const detail = clean(req.body.detail).slice(0, 2000);
    if (!EVENT_KINDS.has(kind)) return bad(res, "Choose a valid journal event type.");
    if (world && !Object.hasOwn(WORLDS, world)) return bad(res, "Choose a valid JR world.");
    if (title.length < 2) return bad(res, "Give this moment a short title.");
    const { data, error } = await db.from("jr_growth_journal").insert({
      member_id: member.id, event_kind: kind, world_key: world, title, detail
    }).select("id,event_kind,world_key,title,detail,created_at").single();
    if (error) throw error;
    res.status(201).json({ ok: true, entry: data });
  }));
  app.patch("/api/jr/environment/worlds/:key", wrap("JR world progress update", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const key = clean(req.params.key);
    if (!Object.hasOwn(WORLDS, key)) return bad(res, "JR world not found.", 404);
    const stage = clean(req.body.stage);
    if (!STAGES.has(stage)) return bad(res, "Choose a valid growth stage.");
    const { data, error } = await db.from("jr_world_progress").upsert({
      member_id: member.id, world_key: key, stage,
      progress: req.body.progress && typeof req.body.progress === "object" && !Array.isArray(req.body.progress) ? req.body.progress : {},
      last_position: req.body.last_position && typeof req.body.last_position === "object" && !Array.isArray(req.body.last_position) ? req.body.last_position : {},
      last_interaction_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }, { onConflict: "member_id,world_key" }).select("world_key,stage,progress,last_position,last_interaction_at").single();
    if (error) throw error;
    res.json({ ok: true, world: data });
  }));
  app.put("/api/jr/environment/capabilities/:key", wrap("JR capability permission update", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const key = clean(req.params.key);
    if (!CAPABILITIES.some(x => x[0] === key)) return bad(res, "JR capability not found.", 404);
    if (typeof req.body.enabled !== "boolean") return bad(res, "Choose whether this capability is enabled.");
    const scope = req.body.scope && typeof req.body.scope === "object" && !Array.isArray(req.body.scope) ? req.body.scope : {};
    const { data, error } = await db.from("jr_capability_permissions").upsert({
      member_id: member.id, capability_key: key, enabled: req.body.enabled, scope, updated_at: new Date().toISOString()
    }, { onConflict: "member_id,capability_key" }).select("capability_key,enabled,scope,updated_at").single();
    if (error) throw error;
    res.json({ ok: true, capability: data, note: "This preference does not override transaction-specific consent or another person's permissions." });
  }));
};
