"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Users,
  X, Save, Trash2, AlertCircle, RefreshCw,
} from "lucide-react"
import type { Schedule } from "@/types"
import CoachSetupPrompt from "@/components/coach/CoachSetupPrompt"

const localizer = momentLocalizer(moment)

const formatDate = (d: Date) => d.toISOString().split("T")[0]

const typeColors: Record<string, string> = {
  coaching: "#C89B3C",
  class: "#0A84FF",
  appointment: "#22C55E",
}

const typeLabels: Record<string, string> = {
  coaching: "Coaching",
  class: "Cours collectif",
  appointment: "Rendez-vous",
}

const typeBadge: Record<string, string> = {
  coaching: "bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C]/30",
  class: "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30",
  appointment: "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30",
}

const typeFormOptions = [
  { value: "coaching" as const, label: "Coaching" },
  { value: "class" as const, label: "Cours collectif" },
  { value: "appointment" as const, label: "Rendez-vous" },
]

const legendItems = [
  { label: "Coaching", color: "#C89B3C" },
  { label: "Cours collectif", color: "#0A84FF" },
  { label: "Rendez-vous", color: "#22C55E" },
]

interface MemberOption { id: string; name: string }

interface CalendarEvent {
  title: string
  start: Date
  end: Date
  resource: {
    id: string
    type: Schedule["type"]
    description: string | null
    memberName?: string
  }
}

const viewLabels: Record<string, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
}

