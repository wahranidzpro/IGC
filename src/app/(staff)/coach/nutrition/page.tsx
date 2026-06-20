"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import {
  Apple, Plus, AlertCircle, RefreshCw, ChevronRight, Save,
  Users, Trash2, X, Sunrise, Sun, Sunset, Moon, Flame,
  Edit2, Copy,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NutritionProgram, Profile } from "@/types"
import { cn } from "@/lib/utils"
import CoachSetupPrompt from "@/components/coach/CoachSetupPrompt"

interface MemberOption { id: string; name: string }

const mealIcons: Record<string, LucideIcon> = { breakfast: Sunrise, lunch: Sun, snack: Sunset, dinner: Moon }

const emptyItem = { name: "", portion: "" }

const initMeals = () => [
    { id: "breakfast", name: "Petit-déjeuner", time: "07:30", calories: 0, protein: 0, carbs: 0, fat: 0, items: [{ ...emptyItem }] },
    { id: "lunch", name: "Déjeuner", time: "12:30", calories: 0, protein: 0, carbs: 0, fat: 0, items: [{ ...emptyItem }] },
    { id: "snack", name: "Collation", time: "16:00", calories: 0, protein: 0, carbs: 0, fat: 0, items: [{ ...emptyItem }] },
    { id: "dinner", name: "Dîner", time: "20:00", calories: 0, protein: 0, carbs: 0, fat: 0, items: [{ ...emptyItem }] },
  ]

function MealIcon({ id }: { id: string }) {
  const nameToId: Record<string, string> = {
    "Petit-déjeuner": "breakfast",
    "Déjeuner": "lunch",
    Collation: "snack",
    Dîner: "dinner",
  }
  const resolvedId = nameToId[id] || id
  const Icon = mealIcons[resolvedId] || Sun
  return <Icon className="w-4 h-4 text-black" />
}

const MACRO_TARGETS = { calories: 2000, protein: 150, carbs: 250, fat: 65 }

const macroLabels: Record<string, string> = {
  calories: "Calories",
  protein: "Protéines",
  carbs: "Glucides",
  fat: "Lipides",
}

const macroUnits: Record<string, string> = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
}

