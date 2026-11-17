"use strict";

// Shared person identity, separate venture membership and approval.
module.exports = function mountVentureAccess(ctx) {
  const { app, db, requireMember, clean, logActivity, checkRequestRate } = ctx;
  const fail = (res, message, status = 400) => res.status(status).json({ ok: false, error: message });
  const wrap = (label, fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(label + ":", clean(e && e.message).slice(0, 180));
      if (!res.headersSent) res.status(500).json({ ok: false, error: "JR could not complete this venture access request." });
    }
  };
  const isOwner = member => member && [member.account_type, member.role]
    .some(value => ["owner", "founder"].includes(String(value || "").toLowerCase()));

  app.get("/api/ventures", wrap("Venture catalogue", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const [{ data: ventures, error }, { data: memberships, error: membershipError }] = await Promise.all([
      db.from("ventures").select("slug,name,kind,status,regulated,description").order("kind").order("name"),
      db.from("venture_memberships").select("venture_slug,role_key,status,created_at,updated_at,approved_at").eq("member_id", member.id)
    ]);
    if (error) throw error; if (membershipError) throw membershipError;
    const bySlug = new Map((memberships || []).map(item => [item.venture_slug, item]));
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, ventures: (ventures || []).map(v => ({
      ...v, membership: bySlug.get(v.slug) || null,
      can_apply: v.status !== "paused"
    })) });
  }));

  app.get("/api/ventures/:slug/registration", wrap("Venture registration template", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const slug = clean(req.params.slug).toLowerCase();
    const [{ data: venture, error }, { data: template, error: templateError }] = await Promise.all([
      db.from("ventures").select("slug,name,kind,status,regulated,description").eq("slug", slug).maybeSingle(),
      db.from("venture_registration_templates").select("version,form_schema,active").eq("venture_slug", slug).maybeSingle()
    ]);
    if (error) throw error; if (templateError) throw templateError;
    if (!venture || !template || !template.active) return fail(res, "This venture registration is not available.", 404);
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, venture, template: { version: template.version, ...template.form_schema } });
  }));

  app.get("/api/my-venture-memberships", wrap("Member venture memberships", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    const { data, error } = await db.from("venture_memberships")
      .select("id,venture_slug,role_key,status,consent_version,consented_at,reviewed_at,approved_at,created_at,updated_at")
      .eq("member_id", member.id).order("created_at", { ascending: true });
    if (error) throw error;
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, memberships: data || [] });
  }));

  app.post("/api/ventures/:slug/apply", wrap("Venture membership application", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (checkRequestRate && !checkRequestRate(req, "venture-apply", 12, 60 * 60 * 1000).allowed)
      return fail(res, "Too many venture applications. Try again later.", 429);
    const slug = clean(req.params.slug).toLowerCase();
    const roleKey = clean(req.body.role_key).toLowerCase();
    const consent = req.body.consent === true;
    if (!consent) return fail(res, "Please review and accept the venture-specific notice before applying.", 400);
    const [{ data: venture, error }, { data: template, error: templateError }] = await Promise.all([
      db.from("ventures").select("slug,name,status,regulated").eq("slug", slug).maybeSingle(),
      db.from("venture_registration_templates").select("version,form_schema,active").eq("venture_slug", slug).maybeSingle()
    ]);
    if (error) throw error; if (templateError) throw templateError;
    if (!venture || !template || !template.active || venture.status === "paused")
      return fail(res, "This venture is not accepting applications.", 403);
    const roles = Array.isArray(template.form_schema && template.form_schema.roles) ? template.form_schema.roles : [];
    if (!roles.some(role => role.key === roleKey)) return fail(res, "Choose a role offered by this venture.", 400);
    const fields = Array.isArray(template.form_schema && template.form_schema.fields) ? template.form_schema.fields : [];
    const submitted = req.body.application_data && typeof req.body.application_data === "object" && !Array.isArray(req.body.application_data) ? req.body.application_data : {};
    const applicationData = {};
    for (const field of fields) {
      const value = clean(submitted[field.key]).slice(0, 2000);
      if (field.required && !value) return fail(res, "Please complete: " + clean(field.label).slice(0, 100), 400);
      if (value) applicationData[field.key] = value;
    }
    if (Buffer.byteLength(JSON.stringify(applicationData), "utf8") > 10000)
      return fail(res, "Application details are too large.", 413);
    const { data: existing, error: existingError } = await db.from("venture_memberships")
      .select("id,status").eq("venture_slug", slug).eq("member_id", member.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing && ["applied", "approved", "suspended"].includes(existing.status))
      return fail(res, "You already have a " + existing.status + " membership record for this venture.", 409);
    const now = new Date().toISOString();
    let membership;
    if (existing) {
      const { data, error: updateError } = await db.from("venture_memberships").update({
        role_key: roleKey, status: "applied", application_data: applicationData,
        consent_version: template.version, consented_at: now,
        reviewed_by: null, reviewed_at: null, review_note: null, approved_at: null, updated_at: now
      }).eq("id", existing.id).eq("member_id", member.id)
        .select("id,venture_slug,role_key,status,created_at,updated_at").single();
      if (updateError) throw updateError; membership = data;
    } else {
      const { data, error: insertError } = await db.from("venture_memberships").insert({
        venture_slug: slug, member_id: member.id, role_key: roleKey, status: "applied",
        application_data: applicationData, consent_version: template.version, consented_at: now
      }).select("id,venture_slug,role_key,status,created_at,updated_at").single();
      if (insertError) throw insertError; membership = data;
    }
    const { error: eventError } = await db.from("venture_membership_events").insert({
      membership_id: membership.id, venture_slug: slug, member_id: member.id,
      actor_member_id: member.id, event_type: existing ? "reapplied" : "applied",
      event_data: { role_key: roleKey, consent_version: template.version }
    });
    if (eventError) throw eventError;
    if (logActivity) await logActivity(member.id, "VENTURE_MEMBERSHIP_APPLIED", { venture_slug: slug, role_key: roleKey });
    res.status(201).json({ ok: true, membership, message: "Application received. Venture access remains pending until an authorised reviewer approves it." });
  }));

  app.get("/api/founder/venture-memberships", wrap("Founder venture application queue", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (!isOwner(member)) return fail(res, "Not found.", 404);
    const status = clean(req.query.status);
    let query = db.from("venture_memberships")
      .select("id,venture_slug,member_id,role_key,status,application_data,consent_version,consented_at,created_at,updated_at")
      .order("created_at", { ascending: true }).limit(200);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    const rows = data || [];
    const memberIds = [...new Set(rows.map(row => row.member_id))];
    let applicants = [];
    if (memberIds.length) {
      const result = await db.from("members").select("id,full_name,email,jp_number").in("id", memberIds);
      if (result.error) throw result.error;
      applicants = result.data || [];
    }
    const applicantById = new Map(applicants.map(applicant => [applicant.id, applicant]));
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, applications: rows.map(row => ({ ...row, applicant: applicantById.get(row.member_id) || null })) });
  }));

  app.post("/api/founder/venture-memberships/:id/review", wrap("Founder venture membership review", async (req, res) => {
    const member = await requireMember(req, res); if (!member) return;
    if (!isOwner(member)) return fail(res, "Not found.", 404);
    const status = clean(req.body.status);
    if (!["approved", "rejected", "suspended", "revoked"].includes(status))
      return fail(res, "Choose an allowed review decision.", 400);
    const note = clean(req.body.review_note).slice(0, 1200) || null;
    const { data: current, error: currentError } = await db.from("venture_memberships")
      .select("id,venture_slug,member_id,status,role_key").eq("id", req.params.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) return fail(res, "Application not found.", 404);
    if (current.venture_slug === "jr-pheef") return fail(res, "Core JR PHEEF identity membership cannot be changed here.", 409);
    const allowedTransition = current.status === "applied"
      ? ["approved", "rejected"].includes(status)
      : current.status === "approved" && ["suspended", "revoked"].includes(status);
    if (!allowedTransition) return fail(res, "This membership is no longer in a state that allows this review decision.", 409);
    const now = new Date().toISOString();
    const { data, error } = await db.from("venture_memberships").update({
      status, reviewed_by: member.id, reviewed_at: now, review_note: note,
      approved_at: status === "approved" ? now : null, updated_at: now
    }).eq("id", current.id).eq("status", current.status)
      .select("id,venture_slug,member_id,role_key,status,reviewed_at,approved_at,review_note").maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, "The application changed during review. Refresh and try again.", 409);
    const { error: eventError } = await db.from("venture_membership_events").insert({
      membership_id: current.id, venture_slug: current.venture_slug, member_id: current.member_id,
      actor_member_id: member.id, event_type: status,
      event_data: { role_key: current.role_key, review_note: note }
    });
    if (eventError) throw eventError;
    if (logActivity) await logActivity(member.id, "VENTURE_MEMBERSHIP_REVIEWED", { venture_slug: current.venture_slug, membership_id: current.id, status });
    res.json({ ok: true, membership: data });
  }));
};
