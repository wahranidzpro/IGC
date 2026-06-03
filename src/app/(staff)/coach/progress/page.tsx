"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import {
  TrendingUp, Weight, Activity, Ruler, Heart, AlertCircle, RefreshCw,
  ChevronRight, Users,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import type { ProgressLog, Profile, Member } from "@/types"

interface MemberOption {
  id: string
  name: string
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberOption[]>([])
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [viewMode, setViewMode] = useState<"weekly" | "monthly" | "quarterly">("monthly")

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const cRow = await supabase.from("coaches").select("id").eq("profile_id", uid).maybeSingle()
          .then(r => mapRow<{ id: string }>(r.data))
        const cId = cRow?.id
        if (!cId) { setLoading(false); return }
        setCoachId(cId)

        const [mcRows, pRows] = await Promise.all([
          supabase.from("member_coaches").select("member_id").eq("coach_id", cId).eq("is_active", true)
            .then(r => mapRows<{ memberId: string }>(r.data)),
          supabase.from("profiles").select("id, first_name, last_name")
            .then(r => mapRows<Profile>(r.data)),
        ])

        const memberIds = mcRows.map((m) => m.memberId)
        const allProfiles = pRows.reduce((acc, p) => {
          acc[p.id] = `${p.firstName} ${p.lastName}`; return acc
        }, {} as Record<string, string>)

        if (memberIds.length > 0) {
          const mRows = await supabase.from("members").select("id, profile_id").in("id", memberIds)
            .then(r => mapRows<{ id: string; profileId: string }>(r.data))
          setMembers(mRows.map((m) => ({
            id: m.id, name: allProfiles[m.profileId] || "Inconnu",
          })))
        }
      } catch {
        setError("Impossible de charger les données")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const loadProgress = async (memberId: string) => {
    setSelectedMember(memberId)
    setLoading(true)
    try {
      const supabase = createClient()
      const logsData = await supabase
        .from("progress_logs")
        .select("*")
        .eq("member_id", memberId)
        .order("logged_at", { ascending: false })
        .limit(50)
        .then(r => mapRows<ProgressLog>(r.data))
      setLogs(logsData)
    } catch {
      setError("Impossible de charger la progression")
    } finally {
      setLoading(false)
    }
  }

  const chartData = [...logs].reverse()
  const latest = logs[0] || null
  const previous = logs[1] || null

  const diff = (val: number | null, prev: number | null) => {
    if (val === null || prev === null || prev === 0) return null
    return ((val - prev) / prev * 100).toFixed(1)
  }

  if (loading && !selectedMember) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}</div>
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
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
          <p className="text-sm font-bold text-brand-black mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!coachId) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Profil coach requis</p>
          <p className="text-xs text-gray-500">Complétez votre profil dans Mon profil.</p>
        </div>
      </div>
    )
  }

  if (!selectedMember) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Suivi progression</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sélectionnez un adhérent pour voir sa progression</p>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-brand-black mb-1">Aucun adhérent</p>
            <p className="text-xs text-gray-500">Aucun adhérent ne vous est assigné.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {members.map((m) => (
              <button key={m.id} onClick={() => loadProgress(m.id)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold">
                    {m.name.charAt(0)}
                  </div>
                  <p className="text-sm font-bold text-brand-black">{m.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <button onClick={() => setSelectedMember(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-black">
        <ChevronRight className="w-4 h-4 rotate-180" /> Changer d&apos;adhérent
      </button>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Poids", value: latest?.weight ? `${latest.weight} kg` : "—", icon: Weight, color: "bg-blue-50 text-blue-600", change: diff(latest?.weight, previous?.weight) },
          { label: "Tour de taille", value: latest?.waistCircumference ? `${latest.waistCircumference} cm` : "—", icon: Ruler, color: "bg-orange-50 text-orange-600" },
          { label: "Masse grasse", value: latest?.bodyFat ? `${latest.bodyFat}%` : "—", icon: Activity, color: "bg-purple-50 text-purple-600" },
          { label: "Masse musculaire", value: latest?.muscleMass ? `${latest.muscleMass} kg` : "—", icon: Heart, color: "bg-green-50 text-green-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4" /></div>
              {s.change && <span className="text-[10px] font-bold text-green-600">-{s.change}%</span>}
            </div>
            <p className="text-xl font-bold text-brand-black">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-brand-black">Évolution du poids</h3>
          <div className="flex gap-1">
            {(["weekly", "monthly", "quarterly"] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
                  viewMode === mode ? "bg-brand-red text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {mode === "weekly" ? "Semaine" : mode === "monthly" ? "Mois" : "Trimestre"}
              </button>
            ))}
          </div>
        </div>
        {chartData.length < 2 ? (
          <div className="text-center py-8 text-sm text-gray-500">Pas assez de données pour afficher le graphique</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E10600" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#E10600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="loggedAt" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" stroke="#E10600" strokeWidth={2} fill="url(#wg)" name="Poids (kg)" />
              {latest?.muscleMass && <Area type="monotone" dataKey="muscleMass" stroke="#00c758" strokeWidth={2} fill="none" name="Muscle (kg)" />}
              {latest?.bodyFat && <Area type="monotone" dataKey="bodyFat" stroke="#fe6e00" strokeWidth={2} fill="none" name="Masse grasse (%)" />}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-gray-50">
            <h3 className="text-sm font-bold text-brand-black">Historique des mesures</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-500">
                  {new Date(log.loggedAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  {log.weight && <span className="text-gray-700"><strong>{log.weight}</strong> kg</span>}
                  {log.muscleMass && <span className="text-green-600"><strong>{log.muscleMass}</strong> kg</span>}
                  {log.bodyFat && <span className="text-orange-600"><strong>{log.bodyFat}</strong>%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {latest?.notes && (
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Notes du coach</p>
          <p className="text-sm text-gray-700 italic">{latest.notes}</p>
        </div>
      )}
    </div>
  )
}
