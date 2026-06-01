import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, deviceId } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json({ access: "refused", reason: "TOKEN_REQUIRED" }, { status: 400 })
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
      .eq("token", token)
      .maybeSingle()

    if (findError || !qrToken) {
      return NextResponse.json({ access: "refused", reason: "TOKEN_NOT_FOUND" })
    }

    if (qrToken.isUsed) {
      return NextResponse.json({ access: "refused", reason: "TOKEN_ALREADY_USED" })
    }

    if (new Date(qrToken.expiresAt) < new Date()) {
      return NextResponse.json({ access: "refused", reason: "TOKEN_EXPIRED" })
    }

    const { data: member } = await supabase
      .from("members")
      .select("id, status, profileId")
      .eq("profileId", qrToken.memberId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ access: "refused", reason: "MEMBER_NOT_FOUND" })
    }

    if (member.status !== "active") {
      return NextResponse.json({ access: "refused", reason: "MEMBER_NOT_ACTIVE", memberId: qrToken.memberId })
    }

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from("qr_tokens")
      .update({ isUsed: true, usedAt: now, deviceId: deviceId || null })
      .eq("id", qrToken.id)

    if (updateError) {
      return NextResponse.json({ access: "refused", reason: "TOKEN_UPDATE_FAILED" }, { status: 500 })
    }

    const { error: attendanceError } = await supabase
      .from("attendance")
      .insert({
        memberId: member.id,
        deviceId: deviceId || null,
        clubId: null,
        type: "entry",
        method: "qr",
        timestamp: now,
      })

    if (attendanceError) {
      return NextResponse.json({ access: "refused", reason: "ATTENDANCE_LOG_FAILED" }, { status: 500 })
    }

    return NextResponse.json({
      access: "granted",
      memberId: qrToken.memberId,
      timestamp: now,
    })
  } catch {
    return NextResponse.json({ access: "refused", reason: "INTERNAL_ERROR" }, { status: 500 })
  }
}
