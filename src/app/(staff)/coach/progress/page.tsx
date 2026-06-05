"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { cn } from "@/lib/utils"
import CoachSetupPrompt from "@/components/coach/CoachSetupPrompt"
import {
  TrendingUp, Weight, Activity, Ruler, Heart, AlertCircle, RefreshCw,
  ChevronRight, Users, LineChart, Scale, Plus, X, Star,
} from "lucide-react"
import {
  AreaChart, Area, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import type { ProgressLog, Profile, Member, ProgressLogInsert } from "@/types"

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
  const [showModal, setShowModal] = useState(false)
  const [modalForm, setModalForm] = useState({
    weight: "", bodyFat: "", muscleMass: "", waistCircumference: "", notes: "",
  })
  const [savingMeasurement, setSavingMeasurement] = useState(false)

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

  const addMeasurement = async () => {
    if (!user || !selectedMember || !coachId) return
    setSavingMeasurement(true)
    try {
      const supabase = createClient()
      const insert: ProgressLogInsert = {
        memberId: selectedMember,
        coachId,
        weight: modalForm.weight ? Number.parseFloat(modalForm.weight) : null,
        bodyFat: modalForm.bodyFat ? Number.parseFloat(modalForm.bodyFat) : null,
        muscleMass: modalForm.muscleMass ? Number.parseFloat(modalForm.muscleMass) : null,
        waistCircumference: modalForm.waistCircumference ? Number.parseFloat(modalForm.waistCircumference) : null,
        notes: modalForm.notes || null,
        loggedAt: new Date().toISOString(),
      }
      await supabase.from("progress_logs").insert(insert as never)
      setShowModal(false)
      setModalForm({ weight: "", bodyFat: "", muscleMass: "", waistCircumference: "", notes: "" })
      loadProgress(selectedMember)
    } catch {
      setError("Erreur lors de l'ajout")
    } finally {
      setSavingMeasurement(false)
    }
  }

  if (loading && !selectedMember) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse" />
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/10" />)}</div>
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!coachId) {
    return <div className="p-4 md:p-6 lg:p-8"><CoachSetupPrompt sectionLabel="Évaluations" /></div>
  }

  if (!selectedMember) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] bg-clip-text text-transparent">Évaluations</h1>
          <p className="text-sm text-gray-400 mt-1">Suivi des progrès de vos clients</p>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-white mb-1">Aucun adhérent</p>
            <p className="text-xs text-gray-400">Aucun adhérent ne vous est assigné.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <button key={m.id} onClick={() => loadProgress(m.id)}
                className="group w-full flex items-center justify-between p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-[#C89B3C]/30 hover:bg-white/[0.07] transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#F5D77B] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#C89B3C]/20">
                    {m.name.charAt(0)}
                  </div>
                  <p className="text-sm font-bold text-white">{m.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#C89B3C] transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const metrics = [
    {
      label: "Poids", value: latest?.weight ? `${latest.weight} kg` : "—",
      icon: Weight, dataKey: "weight", color: "#C89B3C",
      change: diff(latest?.weight, previous?.weight),
    },
    {
      label: "Tour de taille", value: latest?.waistCircumference ? `${latest.waistCircumference} cm` : "—",
      icon: Ruler, dataKey: "waistCircumference", color: "#F5D77B",
    },
    {
      label: "Masse musculaire", value: latest?.muscleMass ? `${latest.muscleMass} kg` : "—",
      icon: Activity, dataKey: "muscleMass", color: "#E8C46A",
      change: diff(latest?.muscleMass, previous?.muscleMass),
    },
    {
      label: "Graisse corporelle", value: latest?.bodyFat ? `${latest.bodyFat}%` : "—",
      icon: Heart, dataKey: "bodyFat", color: "#B8860B",
      change: diff(latest?.bodyFat, previous?.bodyFat),
    },
  ]

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (!active || !payload) return null
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-gray-300 mb-2">{new Date(label as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs font-bold" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] bg-clip-text text-transparent">Évaluations</h1>
          <p className="text-sm text-gray-400 mt-1">Suivi des progrès de vos clients</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#C89B3C]/20">
          <Plus className="w-4 h-4" /> Ajouter une mesure
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={() => setSelectedMember(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#C89B3C] transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Changer d&apos;adhérent
        </button>
        <select value={selectedMember || ""} onChange={(e) => loadProgress(e.target.value)}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-bold outline-none focus:border-[#C89B3C]/50 transition-colors appearance-none cursor-pointer">
          {members.map((m) => (
            <option key={m.id} value={m.id} className="bg-gray-900 text-white">{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-[#C89B3C]/20 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/10 flex items-center justify-center group-hover:bg-[#C89B3C]/20 transition-colors">
                <m.icon className="w-5 h-5 text-[#C89B3C]" />
              </div>
              {m.change !== null && m.change !== undefined && (
                <span className={cn("text-xs font-bold flex items-center gap-0.5", Number.parseFloat(m.change ?? "0") >= 0 ? "text-red-400" : "text-green-400")}>
                  <TrendingUp className={cn("w-3 h-3", Number.parseFloat(m.change ?? "0") >= 0 ? "" : "rotate-180")} />
                  {Math.abs(Number.parseFloat(m.change ?? "0"))}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{m.value}</p>
            <p className="text-xs text-gray-400 mb-3">{m.label}</p>
            {chartData.length > 1 && (
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`sparkline-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={m.dataKey} stroke={m.color} strokeWidth={1.5} fill={`url(#sparkline-${i})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#C89B3C]" /> Évolution des mesures
          </h3>
          <div className="flex gap-1">
            {(["weekly", "monthly", "quarterly"] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn("text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors",
                  viewMode === mode
                    ? "bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                )}>
                {mode === "weekly" ? "Semaine" : mode === "monthly" ? "Mois" : "Trimestre"}
              </button>
            ))}
          </div>
        </div>
        {chartData.length < 2 ? (
          <div className="text-center py-8 text-sm text-gray-400">Pas assez de données pour afficher le graphique</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C89B3C" strokeOpacity={0.1} />
              <XAxis dataKey="loggedAt" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
              <Line type="monotone" dataKey="weight" stroke="#C89B3C" strokeWidth={2} dot={false} name="Poids (kg)" />
              {latest?.muscleMass && <Line type="monotone" dataKey="muscleMass" stroke="#E8C46A" strokeWidth={2} dot={false} name="Muscle (kg)" />}
              {latest?.bodyFat && <Line type="monotone" dataKey="bodyFat" stroke="#B8860B" strokeWidth={2} dot={false} name="Graisse (%)" />}
              {latest?.waistCircumference && <Line type="monotone" dataKey="waistCircumference" stroke="#F5D77B" strokeWidth={2} dot={false} name="Tour de taille (cm)" />}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Historique des mesures</h3>
          </div>
          <div className="divide-y divide-white/5">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors">
                <span className="text-xs text-gray-400">
                  {new Date(log.loggedAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  {log.weight && <span className="text-white"><strong className="text-[#C89B3C]">{log.weight}</strong> kg</span>}
                  {log.muscleMass && <span className="text-[#E8C46A]"><strong>{log.muscleMass}</strong> kg</span>}
                  {log.bodyFat && <span className="text-[#B8860B]"><strong>{log.bodyFat}</strong>%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {latest?.notes && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Notes du coach</p>
          <p className="text-sm text-gray-300 italic">{latest.notes}</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Nouvelle mesure</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Poids (kg)</label>
                  <input type="number" step="0.1" value={modalForm.weight} onChange={(e) => setModalForm(f => ({ ...f, weight: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="0.0" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Masse musculaire (kg)</label>
                  <input type="number" step="0.1" value={modalForm.muscleMass} onChange={(e) => setModalForm(f => ({ ...f, muscleMass: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="0.0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Graisse corporelle (%)</label>
                  <input type="number" step="0.1" value={modalForm.bodyFat} onChange={(e) => setModalForm(f => ({ ...f, bodyFat: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="0.0" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tour de taille (cm)</label>
                  <input type="number" step="0.1" value={modalForm.waistCircumference} onChange={(e) => setModalForm(f => ({ ...f, waistCircumference: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="0.0" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea value={modalForm.notes} onChange={(e) => setModalForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500 resize-none" rows={3} placeholder="Notes optionnelles..." />
              </div>
              <button onClick={addMeasurement} disabled={savingMeasurement}
                className="w-full py-3 bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[#C89B3C]/20 mt-2">
                {savingMeasurement ? "Enregistrement..." : "Ajouter la mesure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
