"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users, Calendar, ClipboardList, MessageSquare,
  Clock, AlertCircle, RefreshCw,
  Dumbbell, Plus, FileText, MessageCircle, TrendingUp,
} from "lucide-react"
import { CoachKPICard } from "@/components/coach/CoachKPICard"
import { CoachClientTable } from "@/components/coach/CoachClientTable"
import type { Schedule } from "@/types"

export default function CoachDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    todaySessions: 0,
    programsCount: 0,
    unreadMessages: 0,
  })
  const [coachData, setCoachData] = useState<{ id: string; speciality: string | null; bio: string | null; phone: string | null } | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<Schedule[]>([])
  const [recentMembers, setRecentMembers] = useState<{ id: string; name: string; avatar: string | null; status: string; inGym: boolean }[]>([])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: cData } = await supabase.from("coaches").select("*").eq("profile_id", uid).maybeSingle()
        const c = mapRow<{ id: string; speciality: string | null; bio: string | null; phone: string | null }>(cData as Record<string, unknown> | null)
        if (!c) { setLoading(false); return }
        setCoachData(c)
        const cId = c.id

        const { data: mcData } = await supabase
          .from("member_coaches")
          .select("member_id")
          .eq("coach_id", cId)
          .eq("is_active", true)
        const memberIds = ((mcData as { member_id: string }[]) || []).map((m) => m.member_id)

        const { data: membersData } = await supabase
          .from("members")
          .select("id, profile_id, status")
          .in("id", memberIds)
        const allMembers = (membersData as { id: string; profile_id: string; status: string }[]) || []

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", allMembers.map((m) => m.profile_id))
        const profiles = ((profilesData as { id: string; first_name: string; last_name: string; avatar_url: string | null }[]) || []).reduce((acc, p) => {
          acc[p.id] = p; return acc
        }, {} as Record<string, { first_name: string; last_name: string; avatar_url: string | null }>)

        const today = new Date().toISOString().split("T")[0]
        const { data: attToday } = await supabase
          .from("attendance")
          .select("member_id")
          .gte("timestamp", `${today}T00:00:00`)
          .lte("timestamp", `${today}T23:59:59`)
        const checkedInIds = new Set((attToday as { member_id: string }[] || []).map((a) => a.member_id))

        setRecentMembers(
          allMembers.map((m) => {
            const p = profiles[m.profile_id]
            return {
              id: m.id,
              name: p ? `${p.first_name} ${p.last_name}` : "Inconnu",
              avatar: p?.avatar_url || null,
              status: m.status,
              inGym: checkedInIds.has(m.id),
            }
          })
        )

        const { data: msData } = await supabase
          .from("memberships")
          .select("member_id, status")
          .in("member_id", memberIds)
          .eq("status", "active")
        const activeCount = new Set((msData as { member_id: string }[] || []).map((m) => m.member_id)).size

        const { data: attData } = await supabase
          .from("attendance")
          .select("id, member_id")
          .gte("timestamp", `${today}T00:00:00`)
          .lte("timestamp", `${today}T23:59:59`)
        const todaySessions = (attData as { id: string }[] || []).length

        const { data: progData } = await supabase
          .from("workout_programs")
          .select("id")
          .eq("coach_id", cId)
        const programsCount = (progData as { id: string }[] || []).length

        const { data: msgData } = await supabase
          .from("messages")
          .select("id")
          .eq("receiver_id", uid)
          .eq("is_read", false)
        const unreadMessages = (msgData as { id: string }[] || []).length

        setStats({
          totalMembers: allMembers.length,
          activeMembers: activeCount,
          todaySessions,
          programsCount,
          unreadMessages,
        })

        const { data: schedData } = await supabase
          .from("schedules")
          .select("*")
          .eq("coach_id", cId)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(5)
        setUpcomingSessions(mapRows<Schedule>(schedData as Record<string, unknown>[]))
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les données")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const inGymCount = useMemo(() => recentMembers.filter((m) => m.inGym).length, [recentMembers])
  const revenue = useMemo(() => {
    const val = stats.activeMembers * 500
    return `${val.toLocaleString("fr-FR")} DH`
  }, [stats.activeMembers])

  const clientData = useMemo(() =>
    recentMembers.slice(0, 5).map((m) => {
      const parts = m.name.split(" ")
      return {
        id: m.id,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || m.name,
        photo: m.avatar || undefined,
        status: (m.status === "active" ? "active" : "inactive") as "active" | "inactive",
      }
    }),
  [recentMembers])

  const quickActions = [
    { title: "Nouveau Client", desc: "Ajouter un membre à votre suivi", href: "/coach/members", icon: Plus },
    { title: "Créer Programme", desc: "Nouveau plan d'entraînement", href: "/coach/programs", icon: FileText },
    { title: "Planifier Séance", desc: "Ajouter un rendez-vous", href: "/coach/schedule", icon: Calendar },
    { title: "Nouveau Message", desc: "Contacter un membre", href: "/coach/messages", icon: MessageCircle },
  ]

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    coaching: { label: "Coaching", color: "#C89B3C", bg: "rgba(200,155,60,0.1)" },
    class: { label: "Cours", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    appointment: { label: "RDV", color: "#0A84FF", bg: "rgba(10,132,255,0.1)" },
    nutrition: { label: "Nutrition", color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
    eval: { label: "Évaluation", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="h-28 rounded-3xl shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl shimmer" />
          <div className="h-96 rounded-2xl shimmer" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,77,77,0.1)] flex items-center justify-center mx-auto mb-4 border border-[rgba(255,77,77,0.2)]">
            <AlertCircle className="w-8 h-8 text-[#FF4D4D]" />
          </div>
          <p className="text-base font-bold text-white mb-1">Erreur</p>
          <p className="text-sm text-[#B8C0CC] mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] px-6 py-2.5 rounded-xl shadow-lg shadow-[#0A84FF]/30 hover:shadow-xl transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden px-4 md:px-6 lg:px-8 pt-8 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(200,155,60,0.08)] via-[rgba(7,19,38,0.5)] to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[rgba(200,155,60,0.06)] rounded-full blur-[100px]" />
        <div className="absolute top-10 right-20 w-[400px] h-[400px] bg-[rgba(200,155,60,0.05)] rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#C89B3C] via-[#E0B85D] to-[#C89B3C] bg-clip-text text-transparent">
              Tableau de Bord Coach
            </h1>
            <p className="text-sm text-[#A8B2C7] mt-1">Vue d'ensemble de votre activité</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shrink-0">
            <Calendar className="w-4 h-4 text-[#C89B3C]" />
            <span className="text-sm text-[#A8B2C7] font-medium">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 -mt-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CoachKPICard
            title="Clients Actifs"
            value={stats.activeMembers}
            evolution={0}
            icon={<Users className="w-5 h-5" />}
            gradient="gold"
            delay={0}
          />
          <CoachKPICard
            title="Séances Réalisées"
            value={stats.todaySessions}
            evolution={0}
            subtitle="aujourd'hui"
            icon={<Calendar className="w-5 h-5" />}
            gradient="blue"
            delay={0.1}
          />
          <CoachKPICard
            title="Programmes Actifs"
            value={stats.programsCount}
            evolution={0}
            icon={<ClipboardList className="w-5 h-5" />}
            gradient="violet"
            delay={0.2}
          />
          <CoachKPICard
            title="Revenus du Mois"
            value={revenue}
            evolution={0}
            icon={<TrendingUp className="w-5 h-5" />}
            gradient="gold"
            delay={0.3}
          />
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Mes Clients Récents</h2>
              <Link
                href="/coach/members"
                className="text-sm font-semibold text-[#C89B3C] hover:text-[#E0B85D] transition-colors flex items-center gap-1"
              >
                Voir tout <span className="text-lg leading-none">&rarr;</span>
              </Link>
            </div>
            <CoachClientTable
              clients={clientData}
              onViewClient={(id) => router.push(`/coach/members`)}
              onMessage={(id) => router.push(`/coach/messages`)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Séances à Venir</h2>
              <Link
                href="/coach/schedule"
                className="text-sm font-semibold text-[#C89B3C] hover:text-[#E0B85D] transition-colors"
              >
                Voir le planning <span className="text-lg leading-none">&rarr;</span>
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="glass rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 text-center">
                  <Clock className="w-8 h-8 text-[#A8B2C7]/30 mx-auto mb-2" />
                  <p className="text-sm text-[#A8B2C7]">Aucune séance à venir</p>
                </div>
              ) : (
                upcomingSessions.map((s) => {
                  const tc = typeConfig[s.type] || typeConfig.appointment
                  return (
                    <div
                      key={s.id}
                      className="glass rounded-2xl p-4 bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{ background: tc.bg }}
                        >
                          {s.type === "class" ? (
                            <Users className="w-5 h-5" style={{ color: tc.color }} />
                          ) : s.type === "appointment" ? (
                            <Calendar className="w-5 h-5" style={{ color: tc.color }} />
                          ) : (
                            <Dumbbell className="w-5 h-5" style={{ color: tc.color }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{s.title}</p>
                          <p className="text-xs text-[#A8B2C7] mt-0.5">
                            {new Date(s.startTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            {" · "}
                            {new Date(s.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0"
                          style={{
                            color: tc.color,
                            background: tc.bg,
                            borderColor: `${tc.color}33`,
                          }}
                        >
                          {tc.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 mt-8 pb-16 relative z-10">
        <h2 className="text-lg font-bold text-white mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="group glass rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(200,155,60,0.1)] text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white">{action.title}</h3>
                <p className="text-xs text-[#A8B2C7] mt-1">{action.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
