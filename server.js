
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 10000;
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_URL = process.env.TWILIO_WEBHOOK_URL;

if (!URL || !KEY) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const db = createClient(URL, KEY);
const ACCESS_PRICE = 30;
const ACCESS_HOURS = 5;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 20 }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "1mb" }));

const clean = v => String(v ?? "").trim();
const emailOf = v => clean(v).toLowerCase();
const hash = v => crypto.createHash("sha256").update(String(v)).digest("hex");

function phoneOf(v) {
  let p = clean(v).replace(/^whatsapp:/i, "").replace(/[\s-]/g, "");
  if (p.startsWith("00254")) p = "+" + p.slice(2);
  else if (p.startsWith("254")) p = "+" + p;
  else if (p.startsWith("0") && /^0[17]\d{8}$/.test(p)) p = "+254" + p.slice(1);
  return p;
}

function phoneVariants(v) {
  const p = phoneOf(v);
  if (!/^\+254\d{9}$/.test(p)) return [clean(v)];
  return [...new Set([p, p.slice(1), "0" + p.slice(4)])];
}

const MEMBER_FIELDS = [
  "id", "dgbo_id", "jp_number", "full_name", "email", "location", "bio", "theme",
  "reward_points", "profile_visibility", "show_email", "show_birth_year",
  "show_location", "verified", "status", "plan", "created_at"
];

function safeMember(m) {
  if (!m) return null;
  return Object.fromEntries(
    MEMBER_FIELDS.filter(k => Object.hasOwn(m, k)).map(k => [k, m[k]])
  );
}

function freeWindow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi", hour: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === "hour")?.value);
  return hour >= 2 && hour < 6;
}

function cookie(token, clear = false) {
  return [
    `jr_session=${clear ? "" : token}`,
    "HttpOnly", "Secure", "SameSite=Lax", "Path=/",
    `Max-Age=${clear ? 0 : 604800}`
  ].join("; ");
}

async function logActivity(id, action, details = {}) {
  const { error } = await db.from("activity_log").insert({
    member_id: String(id), action, details
  });
  if (error) console.error("Activity log failed:", error.message);
}

async function getMember(req) {
  const match = (req.headers.cookie || "").match(/(?:^|;\s*)jr_session=([^;]+)/);
  if (!match) return null;

  const { data: session, error } = await db.from("sessions")
    .select("member_id")
    .eq("token_hash", hash(decodeURIComponent(match[1])))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !session) return null;

  const { data: member, error: memberError } = await db.from("members")
    .select("*").eq("id", session.member_id).maybeSingle();

  if (memberError || !member) return null;
  if (["blocked", "suspended", "disabled"].includes(
    String(member.status || "").toLowerCase()
  )) return null;

  return member;
}

async function requireMember(req, res) {
  const member = await getMember(req);
  if (!member) {
    res.status(401).json({ ok: false, error: "LOGIN_REQUIRED" });
    return null;
  }
  return member;
}

function contactBlocked(s) {
  return /(?:\+?254\d{9}|\b0[17]\d{8}\b|https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\.com\b|\.co\.ke\b|\bwhatsapp\b|\btelegram\b|\bcall me\b|\btext me\b)/i.test(clean(s));
}

async function accessStatus(id) {
  if (freeWindow()) {
    return { allowed: true, reason: "FREE_WINDOW" };
  }

  const { data, error } = await db.from("access_passes")
    .select("expires_at").eq("member_id", String(id))
    .eq("status", "active").gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false }).limit(1).maybeSingle();

  if (error) throw error;
  if (data) return { allowed: true, reason: "ACTIVE_PASS", expires_at: data.expires_at };
  return { allowed: false, reason: "PAYMENT_REQUIRED", price: ACCESS_PRICE, hours: ACCESS_HOURS };
}

