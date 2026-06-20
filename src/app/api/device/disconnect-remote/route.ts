import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { verifyAuthenticated } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  const auth = await verifyAuthenticated(request)
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error || "Non authentifié" }, { status: 401 })
  }

  const { profileId } = await request.json()

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

  const { error } = await supabase
    .from("profiles")
    .update({
      deviceFingerprint: null,
      deviceLocked: false,
      lastActiveAt: null,
    })
    .eq("id", profileId)

  if (error) {
    return NextResponse.json({ success: false, error: "Erreur de déconnexion" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}