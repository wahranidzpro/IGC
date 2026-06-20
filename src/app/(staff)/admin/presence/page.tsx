"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import AdminStatsCard from "@/components/admin/AdminStatsCard"
import { DoorOpen, LogIn, LogOut, Clock, Calendar, Activity, Users } from "lucide-react"

interface AttendanceRow {
  id: string
  type: "entry" | "exit"
  timestamp: string
  method: string
  member: {
    profile: { firstName: string; lastName: string } | null
  } | null
}

export default function AdminPresencePage() {
  const [todayEntries, setTodayEntries] = useState<AttendanceRow[]>([])
  const [stats, setStats] = useState({ todayEntries: 0, todayExits: 0, uniqueMembers: 0, peakHour: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

      const { data: today } = await supabase
        .from("attendance")
        .select("*, member:members(profile:profiles(*))")
        .gte("timestamp", todayStart)
        .lt("timestamp", todayEnd)
        .order("timestamp", { ascending: false })

      if (today) {
        const rows = today as unknown as AttendanceRow[]
        setTodayEntries(rows)
        const entries = rows.filter((r) => r.type === "entry").length
        const exits = rows.filter((r) => r.type === "exit").length
        const unique = new Set(rows.map((r) => `${r.member?.profile?.firstName ?? ""}${r.member?.profile?.lastName ?? ""}`)).size

        const hourly: Record<number, number> = {}
        rows.forEach((r) => {
          const h = new Date(r.timestamp).getHours()
          hourly[h] = (hourly[h] || 0) + 1
        })
        const peak = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0]
        const peakHour = peak ? `${peak[0]}h` : "—"

        setStats({ todayEntries: entries, todayExits: exits, uniqueMembers: unique, peakHour })
      }
      setLoading(false)
    }
    load()
  }, [])

  const methodBreakdown = useMemo(() => {
    const methods: Record<string, number> = {}
    todayEntries.forEach((a) => {
      methods[a.method] = (methods[a.method] || 0) + 1
    })
    return methods
  }, [todayEntries])

  const METHOD_LABELS: Record<string, string> = {
    qr: "QR Code",
    rfid: "RFID",
    manual: "Manuel",
  }

  const METHOD_COLORS: Record<string, string> = {
    qr: "from-[#0A84FF] to-[#00D4FF]",
    rfid: "from-[#7C3AED] to-[#A855F7]",
    manual: "from-[#C89B3C] to-[#E0B85D]",
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="h-80 rounded-2xl shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0A84FF] flex items-center justify-center shadow-lg shadow-[#00D4FF]/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">PR\u00c9SENCES</h1>
        </div>
        <p className="text-[#A8B2C7] text-sm ml-[52px]">
          Suivi des entr\u00e9es et sorties du {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard label="Entr\u00e9es" value={stats.todayEntries} icon={LogIn} color="green" />
        <AdminStatsCard label="Sorties" value={stats.todayExits} icon={LogOut} color="orange" />
        <AdminStatsCard label="Membres uniques" value={stats.uniqueMembers} icon={Users} color="blue" />
        <AdminStatsCard label="Heure de pointe" value={stats.peakHour} icon={Clock} color="gold" />
      </div>

      {/* Method Breakdown */}
      {Object.keys(methodBreakdown).length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">M\u00e9thodes d&apos;acc\u00e8s</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(methodBreakdown).map(([method, count]) => {
              const total = todayEntries.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const grad = METHOD_COLORS[method] || "from-[#A8B2C7] to-[#A8B2C7]"
              return (
                <div key={method} className="glass rounded-2xl p-5 border border-[rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg`}>
                      <DoorOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-black text-white">{count}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{METHOD_LABELS[method] || method}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-[#A8B2C7] mt-1">{pct}% du total</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity List */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0A84FF]" /> Activit\u00e9 du jour
          </span>
        </h2>

        <div className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {todayEntries.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-[#A8B2C7]/30 mx-auto mb-3" />
              <p className="text-[#A8B2C7] text-sm">Aucune activit\u00e9 aujourd&apos;hui</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A8B2C7] border-b border-[rgba(255,255,255,0.06)]">
                <div className="col-span-5">Membre</div>
                <div className="col-span-3">Type</div>
                <div className="col-span-2">M\u00e9thode</div>
                <div className="col-span-2 text-right">Heure</div>
              </div>

              {todayEntries.map((a) => (
                <div key={a.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-[rgba(255,255,255,0.02)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      a.type === "entry"
                        ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]"
                        : "bg-[rgba(200,155,60,0.1)] text-[#C89B3C] border border-[rgba(200,155,60,0.2)]"
                    }`}>
                      {a.type === "entry" ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {a.member?.profile?.firstName} {a.member?.profile?.lastName}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold tracking-wider border ${
                      a.type === "entry"
                        ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]"
                        : "bg-[rgba(200,155,60,0.1)] text-[#C89B3C] border-[rgba(200,155,60,0.2)]"
                    }`}>
                      {a.type === "entry" ? "ENTR\u00c9E" : "SORTIE"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-[#A8B2C7]">
                      {a.method === "qr" ? "QR" : a.method === "rfid" ? "RFID" : a.method === "manual" ? "Manuel" : a.method}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-sm text-[#A8B2C7]">
                    {new Date(a.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
