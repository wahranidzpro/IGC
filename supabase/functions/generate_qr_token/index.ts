import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const HMAC_SECRET = Deno.env.get("QR_HMAC_SECRET") || Deno.env.get("SUPABASE_ANON_KEY") || "fallback-secret"

function signToken(token: string, memberId: string, expiresAt: string): string {
  const key = new TextEncoder().encode(HMAC_SECRET)
  const data = new TextEncoder().encode(`${token}:${memberId}:${expiresAt}`)
  return crypto.subtle.sign("HMAC", key, data).then((sig) => {
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("")
    return hex
  })
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
    }

    const body = await req.json()
    const { memberId } = body

    if (!memberId || typeof memberId !== "string") {
      return new Response(JSON.stringify({ error: "memberId requis" }), { status: 400 })
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, status")
      .eq("profileId", memberId)
      .maybeSingle()

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Membre introuvable" }), { status: 404 })
    }

    if (member.status !== "active") {
      return new Response(JSON.stringify({ error: "Membre non actif" }), { status: 403 })
    }

    await supabase
      .from("qr_tokens")
      .update({ isUsed: true })
      .eq("memberId", memberId)
      .eq("isUsed", false)

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 5000).toISOString()
    const signature = await signToken(token, memberId, expiresAt)

    const { error: insertError } = await supabase
      .from("qr_tokens")
      .insert({ memberId, token, expiresAt })

    if (insertError) {
      console.error("Insert error:", insertError)
      return new Response(JSON.stringify({ error: "Erreur de création du token" }), { status: 500 })
    }

    return new Response(
      JSON.stringify({ token, expiresAt, memberId, signature }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Unexpected error:", err)
    return new Response(JSON.stringify({ error: "Erreur interne" }), { status: 500 })
  }
})
