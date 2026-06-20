import { success, error } from '@/lib/api-response';
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, deviceId } = body

    if (!token || typeof token !== "string") {
      return error('Token requis', 400, 'TOKEN_REQUIRED')
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
      return error('Token introuvable', 404, 'TOKEN_NOT_FOUND')
    }

    if (qrToken.isUsed) {
      return error('Token déjà utilisé', 410, 'TOKEN_ALREADY_USED')
    }

    if (new Date(qrToken.expiresAt) < new Date()) {
      return error('Token expiré', 410, 'TOKEN_EXPIRED')
    }

    const { data: member } = await supabase
      .from("members")
      .select("id, status, profileId")
      .eq("profileId", qrToken.memberId)
      .maybeSingle()

    if (!member) {
      return error('Membre introuvable', 404, 'MEMBER_NOT_FOUND')
    }

    if (member.status !== "active") {
      return error('Membre non actif', 403, 'MEMBER_NOT_ACTIVE')
    }

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from("qr_tokens")
      .update({ isUsed: true, usedAt: now, deviceId: deviceId || null })
      .eq("id", qrToken.id)

    if (updateError) {
      return error('Échec mise à jour token', 500, 'TOKEN_UPDATE_FAILED')
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
      return error('Échec enregistrement présence', 500, 'ATTENDANCE_LOG_FAILED')
    }

    return success({ access: "granted", memberId: qrToken.memberId, timestamp: now })
  } catch {
    return error('Erreur interne', 500, 'INTERNAL_ERROR')
  }
}