app.get("/health", (req, res) => res.json({
  ok: true, app: "JR PHEEF", version: "5.0.0",
  access: "KSh 30 / 5 hours", free_window: "02:00-06:00 EAT",
  flex: "PREPARED / INACTIVE", daraja: "NOT CONNECTED"
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* REGISTER */
app.post("/api/register", async (req, res) => {
  try {
    const full_name = clean(req.body.full_name);
    const phone = phoneOf(req.body.phone);
    const email = emailOf(req.body.email);
    const password = String(req.body.password || "");
    const yearText = clean(req.body.birth_year);
    const birth_year = yearText ? Number(yearText) : null;

    if (!full_name || full_name.length > 100)
      return res.status(400).json({ ok: false, error: "Enter your full name." });
    if (!/^\+254\d{9}$/.test(phone))
      return res.status(400).json({ ok: false, error: "Enter a valid Kenyan phone number." });
    if (password.length < 8)
      return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ ok: false, error: "Enter a valid email address." });
    if (birth_year !== null && (!Number.isInteger(birth_year) || birth_year < 1900 || birth_year > new Date().getFullYear()))
      return res.status(400).json({ ok: false, error: "Enter a valid birth year." });

    for (const p of phoneVariants(phone)) {
      const { data, error } = await db.from("members").select("id")
        .eq("phone", p).limit(1);
      if (error) throw error;
      if (data?.length) return res.status(409).json({ ok: false, error: "Account already exists. Please log in." });
    }

    if (email) {
      const { data, error } = await db.from("members").select("id")
        .ilike("email", email).limit(1);
      if (error) throw error;
      if (data?.length) return res.status(409).json({ ok: false, error: "An account with this email already exists. Log in with that email, or use account recovery." });
    }

    // The optional ID generator may be missing in older databases. Registration
    // must not fail solely because that helper RPC has not been installed.
    let nextId = null;
    const idResult = await db.rpc("next_dgbo_id");
    if (!idResult.error) nextId = idResult.data;
    const memberCode = nextId || `DGBO-${Date.now().toString().slice(-6)}`;

    const { data: member, error } = await db.from("members").insert({
      dgbo_id: memberCode,
      full_name, phone, email: email || null, birth_year,
      password_hash: await bcrypt.hash(password, 12),
      verified: false, status: "active", plan: "FREE",
      reward_points: 0, credits: 0, rewards: 0, referrals: 0,
      cash_balance: 0, theme: "ocean", account_type: "individual"
    }).select("id,dgbo_id,full_name").single();

    if (error) throw error;
    await logActivity(member.id, "REGISTER");
    res.status(201).json({ ok: true, message: "Account created. Please log in.", member });
  } catch (e) {
    console.error("Register:", e.message);
    res.status(500).json({ ok: false, error: "Registration failed. Check server configuration and database schema." });
  }
});

/* LOGIN */
app.post("/api/login", async (req, res) => {
  try {
    const identifier = clean(req.body.identifier);
    const password = String(req.body.password || "");
    if (!identifier || !password)
      return res.status(400).json({ ok: false, error: "Enter your phone/email and password." });

    let member = null;
    if (identifier.includes("@")) {
      const { data, error } = await db.from("members").select("*")
        .ilike("email", emailOf(identifier)).limit(2);
      if (error) throw error;
      if (data?.length > 1) return res.status(409).json({ ok: false, error: "More than one account uses this email. Contact JR PHEEF support to safely resolve the duplicate." });
      member = data?.[0] || null;
    } else {
      for (const p of phoneVariants(identifier)) {
        const { data, error } = await db.from("members").select("*")
          .eq("phone", p).limit(2);
        if (error) throw error;
        if (data?.length > 1) return res.status(409).json({ ok: false, error: "More than one account matches this phone number. Contact JR PHEEF support to safely resolve the duplicate." });
        if (data?.[0]) { member = data[0]; break; }
      }
    }

    if (!member || !member.password_hash || !(await bcrypt.compare(password, member.password_hash)))
      return res.status(401).json({ ok: false, error: "Invalid phone/email or password." });

    if (["blocked", "suspended", "disabled"].includes(String(member.status || "").toLowerCase()))
      return res.status(403).json({ ok: false, error: "This account is restricted." });

    const token = crypto.randomBytes(48).toString("hex");
    const { error } = await db.from("sessions").insert({
      member_id: String(member.id), token_hash: hash(token),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      device_label: clean(req.body.device_label).slice(0,80) || "New device",
      user_agent: clean(req.get("user-agent")).slice(0,300),
      last_seen_at: new Date().toISOString()
    });
    if (error) throw error;

    res.setHeader("Set-Cookie", cookie(token));
    await db.from("members").update({
      last_seen_at: new Date().toISOString(), is_online: true
    }).eq("id", member.id);
    await logActivity(member.id, "LOGIN");
    res.json({ ok: true, message: "Login successful.", member: safeMember(member) });
  } catch (e) {
    console.error("Login:", e.message);
    res.status(500).json({ ok: false, error: "We could not complete sign-in because of a server or database problem. Your account has not been deleted. Please try again shortly." });
  }
});

/* SESSION RESTORE */
app.get("/api/me", async (req, res) => {
  try {
    const member = await getMember(req);
    res.json({ ok: true, logged_in: !!member, ...(member ? { member: safeMember(member) } : {}) });
  } catch {
    res.status(500).json({ ok: false, error: "Could not restore session." });
  }
});

/* LOGOUT */
app.post("/api/logout", async (req, res) => {
  try {
    const match = (req.headers.cookie || "").match(/(?:^|;\s*)jr_session=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      const { data: session } = await db.from("sessions").select("member_id")
        .eq("token_hash", hash(token)).maybeSingle();
      await db.from("sessions").delete().eq("token_hash", hash(token));
      if (session?.member_id) await db.from("members").update({ is_online: false }).eq("id", session.member_id);
    }
    res.setHeader("Set-Cookie", cookie("", true));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "Logout failed." });
  }
});

