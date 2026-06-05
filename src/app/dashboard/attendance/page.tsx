"use client"

import { useEffect, useState, useMemo } from "react"
import { logger } from "@/lib/logger"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import {
  DoorOpen, Calendar, Clock, MapPin, Filter,
  TrendingUp, BarChart3, ChevronRight,
} from "lucide-react"
import type { Attendance, Club, Member } from "@/types"

type FilterKey = "today" | "week" | "month"

const filters: { key: FilterKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
]

function getFilterRange(key: FilterKey): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (key === "today") return { start, end }

  if (key === "week") {
    const day = start.getDay()
    const diff = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - diff)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  start.setDate(1)
  end.setMonth(end.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export default function AttendancePage() {
  const { user } = useAuth()
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([])
  const [clubMap, setClubMap] = useState<Record<string, string>>({})
  const [activeFilter, setActiveFilter] = useState<FilterKey>("month")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: mData } = await supabase.from("members").select("*").eq("profile_id", uid).maybeSingle()
        const m = mData ? mapRow<Member>(mData) : null
        const memberId = m?.id
        if (!memberId) { setLoading(false); return }

        const { data: c } = await supabase.from("clubs").select("id, name")
        const map: Record<string, string> = {}
        if (c) (c as unknown as Club[]).forEach((cl) => { map[cl.id] = cl.name })
        setClubMap(map)

        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
        const { data: a } = await supabase
          .from("attendance")
          .select("*")
          .eq("member_id", memberId)
          .gte("timestamp", yearStart)
          .order("timestamp", { ascending: false })
        if (a) setAllAttendance(mapRows<Attendance>(a))
      } catch {
        logger.error('Erreur chargement présences')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const filtered = useMemo(() => {
    const range = getFilterRange(activeFilter)
    return allAttendance.filter((a) => {
      const d = new Date(a.timestamp)
      return d >= range.start && d <= range.end
    })
  }, [allAttendance, activeFilter])

  const entries = filtered.filter((a) => a.type === "entry")

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    allAttendance.forEach((a) => {
      if (a.type !== "entry") return
      const key = `${new Date(a.timestamp).getFullYear()}-${new Date(a.timestamp).getMonth()}`
      map.set(key, (map.get(key) || 0) + 1)
    })
    return map
  }, [allAttendance])

  const monthlyAvg = monthlyData.size > 0
    ? Math.round([...monthlyData.values()].reduce((a, b) => a + b, 0) / monthlyData.size)
    : 0

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Mes présences</h1>
          <p className="text-sm text-gray-400 mt-0.5">Suivez votre assiduité à la salle</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-brand-red/10 text-brand-red px-3 py-1.5 rounded-full text-xs font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          {entries.length} ce mois
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Visites", value: entries.length, icon: DoorOpen, color: "bg-brand-red/10 text-brand-red" },
          { label: "Moy./mois", value: monthlyAvg, icon: BarChart3, color: "bg-brand-blue/10 text-brand-blue" },
          { label: "Meilleur mois", value: Math.max(...Array.from(monthlyData.values()), 0), icon: TrendingUp, color: "bg-green-500/10 text-green-400" },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl border border-white/10 p-3">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 bg-white/5 rounded-xl p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeFilter === f.key
                ? "glass text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-sm font-bold text-white">
            Historique
            <span className="text-xs font-normal text-gray-400 ml-2">({filtered.length} entrée{filtered.length > 1 ? "s" : ""})</span>
          </h3>
          <Filter className="w-4 h-4 text-gray-500" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <DoorOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucune présence</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((a, i) => {
              const d = new Date(a.timestamp)
              const today = new Date()
              const isToday = d.toDateString() === today.toDateString()
              const yesterday = new Date(today)
              yesterday.setDate(yesterday.getDate() - 1)
              const isYesterday = d.toDateString() === yesterday.toDateString()

              let dayLabel = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
              if (isToday) dayLabel = "Aujourd'hui"
              else if (isYesterday) dayLabel = "Hier"

              return (
                <div key={a.id || i} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      a.type === "entry"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-orange-500/10 text-orange-400"
                    }`}>
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {a.type === "entry" ? "Entrée" : "Sortie"}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          a.type === "entry"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-orange-500/10 text-orange-400"
                        }`}>
                          {a.method}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dayLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {a.clubId && clubMap[a.clubId] && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clubMap[a.clubId]}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-red/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-xs">Total {activeFilter === "today" ? "aujourd'hui" : activeFilter === "week" ? "cette semaine" : "ce mois"}</p>
              <p className="text-2xl font-bold">{entries.length} séance{entries.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{monthlyAvg}</p>
            <p className="text-xs text-white/70">Moy. mensuelle</p>
          </div>
        </div>
      </div>
    </div>
  )
}
