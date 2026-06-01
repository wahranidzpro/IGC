"use client"

import { useState, useEffect } from "react"
import { Apple, Flame, Utensils, Droplets, Wheat, Beef, Sun, Sunrise, Moon, Sunset, AlertCircle, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface MealItem {
  name: string
  portion: string
}

interface Meal {
  id: string
  name: string
  time: string
  icon: LucideIcon
  calories: number
  protein: number
  carbs: number
  fat: number
  items: MealItem[]
}

const dailyTarget = { calories: 2200, protein: 150, carbs: 250, fat: 65, water: 2.5 }

const sampleMeals: Meal[] = [
  {
    id: "breakfast",
    name: "Petit-déjeuner",
    time: "07:30",
    icon: Sunrise,
    calories: 480,
    protein: 35,
    carbs: 55,
    fat: 12,
    items: [
      { name: "Flocons d'avoine", portion: "80 g" },
      { name: "Banane", portion: "1 unité" },
      { name: "Lait écrémé", portion: "250 ml" },
      { name: "Amandes", portion: "20 g" },
    ],
  },
  {
    id: "lunch",
    name: "Déjeuner",
    time: "12:30",
    icon: Sun,
    calories: 720,
    protein: 50,
    carbs: 75,
    fat: 18,
    items: [
      { name: "Blé complet", portion: "200 g" },
      { name: "Poulet grillé", portion: "180 g" },
      { name: "Légumes verts", portion: "150 g" },
      { name: "Huile d'olive", portion: "15 ml" },
    ],
  },
  {
    id: "snack",
    name: "Collation",
    time: "16:00",
    icon: Sunset,
    calories: 280,
    protein: 20,
    carbs: 30,
    fat: 8,
    items: [
      { name: "Yaourt grec", portion: "200 g" },
      { name: "Fruits rouges", portion: "100 g" },
      { name: "Miel", portion: "15 g" },
    ],
  },
  {
    id: "dinner",
    name: "Dîner",
    time: "20:00",
    icon: Moon,
    calories: 580,
    protein: 45,
    carbs: 50,
    fat: 15,
    items: [
      { name: "Poisson blanc", portion: "200 g" },
      { name: "Riz complet", portion: "150 g" },
      { name: "Salade verte", portion: "100 g" },
      { name: "Avocat", portion: "½ unité" },
    ],
  },
]

export default function NutritionPage() {
  const [meals, setMeals] = useState<Meal[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setMeals(sampleMeals)
        setError(null)
      } catch {
        setError("Impossible de charger le plan nutritionnel")
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Erreur de chargement</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-brand-red font-medium hover:underline flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!meals) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Apple className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucun plan nutritionnel</p>
          <p className="text-sm text-gray-500">Votre plan alimentaire sera disponible ici.</p>
        </div>
      </div>
    )
  }

  const macros = [
    { key: "calories", label: "Calories", value: meals.reduce((a, m) => a + m.calories, 0), target: dailyTarget.calories, unit: "kcal", icon: Flame, color: "bg-orange-500" },
    { key: "protein", label: "Protéines", value: meals.reduce((a, m) => a + m.protein, 0), target: dailyTarget.protein, unit: "g", icon: Beef, color: "bg-red-500" },
    { key: "carbs", label: "Glucides", value: meals.reduce((a, m) => a + m.carbs, 0), target: dailyTarget.carbs, unit: "g", icon: Wheat, color: "bg-blue-500" },
    { key: "fat", label: "Lipides", value: meals.reduce((a, m) => a + m.fat, 0), target: dailyTarget.fat, unit: "g", icon: Droplets, color: "bg-amber-500" },
    { key: "water", label: "Eau", value: 1.8, target: dailyTarget.water, unit: "L", icon: Droplets, color: "bg-cyan-500" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Nutrition</h1>
        <p className="text-sm text-gray-500 mt-0.5">Plan alimentaire personnalisé — Coach Karim</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {macros.map((m) => {
          const pct = Math.min(100, Math.round((m.value / m.target) * 100))
          return (
            <div key={m.key} className="bg-white rounded-2xl border shadow-sm p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${m.color.replace("bg-", "bg-").replace("-500", "-50")} flex items-center justify-center`}>
                  <m.icon className={`w-4 h-4 ${m.color.replace("bg-", "text-")}`} />
                </div>
                <span className={`text-xs font-bold ${pct >= 100 ? "text-green-600" : "text-gray-400"}`}>{pct}%</span>
              </div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-lg font-bold text-brand-black leading-tight">
                {m.value} <span className="text-xs font-normal text-gray-400">{m.unit}</span>
              </p>
              <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : m.color}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Objectif {m.target}{m.unit}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-red/20">
        <div className="flex items-center gap-3 mb-3">
          <Utensils className="w-5 h-5 text-white/70" />
          <p className="text-sm font-medium text-white/80">Répartition calorique</p>
        </div>
        <div className="flex items-center gap-1.5 h-3 rounded-full overflow-hidden bg-white/20">
          {[
            { pct: Math.round((macros[1].value * 4 / macros[0].value) * 100), color: "bg-red-400" },
            { pct: Math.round((macros[2].value * 4 / macros[0].value) * 100), color: "bg-blue-400" },
            { pct: Math.round((macros[3].value * 9 / macros[0].value) * 100), color: "bg-amber-400" },
          ].map((s, i) => (
            <div key={i} className={`${s.color} h-full`} style={{ width: `${s.pct}%` }} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-white/70">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Protéines</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Glucides</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Lipides</span>
        </div>
      </div>

      <div className="space-y-3">
        {meals.map((meal) => (
          <div key={meal.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                  <meal.icon className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-black">{meal.name}</p>
                  <p className="text-xs text-gray-400">{meal.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-black">{meal.calories} <span className="text-xs font-normal text-gray-400">kcal</span></p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                  <span className="text-red-500">{meal.protein}g</span>
                  <span className="text-blue-500">{meal.carbs}g</span>
                  <span className="text-amber-500">{meal.fat}g</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {meal.items.map((item, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-100"
                >
                  {item.name}
                  <span className="text-gray-400 font-medium">{item.portion}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