const navDateFormats: Record<string, (d: Date) => string> = {
  month: (d: Date) =>
    d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
  week: (d: Date) => {
    const monday = new Date(d)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return `${monday.getDate()} ${monday.toLocaleDateString("fr-FR", { month: "short" })} - ${sunday.getDate()} ${sunday.toLocaleDateString("fr-FR", { month: "short" })}`
  },
  day: (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
}

export default function SchedulePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "", description: "", type: "coaching" as Schedule["type"],
    startTime: "", endTime: "", memberId: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: cData } = await supabase.from("coaches").select("*").eq("profile_id", uid).maybeSingle()
        const cId = (cData as { id?: string } | null)?.id
        if (!cId) { setLoading(false); return }
        setCoachId(cId)

        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

        const [schedRes, mcRes, pRes] = await Promise.all([
          supabase
            .from("schedules")
            .select("*")
            .eq("coach_id", cId)
            .gte("start_time", startOfMonth.toISOString())
            .lte("start_time", endOfMonth.toISOString())
            .order("start_time", { ascending: true }),
          supabase.from("member_coaches").select("member_id").eq("coach_id", cId).eq("is_active", true),
          supabase.from("profiles").select("id, first_name, last_name"),
        ])

        setSchedules(mapRows<Schedule>(schedRes.data) || [])

        const allProfiles = (mapRows<{ id: string; firstName: string; lastName: string }>(pRes.data) || []).reduce((acc: Record<string, string>, p) => {
          acc[p.id] = `${p.firstName} ${p.lastName}`
          return acc
        }, {} as Record<string, string>)

        const memberIds = ((mcRes.data as { member_id: string }[]) || []).map((m) => m.member_id)
        if (memberIds.length > 0) {
          const { data: mData } = await supabase.from("members").select("id, profile_id").in("id", memberIds)
          setMembers(((mData as { id: string; profile_id: string }[]) || []).map((m) => ({
            id: m.id, name: allProfiles[m.profile_id] || "Inconnu",
          })))
        }
      } catch {
        setError("Impossible de charger le planning")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, currentDate])

  const events = useMemo<CalendarEvent[]>(() =>
    schedules.map((s) => ({
      title: s.title,
      start: new Date(s.startTime),
      end: new Date(s.endTime),
      resource: {
        id: s.id,
        type: s.type,
        description: s.description,
        memberName: members.find((m) => m.id === s.memberId)?.name,
      },
    })),
    [schedules, members],
  )

  const todayEvents = useMemo(() => {
    const todayStr = formatDate(new Date())
    return events
      .filter((e) => formatDate(e.start) === todayStr)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events])

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  const handleViewChange = useCallback((newView: string) => {
    setView(newView as "day" | "week" | "month")
  }, [])

  const eventPropGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: typeColors[event.resource?.type] || "#C89B3C",
      borderRadius: "6px",
      border: "none",
      color: "#fff",
      padding: "2px 6px",
      fontSize: "12px",
      fontWeight: 600,
      boxShadow: `0 2px 8px ${typeColors[event.resource?.type] || "#C89B3C"}40`,
    },
  }), [])

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setEditId(null)
    setSelectedEvent(null)
    setFormData({
      title: "", description: "", type: "coaching",
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
      memberId: "",
    })
    setShowForm(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowForm(false)
  }, [])

  const navigate = (dir: number) => {
    const d = new Date(currentDate)
    if (view === "day") d.setDate(d.getDate() + dir)
    else if (view === "week") d.setDate(d.getDate() + 7 * dir)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const goToToday = () => setCurrentDate(new Date())

  const saveSchedule = async () => {
    if (!coachId || !formData.title || !formData.startTime) return
    setSaving(true)
    try {
      const endTime = formData.endTime || formData.startTime
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from("schedules")
        .insert({
          coach_id: coachId,
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          start_time: new Date(formData.startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          member_id: formData.memberId || null,
        } as never)
        .select()
        .maybeSingle()

      if (err) throw err
      if (data) {
        setSchedules((prev) => [...prev, mapRow<Schedule>(data)!])
        setShowForm(false)
        setEditId(null)
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
      setSelectedEvent(null)
    } catch { /* ignore */ }
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg shimmer" />
        <div className="flex gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-9 w-24 bg-white/5 rounded-xl shimmer" />)}</div>
        <div className="h-[500px] bg-white/5 rounded-2xl shimmer" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center glass rounded-2xl max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-white bg-red-500/80 px-6 py-2.5 rounded-xl hover:bg-red-500 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!coachId) {
    return <div className="p-4 md:p-6 lg:p-8"><CoachSetupPrompt sectionLabel="Séances" /></div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <style>{`
        .rbc-calendar { background: transparent; color: #fff; font-family: inherit; }
        .rbc-header { border-color: rgba(255,255,255,0.06); padding: 10px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #C89B3C; background: rgba(10,15,25,0.5); }
        .rbc-header + .rbc-header { border-left: 1px solid rgba(255,255,255,0.06); }
        .rbc-day-bg { background: transparent; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.04); }
        .rbc-day-bg.rbc-off-range-bg { background: rgba(255,255,255,0.02); }
        .rbc-day-bg.rbc-today { background: rgba(10,132,255,0.08); }
        .rbc-date-cell { padding: 4px 6px; font-size: 12px; font-weight: 600; }
        .rbc-date-cell.rbc-now { font-weight: 700; color: #0A84FF; }
        .rbc-date-cell > a { color: inherit; }
        .rbc-row-segment { padding: 1px; }
        .rbc-event { padding: 2px 6px; border-radius: 6px; border: none; font-size: 12px; font-weight: 600; }
        .rbc-event.rbc-selected { box-shadow: 0 0 0 2px rgba(255,255,255,0.3) !important; }
        .rbc-show-more { color: #C89B3C; font-size: 11px; font-weight: 600; padding: 1px 4px; }
        .rbc-show-more:hover { color: #E0B85D; }
        .rbc-toolbar { display: none; }
        .rbc-btn-group button { color: #a0a0b0; background: transparent; border: 1px solid rgba(255,255,255,0.08); padding: 4px 12px; font-size: 12px; border-radius: 8px; }
        .rbc-btn-group button.rbc-active { background: #C89B3C; color: #fff; border-color: #C89B3C; }
        .rbc-time-view { border: none; background: transparent; }
        .rbc-time-view .rbc-row { border-color: rgba(255,255,255,0.06); }
        .rbc-time-header { border-color: rgba(255,255,255,0.06); }
        .rbc-time-header > .rbc-row > .rbc-header { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .rbc-time-content { border-color: rgba(255,255,255,0.06); }
        .rbc-time-content > * + * > * { border-left: 1px solid rgba(255,255,255,0.04); }
        .rbc-timeslot-group { border-color: rgba(255,255,255,0.04); min-height: 40px; }
        .rbc-time-gutter .rbc-timeslot-group { border-color: rgba(255,255,255,0.04); }
        .rbc-time-gutter { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }
        .rbc-time-gutter .rbc-timeslot-group { border-color: transparent; }
        .rbc-label { padding: 0 8px; }
        .rbc-day-slot .rbc-time-slot { border-color: rgba(255,255,255,0.03); }
        .rbc-day-slot .rbc-events-container { margin-right: 0; }
        .rbc-day-slot .rbc-event { border: none; }
        .rbc-day-slot .rbc-background-event { opacity: 0.7; }
        .rbc-month-view { border: none; background: transparent; }
        .rbc-month-row { border-color: rgba(255,255,255,0.06); }
        .rbc-month-header { background: rgba(10,15,25,0.5); }
        .rbc-row-content { z-index: 1; }
        .rbc-overlay { background: rgba(10,15,25,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); padding: 8px; }
        .rbc-overlay-header { border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 8px; font-weight: 700; color: #C89B3C; font-size: 13px; }
        .rbc-overlay > .rbc-event + .rbc-event { margin-top: 4px; }
        .rbc-now { font-weight: 700; }
        .rbc-current-time-indicator { background-color: #0A84FF; height: 2px; }
        .rbc-time-slot { min-height: 20px; }
        .rbc-day-slot .rbc-event-label { display: none; }
        .rbc-agenda-view { border: none; }
        .rbc-agenda-view table { border-color: rgba(255,255,255,0.06); }
        .rbc-agenda-view table thead > tr > th { border-color: rgba(255,255,255,0.06); background: rgba(10,15,25,0.5); color: #C89B3C; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 8px; }
        .rbc-agenda-view table tbody > tr > td { border-color: rgba(255,255,255,0.04); padding: 8px; font-size: 13px; }
        .rbc-agenda-view table tbody > tr + tr > td { border-top: 1px solid rgba(255,255,255,0.04); }
        .rbc-agenda-empty { padding: 20px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }
        @media (max-width: 768px) {
          .rbc-toolbar { display: flex !important; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
          .rbc-toolbar-label { flex: 1 1 100%; text-align: center; font-size: 14px; font-weight: 700; color: #C89B3C; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gradient-gold">Planning</h1>
          <p className="text-xs text-white/40 mt-0.5">Gérez vos séances et rendez-vous</p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ title: "", description: "", type: "coaching", startTime: "", endTime: "", memberId: "" }); setShowForm(true); setSelectedEvent(null) }}
          className="flex items-center gap-2 bg-[#C89B3C] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#B8892C] transition-all shadow-lg shadow-[#C89B3C]/20">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                view === v ? "bg-[#C89B3C] text-white shadow-md shadow-[#C89B3C]/20" : "glass-light text-white/60 hover:text-white hover:border-white/20"
              }`}>
              {viewLabels[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday}
            className="px-3 py-2 rounded-xl text-xs font-bold text-[#C89B3C] border border-[#C89B3C]/30 hover:bg-[#C89B3C]/10 transition-all">
            Aujourd'hui
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white min-w-[160px] text-center capitalize">
              {navDateFormats[view] ? navDateFormats[view](currentDate) : ""}
            </span>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 glass rounded-2xl p-3 lg:p-4">
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            date={currentDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            selectable
            popup
            views={["day", "week", "month"]}
            step={30}
            timeslots={2}
            className="h-[600px] lg:h-[650px]"
          />
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/5">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-white/60">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-80 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C89B3C]" />
              Aujourd'hui
            </h3>
            <span className="text-[10px] font-bold text-white/30 px-2 py-0.5 rounded-full border border-white/10">
              {todayEvents.length} événement{todayEvents.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="glass rounded-2xl divide-y divide-white/5 max-h-[480px] overflow-y-auto">
            {todayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarIcon className="w-8 h-8 text-white/10 mb-2" />
                <p className="text-xs text-white/30">Aucun événement aujourd'hui</p>
              </div>
            ) : (
              todayEvents.map((evt) => (
                <button key={evt.resource.id} onClick={() => handleSelectEvent(evt)}
                  className="w-full text-left p-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-full min-h-[40px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: typeColors[evt.resource.type] || "#C89B3C" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{evt.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatTime(evt.start)} - {formatTime(evt.end)}
                      </div>
                      {evt.resource.memberName && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
                          <Users className="w-3 h-3 shrink-0" />
                          {evt.resource.memberName}
                        </div>
                      )}
                      <span className={`inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${typeBadge[evt.resource.type] || ""}`}>
                        {typeLabels[evt.resource.type]}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-4 shadow-2xl border border-white/10 m-4 animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: typeColors[selectedEvent.resource.type] || "#C89B3C" }} />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedEvent.title}</h3>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${typeBadge[selectedEvent.resource.type] || ""}`}>
                    {typeLabels[selectedEvent.resource.type]}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-4 h-4 text-[#C89B3C]" />
                {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
              </div>
              {selectedEvent.resource.memberName && (
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4 text-[#C89B3C]" />
                  {selectedEvent.resource.memberName}
                </div>
              )}
              {selectedEvent.resource.description && (
                <p className="text-white/50 text-xs mt-2 pt-2 border-t border-white/5">
                  {selectedEvent.resource.description}
                </p>
              )}
            </div>
            <button onClick={() => deleteSchedule(selectedEvent.resource.id)}
              className="w-full flex items-center justify-center gap-2 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-sm font-bold hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-4 shadow-2xl border border-white/10 m-4 animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gradient-gold">{editId ? "Modifier" : "Nouvel événement"}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Titre</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20" placeholder="Séance coaching" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Type</label>
              <div className="flex gap-2 flex-wrap">
                {typeFormOptions.map((t) => (
                  <button key={t.value} onClick={() => setFormData((f) => ({ ...f, type: t.value }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.type === t.value ? "bg-[#C89B3C] text-white border-[#C89B3C]" : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    }`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Client</label>
              <select value={formData.memberId} onChange={(e) => setFormData((f) => ({ ...f, memberId: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:bg-white/[0.07] transition-all">
                <option value="" className="bg-[#0A0F1A]">Aucun client</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0A0F1A]">{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Début</label>
                <input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:bg-white/[0.07] transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Fin</label>
                <input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:bg-white/[0.07] transition-all [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20" rows={2} />
            </div>
            <button onClick={saveSchedule} disabled={saving || !formData.title || !formData.startTime}
              className="w-full flex items-center justify-center gap-2 bg-[#C89B3C] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#B8892C] transition-all shadow-lg shadow-[#C89B3C]/20 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? "Enregistrement..." : <><Save className="w-4 h-4" /> Ajouter</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