/* ACCESS */
app.get("/api/access", async (req, res) => {
  try {
    const m = await requireMember(req, res);
    if (!m) return;
    res.json({ ok: true, ...(await accessStatus(m.id)), points: Number(m.reward_points || 0), points_needed: ACCESS_PRICE });
  } catch {
    res.status(500).json({ ok: false, error: "Could not check access." });
  }
});

/* REDEEM POINTS
   NOTE: use a database transaction/RPC for production-grade atomic redemption. */
app.post("/api/points/redeem-access", async (req, res) => {
  try {
    const m = await requireMember(req, res);
    if (!m) return;
    if (freeWindow()) return res.json({ ok: true, free: true, message: "Access is free right now." });

    const points = Number(m.reward_points || 0);
    if (points < ACCESS_PRICE)
      return res.status(400).json({ ok: false, error: "You need 30 points for 5-hour access.", points });

    const starts = new Date();
    const expires = new Date(starts.getTime() + ACCESS_HOURS * 3600000);
    const { data: updated, error } = await db.from("members")
      .update({ reward_points: points - ACCESS_PRICE })
      .eq("id", m.id).gte("reward_points", ACCESS_PRICE)
      .select("reward_points").maybeSingle();

    if (error || !updated)
      return res.status(409).json({ ok: false, error: "Points could not be redeemed. Please retry." });

    const { error: passError } = await db.from("access_passes").insert({
      member_id: String(m.id), amount: ACCESS_PRICE, hours: ACCESS_HOURS,
      payment_method: "points", source: "points", status: "active",
      starts_at: starts.toISOString(), expires_at: expires.toISOString()
    });

    if (passError) {
      console.error("Pass creation failed; points need reconciliation:", passError.message);
      return res.status(500).json({ ok: false, error: "Pass creation failed. Contact support before retrying." });
    }

    await db.from("point_transactions").insert({
      member_id: String(m.id), amount: -ACCESS_PRICE,
      transaction_type: "REDEEM_ACCESS", description: "Points redeemed for 5-hour access"
    });
    res.json({ ok: true, points_remaining: updated.reward_points, expires_at: expires.toISOString() });
  } catch {
    res.status(500).json({ ok: false, error: "Redemption failed." });
  }
});

/* OWNER POINT ADJUSTMENT */
app.post("/api/owner/points", async (req, res) => {
  try {
    const owner = await requireMember(req, res);
    if (!owner) return;
    if (![owner.account_type, owner.role].some(v => String(v || "").toLowerCase() === "owner"))
      return res.status(403).json({ ok: false, error: "Owner access required." });

    const memberId = clean(req.body.member_id);
    const amount = Number(req.body.amount);
    if (!memberId || !Number.isSafeInteger(amount) || !amount)
      return res.status(400).json({ ok: false, error: "Valid member ID and point amount required." });

    const { data: target, error } = await db.from("members").select("id,reward_points")
      .eq("id", memberId).maybeSingle();
    if (error) throw error;
    if (!target) return res.status(404).json({ ok: false, error: "Member not found." });

    const oldPoints = Number(target.reward_points || 0);
    if (oldPoints + amount < 0)
      return res.status(400).json({ ok: false, error: "Insufficient points for this deduction." });

    const newPoints = oldPoints + amount;
    const { error: updateError } = await db.from("members").update({ reward_points: newPoints }).eq("id", memberId);
    if (updateError) throw updateError;

    const { error: txError } = await db.from("point_transactions").insert({
      member_id: String(memberId), amount,
      transaction_type: amount > 0 ? "OWNER_AWARD" : "OWNER_DEDUCTION",
      description: clean(req.body.description) || "Owner point adjustment"
    });
    if (txError) console.error("Point transaction log failed:", txError.message);

    res.json({ ok: true, reward_points: newPoints });
  } catch (e) {
    console.error("Owner points:", e.message);
    res.status(500).json({ ok: false, error: "Point adjustment failed." });
  }
});

/* PHEEF FLEX — requests only; lending remains disabled */
app.get("/api/flex", async (req, res) => {
  const m = await requireMember(req, res);
  if (!m) return;
  const { data } = await db.from("pay_later_accounts").select("status,trust_level,available_limit")
    .eq("member_id", String(m.id)).maybeSingle();
  res.json({ ok: true, active: false, status: data?.status || "inactive",
    trust_level: data?.trust_level || 0, available_limit: data?.available_limit || 0,
    message: "PHEEF FLEX is not active yet." });
});

app.post("/api/flex/request", async (req, res) => {
  const m = await requireMember(req, res);
  if (!m) return;
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ ok: false, error: "Enter a valid amount." });

  const { data, error } = await db.from("credit_requests").insert({
    member_id: String(m.id), requested_amount: amount, approved_amount: 0,
    principal: 0, interest_amount: 0, fees: 0, total_payable: 0,
    status: "disabled", provider: "JR_PHEEF_PENDING_PARTNER", purpose: "marketplace_access"
  }).select("id").single();
  if (error) return res.status(500).json({ ok: false, error: "Request could not be recorded." });
  res.json({ ok: true, active: false, request_id: data.id, message: "Request recorded; credit is not enabled." });
});


