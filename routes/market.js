// JR PHEEF marketplace routes: my listings, deal rooms + chat, reports/blocks,
// notifications, password reset and the owner admin API.
// Mounted from server.js with: require("./routes/market")({ ...deps })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESTRICTED = ["blocked", "suspended", "disabled"];
const LISTING_STATUS = ["active", "paused", "sold"];
const MEDIA_BUCKET = "jr-pheef-media";

module.exports = function mountMarket(ctx) {
  const {
    app, db, crypto, bcrypt, twilio,
    clean, hash, phoneOf, phoneVariants,
    requireMember, checkRequestRate, contactBlocked, logActivity
  } = ctx;

  const wrap = (label, fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(label + ":", clean(e && e.message).slice(0, 200));
      if (!res.headersSent) res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
    }
  };
  const bad = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });
  const limited = (req, res, scope, limit, windowMs) => {
    const r = checkRequestRate(req, scope, limit, windowMs);
    if (r.allowed) return false;
    res.setHeader("Retry-After", String(r.retryAfter));
    bad(res, "Too many requests. Please slow down and try again shortly.", 429);
    return true;
  };
  const isOwner = m => [m.account_type, m.role].some(v => String(v || "").toLowerCase() === "owner");
  const displayName = p => (!p ? "JR PHEEF Member" : p.profile_visibility === "private" ? "JR PHEEF Member" : p.full_name || "JR PHEEF Member");

  async function notify(memberId, title, message, type = "general") {
    const { error } = await db.from("jr_notifications").insert({ member_id: memberId, title, message, type });
    if (error) console.error("Notify failed:", error.message);
  }

  async function blockedBetween(a, b) {
    const { data, error } = await db.from("jr_blocks").select("id")
      .or(`and(member_id.eq.${a},blocked_id.eq.${b}),and(member_id.eq.${b},blocked_id.eq.${a})`).limit(1);
    if (error) throw error;
    return !!(data && data.length);
  }

  function mediaPath(url) {
    const marker = "/" + MEDIA_BUCKET + "/";
    const i = String(url).indexOf(marker);
    return i === -1 ? null : decodeURIComponent(String(url).slice(i + marker.length));
  }

  /* ---------------- MY LISTINGS ---------------- */
  app.get("/api/listings/mine", wrap("My listings", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { data, error } = await db.from("jr_listings").select("*")
      .eq("member_id", m.id).neq("status", "removed")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ ok: true, listings: data || [] });
  }));

  app.get("/api/listings/:id", wrap("Listing detail", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Listing not found.", 404);
    const { data: l, error } = await db.from("jr_listings").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    const mine = l && String(l.member_id) === String(m.id);
    if (!l || (l.status !== "active" && !mine)) return bad(res, "Listing not found.", 404);
    if (!mine && await blockedBetween(m.id, l.member_id)) return bad(res, "Listing not found.", 404);
    const { data: seller } = await db.from("members")
      .select("id,full_name,verified,jp_number,profile_visibility,created_at").eq("id", l.member_id).maybeSingle();
    if (!mine) db.from("jr_listings").update({ views: Number(l.views || 0) + 1 }).eq("id", id).then(() => {}).catch(() => {});
    res.json({
      ok: true, is_mine: !!mine,
      listing: { ...l, seller_name: displayName(seller), phone: undefined },
      seller: seller ? { id: seller.id, name: displayName(seller), verified: !!seller.verified, jp_number: seller.jp_number, member_since: seller.created_at } : null
    });
  }));

  app.patch("/api/listings/:id", wrap("Listing update", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Listing not found.", 404);
    const b = req.body || {};
    const u = {};
    if (b.item_name !== undefined) {
      const v = clean(b.item_name);
      if (!v || v.length > 120) return bad(res, "Enter a valid listing title.");
      u.item_name = v; u.title = v;
    }
    if (b.description !== undefined) {
      const v = clean(b.description);
      if (v.length > 3000) return bad(res, "Description is too long.");
      u.description = v;
    }
    if (b.price !== undefined) {
      const v = Number(b.price);
      if (!Number.isFinite(v) || v < 0) return bad(res, "Enter a valid price.");
      u.price = v;
    }
    if (b.category !== undefined) u.category = clean(b.category).slice(0, 60);
    if (b.location !== undefined) u.location = clean(b.location).slice(0, 180);
    if (b.condition !== undefined) u.condition = clean(b.condition).slice(0, 40);
    if (b.negotiable !== undefined) {
      if (typeof b.negotiable !== "boolean") return bad(res, "Invalid negotiable setting.");
      u.negotiable = b.negotiable;
    }
    if (b.status !== undefined) {
      const v = clean(b.status);
      if (!LISTING_STATUS.includes(v)) return bad(res, "Status must be active, paused or sold.");
      u.status = v;
    }
    if (!Object.keys(u).length) return bad(res, "No valid changes supplied.");
    if ([u.item_name, u.description].some(v => v && contactBlocked(v)))
      return bad(res, "Direct contact details cannot be shared in listings.");
    u.updated_at = new Date().toISOString();
    const { data, error } = await db.from("jr_listings").update(u)
      .eq("id", id).eq("member_id", m.id).neq("status", "removed").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Listing not found or not yours.", 404);
    await logActivity(m.id, "UPDATE_LISTING", { listing_id: id });
    res.json({ ok: true, listing: data });
  }));

  app.delete("/api/listings/:id", wrap("Listing delete", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Listing not found.", 404);
    const { data: l, error } = await db.from("jr_listings").select("id,photos,member_id")
      .eq("id", id).eq("member_id", m.id).maybeSingle();
    if (error) throw error;
    if (!l) return bad(res, "Listing not found or not yours.", 404);
    const { count } = await db.from("jr_deal_rooms").select("id", { count: "exact", head: true })
      .eq("listing_id", id).in("status", ["open", "agreed"]);
    if (count > 0) return bad(res, "This listing has an active deal. Cancel the deal or mark the listing as sold instead.", 409);
    const paths = (Array.isArray(l.photos) ? l.photos : []).map(mediaPath).filter(Boolean);
    const { error: delErr } = await db.from("jr_listings").delete().eq("id", id).eq("member_id", m.id);
    if (delErr) throw delErr;
    if (paths.length) await db.storage.from(MEDIA_BUCKET).remove(paths).catch(() => {});
    await logActivity(m.id, "DELETE_LISTING", { listing_id: id });
    res.json({ ok: true });
  }));

  /* ---------------- DEAL ROOMS ---------------- */
  async function loadRoom(req, res, m) {
    const id = clean(req.params.id);
    if (!UUID.test(id)) { bad(res, "Deal not found.", 404); return null; }
    const { data: room, error } = await db.from("jr_deal_rooms").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    const part = room && [String(room.buyer_id), String(room.seller_id)].includes(String(m.id));
    if (!part) { bad(res, "Deal not found.", 404); return null; }
    return room;
  }
  const otherParty = (room, m) => String(room.buyer_id) === String(m.id) ? room.seller_id : room.buyer_id;

  app.post("/api/deals", wrap("Open deal", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "deal-open", 30, 3600000)) return;
    const listingId = clean(req.body.listing_id);
    if (!UUID.test(listingId)) return bad(res, "Choose a valid listing.");
    const { data: l, error } = await db.from("jr_listings").select("id,member_id,item_name,price,status,negotiable")
      .eq("id", listingId).maybeSingle();
    if (error) throw error;
    if (!l || l.status !== "active") return bad(res, "This listing is no longer available.", 404);
    if (String(l.member_id) === String(m.id)) return bad(res, "You cannot open a deal on your own listing.");
    if (await blockedBetween(m.id, l.member_id)) return bad(res, "This listing is no longer available.", 404);

    const price = Number(l.price || 0);
    let offer = price;
    if (req.body.offer !== undefined && req.body.offer !== "") {
      offer = Number(req.body.offer);
      if (!Number.isFinite(offer) || offer <= 0) return bad(res, "Enter a valid offer.");
      if (!l.negotiable && offer !== price) return bad(res, "This price is fixed.");
    }
    const { data: room, error: insErr } = await db.from("jr_deal_rooms").insert({
      buyer_id: m.id, seller_id: l.member_id, listing_id: l.id,
      amount: price, offer_amount: offer, status: "open"
    }).select("*").single();
    if (insErr) {
      if (insErr.code === "23505") {
        const { data: existing } = await db.from("jr_deal_rooms").select("*")
          .eq("listing_id", l.id).eq("buyer_id", m.id).in("status", ["open", "agreed"]).maybeSingle();
        if (existing) return res.json({ ok: true, already_exists: true, deal: existing });
      }
      throw insErr;
    }
    await notify(l.member_id, "New deal request", `Someone is interested in "${l.item_name}".`, "deal");
    await logActivity(m.id, "OPEN_DEAL", { deal_id: room.id, listing_id: l.id });
    res.status(201).json({ ok: true, deal: room });
  }));

  app.get("/api/deals", wrap("List deals", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { data, error } = await db.from("jr_deal_rooms").select("*")
      .or(`buyer_id.eq.${m.id},seller_id.eq.${m.id}`)
      .order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    const rooms = data || [];
    const listingIds = [...new Set(rooms.map(r => r.listing_id).filter(Boolean))];
    let titles = {};
    if (listingIds.length) {
      const { data: ls } = await db.from("jr_listings").select("id,item_name,photos").in("id", listingIds);
      titles = Object.fromEntries((ls || []).map(x => [x.id, x]));
    }
    res.json({
      ok: true,
      deals: rooms.map(r => ({
        ...r, role: String(r.buyer_id) === String(m.id) ? "buyer" : "seller",
        listing: titles[r.listing_id] ? { id: r.listing_id, item_name: titles[r.listing_id].item_name, photo: (titles[r.listing_id].photos || [])[0] || null } : null
      }))
    });
  }));

  app.get("/api/deals/:id", wrap("Deal detail", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const room = await loadRoom(req, res, m); if (!room) return;
    const [{ data: msgs, error }, { data: people }, { data: listing }] = await Promise.all([
      db.from("jr_deal_messages").select("id,sender_id,body,created_at").eq("room_id", room.id).order("created_at", { ascending: true }).limit(300),
      db.from("members").select("id,full_name,verified,jp_number,profile_visibility").in("id", [room.buyer_id, room.seller_id]),
      db.from("jr_listings").select("id,item_name,price,photos,status,negotiable").eq("id", room.listing_id).maybeSingle()
    ]);
    if (error) throw error;
    const byId = Object.fromEntries((people || []).map(p => [String(p.id), p]));
    const party = id => ({ id, name: displayName(byId[String(id)]), verified: !!byId[String(id)]?.verified });
    res.json({
      ok: true, deal: room, listing: listing || null,
      role: String(room.buyer_id) === String(m.id) ? "buyer" : "seller",
      buyer: party(room.buyer_id), seller: party(room.seller_id),
      messages: msgs || []
    });
  }));

  app.post("/api/deals/:id/messages", wrap("Deal message", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "deal-msg", 60, 60000)) return;
    const room = await loadRoom(req, res, m); if (!room) return;
    if (!["open", "agreed"].includes(room.status)) return bad(res, "This deal is closed.", 409);
    const body = clean(req.body.body);
    if (!body || body.length > 2000) return bad(res, "Write a message of 1–2000 characters.");
    if (contactBlocked(body)) return bad(res, "For your safety, keep phone numbers, emails and links out of the chat. Use the deal room to agree terms.");
    const other = otherParty(room, m);
    if (await blockedBetween(m.id, other)) return bad(res, "You cannot message this member.", 403);
    const { data, error } = await db.from("jr_deal_messages").insert({ room_id: room.id, sender_id: m.id, body })
      .select("id,sender_id,body,created_at").single();
    if (error) throw error;
    db.from("jr_deal_rooms").update({ updated_at: new Date().toISOString() }).eq("id", room.id).then(() => {}).catch(() => {});
    await notify(other, "New message", "You have a new message in a deal room.", "message");
    res.status(201).json({ ok: true, message: data });
  }));

  app.post("/api/deals/:id/offer", wrap("Deal offer", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const room = await loadRoom(req, res, m); if (!room) return;
    if (room.status !== "open") return bad(res, "Offers can only be changed while a deal is open.", 409);
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return bad(res, "Enter a valid amount.");
    const { data: l } = await db.from("jr_listings").select("price,negotiable").eq("id", room.listing_id).maybeSingle();
    if (l && !l.negotiable && amount !== Number(l.price)) return bad(res, "This price is fixed.");
    const { data, error } = await db.from("jr_deal_rooms").update({
      offer_amount: amount, buyer_agreed: false, seller_agreed: false, updated_at: new Date().toISOString()
    }).eq("id", room.id).eq("status", "open").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "This deal has already changed.", 409);
    await notify(otherParty(room, m), "New offer", `A new offer of KSh ${amount.toLocaleString("en-KE")} was made.`, "deal");
    res.json({ ok: true, deal: data });
  }));

  app.post("/api/deals/:id/agree", wrap("Deal agree", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const room = await loadRoom(req, res, m); if (!room) return;
    if (room.status !== "open") return bad(res, "This deal is not open.", 409);
    const isBuyer = String(room.buyer_id) === String(m.id);
    const flags = { buyer_agreed: room.buyer_agreed, seller_agreed: room.seller_agreed };
    flags[isBuyer ? "buyer_agreed" : "seller_agreed"] = true;
    const both = flags.buyer_agreed && flags.seller_agreed;
    const update = { ...flags, updated_at: new Date().toISOString() };
    if (both) { update.status = "agreed"; update.amount = room.offer_amount ?? room.amount; }
    const { data, error } = await db.from("jr_deal_rooms").update(update).eq("id", room.id).eq("status", "open").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "This deal has already changed.", 409);
    await notify(otherParty(room, m), both ? "Deal agreed" : "Agreement requested",
      both ? "Both sides agreed on the price." : "The other side agreed to the offer. Review it in the deal room.", "deal");
    res.json({ ok: true, deal: data });
  }));

  app.post("/api/deals/:id/complete", wrap("Deal complete", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const room = await loadRoom(req, res, m); if (!room) return;
    if (String(room.buyer_id) !== String(m.id)) return bad(res, "Only the buyer can confirm the item was received.", 403);
    if (room.status !== "agreed") return bad(res, "Both sides must agree before a deal can be completed.", 409);
    const { data, error } = await db.from("jr_deal_rooms").update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", room.id).eq("status", "agreed").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "This deal has already changed.", 409);
    await db.from("jr_listings").update({ status: "sold", updated_at: new Date().toISOString() }).eq("id", room.listing_id);
    await notify(room.seller_id, "Deal completed", "The buyer confirmed the deal is complete.", "deal");
    await logActivity(m.id, "COMPLETE_DEAL", { deal_id: room.id });
    res.json({ ok: true, deal: data });
  }));

  app.post("/api/deals/:id/cancel", wrap("Deal cancel", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const room = await loadRoom(req, res, m); if (!room) return;
    if (!["open", "agreed"].includes(room.status)) return bad(res, "This deal is already closed.", 409);
    const { data, error } = await db.from("jr_deal_rooms").update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", room.id).in("status", ["open", "agreed"]).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "This deal has already changed.", 409);
    await notify(otherParty(room, m), "Deal cancelled", "The other side cancelled the deal.", "deal");
    res.json({ ok: true, deal: data });
  }));

  /* ---------------- REPORTS AND BLOCKS ---------------- */
  app.post("/api/report", wrap("Report", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "report", 20, 3600000)) return;
    const reported = clean(req.body.reported_id);
    const listing = clean(req.body.listing_id);
    const reason = clean(req.body.reason).slice(0, 120);
    const details = clean(req.body.details).slice(0, 1000);
    if (!reason) return bad(res, "Tell us why you are reporting this.");
    if (!reported && !listing) return bad(res, "Choose a member or listing to report.");
    if (reported && !UUID.test(reported)) return bad(res, "Invalid member.");
    if (listing && !UUID.test(listing)) return bad(res, "Invalid listing.");
    if (reported && reported === String(m.id)) return bad(res, "You cannot report yourself.");
    const { error } = await db.from("jr_reports").insert({
      reporter_id: m.id, reported_id: reported || null, listing_id: listing || null, reason, details, status: "pending"
    });
    if (error) throw error;
    res.status(201).json({ ok: true, message: "Thank you. Our team will review this report." });
  }));

  app.get("/api/blocks", wrap("List blocks", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { data, error } = await db.from("jr_blocks").select("id,blocked_id,created_at").eq("member_id", m.id).limit(200);
    if (error) throw error;
    res.json({ ok: true, blocks: data || [] });
  }));

  app.post("/api/blocks", wrap("Block", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const target = clean(req.body.member_id);
    if (!UUID.test(target) || target === String(m.id)) return bad(res, "Invalid member.");
    const { error } = await db.from("jr_blocks").upsert({ member_id: m.id, blocked_id: target }, { onConflict: "member_id,blocked_id", ignoreDuplicates: true });
    if (error) throw error;
    res.status(201).json({ ok: true });
  }));

  app.delete("/api/blocks/:memberId", wrap("Unblock", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const target = clean(req.params.memberId);
    if (!UUID.test(target)) return bad(res, "Invalid member.");
    const { error } = await db.from("jr_blocks").delete().eq("member_id", m.id).eq("blocked_id", target);
    if (error) throw error;
    res.json({ ok: true });
  }));

  /* ---------------- NOTIFICATIONS ---------------- */
  app.get("/api/notifications", wrap("Notifications", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { data, error } = await db.from("jr_notifications").select("id,title,message,type,read,created_at")
      .eq("member_id", m.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ ok: true, unread: (data || []).filter(n => !n.read).length, notifications: data || [] });
  }));

  app.post("/api/notifications/read-all", wrap("Notifications read", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { error } = await db.from("jr_notifications").update({ read: true }).eq("member_id", m.id).eq("read", false);
    if (error) throw error;
    res.json({ ok: true });
  }));

  /* ---------------- PASSWORD RESET (code sent by WhatsApp/SMS via Twilio) ---------------- */
  const SID = process.env.TWILIO_ACCOUNT_SID;
  const TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const FROM = process.env.TWILIO_RESET_FROM; // e.g. "whatsapp:+14155238886" or an SMS-capable number

  async function sendCode(phone, code) {
    const client = twilio(SID, TOKEN);
    const to = FROM.toLowerCase().startsWith("whatsapp:") ? "whatsapp:" + phone : phone;
    await client.messages.create({ from: FROM, to, body: `JR PHEEF: your reset code is ${code}. It expires in 10 minutes. Never share it with anyone.` });
  }

  app.post("/api/password/forgot", wrap("Password forgot", async (req, res) => {
    if (limited(req, res, "pw-forgot", 5, 3600000)) return;
    if (!SID || !TOKEN || !FROM) return bad(res, "Password reset by message is not enabled yet. Please contact JR PHEEF support.", 503);
    const phone = phoneOf(req.body.phone);
    const generic = { ok: true, message: "If an account exists for that number, a reset code has been sent." };
    if (!/^\+254\d{9}$/.test(phone)) return res.json(generic);
    let member = null;
    for (const p of phoneVariants(phone)) {
      const { data } = await db.from("members").select("id,status").eq("phone", p).limit(1);
      if (data && data[0]) { member = data[0]; break; }
    }
    if (!member || RESTRICTED.includes(String(member.status || "").toLowerCase())) return res.json(generic);
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    await db.from("password_resets").update({ used: true, used_at: new Date().toISOString() })
      .eq("phone", phone).eq("used", false);
    const { error } = await db.from("password_resets").insert({
      phone, member_id: String(member.id), purpose: "password_reset",
      code_hash: hash(code + ":" + member.id), expires_at: new Date(Date.now() + 10 * 60000).toISOString()
    });
    if (error) throw error;
    await sendCode(phone, code);
    res.json(generic);
  }));

  app.post("/api/password/reset", wrap("Password reset", async (req, res) => {
    if (limited(req, res, "pw-reset", 15, 3600000)) return;
    const phone = phoneOf(req.body.phone);
    const code = clean(req.body.code);
    const next = String(req.body.new_password || "");
    if (!/^\+254\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) return bad(res, "Enter your phone number and the 6-digit code.");
    if (next.length < 8 || next.length > 72) return bad(res, "Password must be 8 to 72 characters.");
    const { data: row, error } = await db.from("password_resets").select("*")
      .eq("phone", phone).eq("used", false).gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    const invalid = () => bad(res, "That code is invalid or has expired.", 400);
    if (!row) return invalid();
    if (Number(row.attempts || 0) >= 5) return bad(res, "Too many wrong attempts. Request a new code.", 429);
    if (row.code_hash !== hash(code + ":" + row.member_id)) {
      await db.from("password_resets").update({ attempts: Number(row.attempts || 0) + 1 }).eq("id", row.id);
      return invalid();
    }
    const { data: used } = await db.from("password_resets").update({ used: true, used_at: new Date().toISOString() })
      .eq("id", row.id).eq("used", false).select("id").maybeSingle();
    if (!used) return invalid();
    const { error: upErr } = await db.from("members").update({ password_hash: await bcrypt.hash(next, 12) }).eq("id", row.member_id);
    if (upErr) throw upErr;
    await db.from("sessions").delete().eq("member_id", String(row.member_id));
    await logActivity(row.member_id, "PASSWORD_RESET");
    res.json({ ok: true, message: "Password updated. Please log in." });
  }));

  /* ---------------- OWNER ADMIN API ---------------- */
  async function requireOwner(req, res) {
    const m = await requireMember(req, res); if (!m) return null;
    if (!isOwner(m)) { bad(res, "Owner access required.", 403); return null; }
    return m;
  }
  const count = async (table, filter) => {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: c, error } = await q;
    if (error) throw error;
    return c || 0;
  };

  app.get("/api/admin/stats", wrap("Admin stats", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const [members, listings, openDeals, completedDeals, pendingReports] = await Promise.all([
      count("members"),
      count("jr_listings", q => q.eq("status", "active")),
      count("jr_deal_rooms", q => q.in("status", ["open", "agreed"])),
      count("jr_deal_rooms", q => q.eq("status", "completed")),
      count("jr_reports", q => q.eq("status", "pending"))
    ]);
    res.json({ ok: true, stats: { members, active_listings: listings, open_deals: openDeals, completed_deals: completedDeals, pending_reports: pendingReports } });
  }));

  app.get("/api/admin/reports", wrap("Admin reports", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const status = clean(req.query.status) || "pending";
    const { data, error } = await db.from("jr_reports").select("*").eq("status", status)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ ok: true, reports: data || [] });
  }));

  app.patch("/api/admin/reports/:id", wrap("Admin report update", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const status = clean(req.body.status);
    if (!["reviewed", "dismissed", "actioned"].includes(status)) return bad(res, "Invalid status.");
    if (!UUID.test(clean(req.params.id))) return bad(res, "Report not found.", 404);
    const { data, error } = await db.from("jr_reports").update({ status }).eq("id", req.params.id).select("id,status").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Report not found.", 404);
    res.json({ ok: true, report: data });
  }));

  app.patch("/api/admin/members/:id", wrap("Admin member update", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Member not found.", 404);
    if (id === String(owner.id)) return bad(res, "You cannot change your own account here.");
    const u = {};
    if (req.body.status !== undefined) {
      const s = clean(req.body.status);
      if (!["active", "suspended", "blocked"].includes(s)) return bad(res, "Invalid status.");
      u.status = s;
    }
    if (req.body.verified !== undefined) {
      if (typeof req.body.verified !== "boolean") return bad(res, "Invalid verified value.");
      u.verified = req.body.verified;
    }
    if (!Object.keys(u).length) return bad(res, "No valid changes supplied.");
    const { data, error } = await db.from("members").update(u).eq("id", id).select("id,status,verified").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Member not found.", 404);
    if (u.status && u.status !== "active") await db.from("sessions").delete().eq("member_id", id);
    await logActivity(owner.id, "ADMIN_MEMBER_UPDATE", { member_id: id, ...u });
    res.json({ ok: true, member: data });
  }));

  app.patch("/api/admin/listings/:id", wrap("Admin listing update", async (req, res) => {
    const owner = await requireOwner(req, res); if (!owner) return;
    const id = clean(req.params.id);
    const status = clean(req.body.status);
    if (!UUID.test(id)) return bad(res, "Listing not found.", 404);
    if (!["active", "removed"].includes(status)) return bad(res, "Status must be active or removed.");
    const { data, error } = await db.from("jr_listings").update({ status, updated_at: new Date().toISOString() })
      .eq("id", id).select("id,status").maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Listing not found.", 404);
    await logActivity(owner.id, "ADMIN_LISTING_UPDATE", { listing_id: id, status });
    res.json({ ok: true, listing: data });
  }));
};
