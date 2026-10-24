// JR PHEEF Payments: M-Pesa (Safaricom Daraja) STK Push.
// Everything stays OFF until the environment variables below are set in Render.
//
//   PAYMENTS_ENABLED=true
//   MPESA_ENV=sandbox | production            (default sandbox)
//   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET
//   MPESA_SHORTCODE                            (paybill or till number)
//   MPESA_PASSKEY
//   MPESA_CALLBACK_BASE=https://jr-pheef-marketplace.onrender.com
//   MPESA_CALLBACK_SECRET=<long random string, used inside the callback URL>
//   MPESA_TRANSACTION_TYPE=CustomerPayBillOnline | CustomerBuyGoodsOnline
//   MPESA_PARTYB=<till number, only for CustomerBuyGoodsOnline; defaults to the shortcode>
//   CONNECTION_FEES_ENABLED=true               (optional; per-deal fees stay off unless set)
const crypto = require("crypto");
const makeHelpers = require("./helpers");

const PLANS = {
  membership_pro: { plan: "PRO", amount: 99, matchFee: 20, label: "PRO membership (30 days)" },
  membership_prime: { plan: "PRIME", amount: 149, matchFee: 20, label: "PRIME membership (30 days)" }
};
const STD_FEE = 30, MEMBER_FEE = 20;
const DAY = 86400000;

