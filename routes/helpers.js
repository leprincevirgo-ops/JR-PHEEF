// Shared helpers for route modules (delivery, powersale, payments).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = function helpers(ctx) {
  const { db, clean, checkRequestRate, requireMember } = ctx;

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
  const requireOwner = async (req, res) => {
    const m = await requireMember(req, res); if (!m) return null;
    if (!isOwner(m)) { bad(res, "Owner access required.", 403); return null; }
    return m;
  };
  const displayName = p => (!p || p.profile_visibility === "private" ? "JR PHEEF Member" : p.full_name || "JR PHEEF Member");

  async function notify(memberId, title, message, type = "general") {
    const { error } = await db.from("jr_notifications").insert({ member_id: memberId, title, message, type });
    if (error) console.error("Notify failed:", error.message);
  }
  async function blockedIds(memberId) {
    const { data, error } = await db.from("jr_blocks").select("member_id,blocked_id")
      .or(`member_id.eq.${memberId},blocked_id.eq.${memberId}`).limit(500);
    if (error) throw error;
    return new Set((data || []).map(b => String(b.member_id) === String(memberId) ? String(b.blocked_id) : String(b.member_id)));
  }
  return { UUID, wrap, bad, limited, isOwner, requireOwner, displayName, notify, blockedIds };
};
