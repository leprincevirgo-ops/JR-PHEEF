import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://jr-pheef-foundation.onrender.com",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const COUNTRY_ORIGIN_CODES = new Set(["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"]);
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ ok: false, error: "Method not allowed." }, { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

  if (!token || !supabaseUrl || !serviceKey || !publishableKey) return Response.json({ ok: false, error: "Member profile service is not configured." }, { status: 503, headers: corsHeaders });

  try {
    const authResponse = await fetch(supabaseUrl + "/auth/v1/user", { headers: { apikey: publishableKey, Authorization: "Bearer " + token } });
    if (!authResponse.ok) return Response.json({ ok: false, error: "Sign in again to continue." }, { status: 401, headers: corsHeaders });
    const user = await authResponse.json();
    const meta = user.user_metadata || {};
    const fullName = String(meta.full_name || "").trim().slice(0, 100);
    const phone = String(meta.phone || "").trim().slice(0, 25);
    const birthYear = Number(meta.birth_year);
    const currentYear = new Date().getUTCFullYear();
    if (!user.email_confirmed_at) return Response.json({ ok: false, error: "Confirm your email address before continuing." }, { status: 403, headers: corsHeaders });
    if (!user.email || !fullName || !phone || !Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear - 18) return Response.json({ ok: false, error: "Your verified account is missing valid profile details. Please contact support." }, { status: 422, headers: corsHeaders });

    const profile: Record<string, unknown> = { auth_user_id: user.id, email: String(user.email).toLowerCase(), full_name: fullName, phone, birth_year: birthYear, status: "active", account_type: "individual", country: "Kenya" };
    const originCode = String(meta.country_of_origin_code || "").toUpperCase();
    if (COUNTRY_ORIGIN_CODES.has(originCode)) profile.country_of_origin_code = originCode;
    const response = await fetch(supabaseUrl + "/rest/v1/members?on_conflict=auth_user_id", {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      console.error("Member profile upsert failed:", response.status, (await response.text()).slice(0, 400));
      return Response.json({ ok: false, error: "Could not prepare your JR PHEEF member profile." }, { status: 502, headers: corsHeaders });
    }
    const rows = await response.json();
    const member = rows[0] || {};
    return Response.json({ ok: true, member: { id: member.id || user.id, jpNumber: member.jp_number || null, role: member.role || "person", accountType: member.account_type || "individual", fullName: member.full_name || fullName, email: member.email || user.email, verified: Boolean(member.verified), emailVerified: Boolean(user.email_confirmed_at) } }, { headers: corsHeaders });
  } catch (error) {
    console.error("Member profile function failed:", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false, error: "Member profile service is temporarily unavailable." }, { status: 500, headers: corsHeaders });
  }
});
