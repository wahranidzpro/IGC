"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import {
  Apple, Plus, AlertCircle, RefreshCw, ChevronRight, Save,
  Users, Trash2, X, Sunrise, Sun, Sunset, Moon, Flame,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NutritionProgram, Profile } from "@/types"

interface MemberOption {
  id: string
  name: string
}

const mealIcons: Record<string, LucideIcon> = { breakfast: Sunrise, lunch: Sun, snack: Sunset, dinner: Moon }

const emptyItem = { name: "", portion: "" }

function MealIcon({ id }: { id: string }) {
  const Icon = mealIcons[id] || Sun
  return <Icon className="w-4 h-4 text-brand-red" />
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
    meals: [] as { id: string; name: string; time: string; items: { name: string; portion: string }[] }[],
    assignedTo: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [viewDetail, setViewDetail] = useState<NutritionProgram | null>(null)

  const initMeals = () => [
    { id: "breakfast", name: "Petit-déjeuner", time: "07:30", items: [{ ...emptyItem }] },
    { id: "lunch", name: "Déjeuner", time: "12:30", items: [{ ...emptyItem }] },
    { id: "snack", name: "Collation", time: "16:00", items: [{ ...emptyItem }] },
    { id: "dinner", name: "Dîner", time: "20:00", items: [{ ...emptyItem }] },
  ]

  useEffect(() => {
    if (!formData.meals.length && showForm) {
      setFormData((f) => ({ ...f, meals: initMeals() }))
    }
  }, [showForm, formData.meals.length])

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
    setFormData((f) => ({ ...f, meals: [...f.meals, { id, name: "Repas", time: "12:00", items: [{ ...emptyItem }] }] }))
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

  const saveProgram = async () => {
    if (!coachId || !formData.name) return
    setSaving(true)
    try {
      const supabase = createClient()
      const meals = formData.meals.filter((m) => m.name).map((m) => ({
        name: m.name, time: m.time,
        items: m.items.filter((it) => it.name),
        calories: 0, protein: 0, carbs: 0, fat: 0,
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

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />)}
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
    const totalCal = viewDetail.meals.reduce((a, m) => a + m.calories, 0)
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <button onClick={() => setViewDetail(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-black">
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour
        </button>
        <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold">{viewDetail.name}</h2>
          {viewDetail.description && <p className="text-sm text-white/70 mt-1">{viewDetail.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-white/60">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {totalCal} kcal</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {viewDetail.assignedTo.length} assigné{viewDetail.assignedTo.length > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="space-y-3">
          {viewDetail.meals.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-red/10 flex items-center justify-center">
                    <MealIcon id={m.name} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-black">{m.name}</p>
                    <p className="text-[10px] text-gray-400">{m.time}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-black">{m.calories} <span className="text-xs font-normal text-gray-400">kcal</span></span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.items.map((it, j) => (
                  <span key={j} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border">{it.name} <span className="text-gray-400">{it.portion}</span></span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Nouveau plan nutritionnel</h1>
          <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-brand-black">Annuler</button>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Nom du plan</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Ex: Prise de masse" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" rows={2} />
          </div>
        </div>

        <div className="space-y-3">
          {formData.meals.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-red/10 flex items-center justify-center">
                    <MealIcon id={m.id} />
                  </div>
                  <input type="text" value={m.name} onChange={(e) => updateMeal(i, "name", e.target.value)}
                    className="text-sm font-bold text-brand-black bg-transparent outline-none border-b border-transparent focus:border-gray-200 w-32" />
                  <input type="time" value={m.time} onChange={(e) => updateMeal(i, "time", e.target.value)}
                    className="text-xs text-gray-400 bg-transparent outline-none" />
                </div>
                {formData.meals.length > 1 && (
                  <button onClick={() => removeMeal(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              {m.items.map((it, j) => (
                <div key={j} className="flex gap-2">
                  <input type="text" value={it.name} onChange={(e) => updateItem(i, j, "name", e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Aliment" />
                  <input type="text" value={it.portion} onChange={(e) => updateItem(i, j, "portion", e.target.value)}
                    className="w-24 px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Portion" />
                  {m.items.length > 1 && (
                    <button onClick={() => removeItem(i, j)} className="text-red-400"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem(i)} className="text-xs font-medium text-brand-red flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter un aliment</button>
            </div>
          ))}
          <button onClick={addMeal} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-brand-red/30 hover:text-brand-red transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter un repas
          </button>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-brand-black mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-brand-red" /> Assigner à</h3>
          {members.length === 0 ? <p className="text-sm text-gray-500">Aucun adhérent disponible</p> : (
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
          {saving ? "Enregistrement..." : <><Save className="w-4 h-4" /> Créer le plan</>}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Programmes nutritionnels</h1>
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
          <p className="text-xs text-gray-500">Complétez votre profil dans Mon profil.</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Apple className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucun plan nutritionnel</p>
          <p className="text-xs text-gray-500">Créez votre premier plan nutritionnel.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((p) => {
            const totalCal = p.meals.reduce((a: number, m: { calories: number }) => a + m.calories, 0)
            return (
              <button key={p.id} onClick={() => setViewDetail(p)}
                className="w-full bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                      <Apple className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-black">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.meals.length} repas · {totalCal} kcal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{p.assignedTo.length} assigné{p.assignedTo.length > 1 ? "s" : ""}</span>
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
