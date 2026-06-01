import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "member") {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 })
  }

  const memberId = user.id

  await supabase
    .from("qr_tokens")
    .update({ isUsed: true })
    .eq("memberId", memberId)
    .eq("isUsed", false)

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 15000).toISOString()

  const { error: insertError } = await supabase
    .from("qr_tokens")
    .insert({ memberId, token, expiresAt })

  if (insertError) {
    return NextResponse.json({ error: "Erreur de création du token" }, { status: 500 })
  }

  return NextResponse.json({ token, expiresAt, memberId })
}
