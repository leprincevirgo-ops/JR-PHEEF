"use strict";

// JR PHEEF — universal human environment foundation.
// One member identity, many permission-separated worlds, private progress and continuity.
module.exports = function mountHumanEnvironment(ctx) {
  const { app, db, clean, requireMember, logActivity, checkRequestRate } = ctx;
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
  const wrap = (label, fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(label + ":", clean(e && e.message).slice(0, 180));
      if (!res.headersSent) res.status(500).json({ ok: false, error: "JR could not complete that step. Please try again." });
    }
  };
  const bad = (res, message, status = 400) => res.status(status).json({ ok: false, error: message });
  function limited(req, res, scope, max = 60) {
    if (!checkRequestRate) return false;
    const r = checkRequestRate(req, scope, max, 3600000);
    if (r.allowed) return false;
    res.setHeader("Retry-After", String(r.retryAfter));
    bad(res, "Please slow down and try again shortly.", 429);
    return true;
  }
  async function recordSecurityEvent(memberId, eventType, resourceType, resourceId, summary, metadata = {}) {
    const { error } = await db.from("jr_security_events").insert({
      member_id: memberId, event_type: eventType, resource_type: resourceType,
      resource_id: resourceId ? String(resourceId).slice(0, 120) : null,
      summary: clean(summary).slice(0, 280),
      metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}
    });
    if (error) throw error;
  }

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
  async function ensureWorldRows(memberId) {
    const { data: existing, error: readError } = await db.from("jr_world_progress").select("world_key").eq("member_id", memberId);
    if (readError) throw readError;
    const present = new Set((existing || []).map(row => row.world_key));
    const missing = Object.keys(WORLDS).filter(key => key !== "health" && !present.has(key))
      .map(world_key => ({ member_id: memberId, world_key, stage: "discovering", progress: {}, last_position: {} }));
    if (missing.length) {
      const { error } = await db.from("jr_world_progress").upsert(missing, { onConflict: "member_id,world_key", ignoreDuplicates: true });
      if (error) throw error;
    }
    const { data, error } = await db.from("jr_world_progress")
      .select("world_key,stage,progress,last_position,last_interaction_at,updated_at")
      .eq("member_id", memberId).order("last_interaction_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  app.get("/api/jr/environment", wrap("JR environment overview", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const [worldRows, journal, permissions, proposals] = await Promise.all([
      ensureWorldRows(member.id),
      db.from("jr_growth_journal").select("id,event_kind,world_key,title,detail,created_at").eq("member_id", member.id).order("created_at", { ascending: false }).limit(12),
      db.from("jr_capability_permissions").select("capability_key,enabled,scope,updated_at").eq("member_id", member.id),
      db.from("jr_action_proposals").select("id,action_key,summary,risk_level,status,requires_confirmation,created_at,expires_at,decided_at").eq("member_id", member.id).order("created_at", { ascending: false }).limit(8)
    ]);
    for (const r of [journal, permissions, proposals]) if (r.error) throw r.error;
    res.json({
      ok: true,
      principle: "JR PHEEF GROWS. IT DOES NOT FORGET.",
      identity: { jp_number: member.jp_number || null, display_name: member.full_name || "Member" },
      active_world: worldRows[0] || null,
      worlds: Object.entries(WORLDS).map(([key, meta]) => { const row = worldRows.find(item => item.world_key === key); return row ? { ...row, title: meta.title, page: meta.page } : { world_key: key, stage: "discovering", progress: {}, last_position: {}, last_interaction_at: null, title: meta.title, page: meta.page, private_by_default: key === "health" }; }),
      journal: journal.data || [],
      action_proposals: proposals.data || [],
      capabilities: CAPABILITIES.map(([key, description, availability]) => {
        const setting = (permissions.data || []).find(p => p.capability_key === key);
        return { key, description, availability, enabled: setting ? setting.enabled : false, scope: setting?.scope || {} };
      }),
      boundaries: { external_connections: "not_connected", high_impact_actions: "confirmation_required", money_movement: "disabled_until_payment_activation" }
    });
  }));

  app.post("/api/jr/environment/interact", wrap("JR universal interaction", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (limited(req, res, "jr-universe-interact", 60)) return;
    const text = clean(req.body.text).slice(0, 1200);
    if (text.length < 2) return bad(res, "Tell JR what you would like to do, learn, create or explore.");
    const inferred = infer(text), stage = stageFor(inferred.key, text);
    const explicit = clean(req.body.world_key);
    const worldKey = Object.hasOwn(WORLDS, explicit) ? explicit : inferred.key;
    const selected = WORLDS[worldKey];
    const title = "Started in " + selected.title;
    let journal = null;
    let checkpointSaved = false;
    if (worldKey !== "health") {
      const now = new Date().toISOString();
      const { error: upsertError } = await db.from("jr_world_progress").upsert({
        member_id: member.id, world_key: worldKey, stage,
        progress: { intent_stage: stage, last_page: selected.page },
        last_position: { page: selected.page },
        last_interaction_at: now, updated_at: now
      }, { onConflict: "member_id,world_key" });
      if (upsertError) throw upsertError;
      const eventKind = stage === "learning" ? "learning" : stage === "building" ? "creation" : "interaction";
      const { data, error: journalError } = await db.from("jr_growth_journal").insert({
        member_id: member.id, event_kind: eventKind, world_key: worldKey,
        title, detail: "JR saved a private progress checkpoint. The original request text is not copied into this growth-journal entry.",
        metadata: { stage, source: "universal_interaction" }
      }).select("id,event_kind,world_key,title,detail,created_at").single();
      if (journalError) throw journalError;
      journal = data;
      checkpointSaved = true;
      await logActivity(member.id, "JR_WORLD_INTERACTION", { world_key: worldKey, stage });
    }
    res.json({
      ok: true, understood: true, checkpoint_saved: checkpointSaved,
      world: { key: worldKey, title: selected.title, stage },
      navigation: selected.page === "assistant" ? null : { page: selected.page, label: selected.title },
      response: selected.page === "assistant"
        ? "I’m here. Tell me a little more about what you want to achieve, and we’ll work through it together."
        : "I’ve understood the direction and opened the space where we can work on it. Your progress is now part of your JR journey.",
      journal
    });
  }));

  app.post("/api/jr/environment/journal", wrap("JR growth journal entry", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (limited(req, res, "jr-universe-journal", 80)) return;
    const kind = clean(req.body.event_kind), world = clean(req.body.world_key) || null;
    const title = clean(req.body.title).slice(0, 140), detail = clean(req.body.detail).slice(0, 2000);
    if (!EVENT_KINDS.has(kind)) return bad(res, "Choose a valid journal event type.");
    if (world && !Object.hasOwn(WORLDS, world)) return bad(res, "Choose a valid JR world.");
    if (title.length < 2) return bad(res, "Give this moment a short title.");
    const { data, error } = await db.from("jr_growth_journal").insert({
      member_id: member.id, event_kind: kind, world_key: world, title, detail,
      metadata: { source: "jr_pheef" }
    }).select("id,event_kind,world_key,title,detail,created_at").single();
    if (error) throw error;
    res.status(201).json({ ok: true, entry: data });
  }));

  app.patch("/api/jr/environment/worlds/:key", wrap("JR world progress update", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const key = clean(req.params.key), stage = clean(req.body.stage);
    if (!Object.hasOwn(WORLDS, key)) return bad(res, "JR world not found.", 404);
    if (key === "health") return bad(res, "Health-related progress is not saved by default. You can still explore general information without adding it to your journey.", 403);
    if (!STAGES.has(stage)) return bad(res, "Choose a valid growth stage.");
    const progress = req.body.progress, position = req.body.last_position;
    if (progress !== undefined && (!progress || typeof progress !== "object" || Array.isArray(progress) || JSON.stringify(progress).length > 3000)) return bad(res, "Progress data must be a small object.");
    if (position !== undefined && (!position || typeof position !== "object" || Array.isArray(position) || JSON.stringify(position).length > 1500)) return bad(res, "Resume position must be a small object.");
    const { data: old, error: readError } = await db.from("jr_world_progress").select("progress,last_position")
      .eq("member_id", member.id).eq("world_key", key).maybeSingle();
    if (readError) throw readError;
    const now = new Date().toISOString();
    const { data, error } = await db.from("jr_world_progress").upsert({
      member_id: member.id, world_key: key, stage,
      progress: progress === undefined ? (old?.progress || {}) : progress,
      last_position: position === undefined ? (old?.last_position || {}) : position,
      last_interaction_at: now, updated_at: now
    }, { onConflict: "member_id,world_key" }).select("world_key,stage,progress,last_position,last_interaction_at").single();
    if (error) throw error;
    res.json({ ok: true, world: data });
  }));

  app.put("/api/jr/environment/capabilities/:key", wrap("JR capability permission update", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const key = clean(req.params.key);
    if (!CAPABILITIES.some(item => item[0] === key)) return bad(res, "JR capability not found.", 404);
    if (typeof req.body.enabled !== "boolean") return bad(res, "Choose whether this capability is enabled.");
    const scope = req.body.scope && typeof req.body.scope === "object" && !Array.isArray(req.body.scope) ? req.body.scope : {};
    if (JSON.stringify(scope).length > 1000) return bad(res, "Capability scope is too large.");
    const { data, error } = await db.from("jr_capability_permissions").upsert({
      member_id: member.id, capability_key: key, enabled: req.body.enabled, scope, updated_at: new Date().toISOString()
    }, { onConflict: "member_id,capability_key" }).select("capability_key,enabled,scope,updated_at").single();
    if (error) throw error;
    res.json({ ok: true, capability: data, note: "This preference does not override transaction-specific consent or another person's permissions." });
  }));
  // Long-term memory is explicit, member-owned and non-sensitive by design.
  const MEMORY_KINDS = new Set(["preference", "goal", "project_context", "workflow", "non_sensitive_fact"]);
  app.get("/api/jr/environment/memories", wrap("JR member memory list", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const { data, error } = await db.from("jr_memory_items")
      .select("id,memory_kind,memory_text,consent_ai_context,active,source,created_at,updated_at")
      .eq("member_id", member.id).eq("active", true)
      .order("updated_at", { ascending: false }).limit(40);
    if (error) throw error;
    res.json({ ok: true, memories: data || [] });
  }));
  app.post("/api/jr/environment/memories", wrap("JR member memory create", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (limited(req, res, "jr-memory-create", 30)) return;
    const kind = clean(req.body.memory_kind);
    const value = clean(req.body.memory_text).slice(0, 1000);
    if (!MEMORY_KINDS.has(kind)) return bad(res, "Choose a supported, non-sensitive memory category.");
    if (value.length < 3) return bad(res, "Write a little more about what JR should remember.");
    if (req.body.consent_ai_context !== true) return bad(res, "Confirm whether JR may reuse this memory as context in future AI conversations.");
    const { count, error: countError } = await db.from("jr_memory_items").select("id", { count: "exact", head: true }).eq("member_id", member.id).eq("active", true);
    if (countError) throw countError;
    if (count >= 40) return bad(res, "You can keep up to 40 active memory items. Review or remove an older one first.", 409);
    const { data, error } = await db.from("jr_memory_items").insert({
      member_id: member.id, memory_kind: kind, memory_text: value,
      consent_ai_context: true, active: true, source: "member_entered"
    }).select("id,memory_kind,memory_text,consent_ai_context,active,source,created_at,updated_at").single();
    if (error) throw error;
    await recordSecurityEvent(member.id, "memory_created", "memory_item", data.id, "Member explicitly saved a non-sensitive JR memory.", { memory_kind: kind, consent_ai_context: true });
    res.status(201).json({ ok: true, memory: data, note: "Saved because you explicitly asked JR to remember it. You can disable AI reuse or delete it at any time." });
  }));
  app.patch("/api/jr/environment/memories/:id", wrap("JR member memory consent update", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const id = clean(req.params.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return bad(res, "Memory item not found.", 404);
    if (typeof req.body.consent_ai_context !== "boolean") return bad(res, "Choose whether JR may reuse this memory in future AI conversations.");
    const { data, error } = await db.from("jr_memory_items").update({
      consent_ai_context: req.body.consent_ai_context, updated_at: new Date().toISOString()
    }).eq("id", id).eq("member_id", member.id).eq("active", true)
      .select("id,memory_kind,memory_text,consent_ai_context,active,source,created_at,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Memory item not found.", 404);
    await recordSecurityEvent(member.id, "memory_consent_changed", "memory_item", id, "Member changed AI reuse consent for a JR memory.", { consent_ai_context: data.consent_ai_context });
    res.json({ ok: true, memory: data });
  }));
  app.delete("/api/jr/environment/memories/:id", wrap("JR member memory delete", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const id = clean(req.params.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(id)) return bad(res, "Memory item not found.", 404);
    const { data, error } = await db.from("jr_memory_items").update({ active: false, consent_ai_context: false, updated_at: new Date().toISOString() })
      .eq("id", id).eq("member_id", member.id).eq("active", true).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Memory item not found.", 404);
    await recordSecurityEvent(member.id, "memory_deactivated", "memory_item", id, "Member removed a JR memory from active use.");
    res.json({ ok: true, deleted: true, note: "This memory is no longer active or used as AI context." });
  }));

  // Action proposals are a durable consent record, not an execution engine.
  // An approved proposal must still be handed to a separately authorised connector.
  const ACTION_RISKS = new Set(["low", "medium", "high", "critical"]);
  const ACTION_DECISIONS = new Set(["approve", "reject"]);
  app.get("/api/jr/actions/proposals", wrap("JR action proposals", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const now = new Date().toISOString();
    const { data: expired, error: expireError } = await db.from("jr_action_proposals")
      .update({ status: "expired", decided_at: now })
      .eq("member_id", member.id).eq("status", "pending").lt("expires_at", now)
      .select("id");
    if (expireError) throw expireError;
    const { data, error } = await db.from("jr_action_proposals")
      .select("id,action_key,summary,risk_level,status,requires_confirmation,created_at,expires_at,decided_at")
      .eq("member_id", member.id).order("created_at", { ascending: false }).limit(40);
    if (error) throw error;
    res.json({ ok: true, proposals: data || [], expired_count: (expired || []).length });
  }));

  app.post("/api/jr/actions/proposals", wrap("JR action proposal create", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (limited(req, res, "jr-action-proposal-create", 30)) return;
    const actionKey = clean(req.body.action_key).toLowerCase();
    const summary = clean(req.body.summary).slice(0, 280);
    const risk = clean(req.body.risk_level).toLowerCase();
    const idempotencyKey = clean(req.body.idempotency_key).slice(0, 100);
    if (!/^[a-z][a-z0-9_.:-]{1,79}$/.test(actionKey)) return bad(res, "Give this action a valid identifier.");
    if (summary.length < 5) return bad(res, "Explain what JR is proposing to do.");
    if (!ACTION_RISKS.has(risk)) return bad(res, "Choose a valid risk level.");
    if (idempotencyKey && !/^[a-zA-Z0-9_.:-]{8,100}$/.test(idempotencyKey)) return bad(res, "The request reference is invalid.");
    if (idempotencyKey) {
      const { data: prior, error: priorError } = await db.from("jr_action_proposals")
        .select("id,action_key,summary,risk_level,status,requires_confirmation,created_at,expires_at,decided_at")
        .eq("member_id", member.id).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (priorError) throw priorError;
      if (prior) return res.json({ ok: true, proposal: prior, reused: true });
    }
    const now = Date.now();
    const requestedExpiry = Number(req.body.expires_in_hours);
    const hours = Number.isFinite(requestedExpiry) ? Math.min(72, Math.max(1, requestedExpiry)) : 24;
    const { data, error } = await db.from("jr_action_proposals").insert({
      member_id: member.id, action_key: actionKey, summary, risk_level: risk,
      status: "pending", requires_confirmation: true,
      idempotency_key: idempotencyKey || null,
      expires_at: new Date(now + hours * 3600000).toISOString()
    }).select("id,action_key,summary,risk_level,status,requires_confirmation,created_at,expires_at,decided_at").single();
    if (error) {
      if (error.code === "23505" && idempotencyKey) {
        const { data: prior } = await db.from("jr_action_proposals").select("id,action_key,summary,risk_level,status,requires_confirmation,created_at,expires_at,decided_at").eq("member_id", member.id).eq("idempotency_key", idempotencyKey).maybeSingle();
        if (prior) return res.json({ ok: true, proposal: prior, reused: true });
      }
      throw error;
    }
    await recordSecurityEvent(member.id, "action_proposed", "action_proposal", data.id, "JR proposed: " + summary, { action_key: actionKey, risk_level: risk });
    await logActivity(member.id, "JR_ACTION_PROPOSED", { proposal_id: data.id, action_key: actionKey, risk_level: risk });
    res.status(201).json({ ok: true, proposal: data, note: "This records a proposal only. No external action has been performed." });
  }));

  app.patch("/api/jr/actions/proposals/:id", wrap("JR action proposal decision", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (limited(req, res, "jr-action-proposal-decision", 40)) return;
    const id = clean(req.params.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return bad(res, "Action proposal not found.", 404);
    const decision = clean(req.body.decision).toLowerCase();
    if (!ACTION_DECISIONS.has(decision)) return bad(res, "Choose approve or reject.");
    const now = new Date().toISOString();
    const { data: proposal, error } = await db.from("jr_action_proposals").update({
      status: decision === "approve" ? "approved" : "rejected", decided_at: now
    }).eq("id", id).eq("member_id", member.id).eq("status", "pending").gt("expires_at", now)
      .select("id,action_key,summary,risk_level,status,requires_confirmation,created_at,expires_at,decided_at").maybeSingle();
    if (error) throw error;
    if (!proposal) return bad(res, "This proposal has expired or has already been decided.", 409);
    await recordSecurityEvent(member.id, decision === "approve" ? "action_approved" : "action_rejected", "action_proposal", id, decision === "approve" ? "Member approved a JR action proposal; execution has not occurred." : "Member rejected a JR action proposal.", { action_key: proposal.action_key, risk_level: proposal.risk_level });
    await logActivity(member.id, decision === "approve" ? "JR_ACTION_APPROVED" : "JR_ACTION_REJECTED", { proposal_id: id, action_key: proposal.action_key });
    res.json({ ok: true, proposal, executed: false, note: decision === "approve"
      ? "Your approval has been recorded. JR has not executed the action; a separately authorised and connected service is still required."
      : "Your rejection has been recorded. No action was performed." });
  }));

};
