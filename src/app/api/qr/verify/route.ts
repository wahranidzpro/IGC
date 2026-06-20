import { success, error } from '@/lib/api-response';
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token: rawToken, deviceId } = body

    if (!rawToken || typeof rawToken !== "string") {
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
      .eq("token", rawToken)
      .maybeSingle()

    if (findError || !qrToken) {
      return error('Token introuvable', 404, 'TOKEN_NOT_FOUND')
    }

    if (qrToken.is_used) {
      return error('Token déjà utilisé', 410, 'TOKEN_ALREADY_USED')
    }

    if (new Date(qrToken.expires_at) < new Date()) {
      return error('Token expiré', 410, 'TOKEN_EXPIRED')
    }

    const { data: member } = await supabase
      .from("members")
      .select("id, status, profile_id")
      .eq("profile_id", qrToken.member_id)
      .maybeSingle()

    if (!member || member.status !== "active") {
      return error('Membre non actif', 403, 'MEMBER_NOT_ACTIVE')
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firstName, lastName, avatarUrl")
      .eq("id", qrToken.member_id)
      .maybeSingle()

    const now = new Date().toISOString()

    await supabase
      .from("qr_tokens")
      .update({ is_used: true, used_at: now, device_id: deviceId || null })
      .eq("id", qrToken.id)

    await supabase
      .from("attendance")
      .insert({
        member_id: member.id,
        device_id: deviceId || null,
        club_id: null,
        type: "entry",
        method: "qr",
        timestamp: now,
      })

    return success({
      valid: true,
      memberId: qrToken.member_id,
      memberName: profile ? `${profile.firstName} ${profile.lastName || ""}`.trim() : null,
      memberPhoto: profile?.avatarUrl || null,
    })
  } catch {
    return error('Erreur interne', 500, 'INTERNAL_ERROR')
  }
}
