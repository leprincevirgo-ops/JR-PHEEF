import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
const allowedTypes = new Set([
  "status_update","task_update","inventory_update","delivery_update",
  "message_received","calendar_update","other"
]);
const allowedDataKeys = new Set([
  "status","category","quantity","unit","location_label","description"
]);
const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed." });
  if (!supabaseUrl || !serviceKey) return json(503, { ok: false, error: "Partner gateway is not configured." });

  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(jr_live_[a-f0-9]{64})$/i);
  if (!match) return json(401, { ok: false, error: "A valid JR partner bearer token is required." });
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return json(415, { ok: false, error: "Send an application/json request." });
  }

  const tokenHash = await sha256(match[1]);
  const { data: connection, error: connectionError } = await admin
    .from("jr_partner_connections")
    .select("id,member_id,scopes,active,revoked_at")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .is("revoked_at", null)
    .maybeSingle();
  if (connectionError) return json(503, { ok: false, error: "Partner credential verification is temporarily unavailable." });
  if (!connection) return json(401, { ok: false, error: "Partner credential is invalid or revoked." });
  if (!Array.isArray(connection.scopes) || !connection.scopes.includes("events:write")) {
    return json(403, { ok: false, error: "This connection does not have permission to submit events." });
  }

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countError } = await admin
    .from("jr_partner_events")
    .select("id", { count: "exact", head: true })
    .eq("connection_id", connection.id)
    .gte("received_at", since);
  if (countError) return json(503, { ok: false, error: "Partner rate limit check is temporarily unavailable." });
  if ((count || 0) >= 60) return json(429, { ok: false, error: "Partner event rate limit reached. Try again shortly." });

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 12_000) return json(413, { ok: false, error: "Event payload is too large." });
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: "A valid JSON object is required." });
  }

  const eventType = text(body.event_type, 40);
  const title = text(body.title, 100);
  const summary = text(body.summary, 500);
  const externalEventId = text(body.external_event_id, 120);
  if (!allowedTypes.has(eventType)) return json(400, { ok: false, error: "Unsupported event type." });
  if (title.length < 2 || summary.length < 2 || externalEventId.length < 3) {
    return json(400, { ok: false, error: "Event title, summary and external event ID are required." });
  }

  let occurredAt = new Date().toISOString();
  if (body.occurred_at !== undefined) {
    const parsed = typeof body.occurred_at === "string" ? new Date(body.occurred_at) : new Date(NaN);
    if (Number.isNaN(parsed.getTime())) return json(400, { ok: false, error: "occurred_at must be a valid date-time." });
    occurredAt = parsed.toISOString();
  }

  const suppliedData = body.event_data && typeof body.event_data === "object" && !Array.isArray(body.event_data)
    ? body.event_data as Record<string, unknown> : {};
  const eventData: Record<string, string> = {};
  for (const [key, value] of Object.entries(suppliedData)) {
    if (!allowedDataKeys.has(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      eventData[key] = String(value).slice(0, 120);
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("jr_partner_events")
    .insert({
      member_id: connection.member_id,
      connection_id: connection.id,
      event_type: eventType,
      title,
      summary,
      external_event_id: externalEventId,
      occurred_at: occurredAt,
      event_data: eventData
    })
    .select("id,received_at")
    .single();

  if (insertError?.code === "23505") return json(202, { ok: true, accepted: true, duplicate: true });
  if (insertError) return json(400, { ok: false, error: "The event could not be accepted." });

  await admin.from("jr_partner_connections")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", connection.id);

  return json(202, {
    ok: true,
    accepted: true,
    event_id: inserted.id,
    received_at: inserted.received_at,
    message: "Event added to the member's private JR PHEEF inbox. No action was executed."
  });
});
