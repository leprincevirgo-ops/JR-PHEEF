// JR PHEEF + DGBO + FAMILY as one ecosystem.
//
//  * One identity: every venture uses the same members table.
//  * Consent first: a member joins a venture and chooses what it may see
//    (profile, contact, activity). The owner view only shows what was consented to.
//  * DGBO (parent): venture registry, consolidated dashboard, decision log.
//  * FAMILY: savings goals (the member's own tracking, no money held) and
//    finance requests that are only RECORDED and referred to licensed partners.
//    FAMILY holds no funds and makes no loans. Lending and wallets need Central
//    Bank of Kenya licensing first, and the code refuses to mark FAMILY active
//    for a regulated venture until a licence reference is entered.
const makeHelpers = require("./helpers");

const SCOPES = ["profile", "contact", "activity"];
const JOINABLE = ["family"];

module.exports = function mountEcosystem(ctx) {
  const { app, db, clean, requireMember, contactBlocked, logActivity } = ctx;
  const { UUID, wrap, bad, limited, requireOwner, displayName, notify } = makeHelpers(ctx);

  const emit = async (memberId, venture, type, payload = {}) => {
    const { error } = await db.from("ecosystem_events").insert({ member_id: memberId || null, venture, type, payload });
    if (error) console.error("Ecosystem event failed:", error.message);
  };
  const head = async (table, filter) => {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  };
  const getVenture = async slug => {
    const { data, error } = await db.from("ventures").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data;
  };
  const getLink = async (memberId, venture) => {
    const { data, error } = await db.from("ecosystem_links").select("*").eq("member_id", memberId).eq("venture", venture).maybeSingle();
    if (error) throw error;
    return data;
  };
  const cleanScopes = v => [...new Set((Array.isArray(v) ? v : []).map(clean).filter(s => SCOPES.includes(s)))];
  const publicVenture = v => ({ slug: v.slug, name: v.name, kind: v.kind, status: v.status, regulated: v.regulated, licensed: !!v.licence_ref, description: v.description });

  /* ---------- the one view ---------- */
  app.get("/api/ecosystem", wrap("Ecosystem", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const [{ data: ventures, error }, { data: links }] = await Promise.all([
      db.from("ventures").select("*").order("kind", { ascending: true }),
      db.from("ecosystem_links").select("venture,status,consent_scopes,joined_at").eq("member_id", m.id)
    ]);
    if (error) throw error;
    res.json({
      ok: true, scopes: SCOPES,
      ventures: (ventures || []).map(publicVenture),
      links: Object.fromEntries((links || []).map(l => [l.venture, l])),
      is_owner: [m.account_type, m.role].some(v => String(v || "").toLowerCase() === "owner")
    });
  }));

  app.get("/api/ecosystem/me", wrap("Ecosystem me", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const id = m.id;
    const [listings, deals, unread, goals, apps, link] = await Promise.all([
      head("jr_listings", q => q.eq("member_id", id).eq("status", "active")),
      head("jr_deal_rooms", q => q.or(`buyer_id.eq.${id},seller_id.eq.${id}`).in("status", ["open", "agreed"])),
      head("jr_notifications", q => q.eq("member_id", id).eq("read", false)),
      db.from("family_goals").select("target_amount,saved_amount,status").eq("member_id", id).limit(50),
      head("family_applications", q => q.eq("member_id", id)),
      getLink(id, "family")
    ]);
    const g = goals.data || [];
    res.json({
      ok: true,
      jr_pheef: { active_listings: listings, open_deals: deals, unread_alerts: unread, points: Number(m.reward_points || 0), plan: m.plan || "FREE" },
      family: {
        joined: !!link && link.status !== "left", status: link ? link.status : null,
        goals: g.length, saved: g.reduce((s, x) => s + Number(x.saved_amount || 0), 0), target: g.reduce((s, x) => s + Number(x.target_amount || 0), 0),
        requests: apps
      }
    });
  }));

  /* ---------- joining, consent, leaving ---------- */
  app.post("/api/ecosystem/join", wrap("Ecosystem join", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "eco-join", 20, 3600000)) return;
    const slug = clean(req.body.venture);
    if (!JOINABLE.includes(slug)) return bad(res, "That venture cannot be joined.");
    const scopes = cleanScopes(req.body.scopes);
    if (!scopes.includes("profile")) return bad(res, "Sharing your basic profile (name and JP number) is needed to join.");
    const v = await getVenture(slug);
    if (!v) return bad(res, "Venture not found.", 404);
    const live = v.status === "active" && (!v.regulated || !!v.licence_ref);
    const row = { member_id: m.id, venture: slug, status: live ? "active" : "waitlist", consent_scopes: scopes, updated_at: new Date().toISOString() };
    const { data, error } = await db.from("ecosystem_links").upsert(row, { onConflict: "member_id,venture" }).select("*").single();
    if (error) throw error;
    await emit(m.id, slug, "JOINED", { status: data.status, scopes });
    await logActivity(m.id, "ECOSYSTEM_JOIN", { venture: slug });
    res.status(201).json({ ok: true, link: data, message: live ? "Welcome to " + v.name + "." : "You are on the " + v.name + " waiting list. You can use savings goals now; financial services open only after licensing." });
  }));

  app.patch("/api/ecosystem/consent", wrap("Ecosystem consent", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const slug = clean(req.body.venture);
    const link = await getLink(m.id, slug);
    if (!link || link.status === "left") return bad(res, "You have not joined this venture.", 404);
    const scopes = cleanScopes(req.body.scopes);
    if (!scopes.includes("profile")) return bad(res, "Basic profile sharing is required while you are a member. Leave the venture to stop all sharing.");
    const { data, error } = await db.from("ecosystem_links").update({ consent_scopes: scopes, updated_at: new Date().toISOString() })
      .eq("id", link.id).select("*").single();
    if (error) throw error;
    await emit(m.id, slug, "CONSENT_CHANGED", { scopes });
    res.json({ ok: true, link: data });
  }));

  app.post("/api/ecosystem/leave", wrap("Ecosystem leave", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const slug = clean(req.body.venture);
    const link = await getLink(m.id, slug);
    if (!link || link.status === "left") return bad(res, "You have not joined this venture.", 404);
    await db.from("ecosystem_links").update({ status: "left", consent_scopes: [], updated_at: new Date().toISOString() }).eq("id", link.id);
    if (slug === "family" && req.body.delete_data === true) {
      await db.from("family_goals").delete().eq("member_id", m.id);
      await db.from("family_applications").delete().eq("member_id", m.id).eq("status", "recorded");
    }
    await emit(m.id, slug, "LEFT", { data_deleted: req.body.delete_data === true });
    res.json({ ok: true, message: "You left. Sharing with " + slug.toUpperCase() + " has stopped." + (req.body.delete_data === true ? " Your goals and unreferred requests were deleted." : "") });
  }));

  /* ---------- FAMILY (no money held, no loans made) ---------- */
  const familyLink = async (req, res, m) => {
    const link = await getLink(m.id, "family");
    if (!link || link.status === "left") { bad(res, "Join FAMILY first from the Ecosystem page.", 403); return null; }
    return link;
  };

  app.get("/api/family/goals", wrap("Goals list", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (!await familyLink(req, res, m)) return;
    const { data, error } = await db.from("family_goals").select("*").eq("member_id", m.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ ok: true, goals: data || [] });
  }));

  app.post("/api/family/goals", wrap("Goal create", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (!await familyLink(req, res, m)) return;
    if (limited(req, res, "goal", 30, 3600000)) return;
    const title = clean(req.body.title).slice(0, 120);
    const target = Number(req.body.target_amount);
    const saved = req.body.saved_amount === undefined || req.body.saved_amount === "" ? 0 : Number(req.body.saved_amount);
    const date = clean(req.body.target_date) || null;
    if (title.length < 2) return bad(res, "Give the goal a name.");
    if (!Number.isFinite(target) || target <= 0 || target > 1e9) return bad(res, "Enter a valid target amount.");
    if (!Number.isFinite(saved) || saved < 0) return bad(res, "Enter a valid saved amount.");
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad(res, "Use a valid target date.");
    if (await head("family_goals", q => q.eq("member_id", m.id)) >= 20) return bad(res, "You can track up to 20 goals.", 409);
    const { data, error } = await db.from("family_goals").insert({
      member_id: m.id, title, target_amount: target, saved_amount: saved, target_date: date, status: saved >= target ? "achieved" : "active"
    }).select("*").single();
    if (error) throw error;
    res.status(201).json({ ok: true, goal: data });
  }));

  app.patch("/api/family/goals/:id", wrap("Goal update", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (!await familyLink(req, res, m)) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Goal not found.", 404);
    const { data: cur } = await db.from("family_goals").select("*").eq("id", id).eq("member_id", m.id).maybeSingle();
    if (!cur) return bad(res, "Goal not found.", 404);
    const u = { updated_at: new Date().toISOString() };
    if (req.body.title !== undefined) { const t = clean(req.body.title).slice(0, 120); if (t.length < 2) return bad(res, "Give the goal a name."); u.title = t; }
    if (req.body.target_amount !== undefined) { const t = Number(req.body.target_amount); if (!Number.isFinite(t) || t <= 0 || t > 1e9) return bad(res, "Enter a valid target."); u.target_amount = t; }
    if (req.body.saved_amount !== undefined) { const s = Number(req.body.saved_amount); if (!Number.isFinite(s) || s < 0) return bad(res, "Enter a valid saved amount."); u.saved_amount = s; }
    if (req.body.status !== undefined) { const s = clean(req.body.status); if (!["active", "paused", "achieved"].includes(s)) return bad(res, "Invalid status."); u.status = s; }
    const target = u.target_amount ?? Number(cur.target_amount), saved = u.saved_amount ?? Number(cur.saved_amount);
    if (u.status === undefined && cur.status !== "paused") u.status = saved >= target ? "achieved" : "active";
    const { data, error } = await db.from("family_goals").update(u).eq("id", id).eq("member_id", m.id).select("*").single();
    if (error) throw error;
    res.json({ ok: true, goal: data });
  }));

  app.delete("/api/family/goals/:id", wrap("Goal delete", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Goal not found.", 404);
    const { error } = await db.from("family_goals").delete().eq("id", id).eq("member_id", m.id);
    if (error) throw error;
    res.json({ ok: true });
  }));

  app.get("/api/family/applications", wrap("Requests mine", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { data, error } = await db.from("family_applications").select("id,kind,amount,purpose,status,partner_note,created_at").eq("member_id", m.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    res.json({ ok: true, requests: data || [] });
  }));

  app.post("/api/family/applications", wrap("Request create", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const link = await familyLink(req, res, m); if (!link) return;
    if (!(link.consent_scopes || []).includes("profile")) return bad(res, "Sharing your basic profile is needed to send a request.");
    if (limited(req, res, "family-req", 5, 3600000)) return;
    const kind = clean(req.body.kind), amount = Number(req.body.amount), purpose = clean(req.body.purpose).slice(0, 500);
    if (!["loan", "investment", "savings"].includes(kind)) return bad(res, "Choose loan, investment or savings.");
    if (!Number.isFinite(amount) || amount < 100 || amount > 1e8) return bad(res, "Enter a valid amount (KSh 100 or more).");
    if (purpose.length < 3) return bad(res, "Tell us what the money is for.");
    if (contactBlocked(purpose)) return bad(res, "Do not include phone numbers, emails or links. Sharing contact details is controlled in your consent settings.");
    if (await head("family_applications", q => q.eq("member_id", m.id).eq("status", "recorded")) >= 3) return bad(res, "You already have 3 requests waiting. Please wait for a response.", 409);
    const { data, error } = await db.from("family_applications").insert({ member_id: m.id, kind, amount, purpose }).select("id,kind,amount,purpose,status,created_at").single();
    if (error) throw error;
    await emit(m.id, "family", "REQUEST_RECORDED", { request_id: data.id, kind });
    res.status(201).json({ ok: true, request: data, message: "Request recorded. FAMILY does not lend or hold money yet. If a licensed partner can help, the team will refer you and tell you." });
  }));

  /* ---------- DGBO (owner) ---------- */
  app.get("/api/dgbo/overview", wrap("DGBO overview", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const [members, listings, openDeals, doneDeals, riders, pending, waitlist, familyActive, goalsN, recorded, referred, decisions, ventures, events, paid] = await Promise.all([
      head("members"), head("jr_listings", q => q.eq("status", "active")),
      head("jr_deal_rooms", q => q.in("status", ["open", "agreed"])), head("jr_deal_rooms", q => q.eq("status", "completed")),
      head("jr_riders", q => q.eq("approved", true)), head("jr_riders", q => q.eq("approved", false)),
      head("ecosystem_links", q => q.eq("venture", "family").eq("status", "waitlist")), head("ecosystem_links", q => q.eq("venture", "family").eq("status", "active")),
      head("family_goals"), head("family_applications", q => q.eq("status", "recorded")), head("family_applications", q => q.eq("status", "referred")),
      head("dgbo_decisions", q => q.eq("status", "proposed")),
      db.from("ventures").select("*").order("kind"),
      db.from("ecosystem_events").select("venture,type,created_at").order("created_at", { ascending: false }).limit(15),
      db.from("jr_payments").select("amount").eq("status", "completed").limit(1000)
    ]);
    res.json({
      ok: true,
      ventures: (ventures.data || []).map(v => ({ ...publicVenture(v), licence_ref: v.licence_ref || null })),
      jr_pheef: { members, active_listings: listings, open_deals: openDeals, completed_deals: doneDeals, approved_riders: riders, rider_applications: pending, revenue_ksh: (paid.data || []).reduce((s, p) => s + Number(p.amount || 0), 0) },
      family: { waitlist, active: familyActive, goals: goalsN, requests_waiting: recorded, requests_referred: referred },
      dgbo: { decisions_waiting: decisions },
      recent_events: events.data || []
    });
  }));

  app.get("/api/dgbo/decisions", wrap("Decisions list", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const { data, error } = await db.from("dgbo_decisions").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ ok: true, decisions: data || [] });
  }));

  app.post("/api/dgbo/decisions", wrap("Decision create", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const title = clean(req.body.title).slice(0, 160), details = clean(req.body.details).slice(0, 2000), venture = clean(req.body.venture) || null;
    if (title.length < 3) return bad(res, "Give the decision a title.");
    if (venture && !await getVenture(venture)) return bad(res, "Unknown venture.");
    const { data, error } = await db.from("dgbo_decisions").insert({ title, details: details || null, venture, proposed_by: owner.id }).select("*").single();
    if (error) throw error;
    res.status(201).json({ ok: true, decision: data });
  }));

  app.patch("/api/dgbo/decisions/:id", wrap("Decision decide", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const id = clean(req.params.id), status = clean(req.body.status);
    if (!UUID.test(id)) return bad(res, "Decision not found.", 404);
    if (!["approved", "rejected"].includes(status)) return bad(res, "Choose approved or rejected.");
    const { data, error } = await db.from("dgbo_decisions").update({ status, decided_by: owner.id, decided_at: new Date().toISOString() })
      .eq("id", id).eq("status", "proposed").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Decision not found or already decided.", 409);
    await logActivity(owner.id, "DGBO_DECISION", { decision_id: id, status });
    res.json({ ok: true, decision: data });
  }));

  app.patch("/api/dgbo/ventures/:slug", wrap("Venture update", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const slug = clean(req.params.slug);
    const v = await getVenture(slug);
    if (!v || slug === "dgbo") return bad(res, "Venture not found.", 404);
    const u = {};
    if (req.body.licence_ref !== undefined) u.licence_ref = clean(req.body.licence_ref).slice(0, 120) || null;
    if (req.body.status !== undefined) {
      const s = clean(req.body.status);
      if (!["active", "planned", "paused"].includes(s)) return bad(res, "Invalid status.");
      const ref = u.licence_ref !== undefined ? u.licence_ref : v.licence_ref;
      if (s === "active" && v.regulated && (!ref || ref.length < 3)) return bad(res, "This venture is regulated. Enter the licence reference before activating it.", 409);
      u.status = s;
    }
    if (!Object.keys(u).length) return bad(res, "No valid changes supplied.");
    const { data, error } = await db.from("ventures").update(u).eq("slug", slug).select("*").single();
    if (error) throw error;
    if (u.status === "active") {
      const { data: moved } = await db.from("ecosystem_links").update({ status: "active", updated_at: new Date().toISOString() }).eq("venture", slug).eq("status", "waitlist").select("member_id");
      for (const r of moved || []) await notify(r.member_id, data.name + " is now open", "You moved from the waiting list to active membership.", "ecosystem");
    }
    await emit(owner.id, slug, "VENTURE_UPDATED", { ...u });
    res.json({ ok: true, venture: { ...publicVenture(data), licence_ref: data.licence_ref } });
  }));

  app.get("/api/dgbo/family/applications", wrap("DGBO requests", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const status = clean(req.query.status) || "recorded";
    const { data, error } = await db.from("family_applications").select("*").eq("status", status).order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    const ids = [...new Set((data || []).map(a => a.member_id))];
    let people = {}, links = {};
    if (ids.length) {
      const [{ data: ms }, { data: ls }] = await Promise.all([
        db.from("members").select("id,full_name,jp_number,phone,email,profile_visibility").in("id", ids),
        db.from("ecosystem_links").select("member_id,consent_scopes").eq("venture", "family").in("member_id", ids)
      ]);
      people = Object.fromEntries((ms || []).map(x => [String(x.id), x]));
      links = Object.fromEntries((ls || []).map(x => [String(x.member_id), x.consent_scopes || []]));
    }
    res.json({
      ok: true,
      requests: (data || []).map(a => {
        const p = people[String(a.member_id)] || {}, scopes = links[String(a.member_id)] || [];
        return {
          ...a, applicant: {
            name: scopes.includes("profile") ? (p.full_name || "Member") : "Member (no profile consent)",
            jp_number: scopes.includes("profile") ? p.jp_number : null,
            phone: scopes.includes("contact") ? p.phone : null, email: scopes.includes("contact") ? p.email : null,
            contact_consented: scopes.includes("contact")
          }
        };
      })
    });
  }));

  app.patch("/api/dgbo/family/applications/:id", wrap("DGBO request update", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const id = clean(req.params.id), status = clean(req.body.status);
    if (!UUID.test(id)) return bad(res, "Request not found.", 404);
    if (!["referred", "closed"].includes(status)) return bad(res, "Choose referred or closed.");
    const note = clean(req.body.partner_note).slice(0, 500) || null;
    const { data, error } = await db.from("family_applications").update({ status, partner_note: note, updated_at: new Date().toISOString() })
      .eq("id", id).neq("status", "closed").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Request not found or already closed.", 404);
    await notify(data.member_id, "Update on your FAMILY request",
      status === "referred" ? "Your request was referred to a licensed partner." + (note ? " Note: " + note : "") : "Your request was closed." + (note ? " Note: " + note : ""), "ecosystem");
    await emit(data.member_id, "family", "REQUEST_" + status.toUpperCase(), { request_id: id });
    res.json({ ok: true, request: data });
  }));
};
 