/* KNOWLEDGE LIBRARY — curated content with provenance metadata */
app.get("/api/knowledge", async (req, res) => {
  try {
    const member = await requireMember(req, res);
    if (!member) return;
    const q = clean(req.query.q).slice(0, 120);
    const domain = clean(req.query.domain).slice(0, 80);
    let query = db.from("knowledge_articles")
      .select("id,slug,title,domain,summary,content,tags,source_name,source_url,source_published_at,evidence_status,updated_at")
      .eq("visibility", "published")
      .order("domain", { ascending: true }).order("title", { ascending: true }).limit(100);
    if (domain) query = query.ilike("domain", "%" + domain + "%");
    if (q) query = query.or("title.ilike.%" + q.replace(/[,%()]/g, " ") + "%,summary.ilike.%" + q.replace(/[,%()]/g, " ") + "%,content.ilike.%" + q.replace(/[,%()]/g, " ") + "%,domain.ilike.%" + q.replace(/[,%()]/g, " ") + "%");
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, count: data.length, articles: data });
  } catch (e) {
    console.error("Knowledge search:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Knowledge Library is temporarily unavailable." });
  }
});

/* LAB — experiments are private to their owner */
app.get("/api/lab/experiments", async (req, res) => {
  try {
    const member = await requireMember(req, res);
    if (!member) return;
    const { data, error } = await db.from("lab_experiments").select("id,title,challenge,thinking_approach,constraints_text,hypothesis,method,success_measure,risk_notes,status,outcome_notes,lessons_learned,created_at,updated_at").eq("member_id", member.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ ok: true, experiments: data || [] });
  } catch (e) {
    console.error("Lab list:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Could not load your Lab experiments." });
  }
});

app.post("/api/lab/experiments", async (req, res) => {
  try {
    const member = await requireMember(req, res);
    if (!member) return;
    const title = clean(req.body.title).slice(0, 140);
    const challenge = clean(req.body.challenge).slice(0, 4000);
    const approach = clean(req.body.thinking_approach);
    const allowed = ["detective","strategist","inventor","scientist","actuary","negotiator","protector","explorer","storyteller","futureai"];
    if (!title || !challenge) return res.status(400).json({ ok: false, error: "A title and challenge are required." });
    if (!allowed.includes(approach)) return res.status(400).json({ ok: false, error: "Choose a valid thinking approach." });
    const row = {
      member_id: member.id, title, challenge, thinking_approach: approach,
      constraints_text: clean(req.body.constraints_text).slice(0, 1000),
      hypothesis: clean(req.body.hypothesis).slice(0, 2000),
      method: clean(req.body.method).slice(0, 4000),
      success_measure: clean(req.body.success_measure).slice(0, 1000),
      risk_notes: clean(req.body.risk_notes).slice(0, 2000),
      status: "planned"
    };
    const { data, error } = await db.from("lab_experiments").insert(row).select("id,title,challenge,thinking_approach,constraints_text,hypothesis,method,success_measure,risk_notes,status,created_at").single();
    if (error) throw error;
    await logActivity(member.id, "LAB_EXPERIMENT_CREATED", { experiment_id: data.id });
    res.status(201).json({ ok: true, experiment: data });
  } catch (e) {
    console.error("Lab save:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Could not save the experiment. Please try again." });
  }
});

app.patch("/api/lab/experiments/:id", async (req, res) => {
  try {
    const member = await requireMember(req, res);
    if (!member) return;
    const allowedStatus = ["planned","running","completed","cancelled"];
    const update = {};
    if (req.body.status !== undefined && allowedStatus.includes(clean(req.body.status))) update.status = clean(req.body.status);
    if (req.body.outcome_notes !== undefined) update.outcome_notes = clean(req.body.outcome_notes).slice(0, 4000);
    if (req.body.lessons_learned !== undefined) update.lessons_learned = clean(req.body.lessons_learned).slice(0, 4000);
    if (!Object.keys(update).length) return res.status(400).json({ ok: false, error: "No valid experiment updates provided." });
    update.updated_at = new Date().toISOString();
    const { data, error } = await db.from("lab_experiments").update(update).eq("id", req.params.id).eq("member_id", member.id).select("id,status,outcome_notes,lessons_learned,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: "Experiment not found." });
    res.json({ ok: true, experiment: data });
  } catch (e) {
    console.error("Lab update:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Could not update the experiment." });
  }
});


