import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Données invalides" }, { status: 400 })
  }
  const { profileId } = body

  if (!profileId) {
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
    .select("email")
    .eq("id", profileId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ success: false, error: "Profil introuvable" }, { status: 404 })
  }

  if (!profile.email) {
    return NextResponse.json({ success: false, error: "Email manquant" }, { status: 400 })
  }

  const otp = crypto.randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ transferOtp: otp, transferOtpExpiresAt: expiresAt })
    .eq("id", profileId)

  if (updateError) {
    return NextResponse.json({ success: false, error: "Erreur lors de la génération du code" }, { status: 500 })
  }

  // TODO: envoyer l'OTP par email via Resend / SendGrid / SMTP
  // Pour l'instant, on le retourne dans la réponse (dev mode)

  return NextResponse.json({
    success: true,
    message: `Code de vérification envoyé à ${profile.email.replace(/.(?=.{4})/g, "*")}`,
    otp: process.env.NODE_ENV === "development" ? otp : undefined,
  })
}
