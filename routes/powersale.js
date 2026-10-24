// JR PHEEF Power Sale: timed discounts on a seller's own listings.
// While a promo runs, price = sale price and original_price = the normal price.
// A database function (expire_promos) restores normal prices when a promo ends.
const makeHelpers = require("./helpers");

module.exports = function mountPowerSale(ctx) {
  const { app, db, clean, requireMember, contactBlocked, logActivity } = ctx;
  const { UUID, wrap, bad, limited, displayName, blockedIds } = makeHelpers(ctx);

  const expire = () => db.rpc("expire_promos").then(r => { if (r.error) console.error("expire_promos:", r.error.message); }).catch(() => {});
  expire();
  setInterval(expire, 15 * 60 * 1000).unref();

  app.post("/api/listings/:id/promo", wrap("Promo start", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (limited(req, res, "promo", 30, 3600000)) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Listing not found.", 404);
    const salePrice = Number(req.body.sale_price);
    const days = Number(req.body.days);
    const label = clean(req.body.label).slice(0, 40);
    if (!Number.isFinite(salePrice) || salePrice <= 0) return bad(res, "Enter a valid sale price.");
    if (!Number.isInteger(days) || days < 1 || days > 30) return bad(res, "Choose a promotion length of 1 to 30 days.");
    if (label && contactBlocked(label)) return bad(res, "Do not include contact details in the label.");
    const { data: l, error } = await db.from("jr_listings").select("id,member_id,price,status,original_price")
      .eq("id", id).eq("member_id", m.id).maybeSingle();
    if (error) throw error;
    if (!l || l.status !== "active") return bad(res, "Listing not found or not active.", 404);
    if (l.original_price !== null) return bad(res, "This listing already has a promotion. End it first.", 409);
    const price = Number(l.price);
    if (salePrice >= price) return bad(res, "The sale price must be lower than the current price.");
    if (salePrice < price * 0.1) return bad(res, "Discounts above 90% are not allowed.");
    const ends = new Date(Date.now() + days * 86400000).toISOString();
    const { data, error: upErr } = await db.from("jr_listings").update({
      original_price: price, price: salePrice, promo_label: label || "Power Sale", promo_ends_at: ends, updated_at: new Date().toISOString()
    }).eq("id", id).eq("member_id", m.id).is("original_price", null).select("*").maybeSingle();
    if (upErr) throw upErr;
    if (!data) return bad(res, "Could not start the promotion. Try again.", 409);
    await logActivity(m.id, "PROMO_START", { listing_id: id, sale_price: salePrice, days });
    res.json({ ok: true, listing: data });
  }));

  app.delete("/api/listings/:id/promo", wrap("Promo end", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const id = clean(req.params.id);
    if (!UUID.test(id)) return bad(res, "Listing not found.", 404);
    const { data: l, error } = await db.from("jr_listings").select("id,original_price").eq("id", id).eq("member_id", m.id).maybeSingle();
    if (error) throw error;
    if (!l) return bad(res, "Listing not found.", 404);
    if (l.original_price === null) return bad(res, "This listing has no active promotion.", 409);
    const { data, error: upErr } = await db.from("jr_listings").update({
      price: l.original_price, original_price: null, promo_label: null, promo_ends_at: null, updated_at: new Date().toISOString()
    }).eq("id", id).eq("member_id", m.id).not("original_price", "is", null).select("*").maybeSingle();
    if (upErr) throw upErr;
    res.json({ ok: true, listing: data });
  }));

  app.get("/api/powersale", wrap("Power sale list", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    await expire();
    const [{ data, error }, blocked] = await Promise.all([
      db.from("jr_listings").select("id,member_id,item_name,description,category,location,price,original_price,promo_label,promo_ends_at,photos,negotiable")
        .eq("status", "active").not("original_price", "is", null).gt("promo_ends_at", new Date().toISOString())
        .order("promo_ends_at", { ascending: true }).limit(100),
      blockedIds(m.id)
    ]);
    if (error) throw error;
    const rows = (data || []).filter(x => !blocked.has(String(x.member_id)));
    const sellerIds = [...new Set(rows.map(x => x.member_id))];
    let sellers = {};
    if (sellerIds.length) {
      const { data: ms } = await db.from("members").select("id,full_name,verified,profile_visibility").in("id", sellerIds);
      sellers = Object.fromEntries((ms || []).map(s => [String(s.id), s]));
    }
    const deals = rows.map(x => ({
      ...x,
      discount_pct: Math.round((1 - Number(x.price) / Number(x.original_price)) * 100),
      seller_name: displayName(sellers[String(x.member_id)]),
      seller_verified: !!(sellers[String(x.member_id)] && sellers[String(x.member_id)].verified),
      is_mine: String(x.member_id) === String(m.id)
    })).sort((a, b) => b.discount_pct - a.discount_pct).slice(0, 60);
    res.json({ ok: true, deals });
  }));
};