/* PROFILE */
app.put("/api/profile", async (req, res) => {
  try {
    const m = await requireMember(req, res);
    if (!m) return;
    const update = {};

    for (const k of ["full_name", "bio", "location", "theme", "profile_visibility", "show_email", "show_birth_year", "show_location"]) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }

    if (update.full_name !== undefined && (!clean(update.full_name) || clean(update.full_name).length > 100))
      return res.status(400).json({ ok: false, error: "Enter a valid name." });
    if (update.bio !== undefined && clean(update.bio).length > 1000)
      return res.status(400).json({ ok: false, error: "Bio is too long." });
    if (update.location !== undefined && clean(update.location).length > 150)
      return res.status(400).json({ ok: false, error: "Location is too long." });
    if (update.theme !== undefined && !/^[a-z0-9_-]{1,30}$/i.test(clean(update.theme)))
      return res.status(400).json({ ok: false, error: "Invalid theme." });
    if (update.profile_visibility !== undefined && !["public", "private", "connections"].includes(update.profile_visibility))
      return res.status(400).json({ ok: false, error: "Invalid profile visibility." });

    for (const k of ["show_email", "show_birth_year", "show_location"]) {
      if (update[k] !== undefined && typeof update[k] !== "boolean")
        return res.status(400).json({ ok: false, error: `Invalid ${k} setting.` });
    }

    if (req.body.email !== undefined && emailOf(req.body.email) !== emailOf(m.email))
      return res.status(403).json({ ok: false, error: "Email changes require verification." });
    if (!Object.keys(update).length)
      return res.status(400).json({ ok: false, error: "No valid profile changes supplied." });

    const { data, error } = await db.from("members").update(update)
      .eq("id", m.id).select("*").single();
    if (error) throw error;
    await logActivity(m.id, "PROFILE_UPDATED");
    res.json({ ok: true, member: safeMember(data) });
  } catch (e) {
    console.error("Profile:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Profile update failed." });
  }
});

/* LISTINGS */
app.get("/api/listings", async (req, res) => {
  try {
    const m = await requireMember(req, res);
    if (!m) return;
    const access = await accessStatus(m.id);
    if (!access.allowed) return res.status(402).json({ ok: false, error: "MARKETPLACE_ACCESS_REQUIRED", price: ACCESS_PRICE, hours: ACCESS_HOURS, points: Number(m.reward_points || 0) });

    let q = db.from("jr_listings").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(50);
    const term = clean(req.query.q);
    if (term) q = q.ilike("item_name", `%${term.replace(/[%_,()]/g, "")}%`);
    const category = clean(req.query.category);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ ok: true, listings: data || [] });
  } catch (e) {
    console.error("Listings:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Could not load listings." });
  }
});

app.post("/api/listings", upload.array("photos", 20), async (req, res) => {
  try {
    const m = await requireMember(req, res);
    if (!m) return;
    const access = await accessStatus(m.id);
    if (!access.allowed) return res.status(402).json({ ok: false, error: "MARKETPLACE_ACCESS_REQUIRED", price: ACCESS_PRICE, hours: ACCESS_HOURS });

    const item_name = clean(req.body.item_name);
    const description = clean(req.body.description);
    const price = Number(req.body.price || 0);
    if (!item_name || item_name.length > 120)
      return res.status(400).json({ ok: false, error: "Enter a valid listing title." });
    if (!Number.isFinite(price) || price < 0)
      return res.status(400).json({ ok: false, error: "Enter a valid price." });
    if (contactBlocked(item_name) || contactBlocked(description))
      return res.status(400).json({ ok: false, error: "Direct contact details cannot be shared in listings." });

    const photos = [];
    for (const f of req.files || []) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.mimetype))
        return res.status(400).json({ ok: false, error: "Only JPG, PNG, and WebP images are accepted." });
      const filename = `${m.id}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[f.mimetype]}`;
      const { error } = await db.storage.from("jr-pheef-media").upload(filename, f.buffer, { contentType: f.mimetype, upsert: false });
      if (error) throw error;
      const { data } = db.storage.from("jr-pheef-media").getPublicUrl(filename);
      photos.push(data.publicUrl);
    }

    const { data, error } = await db.from("jr_listings").insert({
      member_id: String(m.id), item_name, description,
      category: clean(req.body.category), price,
      location: clean(req.body.location), photos, status: "active"
    }).select().single();
    if (error) throw error;
    await logActivity(m.id, "CREATE_LISTING", { listing_id: data.id });
    res.status(201).json({ ok: true, listing: data });
  } catch (e) {
    console.error("Create listing:", e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Listing could not be created." });
  }
});

/* CONNECTION REQUEST */
app.post("/api/connections", async (req, res) => {
  const m = await requireMember(req, res);
  if (!m) return;
  const receiver_id = clean(req.body.receiver_id);
  if (!receiver_id || receiver_id === String(m.id))
    return res.status(400).json({ ok: false, error: "Invalid connection." });

  const { data, error } = await db.from("connections").upsert({
    requester_id: String(m.id), receiver_id, status: "pending",
    updated_at: new Date().toISOString()
  }, { onConflict: "requester_id,receiver_id" }).select().single();

  if (error) return res.status(400).json({ ok: false, error: "Connection request failed." });
  res.json({ ok: true, connection: data });
});


