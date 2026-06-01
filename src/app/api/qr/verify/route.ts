import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const body = await request.json()
  const { token: rawToken, deviceId } = body

  if (!rawToken || typeof rawToken !== "string") {
    return NextResponse.json({ valid: false, reason: "TOKEN_REQUIRED" })
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

  const { data: qrToken, error: findError } = await supabase
    .from("qr_tokens")
    .select("*")
    .eq("token", rawToken)
    .single()

  if (findError || !qrToken) {
    return NextResponse.json({ valid: false, reason: "TOKEN_NOT_FOUND" })
  }

  if (qrToken.isUsed) {
    return NextResponse.json({ valid: false, reason: "TOKEN_ALREADY_USED" })
  }

  if (new Date(qrToken.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, reason: "TOKEN_EXPIRED" })
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, status, profileId")
    .eq("profileId", qrToken.memberId)
    .single()

  if (!member || member.status !== "active") {
    return NextResponse.json({ valid: false, memberId: qrToken.memberId, reason: "MEMBER_NOT_ACTIVE" })
  }

  const now = new Date().toISOString()

  await supabase
    .from("qr_tokens")
    .update({ isUsed: true, usedAt: now, deviceId: deviceId || null })
    .eq("id", qrToken.id)

  await supabase
    .from("attendance")
    .insert({
      memberId: member.id,
      deviceId: deviceId || null,
      clubId: null,
      type: "entry",
      method: "qr",
      timestamp: now,
    })

  return NextResponse.json({ valid: true, memberId: qrToken.memberId })
}