module.exports = function mountPayments(ctx) {
  const { app, db, clean, phoneOf, requireMember, logActivity } = ctx;
  const { UUID, wrap, bad, limited, requireOwner, notify } = makeHelpers(ctx);
  const E = process.env;

  const configured = () => !!(E.PAYMENTS_ENABLED === "true" && E.MPESA_CONSUMER_KEY && E.MPESA_CONSUMER_SECRET &&
    E.MPESA_SHORTCODE && E.MPESA_PASSKEY && E.MPESA_CALLBACK_BASE && E.MPESA_CALLBACK_SECRET);
  const apiBase = () => (E.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");
  const feesOn = () => E.CONNECTION_FEES_ENABLED === "true";
  const digest = s => crypto.createHash("sha256").update(String(s)).digest();
  const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

  let tokenCache = { value: null, exp: 0 };
  async function accessToken() {
    if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;
    const auth = Buffer.from(E.MPESA_CONSUMER_KEY + ":" + E.MPESA_CONSUMER_SECRET).toString("base64");
    const r = await fetch(apiBase() + "/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: "Basic " + auth }, signal: AbortSignal.timeout(15000)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) throw new Error("Daraja auth failed (" + r.status + ")");
    tokenCache = { value: j.access_token, exp: Date.now() + (Number(j.expires_in || 3500) - 120) * 1000 };
    return tokenCache.value;
  }
  function timestamp() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return p.year + p.month + p.day + p.hour + p.minute + p.second;
  }

  async function activeMembership(memberId) {
    const { data } = await db.from("jr_memberships").select("*").eq("member_id", memberId).maybeSingle();
    if (data && data.expires_at && new Date(data.expires_at) > new Date() && data.plan && data.plan !== "FREE") return data;
    return null;
  }
  const dealFeeFor = m => (m.plan === "PRO" || m.plan === "PRIME" ? MEMBER_FEE : STD_FEE);

  /* ---------- status ---------- */
  app.get("/api/payments/status", wrap("Pay status", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const ms = await activeMembership(m.id);
    res.json({
      ok: true, enabled: configured(), environment: E.MPESA_ENV === "production" ? "production" : "sandbox",
      products: { membership_pro: PLANS.membership_pro.amount, membership_prime: PLANS.membership_prime.amount },
      connection_fees: feesOn() ? { standard: STD_FEE, member: MEMBER_FEE } : null,
      plan: m.plan || "FREE", membership: ms ? { plan: ms.plan, expires_at: ms.expires_at } : null
    });
  }));

  /* ---------- start a payment ---------- */
  app.post("/api/payments/stk", wrap("STK start", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (!configured()) return bad(res, "M-Pesa payments are not active yet.", 503);
    if (limited(req, res, "stk", 10, 3600000)) return;
    const product = clean(req.body.product);
    let amount, purpose = product, refId = null, desc;
    if (PLANS[product]) { amount = PLANS[product].amount; desc = PLANS[product].label; }
    else if (product === "deal_fee") {
      if (!feesOn()) return bad(res, "Connection fees are not active.", 409);
      refId = clean(req.body.ref_id);
      if (!UUID.test(refId)) return bad(res, "Invalid deal.");
      const { data: room } = await db.from("jr_deal_rooms").select("id,buyer_id,seller_id,status").eq("id", refId).maybeSingle();
      if (!room || ![String(room.buyer_id), String(room.seller_id)].includes(String(m.id))) return bad(res, "Deal not found.", 404);
      if (room.status !== "agreed") return bad(res, "A connection fee applies only after both sides agree.", 409);
      amount = dealFeeFor(m); desc = "JR PHEEF deal fee";
    } else return bad(res, "Unknown product.");
    const phone = phoneOf(req.body.phone || m.phone);
    if (!/^\+254[17]\d{8}$/.test(phone)) return bad(res, "Enter a valid Safaricom number (07XXXXXXXX).");
    const msisdn = phone.slice(1);

    const since = new Date(Date.now() - 2 * 60000).toISOString();
    const { data: recent } = await db.from("jr_payments").select("id,status").eq("member_id", m.id).eq("purpose", purpose)
      .eq("status", "pending").gt("created_at", since).limit(1);
    if (recent && recent[0]) return res.json({ ok: true, payment_id: recent[0].id, message: "A payment request is already waiting on your phone." });
    if (purpose === "deal_fee") {
      const { data: paid } = await db.from("jr_payments").select("id").eq("member_id", m.id).eq("purpose", "deal_fee")
        .eq("ref_id", refId).eq("status", "completed").limit(1);
      if (paid && paid[0]) return bad(res, "You have already paid this fee.", 409);
    }

    const { data: pay, error } = await db.from("jr_payments").insert({
      member_id: m.id, amount, currency: "KES", method: "mpesa", purpose, ref_id: refId, phone: msisdn, status: "pending"
    }).select("id").single();
    if (error) throw error;

    try {
      const token = await accessToken(), ts = timestamp();
      const body = {
        BusinessShortCode: E.MPESA_SHORTCODE,
        Password: Buffer.from(E.MPESA_SHORTCODE + E.MPESA_PASSKEY + ts).toString("base64"),
        Timestamp: ts,
        TransactionType: E.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
        Amount: Math.round(amount), PartyA: msisdn, PartyB: E.MPESA_PARTYB || E.MPESA_SHORTCODE, PhoneNumber: msisdn,
        CallBackURL: E.MPESA_CALLBACK_BASE.replace(/\/+$/, "") + "/api/payments/mpesa/callback/" + E.MPESA_CALLBACK_SECRET,
        AccountReference: "JRPHEEF", TransactionDesc: desc.slice(0, 13)
      };
      const r = await fetch(apiBase() + "/mpesa/stkpush/v1/processrequest", {
        method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(20000)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.ResponseCode) !== "0") {
        await db.from("jr_payments").update({ status: "failed", result_desc: clean(j.errorMessage || j.ResponseDescription || "STK request rejected").slice(0, 200), updated_at: new Date().toISOString() }).eq("id", pay.id);
        return bad(res, "Could not start the M-Pesa request. Please try again shortly.", 502);
      }
      await db.from("jr_payments").update({ checkout_request_id: j.CheckoutRequestID, merchant_request_id: j.MerchantRequestID, updated_at: new Date().toISOString() }).eq("id", pay.id);
      await logActivity(m.id, "PAYMENT_STARTED", { payment_id: pay.id, purpose });
      res.json({ ok: true, payment_id: pay.id, message: "Check your phone and enter your M-Pesa PIN to approve KSh " + amount + "." });
    } catch (e) {
      await db.from("jr_payments").update({ status: "failed", result_desc: "Gateway error", updated_at: new Date().toISOString() }).eq("id", pay.id);
      console.error("STK error:", clean(e.message).slice(0, 200));
      return bad(res, "M-Pesa is not reachable right now. Please try again shortly.", 502);
    }
  }));

  /* ---------- Safaricom callback (secret in the URL) ---------- */
  async function fulfil(pay) {
    if (PLANS[pay.purpose]) {
      const p = PLANS[pay.purpose];
      const existing = await db.from("jr_memberships").select("*").eq("member_id", pay.member_id).maybeSingle();
      const cur = existing.data;
      const base = cur && cur.plan === p.plan && cur.expires_at && new Date(cur.expires_at) > new Date() ? new Date(cur.expires_at).getTime() : Date.now();
      const expires = new Date(base + 30 * DAY).toISOString();
      const { error } = await db.from("jr_memberships").upsert({
        member_id: pay.member_id, plan: p.plan, price: p.amount, match_fee: p.matchFee, expires_at: expires, updated_at: new Date().toISOString()
      }, { onConflict: "member_id" });
      if (error) throw error;
      await db.from("members").update({ plan: p.plan }).eq("id", pay.member_id);
      await notify(pay.member_id, p.plan + " activated", "Your " + p.plan + " membership is active until " + new Date(expires).toLocaleDateString("en-KE") + ".", "payment");
    } else if (pay.purpose === "deal_fee") {
      await notify(pay.member_id, "Fee received", "Your deal fee was received. Thank you.", "payment");
    }
  }

  app.post("/api/payments/mpesa/callback/:secret", async (req, res) => {
    const ok = { ResultCode: 0, ResultDesc: "Accepted" };
    try {
      if (!configured() || !safeEqual(req.params.secret, E.MPESA_CALLBACK_SECRET)) return res.status(403).json({ ok: false });
      const cb = req.body && req.body.Body && req.body.Body.stkCallback;
      if (!cb || !cb.CheckoutRequestID) return res.json(ok);
      const { data: pay } = await db.from("jr_payments").select("*").eq("checkout_request_id", String(cb.CheckoutRequestID)).maybeSingle();
      if (!pay || pay.status !== "pending") return res.json(ok);
      const now = new Date().toISOString();
      if (Number(cb.ResultCode) !== 0) {
        await db.from("jr_payments").update({ status: Number(cb.ResultCode) === 1032 ? "cancelled" : "failed", result_code: Number(cb.ResultCode), result_desc: clean(cb.ResultDesc).slice(0, 200), raw_callback: req.body, updated_at: now }).eq("id", pay.id).eq("status", "pending");
        return res.json(ok);
      }
      const items = Object.fromEntries(((cb.CallbackMetadata && cb.CallbackMetadata.Item) || []).map(i => [i.Name, i.Value]));
      const paid = Number(items.Amount), receipt = clean(items.MpesaReceiptNumber).slice(0, 40);
      const good = Number.isFinite(paid) && paid >= Number(pay.amount) && receipt;
      const { data: done } = await db.from("jr_payments").update({
        status: good ? "completed" : "needs_review", result_code: 0, result_desc: good ? "Success" : "Amount or receipt mismatch: review manually",
        mpesa_receipt: receipt || null, raw_callback: req.body, updated_at: now
      }).eq("id", pay.id).eq("status", "pending").select("*").maybeSingle();
      if (done && good) await fulfil(done);
      else if (done) console.error("Payment needs review:", pay.id);
    } catch (e) { console.error("Callback error:", clean(e.message).slice(0, 200)); }
    res.json(ok);
  });

  /* ---------- history and polling ---------- */
  const PUBLIC = "id,amount,currency,purpose,status,mpesa_receipt,result_desc,created_at";
  app.get("/api/payments/mine", wrap("Pay history", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    const { data, error } = await db.from("jr_payments").select(PUBLIC).eq("member_id", m.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ ok: true, payments: data || [] });
  }));
  app.get("/api/payments/:id", wrap("Pay one", async (req, res) => {
    const m = await requireMember(req, res); if (!m) return;
    if (!UUID.test(clean(req.params.id))) return bad(res, "Payment not found.", 404);
    const { data, error } = await db.from("jr_payments").select(PUBLIC).eq("id", req.params.id).eq("member_id", m.id).maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, "Payment not found.", 404);
    res.json({ ok: true, payment: data });
  }));

  /* ---------- owner ---------- */
  app.get("/api/admin/payments", wrap("Admin payments", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    const status = clean(req.query.status);
    let q = db.from("jr_payments").select("id,member_id,amount,purpose,status,mpesa_receipt,phone,result_desc,created_at").order("created_at", { ascending: false }).limit(100);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    const total = (data || []).filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);
    res.json({ ok: true, payments: data || [], completed_total: total });
  }));

  /* ---------- housekeeping: expire memberships, time out stale requests ---------- */
  async function housekeeping() {
    try {
      const now = new Date().toISOString();
      const { data: expired } = await db.from("jr_memberships").select("member_id").neq("plan", "FREE").lt("expires_at", now).limit(200);
      for (const row of expired || []) {
        await db.from("jr_memberships").update({ plan: "FREE", updated_at: now }).eq("member_id", row.member_id);
        await db.from("members").update({ plan: "FREE" }).eq("id", row.member_id);
        await notify(row.member_id, "Membership ended", "Your membership has ended. Renew it any time from the Membership page.", "payment");
      }
      await db.from("jr_payments").update({ status: "failed", result_desc: "No response from M-Pesa", updated_at: now })
        .eq("status", "pending").lt("created_at", new Date(Date.now() - 30 * 60000).toISOString());
    } catch (e) { console.error("Payments housekeeping:", clean(e.message).slice(0, 160)); }
  }
  setTimeout(housekeeping, 20000).unref();
  setInterval(housekeeping, 30 * 60 * 1000).unref();
};