/* JP NUMBER DIRECTORY AND SOCIAL CONNECTIONS */
app.get("/api/connections", async (req,res) => {
  try {
    const m=await requireMember(req,res); if(!m) return;
    const {data,error}=await db.from("connections").select("*")
      .or("requester_id.eq."+String(m.id)+",receiver_id.eq."+String(m.id))
      .order("created_at",{ascending:false}).limit(100);
    if(error) throw error;
    const ids=[...new Set((data||[]).flatMap(x=>[x.requester_id,x.receiver_id]).filter(x=>x!==String(m.id)))];
    let people={};
    if(ids.length){
      const p=await db.from("members").select("id,jp_number,dgbo_id,full_name,verified,profile_visibility").in("id",ids);
      if(!p.error) people=Object.fromEntries((p.data||[]).map(x=>[String(x.id),x]));
    }
    res.json({ok:true,connections:(data||[]).map(x=>({...x,other_member:people[x.requester_id===String(m.id)?x.receiver_id:x.requester_id]||null}))});
  } catch(e){ console.error("Connections list:",e.message); if(!res.headersSent) res.status(500).json({ok:false,error:"Could not load connections."});}
});
app.post("/api/connections/by-jp-number", async(req,res)=>{
  try{
    const m=await requireMember(req,res); if(!m) return;
    const jp=clean(req.body.jp_number).toUpperCase().replace(/\s+/g,"");
    if(!/^JP-[A-Z0-9]{6,16}$/.test(jp)) return res.status(400).json({ok:false,error:"Enter a valid JP number, for example JP-12AB34CD56."});
    const {data:target,error}=await db.from("members").select("id,jp_number,dgbo_id,full_name,verified,status,profile_visibility").eq("jp_number",jp).maybeSingle();
    if(error) throw error;
    if(!target || ["blocked","suspended","disabled"].includes(String(target.status||"").toLowerCase())) return res.status(404).json({ok:false,error:"No active JR PHEEF member found for that JP number."});
    if(String(target.id)===String(m.id)) return res.status(400).json({ok:false,error:"That is your own JP number."});
    const {data:existing}=await db.from("connections").select("id,status,requester_id,receiver_id").or("and(requester_id.eq."+m.id+",receiver_id.eq."+target.id+"),and(requester_id.eq."+target.id+",receiver_id.eq."+m.id+")").limit(1).maybeSingle();
    if(existing) return res.json({ok:true,already_exists:true,connection:existing,member:{jp_number:target.jp_number,dgbo_id:target.dgbo_id,full_name:target.profile_visibility==="private"?"JR PHEEF Member":target.full_name,verified:target.verified}});
    const {data:connection,error:insertError}=await db.from("connections").insert({requester_id:String(m.id),receiver_id:String(target.id),status:"pending"}).select().single();
    if(insertError) throw insertError;
    await logActivity(m.id,"JP_CONNECTION_REQUEST",{receiver_id:target.id});
    res.status(201).json({ok:true,connection,member:{jp_number:target.jp_number,dgbo_id:target.dgbo_id,full_name:target.profile_visibility==="private"?"JR PHEEF Member":target.full_name,verified:target.verified},message:"Connection request sent. Their contact details stay private until they choose to share them."});
  }catch(e){console.error("JP connection:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not send connection request."});}
});
app.patch("/api/connections/:id",async(req,res)=>{
  try{
    const m=await requireMember(req,res); if(!m)return;
    const status=clean(req.body.status);
    if(!["accepted","declined","cancelled"].includes(status))return res.status(400).json({ok:false,error:"Invalid connection action."});
    let q=db.from("connections").select("*").eq("id",req.params.id).maybeSingle();
    const {data:current,error}=await q;if(error)throw error;
    if(!current || (String(current.requester_id)!==String(m.id)&&String(current.receiver_id)!==String(m.id)))return res.status(404).json({ok:false,error:"Connection request not found."});
    if(status==="accepted" && String(current.receiver_id)!==String(m.id))return res.status(403).json({ok:false,error:"Only the recipient can accept this request."});
    if(status==="cancelled" && String(current.requester_id)!==String(m.id))return res.status(403).json({ok:false,error:"Only the sender can cancel this request."});
    const {data,error:updateError}=await db.from("connections").update({status,updated_at:new Date().toISOString()}).eq("id",req.params.id).select().single();
    if(updateError)throw updateError;
    res.json({ok:true,connection:data});
  }catch(e){console.error("Connection update:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not update connection."});}
});

