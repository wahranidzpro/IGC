// INFINITY GYM CENTER - Turnstile Access Edge Function
// Deploy to Supabase: supabase functions deploy turnstile-access

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting: simple in-memory per-device
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 1000; // 1 request per second per device

function checkRateLimit(deviceId: string): boolean {
  const now = Date.now();
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > 3600000) rateLimitMap.delete(key);
  }
  const last = rateLimitMap.get(deviceId) || 0;
  if (now - last < RATE_LIMIT_WINDOW_MS) return false;
  rateLimitMap.set(deviceId, now);
  return true;
}

// HMAC signature verification
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return sigHex === signature;
}

// Response helpers
function response(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Access-Control": "turnstile-v1",
    },
  });
}

serve(async (req) => {
  const startTime = performance.now();

  try {
    // --- Method check ---
    if (req.method !== "POST") {
      return response({ error: "Method not allowed" }, 405);
    }

    // --- Parse payload ---
    const payload = await req.json();
    const deviceId = payload.device_id || req.headers.get("X-Device-Id") || "unknown";
    const signature = req.headers.get("X-Signature") || "";
    const hmacSecret = Deno.env.get("TURNSTILE_HMAC_SECRET") || "";

    // --- Signature verification (optional) ---
    if (hmacSecret && signature) {
      const valid = await verifySignature(JSON.stringify(payload), signature, hmacSecret);
      if (!valid) {
        return response({ access: false, action: "DENY", reason: "INVALID_SIGNATURE" }, 401);
      }
    }

    // --- Rate limiting ---
    if (!checkRateLimit(deviceId)) {
      return response({ access: false, action: "DENY", reason: "RATE_LIMITED" }, 429);
    }

    // --- Extract credentials ---
    const rfid = payload.cardno || payload.rfid || payload.uid || "";
    const qr = payload.qr || "";
    const method: string = payload.method || (rfid ? "rfid" : qr ? "qr" : "manual");

    // --- Validate device exists ---
    const { data: device, error: deviceError } = await supabase
      .from("turnstiles")
      .select("id, name, direction, active, antipassback_seconds")
      .eq("id", deviceId)
      .single();

    if (deviceError || !device) {
      // Unknown device - log and deny
      await supabase.from("access_logs").insert({
        turnstile_id: deviceId,
        status: "denied",
        method,
        reason: "UNKNOWN_DEVICE",
        raw_payload: payload,
      });
      return response({ access: false, action: "DENY", reason: "UNKNOWN_DEVICE" });
    }

    if (!device.active) {
      return response({ access: false, action: "DENY", reason: "DEVICE_INACTIVE" });
    }

    // --- Find member ---
    let memberQuery = supabase
      .from("turnstile_members")
      .select("id, name, subscription_status, subscription_end_date, is_blocked, blocked_until");

    if (rfid) {
      memberQuery = memberQuery.eq("rfid_uid", rfid);
    } else if (qr) {
      memberQuery = memberQuery.eq("qr_code", qr);
    } else {
      return response({ access: false, action: "DENY", reason: "NO_CREDENTIALS" });
    }

    const { data: member, error: memberError } = await memberQuery.single();

    if (memberError || !member) {
      // Unknown member
      await supabase.from("access_logs").insert({
        turnstile_id: device.id,
        status: "denied",
        method,
        reason: "UNKNOWN_MEMBER",
        raw_payload: payload,
      });
      return response({ access: false, action: "DENY", reason: "UNKNOWN_MEMBER" });
    }

    // --- Access validation ---
    let allowed = false;
    let reason = "";

    // Check banned
    if (member.subscription_status === "banned") {
      reason = "BANNED";
    }
    // Check blocked
    else if (member.is_blocked) {
      if (!member.blocked_until || new Date(member.blocked_until) > new Date()) {
        reason = "BLOCKED";
      } else {
        // Auto-unblock if date passed
        await supabase
          .from("turnstile_members")
          .update({ is_blocked: false, block_reason: null, blocked_until: null })
          .eq("id", member.id);
        allowed = true;
      }
    }
    // Check subscription
    else if (member.subscription_status !== "active") {
      reason = member.subscription_status === "expired" ? "SUBSCRIPTION_EXPIRED" : "INACTIVE_SUBSCRIPTION";
    }
    else if (member.subscription_end_date && new Date(member.subscription_end_date) < new Date()) {
      reason = "SUBSCRIPTION_EXPIRED";
      // Auto-mark as expired
      await supabase
        .from("turnstile_members")
        .update({ subscription_status: "expired" })
        .eq("id", member.id);
    }
    else {
      allowed = true;
    }

    // --- Antipassback check ---
    let alreadyInside = false;
    if (allowed && device.direction === "entry") {
      const { data: existingSession } = await supabase
        .from("active_sessions")
        .select("id, entry_at")
        .eq("member_id", member.id)
        .is("exit_at", null)
        .single();

      if (existingSession) {
        const antipassbackMs = (device.antipassback_seconds || 30) * 1000;
        const elapsed = Date.now() - new Date(existingSession.entry_at).getTime();
        if (elapsed < antipassbackMs) {
          allowed = false;
          alreadyInside = true;
          reason = "ANTIPASSBACK";
        }
      }
    }

    // --- Execute action ---
    if (allowed) {
      if (device.direction === "entry" || device.direction === "bidirectional") {
        // Upsert active session
        await supabase.rpc("record_entry", {
          p_member_id: member.id,
          p_turnstile_id: device.id,
        });
      } else if (device.direction === "exit") {
        await supabase.rpc("record_exit", {
          p_member_id: member.id,
          p_turnstile_id: device.id,
        });
      }
    }

    // --- Log access event ---
    await supabase.from("access_logs").insert({
      member_id: member.id,
      turnstile_id: device.id,
      status: allowed ? "allowed" : "denied",
      method,
      reason,
      raw_payload: { ...payload, device_name: device.name },
    });

    // --- Update device heartbeat ---
    await supabase.from("device_heartbeats").insert({
      turnstile_id: device.id,
      status: "online",
      ip_address: req.headers.get("x-forwarded-for") || "",
      payload: { latency_ms: Math.round(performance.now() - startTime) },
    });

    // --- Response ---
    return response({
      access: allowed,
      action: allowed ? "OPEN" : "DENY",
      reason,
      member_name: allowed ? member.name : undefined,
      member_id: allowed ? member.id : undefined,
      device_name: device.name,
      latency_ms: Math.round(performance.now() - startTime),
    });

  } catch (e) {
    console.error("Turnstile access error:", e);
    return response(
      { access: false, action: "DENY", error: e.message, latency_ms: Math.round(performance.now() - startTime) },
      500
    );
  }
});
