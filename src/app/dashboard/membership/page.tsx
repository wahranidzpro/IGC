"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow } from "@/lib/utils/transform"
import { Crown, Check, Calendar } from "lucide-react"
import type { Membership } from "@/types"
import BackButton from "@/components/dashboard/mobile/BackButton"

const advantages = [
  "Accès illimité à la salle",
  "Coaching personnalisé",
  "Cours collectifs illimités",
  "Invitations (2/mois)",
  "Accès application mobile",
  "Nutrition coaching",
]

export default function MembershipPage() {
  const { user } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()
    async function load() {
      const { data: m } = await supabase.from("members").select("id").eq("profile_id", uid).maybeSingle()
      const memberId = (m as { id?: string } | null)?.id
      if (memberId) {
        const { data: ms } = await supabase.from("memberships").select("*").eq("member_id", memberId).eq("status", "active").maybeSingle()
        if (ms) setMembership(mapRow<Membership>(ms))
      }
      setLoading(false)
    }
    load()
  }, [user])

  const daysLeft = membership ? Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  if (loading) {
    return (
      <div className="min-h-screen p-4" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
        <div className="h-48 rounded-3xl shimmer" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <h1 className="text-lg font-bold text-white">Abonnement</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-[20px] overflow-hidden border" style={{ borderColor: "rgba(200,155,60,0.3)" }}>
          <div className="p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.15), rgba(200,155,60,0.05))" }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#C89B3C]/30">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">{membership?.planName || "Premium"}</h2>
            <span className="inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              {membership ? "Actif" : "Inactif"}
            </span>
          </div>

          {membership && (
            <div className="px-6 py-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Début : <strong className="text-white">{new Date(membership.startDate).toLocaleDateString("fr-FR")}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Fin : <strong className="text-white">{new Date(membership.endDate).toLocaleDateString("fr-FR")}</strong></span>
              </div>
              <div className="flex items-center justify-center gap-1 text-2xl font-black text-[#C89B3C]">
                J-{daysLeft}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mb-3 px-1">AVANTAGES</h3>
        <div className="rounded-[20px] p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="space-y-3">
            {advantages.map((adv) => (
              <div key={adv} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-sm text-gray-300">{adv}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-28">
        <button
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #C89B3C, #E0B85D)", boxShadow: "0 8px 24px rgba(200,155,60,0.3)" }}
        >
          GÉRER MON ABONNEMENT
        </button>
      </div>
    </div>
  )
}