/* PRIVATE FILE VAULT — file contents are never stored in public buckets */
const vaultUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024,files:1}});
const VAULT_BUCKET="jr-pheef-private-files";
const VAULT_TYPES=new Set(["application/pdf","text/plain","text/csv","application/json","image/jpeg","image/png","image/webp","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
app.get("/api/vault/files",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const {data,error}=await db.from("file_vault").select("id,file_name,mime_type,size_bytes,category,created_at").eq("member_id",m.id).order("created_at",{ascending:false}).limit(100);
    if(error)throw error;res.json({ok:true,files:data||[]});
  }catch(e){console.error("Vault list:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not load your files."});}
});
app.post("/api/vault/files",vaultUpload.single("file"),async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const f=req.file;if(!f)return res.status(400).json({ok:false,error:"Choose a file first."});
    if(!VAULT_TYPES.has(f.mimetype))return res.status(415).json({ok:false,error:"This file type is not supported yet."});
    const fileName=path.basename(f.originalname).replace(/[\r\n]/g,"").slice(0,180)||"file";
    const objectPath=String(m.id)+"/"+crypto.randomUUID();
    const {error:uploadError}=await db.storage.from(VAULT_BUCKET).upload(objectPath,f.buffer,{contentType:f.mimetype,upsert:false});
    if(uploadError)throw uploadError;
    const {data,error}=await db.from("file_vault").insert({member_id:m.id,object_path:objectPath,file_name:fileName,mime_type:f.mimetype,size_bytes:f.size,category:clean(req.body.category).slice(0,30)||"personal"}).select("id,file_name,mime_type,size_bytes,category,created_at").single();
    if(error){await db.storage.from(VAULT_BUCKET).remove([objectPath]);throw error;}
    await logActivity(m.id,"VAULT_UPLOAD",{file_id:data.id});
    res.status(201).json({ok:true,file:data});
  }catch(e){console.error("Vault upload:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Upload failed. Check storage setup and try again."});}
});
app.get("/api/vault/files/:id/download",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const {data:file,error}=await db.from("file_vault").select("*").eq("id",req.params.id).eq("member_id",m.id).maybeSingle();
    if(error)throw error;if(!file)return res.status(404).json({ok:false,error:"File not found."});
    const {data,error:signError}=await db.storage.from(VAULT_BUCKET).createSignedUrl(file.object_path,60,{download:file.file_name});
    if(signError)throw signError;res.json({ok:true,url:data.signedUrl,expires_in:60});
  }catch(e){console.error("Vault download:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not create a secure download link."});}
});
app.delete("/api/vault/files/:id",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const {data:file,error}=await db.from("file_vault").select("id,object_path").eq("id",req.params.id).eq("member_id",m.id).maybeSingle();
    if(error)throw error;if(!file)return res.status(404).json({ok:false,error:"File not found."});
    const {error:removeError}=await db.storage.from(VAULT_BUCKET).remove([file.object_path]);if(removeError)throw removeError;
    const {error:deleteError}=await db.from("file_vault").delete().eq("id",file.id).eq("member_id",m.id);if(deleteError)throw deleteError;
    res.json({ok:true});
  }catch(e){console.error("Vault delete:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not delete file."});}
});

/* CROSS-DEVICE SESSION MANAGEMENT */
app.get("/api/devices",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const match=(req.headers.cookie||"").match(/(?:^|;\s*)jr_session=([^;]+)/);
    const tokenHash=match?hash(decodeURIComponent(match[1])):"";
    const {data,error}=await db.from("sessions").select("id,device_label,user_agent,created_at,last_seen_at,expires_at,token_hash").eq("member_id",String(m.id)).gt("expires_at",new Date().toISOString()).order("last_seen_at",{ascending:false}).limit(20);
    if(error)throw error;
    res.json({ok:true,devices:(data||[]).map(d=>({id:d.id,label:d.device_label||"Device",user_agent:d.user_agent||"",created_at:d.created_at,last_seen_at:d.last_seen_at,current:d.token_hash===tokenHash}))});
  }catch(e){console.error("Devices:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not load devices."});}
});
app.post("/api/devices/label",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const match=(req.headers.cookie||"").match(/(?:^|;\s*)jr_session=([^;]+)/);if(!match)return res.status(401).json({ok:false,error:"Login required."});
    const tokenHash=hash(decodeURIComponent(match[1]));
    const label=clean(req.body.label).slice(0,80)||"My device";
    const {data,error}=await db.from("sessions").update({device_label:label,user_agent:clean(req.get("user-agent")).slice(0,300),last_seen_at:new Date().toISOString()}).eq("token_hash",tokenHash).eq("member_id",String(m.id)).select("id,device_label").maybeSingle();
    if(error)throw error;if(!data)return res.status(404).json({ok:false,error:"Current device session not found."});
    res.json({ok:true,device:data});
  }catch(e){console.error("Device label:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not save device label."});}
});

