// INFINITY GYM CENTER - Sync Data Edge Function
// Deploy to Supabase: supabase functions deploy sync-data

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SYNC_TABLES: Record<string, string> = {
  members: "synced_members",
  payments: "synced_payments",
  checkins: "synced_checkins",
  points_ledger: "synced_points_ledger",
};

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
      "X-Access-Control": "sync-data-v1",
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
    const rawPayload = await req.text();
    const signature = req.headers.get("X-Signature") || "";
    const hmacSecret = Deno.env.get("SYNC_HMAC_SECRET") || "";

    // --- Signature verification (optional) ---
    if (hmacSecret && signature) {
      const valid = await verifySignature(rawPayload, signature, hmacSecret);
      if (!valid) {
        return response({ error: "INVALID_SIGNATURE" }, 401);
      }
    }

    const body = JSON.parse(rawPayload);
    const counts: Record<string, number> = {};
    const errors: Record<string, string> = {};

    // --- Process each table ---
    for (const [key, tableName] of Object.entries(SYNC_TABLES)) {
      const records = body[key];
      if (!records || !Array.isArray(records) || records.length === 0) {
        continue;
      }

      const { error } = await supabase
        .from(tableName)
        .upsert(records, { onConflict: "local_id" });

      if (error) {
        errors[key] = error.message;
        counts[key] = 0;
      } else {
        counts[key] = records.length;
      }
    }

    // --- Log sync event ---
    const totalSynced = Object.values(counts).reduce((a, b) => a + b, 0);
    await supabase.from("sync_logs").insert({
      sync_type: "batch",
      records_synced: totalSynced,
      status: Object.keys(errors).length > 0 ? "partial" : "success",
      error: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
      completed_at: new Date().toISOString(),
    });

    const hasErrors = Object.keys(errors).length > 0;

    return response({
      success: !hasErrors,
      counts,
      errors: hasErrors ? errors : undefined,
      total_synced: totalSynced,
      latency_ms: Math.round(performance.now() - startTime),
    });

  } catch (e) {
    console.error("Sync data error:", e);
    return response(
      { error: e.message, latency_ms: Math.round(performance.now() - startTime) },
      500
    );
  }
});