export default function NutritionPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<NutritionProgram[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberOption[]>([])

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    meals: [] as {
      id: string
      name: string
      time: string
      items: { name: string; portion: string }[]
      calories: number
      protein: number
      carbs: number
      fat: number
    }[],
    assignedTo: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [viewDetail, setViewDetail] = useState<NutritionProgram | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      try {
        if (!user) return
        const uid = user.id
        const { data: cData } = await supabase.from("coaches").select("*").eq("profile_id", uid as string).maybeSingle()
        const cId = mapRow<{ id: string }>(cData as unknown as Record<string, unknown> | null)?.id
        if (!cId) return
        setCoachId(cId)

        const [progRes, mcRes, pRes] = await Promise.all([
          supabase.from("nutrition_programs").select("*").eq("coach_id", cId).order("created_at", { ascending: false }),
          supabase.from("member_coaches").select("member_id").eq("coach_id", cId).eq("is_active", true),
          supabase.from("profiles").select("id, first_name, last_name"),
        ])

        setPrograms(mapRows<NutritionProgram>(progRes.data) || [])
        const memberIds = ((mcRes.data as { member_id: string }[]) || []).map((m) => m.member_id)
        const allProfiles = (mapRows<Profile>(pRes.data) || []).reduce((acc, p) => {
          acc[p.id] = `${p.firstName} ${p.lastName}`; return acc
        }, {} as Record<string, string>)

        if (memberIds.length > 0) {
          const { data: mData } = await supabase.from("members").select("id, profile_id").in("id", memberIds)
          setMembers(((mData as { id: string; profile_id: string }[]) || []).map((m) => ({
            id: m.id, name: allProfiles[m.profile_id] || "Inconnu",
          })))
        }
      } catch {
        setError("Impossible de charger les programmes nutritionnels")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const addMeal = () => {
    const id = `meal_${Date.now()}`
    setFormData((f) => ({ ...f, meals: [...f.meals, { id, name: "Repas", time: "12:00", calories: 0, protein: 0, carbs: 0, fat: 0, items: [{ ...emptyItem }] }] }))
  }

  const removeMeal = (idx: number) => {
    setFormData((f) => ({ ...f, meals: f.meals.filter((_, i) => i !== idx) }))
  }

  const addItem = (mealIdx: number) => {
    setFormData((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === mealIdx ? { ...m, items: [...m.items, { ...emptyItem }] } : m)),
    }))
  }

  const removeItem = (mealIdx: number, itemIdx: number) => {
    setFormData((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === mealIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m)),
    }))
  }

  const updateMeal = (idx: number, field: string, value: string) => {
    setFormData((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }))
  }

  const updateMealNumber = (idx: number, field: string, value: string) => {
    setFormData((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === idx ? { ...m, [field]: parseInt(value) || 0 } : m)),
    }))
  }

  const updateItem = (mealIdx: number, itemIdx: number, field: string, value: string) => {
    setFormData((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === mealIdx ? {
        ...m,
        items: m.items.map((it, j) => (j === itemIdx ? { ...it, [field]: value } : it)),
      } : m)),
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

  const handleEdit = (p: NutritionProgram) => {
    setFormData({
      name: p.name,
      description: p.description || "",
      meals: p.meals.map((m) => ({
        id: m.name.toLowerCase().replace(/\s/g, "_"),
        name: m.name,
        time: m.time,
        items: m.items.length > 0 ? m.items : [{ ...emptyItem }],
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
      })),
      assignedTo: p.assignedTo,
    })
    setShowForm(true)
  }

  const handleDuplicate = (p: NutritionProgram) => {
    setFormData({
      name: `${p.name} (copie)`,
      description: p.description || "",
      meals: initMeals(),
      assignedTo: [],
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Supprimer ce plan nutritionnel ?")) return
    const supabase = createClient()
    await supabase.from("nutrition_programs").delete().eq("id", id)
    setPrograms((prev) => prev.filter((p) => p.id !== id))
  }

  const saveProgram = async () => {
    if (!coachId || !formData.name) return
    setSaving(true)
    try {
      const supabase = createClient()
      const meals = formData.meals.filter((m) => m.name).map((m) => ({
        name: m.name, time: m.time,
        calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
        items: m.items.filter((it) => it.name),
      }))

      const { data, error: err } = await supabase
        .from("nutrition_programs")
        .insert({
          coach_id: coachId,
          name: formData.name,
          description: formData.description || null,
          meals,
          assigned_to: formData.assignedTo,
        } as never)
        .select()
        .maybeSingle()

      if (err) throw err
      if (data) {
        setPrograms((prev) => [mapRow<NutritionProgram>(data)!, ...prev])
        setShowForm(false)
        setFormData({ name: "", description: "", meals: [], assignedTo: [] })
      }
    } catch { setError("Erreur lors de la création") }
    finally { setSaving(false) }
  }

  const totalMacros = formData.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse backdrop-blur-xl" />
        <div className="h-12 bg-white/5 rounded-xl animate-pulse backdrop-blur-xl" />
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
    const totalCal = viewDetail.meals.reduce((a, m) => a + m.calories, 0)
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <button onClick={() => setViewDetail(null)} className="flex items-center gap-1 text-sm text-white/50 hover:text-[#C89B3C] transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour
        </button>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center">
              <Apple className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{viewDetail.name}</h2>
              {viewDetail.description && <p className="text-sm text-white/50 mt-0.5">{viewDetail.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs text-white/40">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {totalCal} kcal</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {viewDetail.assignedTo.length} assigné{viewDetail.assignedTo.length > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="space-y-3">
          {viewDetail.meals.map((m, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center">
                    <MealIcon id={m.name} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{m.name}</p>
                    <p className="text-[10px] text-white/30">{m.time}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#C89B3C]">{m.calories} <span className="text-xs font-normal text-white/30">kcal</span></span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.items.map((it, j) => (
                  <span key={j} className="text-xs bg-white/5 border border-white/10 text-white/50 px-2.5 py-1.5 rounded-lg">{it.name} <span className="text-white/30">{it.portion}</span></span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderForm = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 overflow-y-auto">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
        <div className="relative w-full max-w-2xl mx-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" />
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">Nouveau plan nutritionnel</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Nom du plan</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Ex: Prise de masse" />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" rows={2} />
              </div>
            </div>

            {(formData.meals.length > 0) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3">Macros totaux</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["calories", "protein", "carbs", "fat"] as const).map((key) => {
                    const val = totalMacros[key]
                    const target = key === "calories" ? MACRO_TARGETS.calories
                      : key === "protein" ? MACRO_TARGETS.protein
                      : key === "carbs" ? MACRO_TARGETS.carbs
                      : MACRO_TARGETS.fat
                    const pct = Math.min((val / target) * 100, 100)
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-white/40">{macroLabels[key]}</span>
                          <span className="text-[10px] text-[#C89B3C] font-bold">{val}/{target} {macroUnits[key]}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {formData.meals.map((m, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center shrink-0">
                        <MealIcon id={m.id} />
                      </div>
                      <input type="text" value={m.name} onChange={(e) => updateMeal(i, "name", e.target.value)}
                        className="text-sm font-bold text-white bg-transparent outline-none border-b border-transparent focus:border-[#C89B3C]/30 w-32" />
                      <input type="time" value={m.time} onChange={(e) => updateMeal(i, "time", e.target.value)}
                        className="text-xs text-white/30 bg-transparent outline-none" />
                    </div>
                    {formData.meals.length > 1 && (
                      <button onClick={() => removeMeal(i)} className="text-red-400/60 hover:text-red-400 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-white/30">Calories</label>
                      <input type="number" value={m.calories} onChange={(e) => updateMealNumber(i, "calories", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30">Protéines</label>
                      <input type="number" value={m.protein} onChange={(e) => updateMealNumber(i, "protein", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30">Glucides</label>
                      <input type="number" value={m.carbs} onChange={(e) => updateMealNumber(i, "carbs", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30">Lipides</label>
                      <input type="number" value={m.fat} onChange={(e) => updateMealNumber(i, "fat", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all" />
                    </div>
                  </div>

                  {m.items.map((it, j) => (
                    <div key={j} className="flex gap-2">
                      <input type="text" value={it.name} onChange={(e) => updateItem(i, j, "name", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Aliment" />
                      <input type="text" value={it.portion} onChange={(e) => updateItem(i, j, "portion", e.target.value)}
                        className="w-24 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Portion" />
                      {m.items.length > 1 && (
                        <button onClick={() => removeItem(i, j)} className="text-red-400/60 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addItem(i)} className="text-xs font-medium text-[#C89B3C] flex items-center gap-1 hover:text-[#D4AF37] transition-colors"><Plus className="w-3 h-3" /> Ajouter un aliment</button>
                </div>
              ))}
              <button onClick={addMeal} className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-sm text-white/40 hover:border-[#C89B3C]/30 hover:text-[#C89B3C] transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Ajouter un repas
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[#C89B3C]" /> Assigner à</h3>
              {members.length === 0 ? <p className="text-sm text-white/40">Aucun adhérent disponible</p> : (
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
              {saving ? "Enregistrement..." : <><Save className="w-4 h-4" /> Créer le plan</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      {showForm && renderForm()}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
            Nutrition
          </h1>
          <p className="text-sm text-white/40 mt-1">Plans alimentaires et suivi nutritionnel</p>
        </div>
        {coachId && <button onClick={() => { setFormData((f) => f.meals.length ? f : { ...f, meals: initMeals() }); setShowForm(true); }} className="flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20">
          <Plus className="w-4 h-4" /> Créer un Plan
        </button>}
      </div>

      {!coachId ? (
        <CoachSetupPrompt sectionLabel="Nutrition" />
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Apple className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Aucun plan nutritionnel</p>
          <p className="text-xs text-white/40">Créez votre premier plan nutritionnel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => {
            const totalCal = p.meals.reduce((a: number, m: { calories: number }) => a + m.calories, 0)
            return (
              <div key={p.id} onClick={() => setViewDetail(p)}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(200,155,60,0.1)] transition-all duration-300 cursor-pointer">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] opacity-60" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center shrink-0">
                      <Apple className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-[10px] font-bold bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C]/20 px-2.5 py-1 rounded-full">
                      {p.meals.length} repas
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#C89B3C] transition-colors">{p.name}</h3>
                  {p.description && <p className="text-xs text-white/40 line-clamp-2 mb-3">{p.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {totalCal} kcal</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedTo.length} client{p.assignedTo.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-3 border-t border-white/5">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(p) }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Modifier">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p) }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Dupliquer">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(p) }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Assigner">
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
