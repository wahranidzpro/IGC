import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { profileId, otp, fingerprint, name } = await request.json()

  if (!profileId || !otp || !fingerprint) {
    return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("transferOtp, transferOtpExpiresAt")
    .eq("id", profileId)
    .single()

  if (!profile) {
    return NextResponse.json({ success: false, error: "Profil introuvable" }, { status: 404 })
  }

  if (!profile.transferOtp || !profile.transferOtpExpiresAt) {
    return NextResponse.json({ success: false, error: "Aucun code de transfert demandé" }, { status: 400 })
  }

  if (new Date(profile.transferOtpExpiresAt) < new Date()) {
    return NextResponse.json({ success: false, error: "Code expiré. Demandez un nouveau code." }, { status: 400 })
  }

  if (profile.transferOtp !== otp) {
    return NextResponse.json({ success: false, error: "Code incorrect" }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      deviceFingerprint: fingerprint,
      transferOtp: null,
      transferOtpExpiresAt: null,
    })
    .eq("id", profileId)

  if (updateError) {
    return NextResponse.json({ success: false, error: "Erreur lors du transfert" }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Appareil transféré avec succès" })
}
