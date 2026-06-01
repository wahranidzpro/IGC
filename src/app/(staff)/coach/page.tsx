"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import {
  Users, Calendar, ClipboardList, TrendingUp, MessageSquare,
  Clock, ChevronRight, AlertCircle, RefreshCw,
  Dumbbell, Activity,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import type { Member, Membership, Attendance, Schedule, Message } from "@/types"

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

export default function CoachDashboard() {
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
  const [coachId, setCoachId] = useState<string | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<Schedule[]>([])
  const [recentMembers, setRecentMembers] = useState<{ id: string; name: string; avatar: string | null; status: string }[]>([])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user.id
    const supabase = createClient()

    async function load() {
      try {
        const { data: cData } = await supabase.from("coaches").select("*").eq("profileId", uid).maybeSingle()
        const cId = (cData as { id?: string } | null)?.id
        if (!cId) { setLoading(false); return }
        setCoachId(cId)

        const { data: mcData } = await supabase
          .from("member_coaches")
          .select("memberId")
          .eq("coachId", cId)
          .eq("isActive", true)
        const memberIds = ((mcData as { memberId: string }[]) || []).map((m) => m.memberId)

        const { data: membersData } = await supabase
          .from("members")
          .select("id, profileId, status")
          .in("id", memberIds)
        const allMembers = (membersData as { id: string; profileId: string; status: string }[]) || []

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, firstName, lastName, avatarUrl")
          .in("id", allMembers.map((m) => m.profileId))
        const profiles = ((profilesData as { id: string; firstName: string; lastName: string; avatarUrl: string | null }[]) || []).reduce((acc, p) => {
          acc[p.id] = p; return acc
        }, {} as Record<string, { firstName: string; lastName: string; avatarUrl: string | null }>)

        setRecentMembers(
          allMembers.slice(0, 5).map((m) => {
            const p = profiles[m.profileId]
            return {
              id: m.id,
              name: p ? `${p.firstName} ${p.lastName}` : "Inconnu",
              avatar: p?.avatarUrl || null,
              status: m.status,
            }
          })
        )

        const { data: msData } = await supabase
          .from("memberships")
          .select("memberId, status")
          .in("memberId", memberIds)
          .eq("status", "active")
        const activeCount = new Set((msData as { memberId: string }[] || []).map((m) => m.memberId)).size

        const today = new Date().toISOString().split("T")[0]
        const { data: attData } = await supabase
          .from("attendance")
          .select("id, memberId")
          .gte("timestamp", `${today}T00:00:00`)
          .lte("timestamp", `${today}T23:59:59`)
        const todaySessions = (attData as { id: string }[] || []).length

        const { data: progData } = await supabase
          .from("workout_programs")
          .select("id")
          .eq("coachId", cId)
        const programsCount = (progData as { id: string }[] || []).length

        const { data: msgData } = await supabase
          .from("messages")
          .select("id")
          .eq("receiverId", uid)
          .eq("isRead", false)
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
          .eq("coachId", cId)
          .gte("startTime", new Date().toISOString())
          .order("startTime", { ascending: true })
          .limit(5)
        setUpcomingSessions((schedData as unknown as Schedule[]) || [])
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les données du tableau de bord")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-base font-bold text-brand-black mb-1">Erreur</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: "Adhérents suivis", value: stats.totalMembers, icon: Users, color: "bg-blue-50 text-blue-600", change: "+3" },
    { label: "Adhérents actifs", value: stats.activeMembers, icon: Activity, color: "bg-green-50 text-green-600", change: "+2" },
    { label: "Séances aujourd'hui", value: stats.todaySessions, icon: Calendar, color: "bg-orange-50 text-orange-600", change: stats.todaySessions > 0 ? "En cours" : "Aucune" },
    { label: "Programmes créés", value: stats.programsCount, icon: ClipboardList, color: "bg-purple-50 text-purple-600", change: `+${stats.programsCount}` },
    { label: "Messages non lus", value: stats.unreadMessages, icon: MessageSquare, color: "bg-pink-50 text-pink-600", change: stats.unreadMessages > 0 ? "Nouveau" : "Tout lu" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Tableau de bord coach</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de votre activité</p>
      </div>

      {!coachId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Profil coach incomplet</p>
            <p className="text-xs text-amber-700">Complétez votre profil dans Mon profil pour apparaître dans l&apos;espace coach.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">{s.change}</span>
            </div>
            <p className="text-xl font-bold text-brand-black">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-black">Progression adhérents</h3>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">+18%</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E10600" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#E10600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="progression" stroke="#E10600" strokeWidth={2} fill="url(#progressGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-black">Fréquentation hebdo</h3>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Cette semaine</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="visites" fill="#E10600" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="objectif" fill="#E10600" fillOpacity={0.15} radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
            <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-red" />
              Prochains rendez-vous
            </h3>
            <button onClick={() => window.location.href = "/coach/schedule"} className="text-xs font-bold text-brand-red hover:underline">
              Voir tout
            </button>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun rendez-vous prévu</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    s.type === "class" ? "bg-green-50 text-green-600" : s.type === "appointment" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                  }`}>
                    {s.type === "class" ? <Users className="w-4 h-4" /> : s.type === "appointment" ? <Calendar className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-black">{s.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.startTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {new Date(s.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
            <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-red" />
              Mes adhérents
            </h3>
            <button onClick={() => window.location.href = "/coach/members"} className="text-xs font-bold text-brand-red hover:underline">
              Voir tout
            </button>
          </div>
          {recentMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun adhérent assigné</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
                    {m.avatar ? (
                      <Image src={m.avatar} alt="" width={36} height={36} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      m.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-black">{m.name}</p>
                    <span className={`text-[10px] font-medium ${
                      m.status === "active" ? "text-green-600" : "text-gray-400"
                    }`}>
                      {m.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