/* SOCIAL SIDE: member posts; private by default */
app.get("/api/social/feed",async(req,res)=>{
  try{
    const m=await requireMember(req,res);if(!m)return;
    const {data:rels,error:relError}=await db.from("connections").select("requester_id,receiver_id").eq("status","accepted").or("requester_id.eq."+m.id+",receiver_id.eq."+m.id);
    if(relError)throw relError;
    const ids=[String(m.id),...(rels||[]).map(x=>String(x.requester_id)===String(m.id)?String(x.receiver_id):String(x.requester_id))];
    const {data,error}=await db.from("social_posts").select("id,member_id,body,visibility,created_at").in("member_id",ids).in("visibility",["public","connections"]).order("created_at",{ascending:false}).limit(100);
    if(error)throw error;
    const memberIds=[...new Set((data||[]).map(p=>String(p.member_id)))];
    let people={};if(memberIds.length){const p=await db.from("members").select("id,full_name,jp_number,verified").in("id",memberIds);if(!p.error)people=Object.fromEntries((p.data||[]).map(x=>[String(x.id),x]));}
    res.json({ok:true,posts:(data||[]).filter(p=>p.visibility==="public"||String(p.member_id)===String(m.id)||ids.includes(String(p.member_id))).map(p=>({...p,author:people[String(p.member_id)]||{full_name:"JR PHEEF Member"}}))});
  }catch(e){console.error("Social feed:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not load the community feed."});}
});
app.get("/api/social/posts",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const {data,error}=await db.from("social_posts").select("id,member_id,body,visibility,created_at").eq("member_id",m.id).order("created_at",{ascending:false}).limit(50);
    if(error)throw error;res.json({ok:true,posts:data||[]});
  }catch(e){console.error("Social posts:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not load your posts."});}
});
app.post("/api/social/posts",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const body=clean(req.body.body),visibility=clean(req.body.visibility)||"connections";
    if(!body||body.length>2000)return res.status(400).json({ok:false,error:"Write a post of 1–2000 characters."});
    if(!["private","connections","public"].includes(visibility))return res.status(400).json({ok:false,error:"Invalid post visibility."});
    const {data,error}=await db.from("social_posts").insert({member_id:m.id,body,visibility}).select("id,body,visibility,created_at").single();
    if(error)throw error;res.status(201).json({ok:true,post:data});
  }catch(e){console.error("Social post create:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not publish post."});}
});
app.delete("/api/social/posts/:id",async(req,res)=>{
  try{const m=await requireMember(req,res);if(!m)return;
    const {error,count}=await db.from("social_posts").delete({count:"exact"}).eq("id",req.params.id).eq("member_id",m.id);
    if(error)throw error;res.json({ok:true});
  }catch(e){console.error("Social post delete:",e.message);if(!res.headersSent)res.status(500).json({ok:false,error:"Could not delete post."});}
});


/* TWILIO WHATSAPP WEBHOOK */
app.post("/api/webhook/whatsapp", async (req, res) => {
  if (!TWILIO_TOKEN || !TWILIO_URL)
    return res.status(503).send("WhatsApp verification unavailable.");

  const signature = req.get("X-Twilio-Signature");
  if (!signature || !twilio.validateRequest(TWILIO_TOKEN, signature, TWILIO_URL, req.body))
    return res.status(403).send("Forbidden");

  try {
    const message = clean(req.body.Body).toUpperCase();
    const phone = phoneOf(req.body.From);
    let answer = "Welcome to JR PHEEF — Find. Match. Trade. Send HELP for options.";

    if (message === "POINTS") {
      const { data } = await db.from("members").select("reward_points").eq("phone", phone).maybeSingle();
      answer = `JR PHEEF POINTS: ${Number(data?.reward_points || 0)}. 30 points can redeem 5-hour access.`;
    } else if (message === "ACCESS") {
      answer = "JR PHEEF access: KSh 30 for 5 hours. Free access is 02:00–06:00 EAT. Daraja payments are not connected yet.";
    } else if (["FLEX", "OKOA", "PAY LATER"].includes(message)) {
      answer = "PHEEF FLEX is being prepared. Credit is not active.";
    } else if (message === "HELP") {
      answer = "JR PHEEF: FIND, CREATE, CONNECT, POINTS, ACCESS, FLEX. You can also send a natural-language message.";
    }

    const xml = answer.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    res.type("text/xml").send(`<Response><Message>${xml}</Message></Response>`);
  } catch (e) {
    console.error("WhatsApp:", e.message);
    res.type("text/xml").send("<Response><Message>JR PHEEF is temporarily unavailable.</Message></Response>");
  }
});

/* NOT FOUND + ERRORS */
app.use((req, res) => {
  if (req.method === "GET" && !req.path.startsWith("/api/"))
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Request error:", err.message);
  if (res.headersSent) return next(err);
  res.status(err instanceof multer.MulterError ? 400 : 500)
    .json({ ok: false, error: err instanceof multer.MulterError ? "Photo upload limits exceeded." : "Request failed." });
});

app.listen(PORT, () => console.log(`JR PHEEF 5.0 listening on ${PORT}`));
 
