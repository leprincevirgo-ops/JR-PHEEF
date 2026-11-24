import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://jr-pheef-marketplace.onrender.com",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  if (!token || !url || !serviceKey || !publishableKey)
    return json({ ok: false, error: "Member profile service is not configured." }, 503);

  try {
    const authResponse = await fetch(url + "/auth/v1/user", {
      headers: { apikey: publishableKey, Authorization: "Bearer " + token }
    });
    if (!authResponse.ok) return json({ ok: false, error: "Sign in again to continue." }, 401);
    const user = await authResponse.json();
    const meta = user.user_metadata || {};
    if (!user.email_confirmed_at) return json({ ok: false, error: "Confirm your email address before continuing." }, 403);
    if (!user.id || !user.email) return json({ ok: false, error: "Your verified account is missing its email identity." }, 422);

    const headers = {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json"
    };
    const rest = async (path: string, method = "GET", body?: unknown, prefer = "return=representation") => {
      const response = await fetch(url + "/rest/v1/" + path, {
        method, headers: { ...headers, Prefer: prefer },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const raw = await response.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch {}
      if (!response.ok) {
        console.error("Member profile database operation failed:", response.status, raw.slice(0, 300));
        throw new Error("Member profile database operation failed.");
      }
      return data;
    };

    const makeReferralCode = () => {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      return "JR-" + Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    };
    const authId = encodeURIComponent(user.id);
    let createdMember = false;
    let rows = await rest("members?auth_user_id=eq." + authId +
      "&select=id,jp_number,role,account_type,full_name,email,verified,status,referral_code&limit=2");
    let member = Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
    if (Array.isArray(rows) && rows.length > 1)
      return json({ ok: false, error: "Your account profile needs support review." }, 409);

    if (!member) {
      const email = String(user.email).trim().toLowerCase();
      rows = await rest("members?email=ilike." + encodeURIComponent(email) +
        "&select=id,auth_user_id,jp_number,role,account_type,full_name,email,verified,status,referral_code&limit=2");
      if (Array.isArray(rows) && rows.length > 1)
        return json({ ok: false, error: "More than one member profile matches this email. Please contact support." }, 409);
      if (Array.isArray(rows) && rows.length === 1) {
        const candidate = rows[0];
        if (candidate.auth_user_id && candidate.auth_user_id !== user.id)
          return json({ ok: false, error: "This member profile is linked to another sign-in identity. Please contact support." }, 409);
        const updated = await rest("members?id=eq." + encodeURIComponent(candidate.id) +
          "&auth_user_id=is.null", "PATCH", { auth_user_id: user.id, email });
        member = Array.isArray(updated) && updated.length === 1 ? updated[0] : null;
      } else {
        const fullName = String(meta.full_name || "").trim().slice(0, 100);
        const phone = String(meta.phone || "").trim().slice(0, 25);
        const birthYear = Number(meta.birth_year);
        const currentYear = new Date().getUTCFullYear();
        if (!fullName || !phone || !Number.isInteger(birthYear) ||
            birthYear < 1900 || birthYear > currentYear - 18)
          return json({ ok: false, error: "Your verified account is missing valid profile details. Please contact support." }, 422);
        const created = await rest("members", "POST", {
          auth_user_id: user.id,
          referral_code: makeReferralCode(),
          email: String(user.email).trim().toLowerCase(),
          full_name: fullName,
          phone,
          birth_year: birthYear,
          status: "active",
          account_type: "individual",
          country: "Kenya"
        });
        member = Array.isArray(created) && created.length === 1 ? created[0] : null;
        createdMember = Boolean(member);
      }
    }

    if (!member) return json({ ok: false, error: "Could not securely link your member profile. Please try again." }, 409);
    if (!member.referral_code) {
      try {
        const assigned = await rest("members?id=eq." + encodeURIComponent(member.id) +
          "&referral_code=is.null&select=id,jp_number,role,account_type,full_name,email,verified,status,referral_code",
          "PATCH", { referral_code: makeReferralCode() });
        if (Array.isArray(assigned) && assigned.length === 1) member = assigned[0];
        else {
          const current = await rest("members?id=eq." + encodeURIComponent(member.id) +
            "&select=id,jp_number,role,account_type,full_name,email,verified,status,referral_code&limit=1");
          if (Array.isArray(current) && current.length === 1) member = current[0];
        }
      } catch {
        console.error("JR personal invitation code assignment failed.");
      }
    }
    if (String(member.status || "").trim().toLowerCase() !== "active")
      return json({ ok: false, error: "This member account is not active. Contact support." }, 403);

    const inviteCode = String(meta.referral_code || "").trim().toUpperCase();
    if (createdMember && /^JR-[A-F0-9]{12}$/.test(inviteCode)) {
      try {
        const referrers = await rest("members?referral_code=eq." + encodeURIComponent(inviteCode) + "&select=id,status&limit=2");
        const referrer = Array.isArray(referrers) && referrers.length === 1 ? referrers[0] : null;
        if (referrer && referrer.status === "active" && referrer.id !== member.id) {
          const existingAttribution = await rest("jr_referrals?referred_id=eq." + encodeURIComponent(member.id) + "&select=id&limit=1");
          if (!Array.isArray(existingAttribution) || existingAttribution.length === 0) {
            await rest("jr_referrals", "POST", {
              id: crypto.randomUUID(),
              referrer_id: referrer.id,
              referred_id: member.id,
              reward: 0,
              status: "pending"
            }, "resolution=ignore-duplicates,return=minimal");
          }
        }
      } catch {
        console.error("JR referral attribution could not be recorded for this sign-up.");
      }
    }

    return json({
      ok: true,
      member: {
        id: member.id,
        jpNumber: member.jp_number || null,
        referralCode: member.referral_code || null,
        role: member.role || "person",
        accountType: member.account_type || "individual",
        fullName: member.full_name || "",
        email: member.email || user.email,
        verified: Boolean(member.verified),
        emailVerified: Boolean(user.email_confirmed_at)
      }
    });
  } catch (error) {
    console.error("Member profile function failed:", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, error: "Member profile service is temporarily unavailable." }, 500);
  }
});
