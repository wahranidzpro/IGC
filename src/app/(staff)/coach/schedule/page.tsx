"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Save,
  Dumbbell, Users, Clock, AlertCircle, RefreshCw, Trash2,
} from "lucide-react"
import type { Schedule } from "@/types"

const formatDate = (d: Date) => d.toISOString().split("T")[0]

const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

const typeColors: Record<string, string> = {
  coaching: "bg-orange-100 text-orange-700 border-orange-200",
  class: "bg-green-100 text-green-700 border-green-200",
  appointment: "bg-blue-100 text-blue-700 border-blue-200",
}

const typeLabels: Record<string, string> = {
  coaching: "Coaching",
  class: "Cours collectif",
  appointment: "Rendez-vous",
}

export default function SchedulePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "", description: "", type: "coaching" as Schedule["type"],
    startTime: "", endTime: "", memberId: "",
  })
  const [saving, setSaving] = useState(false)

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

        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

        const { data } = await supabase
          .from("schedules")
          .select("*")
          .eq("coachId", cId)
          .gte("startTime", startOfMonth.toISOString())
          .lte("startTime", endOfMonth.toISOString())
          .order("startTime", { ascending: true })

        setSchedules((data as unknown as Schedule[]) || [])
      } catch {
        setError("Impossible de charger le planning")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, currentDate])

  const navigate = (dir: number) => {
    const d = new Date(currentDate)
    if (view === "day") d.setDate(d.getDate() + dir)
    else if (view === "week") d.setDate(d.getDate() + 7 * dir)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const getWeekDays = () => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      return day
    })
  }

  const getDaySchedules = (date: Date) => {
    const ds = formatDate(date)
    return schedules.filter((s) => formatDate(new Date(s.startTime)) === ds)
  }

  const saveSchedule = async () => {
    if (!coachId || !formData.title || !formData.startTime) return
    setSaving(true)
    try {
      const endTime = formData.endTime || formData.startTime
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from("schedules")
        .insert({
          coachId,
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          memberId: formData.memberId || null,
        } as never)
        .select()
        .single()

      if (err) throw err
      if (data) {
        setSchedules((prev) => [...prev, data as unknown as Schedule])
        setShowForm(false)
        setFormData({ title: "", description: "", type: "coaching", startTime: "", endTime: "", memberId: "" })
      }
    } catch {
      setError("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      const supabase = createClient()
      await supabase.from("schedules").delete().eq("id", id)
      setSchedules((prev) => prev.filter((s) => s.id !== id))
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        <div className="grid grid-cols-7 gap-1">{[...Array(35)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}</div>
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
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
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

  const weekDays = getWeekDays()
  const todayStr = formatDate(new Date())

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Planning</h1>
          <p className="text-sm text-gray-500 mt-0.5">{schedules.length} événement{schedules.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-red text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                view === v ? "bg-brand-red text-white shadow-md shadow-brand-red/20" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-red/30"
              }`}>
              {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-bold text-brand-black min-w-[140px] text-center">
            {view === "month" ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` :
             view === "week" ? `${weekDays[0].getDate()} ${monthNames[weekDays[0].getMonth()]}` :
             currentDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </span>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {view === "week" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((d, i) => (
              <div key={i} className={`text-center py-3 text-xs font-bold ${
                formatDate(d) === todayStr ? "text-brand-red" : "text-gray-500"
              }`}>
                <span className="block">{dayNames[d.getDay()]}</span>
                <span className={`block mt-0.5 w-7 h-7 mx-auto rounded-full flex items-center justify-center ${
                  formatDate(d) === todayStr ? "bg-brand-red text-white" : ""
                }`}>{d.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-50 min-h-[300px]">
            {weekDays.map((d, i) => {
              const dayScheds = getDaySchedules(d)
              const isToday = formatDate(d) === todayStr
              return (
                <div key={i} className={`p-1.5 ${isToday ? "bg-brand-red/5" : ""}`}>
                  {dayScheds.length === 0 ? (
                    <p className="text-[10px] text-gray-300 text-center mt-6">—</p>
                  ) : (
                    <div className="space-y-1">
                      {dayScheds.slice(0, 3).map((s) => (
                        <div key={s.id} className={`text-[9px] font-bold px-1.5 py-1 rounded-md border ${typeColors[s.type] || "bg-gray-100"}`}>
                          <p className="truncate">{s.title}</p>
                          <p className="opacity-70">{new Date(s.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      ))}
                      {dayScheds.length > 3 && <p className="text-[9px] text-gray-400 text-center">+{dayScheds.length - 3}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === "day" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-brand-red/5 to-transparent">
            <p className="text-sm font-bold text-brand-black">
              {currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="divide-y divide-gray-50 min-h-[200px]">
            {getDaySchedules(currentDate).length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500">Aucun événement ce jour</div>
            ) : (
              getDaySchedules(currentDate).map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div className={`w-2 h-10 rounded-full ${s.type === "coaching" ? "bg-orange-400" : s.type === "class" ? "bg-green-400" : "bg-blue-400"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-black">{s.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(s.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - {new Date(s.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColors[s.type]}`}>{typeLabels[s.type]}</span>
                    </div>
                    {s.description && <p className="text-xs text-gray-400 mt-1">{s.description}</p>}
                  </div>
                  <button onClick={() => deleteSchedule(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {dayNames.map((d, i) => (
              <div key={i} className="text-center py-2 text-xs font-bold text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
            {Array.from({ length: 42 }, (_, i) => {
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
              const day = i - firstDay + 1
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = formatDate(date) === todayStr
              const dayScheds = isCurrentMonth ? getDaySchedules(date) : []
              return (
                <div key={i} className={`min-h-[80px] p-1 ${!isCurrentMonth ? "bg-gray-50" : isToday ? "bg-brand-red/5" : ""}`}>
                  <span className={`text-[10px] font-bold ${isToday ? "text-brand-red" : !isCurrentMonth ? "text-gray-300" : "text-gray-600"}`}>
                    {isCurrentMonth ? day : ""}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayScheds.slice(0, 2).map((s) => (
                      <div key={s.id} className={`text-[8px] font-bold px-1 py-0.5 rounded truncate ${typeColors[s.type]}`}>
                        {s.title}
                      </div>
                    ))}
                    {dayScheds.length > 2 && <p className="text-[8px] text-gray-400">+{dayScheds.length - 2}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-brand-black">Nouvel événement</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Titre</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Séance coaching" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
              <div className="flex gap-2">
                {(["coaching", "class", "appointment"] as const).map((t) => (
                  <button key={t} onClick={() => setFormData((f) => ({ ...f, type: t }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.type === t ? "bg-brand-red text-white border-brand-red" : "bg-white text-gray-600 border-gray-200"
                    }`}>{typeLabels[t]}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Début</label>
                <input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Fin</label>
                <input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" rows={2} />
            </div>
            <button onClick={saveSchedule} disabled={saving || !formData.title || !formData.startTime}
              className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
              {saving ? "Enregistrement..." : <><Save className="w-4 h-4" /> Ajouter</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
