import { NextRequest, NextResponse } from "next/server"
import { verifyDeviceKey } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  const deviceAuth = verifyDeviceKey(request)
  if (!deviceAuth.valid) {
    return NextResponse.json({ ok: false, reason: deviceAuth.error }, { status: 401 })
  }

  const { fingerprint } = await request.json()

  if (!fingerprint) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error } = await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("device_fingerprint", fingerprint)

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}