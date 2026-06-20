import { success, error } from '@/lib/api-response';
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST() {
  try {
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
      return error('Non authentifié', 401, 'NOT_AUTHENTICATED')
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile || profile.role !== "member") {
      return error('Accès réservé aux membres', 403, 'FORBIDDEN')
    }

    const memberId = user.id

    await supabase
      .from("qr_tokens")
      .update({ is_used: true })
      .eq("member_id", memberId)
      .eq("is_used", false)

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15000).toISOString()

    const { error: insertError } = await supabase
      .from("qr_tokens")
      .insert({ member_id: memberId, token, expires_at: expiresAt })

    if (insertError) {
      return error('Erreur de création du token', 500, 'TOKEN_CREATION_FAILED')
    }

    return success({ token, expiresAt, memberId })
  } catch {
    return error('Erreur interne', 500, 'INTERNAL_ERROR')
  }
}
