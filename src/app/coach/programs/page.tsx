"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import {
  ClipboardList, Plus, Dumbbell, AlertCircle, RefreshCw,
  ChevronRight, X, Save, Trash2, Users, Clock,
} from "lucide-react"
import type { WorkoutProgram, Profile } from "@/types"

interface MemberOption {
  id: string
  name: string
}

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

        const [progRes, mcRes, pRes] = await Promise.all([
          supabase.from("workout_programs").select("*").eq("coachId", cId).order("createdAt", { ascending: false }),
          supabase.from("member_coaches").select("memberId").eq("coachId", cId).eq("isActive", true),
          supabase.from("profiles").select("id, firstName, lastName"),
        ])

        setPrograms((progRes.data as unknown as WorkoutProgram[]) || [])

        const memberIds = ((mcRes.data as { memberId: string }[]) || []).map((m) => m.memberId)
        const allProfiles = ((pRes.data as Profile[]) || []).reduce((acc, p) => {
          acc[p.id] = `${p.firstName} ${p.lastName}`; return acc
        }, {} as Record<string, string>)
        setMemberProfiles(allProfiles)

        if (memberIds.length > 0) {
          const { data: mData } = await supabase.from("members").select("id, profileId").in("id", memberIds)
          const mList = ((mData as { id: string; profileId: string }[]) || []).map((m) => ({
            id: m.id,
            name: allProfiles[m.profileId] || "Inconnu",
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

  const saveProgram = async () => {
    if (!coachId || !formData.name) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from("workout_programs")
        .insert({
          coachId,
          name: formData.name,
          description: formData.description || null,
          exercises: formData.exercises,
          assignedTo: formData.assignedTo,
        } as never)
        .select()
        .single()

      if (err) throw err
      if (data) {
        setPrograms((prev) => [data as unknown as WorkoutProgram, ...prev])
        setFormData({ name: "", description: "", exercises: [{ name: "", sets: 4, reps: "10-12", weight: "", rest: "60s", notes: "" }], assignedTo: [] })
        setShowForm(false)
      }
    } catch {
      setError("Erreur lors de la création du programme")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
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

  if (viewDetail) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <button onClick={() => setViewDetail(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-black">
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour
        </button>

        <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold">{viewDetail.name}</h2>
          {viewDetail.description && <p className="text-sm text-white/70 mt-1">{viewDetail.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-white/60">
            <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {viewDetail.exercises.length} exercices</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {viewDetail.assignedTo.length} adhérent{viewDetail.assignedTo.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="space-y-2">
          {viewDetail.exercises.map((ex, i) => (
            <div key={i} className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-brand-black">{ex.name}</p>
                <span className="text-[10px] font-bold text-gray-400">{ex.sets} × {ex.reps}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {ex.weight && <span>Charge: <strong>{ex.weight}</strong></span>}
                {ex.rest && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ex.rest}</span>}
              </div>
              {ex.notes && <p className="text-xs text-gray-400 mt-1 italic">{ex.notes}</p>}
            </div>
          ))}
        </div>

        {viewDetail.assignedTo.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <h3 className="text-sm font-bold text-brand-black mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-brand-red" /> Assigné à</h3>
            <div className="flex flex-wrap gap-2">
              {viewDetail.assignedTo.map((mid) => {
                const m = members.find((m) => m.id === mid)
                return <span key={mid} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{m?.name || "Inconnu"}</span>
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Nouveau programme</h1>
          <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-brand-black">Annuler</button>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Nom du programme</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Ex: Prise de masse" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" rows={3} placeholder="Objectifs, notes..." />
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-50">
            <h3 className="text-sm font-bold text-brand-black">Exercices ({formData.exercises.length})</h3>
            <button onClick={addExercise} className="text-xs font-bold text-brand-red flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
          </div>
          <div className="divide-y divide-gray-50">
            {formData.exercises.map((ex, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Exercice {i + 1}</span>
                  {formData.exercises.length > 1 && (
                    <button onClick={() => removeExercise(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
                <input type="text" value={ex.name} onChange={(e) => updateExercise(i, "name", e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Nom de l'exercice" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">Séries</label>
                    <input type="number" value={ex.sets} onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Répétitions</label>
                    <input type="text" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="10-12" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Charge</label>
                    <input type="text" value={ex.weight} onChange={(e) => updateExercise(i, "weight", e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="60 kg" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Repos</label>
                    <input type="text" value={ex.rest} onChange={(e) => updateExercise(i, "rest", e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="60s" />
                  </div>
                </div>
                <input type="text" value={ex.notes} onChange={(e) => updateExercise(i, "notes", e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Notes (optionnel)" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-brand-black mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-brand-red" /> Assigner à</h3>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun adhérent disponible</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button key={m.id} onClick={() => toggleMember(m.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    formData.assignedTo.includes(m.id) ? "bg-brand-red text-white border-brand-red" : "bg-white text-gray-600 border-gray-200 hover:border-brand-red/30"
                  }`}>{m.name}</button>
              ))}
            </div>
          )}
        </div>

        <button onClick={saveProgram} disabled={saving || !formData.name}
          className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
          {saving ? "Enregistrement..." : <><Save className="w-4 h-4" /> Créer le programme</>}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Programmes sportifs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{programs.length} programme{programs.length > 1 ? "s" : ""}</p>
        </div>
        {coachId && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-red text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
          <Plus className="w-4 h-4" /> Nouveau
        </button>}
      </div>

      {!coachId ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Profil coach requis</p>
          <p className="text-xs text-gray-500">Complétez votre profil dans Mon profil pour créer des programmes.</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucun programme</p>
          <p className="text-xs text-gray-500">Créez votre premier programme sportif.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((p) => {
            const totalEx = p.exercises.length
            const totalSets = p.exercises.reduce((a, e) => a + e.sets, 0)
            return (
              <button key={p.id} onClick={() => setViewDetail(p)}
                className="w-full bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-black">{p.name}</p>
                      <p className="text-xs text-gray-500">{totalEx} exercices · {totalSets} séries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      {p.assignedTo.length} assigné{p.assignedTo.length > 1 ? "s" : ""}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
