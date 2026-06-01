import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { profileId, email, fingerprint } = await request.json()

  if ((!profileId && !email) || !fingerprint) {
    return NextResponse.json({ allowed: false, reason: "DONNEES_MANQUANTES" })
  }

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

  const query = supabase.from("profiles").select("id, deviceFingerprint, deviceLocked")
  if (profileId) query.eq("id", profileId)
  else query.eq("email", email)

  const { data: profile } = await query.single()

  if (!profile) {
    return NextResponse.json({ allowed: false, reason: "PROFIL_INTROUVABLE" })
  }

  if (!profile.deviceFingerprint) {
    return NextResponse.json({ allowed: true, reason: "PREMIER_APPAREIL", profileId: profile.id })
  }

  if (profile.deviceFingerprint === fingerprint) {
    return NextResponse.json({ allowed: true, reason: "APPAREIL_CONNU", profileId: profile.id })
  }

  if (profile.deviceLocked) {
    return NextResponse.json({ allowed: false, reason: "APPAREIL_BLOQUE", profileId: profile.id })
  }

  return NextResponse.json({ allowed: false, reason: "APPAREIL_DIFFERENT", profileId: profile.id })
}
