"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Dumbbell, Plus, Edit2, Copy, Trash2, Users, X, AlertCircle, RefreshCw, ChevronRight, Save } from "lucide-react"
import type { WorkoutProgram, Profile } from "@/types"
import { cn } from "@/lib/utils"
import CoachSetupPrompt from "@/components/coach/CoachSetupPrompt"

interface MemberOption { id: string; name: string }

const FILTERS = ["Tous", "Actifs", "Terminés", "Personnalisés"] as const
type FilterType = typeof FILTERS[number]

export default function ProgramsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<WorkoutProgram[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberOption[]>([])

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    exercises: [{ name: "", sets: 4, reps: "10-12", weight: "", rest: "60s", notes: "" }],
    assignedTo: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [viewDetail, setViewDetail] = useState<WorkoutProgram | null>(null)
  const [memberProfiles, setMemberProfiles] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<FilterType>("Tous")

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: cData } = await supabase.from("coaches").select("*").eq("profile_id", uid).maybeSingle()
        const cId = (cData as { id?: string } | null)?.id
        if (!cId) { setLoading(false); return }
        setCoachId(cId)

        const [progRes, mcRes, pRes] = await Promise.all([
          supabase.from("workout_programs").select("*").eq("coach_id", cId).order("created_at", { ascending: false }),
          supabase.from("member_coaches").select("member_id").eq("coach_id", cId).eq("is_active", true),
          supabase.from("profiles").select("id, first_name, last_name"),
        ])

        setPrograms(mapRows<WorkoutProgram>(progRes.data) || [])

        const memberIds = ((mcRes.data as { member_id: string }[]) || []).map((m) => m.member_id)
        const allProfiles = (mapRows<Profile>(pRes.data) || []).reduce((acc, p) => {
          acc[p.id] = `${p.firstName} ${p.lastName}`; return acc
        }, {} as Record<string, string>)
        setMemberProfiles(allProfiles)

        if (memberIds.length > 0) {
          const { data: mData } = await supabase.from("members").select("id, profile_id").in("id", memberIds)
          const mList = ((mData as { id: string; profile_id: string }[]) || []).map((m) => ({
            id: m.id,
            name: allProfiles[m.profile_id] || "Inconnu",
          }))
          setMembers(mList)
        }
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les programmes")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const addExercise = () => {
    setFormData((f) => ({
      ...f,
      exercises: [...f.exercises, { name: "", sets: 4, reps: "10-12", weight: "", rest: "60s", notes: "" }],
    }))
  }

  const removeExercise = (idx: number) => {
    setFormData((f) => ({ ...f, exercises: f.exercises.filter((_, i) => i !== idx) }))
  }

  const updateExercise = (idx: number, field: string, value: string | number) => {
    setFormData((f) => ({
      ...f,
      exercises: f.exercises.map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    }))
  }

  const toggleMember = (memberId: string) => {
    setFormData((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(memberId)
        ? f.assignedTo.filter((id) => id !== memberId)
        : [...f.assignedTo, memberId],
    }))
  }

  const handleEdit = (p: WorkoutProgram) => {
    setFormData({
      name: p.name,
      description: p.description || "",
      exercises: p.exercises,
      assignedTo: p.assignedTo,
    })
    setShowForm(true)
  }

  const handleDuplicate = (p: WorkoutProgram) => {
    setFormData({
      name: `${p.name} (copie)`,
      description: p.description || "",
      exercises: p.exercises,
      assignedTo: [],
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Supprimer ce programme ?")) return
    const supabase = createClient()
    await supabase.from("workout_programs").delete().eq("id", id)
    setPrograms((prev) => prev.filter((p) => p.id !== id))
  }

  const saveProgram = async () => {
    if (!coachId || !formData.name) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from("workout_programs")
        .insert({
          coach_id: coachId,
          name: formData.name,
          description: formData.description || null,
          exercises: formData.exercises,
          assigned_to: formData.assignedTo,
        } as never)
        .select()
        .maybeSingle()

      if (err) throw err
      if (data) {
        setPrograms((prev) => [mapRow<WorkoutProgram>(data)!, ...prev])
        setFormData({ name: "", description: "", exercises: [{ name: "", sets: 4, reps: "10-12", weight: "", rest: "60s", notes: "" }], assignedTo: [] })
        setShowForm(false)
      }
    } catch {
      setError("Erreur lors de la création du programme")
    } finally {
      setSaving(false)
    }
  }

  const filteredPrograms = filter === "Tous" ? programs
    : filter === "Actifs" ? programs.filter((p) => p.assignedTo.length > 0)
    : filter === "Personnalisés" ? programs.filter((p) => p.assignedTo.length === 0)
    : []

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse backdrop-blur-xl" />
        <div className="h-12 bg-white/5 rounded-xl animate-pulse backdrop-blur-xl" />
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-9 w-20 bg-white/5 rounded-xl animate-pulse backdrop-blur-xl" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse backdrop-blur-xl border border-white/10" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-black bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] px-6 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-[#C89B3C]/20">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (viewDetail) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <button onClick={() => setViewDetail(null)} className="flex items-center gap-1 text-sm text-white/50 hover:text-[#C89B3C] transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{viewDetail.name}</h2>
              {viewDetail.description && <p className="text-sm text-white/50 mt-0.5">{viewDetail.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs text-white/40">
            <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {viewDetail.exercises.length} exercices</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {viewDetail.assignedTo.length} adhérent{viewDetail.assignedTo.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="space-y-2">
          {viewDetail.exercises.map((ex, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-white">{ex.name}</p>
                <span className="text-[10px] font-bold text-[#C89B3C]">{ex.sets} × {ex.reps}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                {ex.weight && <span>Charge: <strong className="text-white/60">{ex.weight}</strong></span>}
                {ex.rest && <span className="flex items-center gap-1">Repos: <strong className="text-white/60">{ex.rest}</strong></span>}
              </div>
              {ex.notes && <p className="text-xs text-white/30 mt-1 italic">{ex.notes}</p>}
            </div>
          ))}
        </div>

        {viewDetail.assignedTo.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[#C89B3C]" /> Assigné à</h3>
            <div className="flex flex-wrap gap-2">
              {viewDetail.assignedTo.map((mid) => {
                const m = members.find((m) => m.id === mid)
                return <span key={mid} className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-full">{m?.name || "Inconnu"}</span>
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderForm = () => (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
      <div className="relative w-full max-w-2xl mx-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">Nouveau programme</h2>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Nom du programme</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Ex: Prise de masse" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" rows={3} placeholder="Objectifs, notes..." />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Exercices ({formData.exercises.length})</h3>
              <button onClick={addExercise} className="text-xs font-bold text-[#C89B3C] flex items-center gap-1 hover:text-[#D4AF37] transition-colors"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
            </div>
            <div className="divide-y divide-white/5">
              {formData.exercises.map((ex, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/40">Exercice {i + 1}</span>
                    {formData.exercises.length > 1 && (
                      <button onClick={() => removeExercise(i)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <input type="text" value={ex.name} onChange={(e) => updateExercise(i, "name", e.target.value)}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Nom de l'exercice" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-white/30">Séries</label>
                      <input type="number" value={ex.sets} onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30">Répétitions</label>
                      <input type="text" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" placeholder="10-12" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30">Charge</label>
                      <input type="text" value={ex.weight} onChange={(e) => updateExercise(i, "weight", e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" placeholder="60 kg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30">Repos</label>
                      <input type="text" value={ex.rest} onChange={(e) => updateExercise(i, "rest", e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" placeholder="60s" />
                    </div>
                  </div>
                  <input type="text" value={ex.notes} onChange={(e) => updateExercise(i, "notes", e.target.value)}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Notes (optionnel)" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[#C89B3C]" /> Assigner à</h3>
            {members.length === 0 ? (
              <p className="text-sm text-white/40">Aucun adhérent disponible</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button key={m.id} onClick={() => toggleMember(m.id)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      formData.assignedTo.includes(m.id)
                        ? "bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black border-transparent shadow-lg shadow-[#C89B3C]/20"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-[#C89B3C]/30"
                    )}>{m.name}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={saveProgram} disabled={saving || !formData.name}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[#C89B3C]/20">
            {saving ? "Enregistrement..." : <><Save className="w-4 h-4" /> Créer le programme</>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      {showForm && renderForm()}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
            Programmes
          </h1>
          <p className="text-sm text-white/40 mt-1">Créez et gérez vos programmes d'entraînement</p>
        </div>
        {coachId && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20">
          <Plus className="w-4 h-4" /> Créer un Programme
        </button>}
      </div>

      {coachId && (
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === f
                  ? "bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black shadow-lg shadow-[#C89B3C]/20"
                  : "bg-white/5 backdrop-blur-xl border border-white/10 text-white/50 hover:text-white hover:border-[#C89B3C]/30"
              )}>{f}</button>
          ))}
        </div>
      )}

      {!coachId ? (
        <CoachSetupPrompt sectionLabel="Programmes" />
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Aucun programme</p>
          <p className="text-xs text-white/40">Créez votre premier programme sportif.</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <p className="text-sm text-white/40">Aucun programme dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((p) => {
            const totalEx = p.exercises.length
            const totalSets = p.exercises.reduce((a, e) => a + e.sets, 0)
            const status = p.assignedTo.length > 0 ? "Actif" : "Personnalisé"
            return (
              <div key={p.id} onClick={() => setViewDetail(p)}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(200,155,60,0.1)] transition-all duration-300 cursor-pointer">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] opacity-60" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-black" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                      status === "Actif"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#C89B3C]/10 text-[#C89B3C] border-[#C89B3C]/20"
                    )}>{status}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#C89B3C] transition-colors">{p.name}</h3>
                  {p.description && <p className="text-xs text-white/40 line-clamp-2 mb-3">{p.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
                    <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {totalEx} ex. · {totalSets} séries</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedTo.length} client{p.assignedTo.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-3 border-t border-white/5">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(p) }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Modifier">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p) }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Dupliquer">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p) }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Assigner">
                      <Users className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleDelete(p.id, e)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all ml-auto" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
