// JR PHEEF Opportunity Posting API. Mounted with trusted server-side database access.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES = new Set(["business_opportunity"]);
const AVAILABILITY = new Set(["available_now", "coming_soon", "seeking_interest", "recurring"]);
const AUDIENCE = new Set(["local", "national", "international", "local_and_international", "remote"]);

module.exports = function mountOpportunities(ctx) {
  const { app, db, clean, requireMember, checkRequestRate, contactBlocked, logActivity } = ctx;
  const bad = (res, error, status = 400) => res.status(status).json({ ok: false, error });
  const wrap = (label, fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(label + ":", clean(e && e.message).slice(0, 180));
      if (!res.headersSent) res.status(500).json({ ok: false, error: "Opportunity request failed. Please try again." });
    }
  };
  const rateLimited = (req, res, scope, limit, ms) => {
    const r = checkRequestRate(req, scope, limit, ms);
    if (r.allowed) return false;
    res.setHeader("Retry-After", String(r.retryAfter));
    bad(res, "Too many requests. Please try again shortly.", 429);
    return true;
  };
  const publicFields = "id,title,description,opportunity_type,availability_status,audience_scope,country_code,location,eligible_regions,offer_details,requirements,commercial_terms,currency_code,deadline_at,publication_status,verification_status,published_at,expires_at,created_at,updated_at";

  app.get("/api/opportunities", wrap("Opportunity feed", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    let q = db.from("jr_opportunities").select(publicFields)
      .eq("publication_status", "published")
      .in("availability_status", ["available_now", "coming_soon", "seeking_interest", "recurring"])
      .order("published_at", { ascending: false }).limit(50);
    const term = clean(req.query.q).slice(0, 100);
    if (term) q = q.ilike("title", "%" + term.replace(/[%,_]/g, "") + "%");
    const audience = clean(req.query.audience);
    if (audience && AUDIENCE.has(audience)) q = q.in("audience_scope", [audience, "local_and_international"]);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ ok: true, opportunities: data || [] });
  }));

  app.get("/api/opportunities/mine", wrap("My opportunities", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const { data, error } = await db.from("jr_opportunities").select(publicFields)
      .eq("owner_user_id", member.id).neq("publication_status", "removed")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ ok: true, opportunities: data || [] });
  }));

  app.post("/api/opportunities", wrap("Create opportunity", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (rateLimited(req, res, "opportunity-create", 10, 60 * 60 * 1000)) return;
    const b = req.body || {};
    const title = clean(b.title);
    const description = clean(b.description);
    const type = clean(b.opportunity_type || "business_opportunity");
    const availability = clean(b.availability_status || "available_now");
    const audience = clean(b.audience_scope || "local_and_international");
    const location = clean(b.location).slice(0, 180);
    const country = clean(b.country_code).toUpperCase();
    const offer = clean(b.offer_details).slice(0, 2000);
    const requirements = clean(b.requirements).slice(0, 2000);
    const terms = clean(b.commercial_terms).slice(0, 2000);
    const regions = Array.isArray(b.eligible_regions) ? [...new Set(b.eligible_regions.map(x => clean(x).toUpperCase()).filter(x => /^[A-Z]{2}$/.test(x)))].slice(0, 100) : [];
    const currency = clean(b.currency_code).toUpperCase();
    const deadline = b.deadline_at ? new Date(b.deadline_at) : null;

    if (title.length < 3 || title.length > 140) return bad(res, "Title must be 3–140 characters.");
    if (description.length < 10 || description.length > 5000) return bad(res, "Description must be 10–5000 characters.");
    if (!TYPES.has(type)) return bad(res, "Unsupported opportunity type.");
    if (!AVAILABILITY.has(availability)) return bad(res, "Choose a valid availability.");
    if (!AUDIENCE.has(audience)) return bad(res, "Choose a valid audience.");
    if (country && !/^[A-Z]{2}$/.test(country)) return bad(res, "Use a two-letter country code.");
    if (currency && !/^[A-Z]{3}$/.test(currency)) return bad(res, "Use a three-letter currency code.");
    if (deadline && Number.isNaN(deadline.getTime())) return bad(res, "Enter a valid deadline.");
    if ([title, description, offer, requirements, terms].some(contactBlocked)) return bad(res, "Do not include direct contact details or external links. Use JR PHEEF connection tools.");
    const { data, error } = await db.from("jr_opportunities").insert({
      owner_user_id: member.id, title, description, opportunity_type: type,
      availability_status: availability, audience_scope: audience,
      country_code: country || null, location: location || null,
      eligible_regions: regions, offer_details: offer, requirements, commercial_terms: terms,
      currency_code: currency || null, deadline_at: deadline ? deadline.toISOString() : null,
      publication_status: "published", verification_status: "unverified", published_at: new Date().toISOString()
    }).select(publicFields).single();
    if (error) throw error;
    await logActivity(member.id, "OPPORTUNITY_POSTED", { opportunity_id: data.id, opportunity_type: type });
    res.status(201).json({ ok: true, opportunity: data, message: "Opportunity published as unverified. JR PHEEF does not guarantee its claims or outcome." });
  }));

  app.patch("/api/opportunities/:id", wrap("Update opportunity", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Opportunity not found.", 404);
    const b = req.body || {};
    const update = {};
    for (const key of ["title", "description", "location", "offer_details", "requirements", "commercial_terms"]) {
      if (b[key] === undefined) continue;
      const value = clean(b[key]);
      const max = key === "title" ? 140 : key === "description" ? 5000 : key === "location" ? 180 : 2000;
      if (!value && ["title", "description"].includes(key)) return bad(res, "Title and description cannot be empty.");
      if (value.length > max) return bad(res, key + " is too long.");
      if (contactBlocked(value)) return bad(res, "Do not include direct contact details or external links. Use JR PHEEF connection tools.");
      update[key] = value;
    }
    if (b.availability_status !== undefined) {
      if (!AVAILABILITY.has(clean(b.availability_status))) return bad(res, "Choose a valid availability.");
      update.availability_status = clean(b.availability_status);
    }
    if (b.audience_scope !== undefined) {
      if (!AUDIENCE.has(clean(b.audience_scope))) return bad(res, "Choose a valid audience.");
      update.audience_scope = clean(b.audience_scope);
    }
    if (b.publication_status !== undefined) {
      if (!["published", "closed", "draft"].includes(clean(b.publication_status))) return bad(res, "Invalid publication status.");
      update.publication_status = clean(b.publication_status);
    }
    if (!Object.keys(update).length) return bad(res, "No supported changes supplied.");
    update.updated_at = new Date().toISOString();
    const { data, error } = await db.from("jr_opportunities").update(update)
      .eq("id", id).eq("owner_user_id", member.id).select(publicFields).maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Opportunity not found or not yours.", 404);
    await logActivity(member.id, "OPPORTUNITY_UPDATED", { opportunity_id: id });
    res.json({ ok: true, opportunity: data });
  }));

  app.post("/api/opportunities/:id/interest", wrap("Opportunity interest", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (rateLimited(req, res, "opportunity-interest", 30, 60 * 60 * 1000)) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Opportunity not found.", 404);
    const { data: opportunity, error: opError } = await db.from("jr_opportunities")
      .select("id,owner_user_id,publication_status,title").eq("id", id).maybeSingle();
    if (opError) throw opError;
    if (!opportunity || opportunity.publication_status !== "published") return bad(res, "Opportunity not found or unavailable.", 404);
    if (String(opportunity.owner_user_id) === String(member.id)) return bad(res, "You cannot express interest in your own opportunity.");
    const message = clean(req.body && req.body.message).slice(0, 1500);
    if (contactBlocked(message)) return bad(res, "Do not include direct contact details. Use the Deal Room to connect.");
    const { data, error } = await db.from("jr_opportunity_interests").upsert({
      opportunity_id: id, member_id: member.id, message, status: "pending", updated_at: new Date().toISOString()
    }, { onConflict: "opportunity_id,member_id" }).select("id,opportunity_id,member_id,message,status,created_at,updated_at").single();
    if (error) throw error;
    await logActivity(member.id, "OPPORTUNITY_INTERESTED", { opportunity_id: id });
    res.status(201).json({ ok: true, interest: data, message: "Interest recorded. Continue through JR PHEEF's approved connection flow." });
  }));

  app.post("/api/opportunities/:id/report", wrap("Opportunity report", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (rateLimited(req, res, "opportunity-report", 10, 60 * 60 * 1000)) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Opportunity not found.", 404);
    const reason = clean(req.body && req.body.reason);
    const details = clean(req.body && req.body.details).slice(0, 1500);
    if (!["misleading","spam","impersonation","prohibited","contact_bypass","other"].includes(reason))
      return bad(res, "Choose a valid report reason.");
    const { data: opportunity, error: opError } = await db.from("jr_opportunities")
      .select("id,owner_user_id").eq("id", id).maybeSingle();
    if (opError) throw opError;
    if (!opportunity || String(opportunity.owner_user_id) === String(member.id))
      return bad(res, "Opportunity not found or cannot be reported.", 404);
    const { data, error } = await db.from("jr_opportunity_reports").insert({
      opportunity_id: id, reporter_member_id: member.id, reason, details
    }).select("id,review_status,created_at").single();
    if (error && error.code === "23505") return bad(res, "You have already reported this opportunity.", 409);
    if (error) throw error;
    await logActivity(member.id, "OPPORTUNITY_REPORTED", { opportunity_id: id, reason });
    res.status(201).json({ ok: true, report: data, message: "Report submitted for review. Automated flags are not proof of wrongdoing." });
  }));

  app.get("/api/opportunities/:id/interests", wrap("Opportunity interests", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Opportunity not found.", 404);
    const { data: owner, error: ownerError } = await db.from("jr_opportunities")
      .select("id").eq("id", id).eq("owner_user_id", member.id).maybeSingle();
    if (ownerError) throw ownerError;
    if (!owner) return bad(res, "Opportunity not found or not yours.", 404);
    const { data, error } = await db.from("jr_opportunity_interests")
      .select("id,opportunity_id,member_id,message,status,created_at,updated_at")
      .eq("opportunity_id", id).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ ok: true, interests: data || [] });
  }));
};
