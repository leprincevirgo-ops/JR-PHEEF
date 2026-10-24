// JR PHEEF Delivery: riders apply, members request deliveries, approved riders accept and complete them.
// Note: jr_delivery_requests.rider_id stores the rider's MEMBER id.
const makeHelpers = require("./helpers");

const VEHICLES = ["motorbike", "bicycle", "car", "pickup", "van", "truck", "on_foot"];
const COMMISSION_PCT = Math.min(30, Math.max(0, Number(process.env.DELIVERY_COMMISSION_PCT ?? 10)));

module.exports = function mountDelivery(ctx) {
  const { app, db, clean, requireMember, contactBlocked, logActivity } = ctx;
  const { UUID, wrap, bad, limited, requireOwner, displayName, notify, blockedIds } = makeHelpers(ctx);

  const riderOf = async memberId => {
    const { data, error } = await db.from("jr_riders").select("*").eq("member_id", memberId).maybeSingle();
    if (error) throw error;
    return data;
  };
  const approvedRider = async (req, res, m) => {
    const r = await riderOf(m.id);
    if (!r || !r.approved) { bad(res, "Only approved riders can do this. Apply to become a rider first.", 403); return null; }
    return r;
  };

  /* ---------- riders ---------- */
  app.get("/api/riders/me", wrap("Rider me", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    res.json({ ok: true, rider: await riderOf(m.id), commission_pct: COMMISSION_PCT });
  }));

  app.post("/api/riders/apply", wrap("Rider apply", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "rider-apply", 5, 3600000)) return;
    const vehicle_type = clean(req.body.vehicle_type);
    const vehicle_number = clean(req.body.vehicle_number).toUpperCase().slice(0, 20);
    const company_name = clean(req.body.company_name).slice(0, 80);
    const location = clean(req.body.location).slice(0, 120);
    if (!VEHICLES.includes(vehicle_type)) return bad(res, "Choose a valid vehicle type.");
    if (vehicle_type !== "on_foot" && vehicle_type !== "bicycle" && vehicle_number.length < 3) return bad(res, "Enter your vehicle registration number.");
    if (location.length < 2) return bad(res, "Enter the area you work in.");
    if ([company_name, location].some(contactBlocked)) return bad(res, "Do not include phone numbers or links here.");
    if (await riderOf(m.id)) return bad(res, "You have already applied. Wait for approval or contact support.", 409);
    const { data, error } = await db.from("jr_riders").insert({
      member_id: m.id, vehicle_type, vehicle_number, company_name: company_name || null, location,
      online: false, verified: false, approved: false
    }).select("*").single();
    if (error) throw error;
    await logActivity(m.id, "RIDER_APPLY");
    res.status(201).json({ ok: true, rider: data, message: "Application received. You will get an alert once it is reviewed." });
  }));

  app.post("/api/riders/online", wrap("Rider online", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const rider = await approvedRider(req, res, m); if (!rider) return;
    if (typeof req.body.online !== "boolean") return bad(res, "Invalid online setting.");
    const u = { online: req.body.online, updated_at: new Date().toISOString() };
    if (req.body.location !== undefined) {
      const loc = clean(req.body.location).slice(0, 120);
      if (contactBlocked(loc)) return bad(res, "Do not include phone numbers or links here.");
      if (loc) u.location = loc;
    }
    const { data, error } = await db.from("jr_riders").update(u).eq("id", rider.id).select("*").single();
    if (error) throw error;
    res.json({ ok: true, rider: data });
  }));

  /* ---------- delivery requests ---------- */
  app.post("/api/delivery", wrap("Delivery create", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "delivery-create", 20, 3600000)) return;
    const pickup = clean(req.body.pickup).slice(0, 200);
    const destination = clean(req.body.destination).slice(0, 200);
    const description = clean(req.body.description).slice(0, 500);
    const pickup_notes = clean(req.body.pickup_notes).slice(0, 300);
    const price = Number(req.body.price);
    const listing_id = clean(req.body.listing_id);
    if (pickup.length < 3 || destination.length < 3) return bad(res, "Enter the pickup and destination places.");
    if (!description) return bad(res, "Describe what should be delivered.");
    if (!Number.isFinite(price) || price < 50 || price > 200000) return bad(res, "Enter what you will pay the rider (KSh 50 or more).");
    if (listing_id && !UUID.test(listing_id)) return bad(res, "Invalid listing.");
    if ([pickup, destination, description, pickup_notes].some(contactBlocked))
      return bad(res, "For safety, keep phone numbers, emails and links out of delivery details.");
    const { count } = await db.from("jr_delivery_requests").select("id", { count: "exact", head: true })
      .eq("requester_id", m.id).in("status", ["open", "accepted", "picked_up"]);
    if (count >= 10) return bad(res, "You have too many active delivery requests. Complete or cancel some first.", 409);
    const commission = Math.round(price * COMMISSION_PCT) / 100;
    const { data, error } = await db.from("jr_delivery_requests").insert({
      requester_id: m.id, pickup, destination, description, pickup_notes: pickup_notes || null,
      price, commission, listing_id: listing_id || null, status: "open"
    }).select("*").single();
    if (error) throw error;
    await logActivity(m.id, "DELIVERY_REQUEST", { delivery_id: data.id });
    res.status(201).json({ ok: true, delivery: data });
  }));

  app.get("/api/delivery/mine", wrap("Delivery mine", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const [{ data: asRequester, error: e1 }, { data: asRider, error: e2 }] = await Promise.all([
      db.from("jr_delivery_requests").select("*").eq("requester_id", m.id).order("created_at", { ascending: false }).limit(50),
      db.from("jr_delivery_requests").select("*").eq("rider_id", m.id).order("created_at", { ascending: false }).limit(50)
    ]);
    if (e1) throw e1; if (e2) throw e2;
    const riderIds = [...new Set((asRequester || []).map(d => d.rider_id).filter(Boolean))];
    let riders = {};
    if (riderIds.length) {
      const [{ data: rs }, { data: ms }] = await Promise.all([
        db.from("jr_riders").select("member_id,vehicle_type,vehicle_number,company_name,rating,verified").in("member_id", riderIds),
        db.from("members").select("id,full_name,profile_visibility").in("id", riderIds)
      ]);
      const names = Object.fromEntries((ms || []).map(x => [String(x.id), displayName(x)]));
      riders = Object.fromEntries((rs || []).map(r => [String(r.member_id), { name: names[String(r.member_id)], vehicle_type: r.vehicle_type, vehicle_number: r.vehicle_number, company_name: r.company_name, rating: r.rating, verified: !!r.verified }]));
    }
    res.json({
      ok: true,
      requested: (asRequester || []).map(d => ({ ...d, rider: d.rider_id ? riders[String(d.rider_id)] || null : null })),
      assigned: asRider || []
    });
  }));

  app.get("/api/delivery/open", wrap("Delivery open", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const rider = await approvedRider(req, res, m); if (!rider) return;
    const [{ data, error }, blocked] = await Promise.all([
      db.from("jr_delivery_requests").select("id,requester_id,pickup,destination,description,pickup_notes,price,created_at")
        .eq("status", "open").neq("requester_id", m.id).order("created_at", { ascending: false }).limit(60),
      blockedIds(m.id)
    ]);
    if (error) throw error;
    const jobs = (data || []).filter(d => !blocked.has(String(d.requester_id))).map(({ requester_id, ...rest }) => rest);
    res.json({ ok: true, jobs, commission_pct: COMMISSION_PCT });
  }));

  async function loadDelivery(req, res) {
    const id = clean(req.params.id);
    if (!UUID.test(id)) { bad(res, "Delivery not found.", 404); return null; }
    const { data, error } = await db.from("jr_delivery_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) { bad(res, "Delivery not found.", 404); return null; }
    return data;
  }

  app.post("/api/delivery/:id/accept", wrap("Delivery accept", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const rider = await approvedRider(req, res, m); if (!rider) return;
    const d = await loadDelivery(req, res); if (!d) return;
    if (String(d.requester_id) === String(m.id)) return bad(res, "You cannot accept your own request.");
    if ((await blockedIds(m.id)).has(String(d.requester_id))) return bad(res, "Delivery not found.", 404);
    const { count } = await db.from("jr_delivery_requests").select("id", { count: "exact", head: true })
      .eq("rider_id", m.id).in("status", ["accepted", "picked_up"]);
    if (count >= 3) return bad(res, "Finish your current deliveries before accepting more (limit 3).", 409);
    const now = new Date().toISOString();
    const { data, error } = await db.from("jr_delivery_requests")
      .update({ rider_id: m.id, status: "accepted", accepted_at: now, updated_at: now })
      .eq("id", d.id).eq("status", "open").is("rider_id", null).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Another rider already took this delivery.", 409);
    await notify(d.requester_id, "Rider found", "A rider accepted your delivery. Open Delivery to see the rider details.", "delivery");
    await logActivity(m.id, "DELIVERY_ACCEPT", { delivery_id: d.id });
    res.json({ ok: true, delivery: data });
  }));

  app.post("/api/delivery/:id/status", wrap("Delivery status", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const d = await loadDelivery(req, res); if (!d) return;
    if (String(d.rider_id) !== String(m.id)) return bad(res, "Only the assigned rider can update this delivery.", 403);
    const next = clean(req.body.status);
    const from = { picked_up: "accepted", delivered: "picked_up" }[next];
    if (!from) return bad(res, "Status must be picked_up or delivered.");
    const now = new Date().toISOString();
    const patch = { status: next, updated_at: now };
    if (next === "delivered") patch.delivered_at = now;
    const { data, error } = await db.from("jr_delivery_requests").update(patch)
      .eq("id", d.id).eq("rider_id", m.id).eq("status", from).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "This delivery is not in the right step for that update.", 409);
    await notify(d.requester_id, next === "delivered" ? "Delivered" : "Picked up",
      next === "delivered" ? "Your item was marked delivered. Please pay the rider the agreed amount." : "The rider picked up your item.", "delivery");
    res.json({ ok: true, delivery: data });
  }));

  app.post("/api/delivery/:id/release", wrap("Delivery release", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const d = await loadDelivery(req, res); if (!d) return;
    if (String(d.rider_id) !== String(m.id)) return bad(res, "Only the assigned rider can release this delivery.", 403);
    const { data, error } = await db.from("jr_delivery_requests")
      .update({ rider_id: null, status: "open", accepted_at: null, updated_at: new Date().toISOString() })
      .eq("id", d.id).eq("rider_id", m.id).eq("status", "accepted").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "A delivery can only be released before pickup.", 409);
    await notify(d.requester_id, "Rider released the job", "Your delivery is open again and riders can accept it.", "delivery");
    res.json({ ok: true, delivery: data });
  }));

  app.post("/api/delivery/:id/cancel", wrap("Delivery cancel", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const d = await loadDelivery(req, res); if (!d) return;
    if (String(d.requester_id) !== String(m.id)) return bad(res, "Only the requester can cancel this delivery.", 403);
    const { data, error } = await db.from("jr_delivery_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", d.id).eq("requester_id", m.id).in("status", ["open", "accepted"]).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "This delivery can no longer be cancelled.", 409);
    if (d.rider_id) await notify(d.rider_id, "Delivery cancelled", "The requester cancelled a delivery you accepted.", "delivery");
    res.json({ ok: true, delivery: data });
  }));

  /* ---------- owner ---------- */
  app.get("/api/admin/riders", wrap("Admin riders", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const pendingOnly = clean(req.query.status) !== "all";
    let q = db.from("jr_riders").select("*").order("created_at", { ascending: false }).limit(100);
    if (pendingOnly) q = q.eq("approved", false);
    const { data, error } = await q;
    if (error) throw error;
    const ids = (data || []).map(r => r.member_id);
    let names = {};
    if (ids.length) {
      const { data: ms } = await db.from("members").select("id,full_name,phone").in("id", ids);
      names = Object.fromEntries((ms || []).map(x => [String(x.id), x]));
    }
    res.json({ ok: true, riders: (data || []).map(r => ({ ...r, member: names[String(r.member_id)] || null })) });
  }));

  app.patch("/api/admin/riders/:id", wrap("Admin rider update", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Rider not found.", 404);
    const u = { updated_at: new Date().toISOString() };
    if (req.body.approved !== undefined) { if (typeof req.body.approved !== "boolean") return bad(res, "Invalid value."); u.approved = req.body.approved; if (!u.approved) u.online = false; }
    if (req.body.verified !== undefined) { if (typeof req.body.verified !== "boolean") return bad(res, "Invalid value."); u.verified = req.body.verified; }
    if (Object.keys(u).length === 1) return bad(res, "No valid changes supplied.");
    const { data, error } = await db.from("jr_riders").update(u).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Rider not found.", 404);
    if (u.approved !== undefined) await notify(data.member_id, u.approved ? "Rider application approved" : "Rider access removed",
      u.approved ? "You can now go online and accept deliveries." : "Your rider access was removed. Contact support for details.", "delivery");
    await logActivity(owner.id, "ADMIN_RIDER_UPDATE", { rider_id: id, ...u });
    res.json({ ok: true, rider: data });
  }));
};
 
