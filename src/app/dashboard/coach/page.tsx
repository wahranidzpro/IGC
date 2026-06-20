"use client"

import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow } from "@/lib/utils/transform"
import Image from "next/image"
import {
  MessageSquare, Star, Calendar, Award, Users, Clock,
  Dumbbell, Apple, Zap, UserX,
} from "lucide-react"
import type { Coach } from "@/types"

export default function CoachPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [coach, setCoach] = useState<{ coach: Coach; profile: { firstName: string; lastName: string; email: string; avatarUrl: string | null } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yearsOfExperience, setYearsOfExperience] = useState(5)

  useEffect(() => {
    if (!user) return
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: mData } = await supabase.from("members").select("id, club_id").eq("profile_id", uid).maybeSingle()
        const memberRow = mData as { id: string; clubId: string | null } | null
        if (!memberRow) { setLoading(false); return }

        const { data: mc } = await supabase
          .from("member_coaches")
          .select("coach_id")
          .eq("member_id", memberRow.id)
          .eq("is_active", true)
          .maybeSingle()
        const assignment = mc as { coach_id: string } | null
        if (!assignment) { setLoading(false); return }

        const { data: c } = await supabase.from("coaches").select("*").eq("id", assignment.coach_id).maybeSingle()
        const coachRow = mapRow<Coach>(c as unknown as Record<string, unknown> | null)
        if (!coachRow) { setLoading(false); return }

        const { data: p } = await supabase.from("profiles").select("first_name, last_name, email, avatar_url").eq("id", coachRow.profileId).maybeSingle()
        const profileRow = mapRow<{ firstName: string; lastName: string; email: string; avatarUrl: string | null }>(p as unknown as Record<string, unknown> | null)
        if (profileRow) {
          setCoach({ coach: coachRow, profile: profileRow })
          if (coachRow.createdAt) {
            setYearsOfExperience(Math.floor((Date.now() - new Date(coachRow.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
          }
        }
      } catch (e) {
        setError("Impossible de charger les informations du coach")
        logger.error('Coach error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-72 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <UserX className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Erreur</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-brand-red font-medium hover:underline">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <UserX className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Aucun coach assigné</p>
          <p className="text-sm text-gray-500">Un coach vous sera attribué lors de votre inscription.</p>
        </div>
      </div>
    )
  }

  const { coach: coachData, profile: coachProfile } = coach
  const specialties = coachData.speciality?.split(",").map((s) => s.trim()) || ["Musculation"]
  const rating = 4.9
  const sessions = 4850
  const clients = 240

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Mon coach</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suivi personnalisé et conseils</p>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-red to-red-700 px-5 pt-8 pb-16 text-center text-white">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl mx-auto bg-white/10">
            {coachProfile.avatarUrl ? (
              <Image src={coachProfile.avatarUrl} alt="" width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                {(coachProfile.firstName?.[0] || "C").toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold mt-3">{coachProfile.firstName} {coachProfile.lastName}</h2>
          <p className="text-sm text-white/70">{coachData.speciality || "Coach sportif"}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              {rating}
            </span>
            <span className="text-xs text-white/60">Coach certifié</span>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-10">
          <div className="glass rounded-xl border border-white/10 p-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Award, label: "Expérience", value: `${yearsOfExperience}+ ans` },
                { icon: Users, label: "Athlètes", value: clients },
                { icon: Clock, label: "Séances", value: sessions },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center mx-auto mb-1">
                    <s.icon className="w-4 h-4 text-brand-red" />
                  </div>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-4">
          {coachData.bio && (
            <p className="text-sm text-gray-300 leading-relaxed">{coachData.bio}</p>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Spécialités</p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-red/5 text-brand-red px-3 py-1.5 rounded-lg border border-brand-red/10">
                  {i === 0 ? <Dumbbell className="w-3 h-3" /> : i === 1 ? <Apple className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                  {s}
                </span>
              ))}
            </div>
          </div>

          {coachData.certifications.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {coachData.certifications.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-white/5 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10">
                    <Award className="w-3 h-3" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push("/dashboard/messages")}
            className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20 mt-2"
          >
            <MessageSquare className="w-4 h-4" />
            Contacter mon coach
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-strong rounded-2xl border border-white/10 p-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-gray-400">Séances incluses</p>
          <p className="text-sm font-bold text-white">Illimité</p>
          <p className="text-[10px] text-gray-500">Forfait coaching</p>
        </div>
        <div className="glass-strong rounded-2xl border border-white/10 p-4">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-gray-400">Disponibilité</p>
          <p className="text-sm font-bold text-white">Lun-Ven 08:00-18:00</p>
          <p className="text-[10px] text-gray-500">Cette semaine</p>
        </div>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Prochains rendez-vous</h3>
          <button className="text-xs text-brand-red font-medium">Planifier</button>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { date: "Vendredi 15 mai", time: "14:30 - 15:30", type: "Séance coaching", status: "Confirmé" },
            { date: "Lundi 18 mai", time: "10:00 - 11:00", type: "Suivi nutrition", status: "En attente" },
          ].map((rdv, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  rdv.status === "Confirmé" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{rdv.date}</p>
                  <p className="text-xs text-gray-500">{rdv.time} · {rdv.type}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                rdv.status === "Confirmé" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {rdv.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
