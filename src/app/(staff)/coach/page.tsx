"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Users, Calendar, ClipboardList, TrendingUp, MessageSquare,
  Clock, ChevronRight, AlertCircle, RefreshCw,
  Dumbbell, Activity, Apple, User, UserCheck, DoorOpen,
  Zap, Award, Building2, BadgeCheck,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import type { Schedule } from "@/types"

const weeklyData = [
  { day: "Lun", visites: 12, objectif: 15 },
  { day: "Mar", visites: 18, objectif: 15 },
  { day: "Mer", visites: 8, objectif: 12 },
  { day: "Jeu", visites: 15, objectif: 15 },
  { day: "Ven", visites: 20, objectif: 15 },
  { day: "Sam", visites: 10, objectif: 10 },
  { day: "Dim", visites: 0, objectif: 0 },
]

const monthlyData = [
  { month: "Jan", progression: 68 },
  { month: "Fév", progression: 72 },
  { month: "Mar", progression: 78 },
  { month: "Avr", progression: 75 },
  { month: "Mai", progression: 82 },
]

const quickLinks = [
  { label: "Mes adhérents", href: "/coach/members", icon: Users, desc: "Gérer mes membres", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
  { label: "Programmes", href: "/coach/programs", icon: Dumbbell, desc: "Plans d'entraînement", color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
  { label: "Nutrition", href: "/coach/nutrition", icon: Apple, desc: "Plans alimentaires", color: "from-green-500 to-emerald-600", bg: "bg-green-50" },
  { label: "Messages", href: "/coach/messages", icon: MessageSquare, desc: "Messagerie", color: "from-pink-500 to-rose-600", bg: "bg-pink-50" },
  { label: "Planning", href: "/coach/schedule", icon: Calendar, desc: "Emploi du temps", color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
  { label: "Mon profil", href: "/coach/profile", icon: User, desc: "Informations personnelles", color: "from-slate-500 to-gray-600", bg: "bg-slate-50" },
]

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

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="h-48 bg-gray-800/50 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-800/50 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-base font-bold text-white mb-1">Erreur</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-br from-brand-red via-red-700 to-brand-black px-5 pt-6 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-red-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-white/10 flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                    {(user as { name?: string })?.name?.[0]?.toUpperCase() || "C"}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white shadow" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Tableau de bord</p>
                <h1 className="text-xl font-bold">{(user as { name?: string })?.name || "Coach"}</h1>
                <p className="text-sm text-white/70">
                  {coachData?.speciality || "Coach sportif"} · Infinity Gym Center
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80">
                <BadgeCheck className="w-3.5 h-3.5" />
                Coach
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-400/20 text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                En ligne
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80">
              <Users className="w-3.5 h-3.5" />
              {stats.totalMembers} adhérents
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-400/20 text-blue-300">
              <DoorOpen className="w-3.5 h-3.5" />
              {inGymCount} en salle
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300">
              <Zap className="w-3.5 h-3.5" />
              {stats.todaySessions} séances aujourd&apos;hui
            </span>
            {stats.unreadMessages > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-pink-400/20 text-pink-300">
                <MessageSquare className="w-3.5 h-3.5" />
                {stats.unreadMessages} message{stats.unreadMessages > 1 ? "s" : ""} non lu{stats.unreadMessages > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-10 space-y-6 pb-28">
        {!coachData && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-300">Profil coach incomplet</p>
              <p className="text-xs text-amber-400/80">Complétez votre profil pour apparaître dans l&apos;espace coach.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Adhérents suivis", value: stats.totalMembers, icon: Users, color: "bg-blue-500/10 text-blue-400", change: "Total" },
            { label: "Actifs", value: stats.activeMembers, icon: UserCheck, color: "bg-green-500/10 text-green-400", change: `${stats.activeMembers}/${stats.totalMembers}` },
            { label: "En salle", value: inGymCount, icon: DoorOpen, color: "bg-cyan-500/10 text-cyan-400", change: "Maintenant" },
            { label: "Programmes", value: stats.programsCount, icon: ClipboardList, color: "bg-purple-500/10 text-purple-400", change: "Créés" },
            { label: "Messages", value: stats.unreadMessages, icon: MessageSquare, color: "bg-pink-500/10 text-pink-400", change: stats.unreadMessages > 0 ? "Non lus" : "Tout lu" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-xl p-4 hover:border-gray-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-500">{s.change}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Accès rapide</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="group relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-xl hover:shadow-black/20 hover:border-brand-red/30 hover:-translate-y-0.5 active:scale-[0.98] before:absolute before:top-0 before:left-4 before:right-4 before:h-0.5 before:bg-gradient-to-r before:from-brand-red before:via-brand-accent before:to-brand-red before:rounded-full before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100"
              >
                <div className={`w-12 h-12 rounded-xl ${link.bg} bg-opacity-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <link.icon className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="text-sm font-bold text-white mb-0.5">{link.label}</h3>
                <p className="text-xs text-gray-400">{link.desc}</p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-brand-red" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Progression adhérents</h3>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded-full">+18%</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E10600" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#E10600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                <Area type="monotone" dataKey="progression" stroke="#E10600" strokeWidth={2} fill="url(#progressGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Fréquentation hebdo</h3>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded-full">Cette semaine</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="visites" fill="#E10600" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="objectif" fill="#E10600" fillOpacity={0.15} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-red" />
                Prochains rendez-vous
              </h3>
              <button onClick={() => router.push("/coach/schedule")} className="text-xs font-bold text-brand-red hover:underline">
                Voir tout
              </button>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun rendez-vous prévu</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {upcomingSessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      s.type === "class" ? "bg-green-500/10 text-green-400" : s.type === "appointment" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
                    }`}>
                      {s.type === "class" ? <Users className="w-4 h-4" /> : s.type === "appointment" ? <Calendar className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.startTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {new Date(s.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-red" />
                Mes adhérents {inGymCount > 0 && <span className="text-xs font-normal text-green-400">({inGymCount} en salle)</span>}
              </h3>
              <button onClick={() => router.push("/coach/members")} className="text-xs font-bold text-brand-red hover:underline">
                Voir tout
              </button>
            </div>
            {recentMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun adhérent assigné</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800 max-h-[320px] overflow-y-auto">
                {recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
                      {m.avatar ? (
                        <Image src={m.avatar} alt="" width={36} height={36} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        m.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${m.status === "active" ? "text-green-400" : "text-gray-500"}`}>
                          {m.status === "active" ? "Actif" : "Inactif"}
                        </span>
                        {m.inGym && (
                          <span className="text-[10px] font-medium text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            En salle
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
