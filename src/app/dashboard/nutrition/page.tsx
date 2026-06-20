"use client"

import { Flame, Beef, Wheat, Droplets } from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"

const macros = [
  { label: "Calories", value: "1 850", target: "2 200", unit: "kcal", icon: Flame, color: "#FF6B35" },
  { label: "Protéines", value: "120", target: "150", unit: "g", icon: Beef, color: "#0A84FF" },
  { label: "Glucides", value: "200", target: "250", unit: "g", icon: Wheat, color: "#C89B3C" },
  { label: "Lipides", value: "45", target: "65", unit: "g", icon: Droplets, color: "#10B981" },
]

const meals = [
  { name: "Petit-déjeuner", time: "07:30", calories: 450, items: ["Flocons d'avoine", "Banane, miel, amandes"], color: "#0A84FF" },
  { name: "Déjeuner", time: "12:30", calories: 680, items: ["Poulet grillé, riz", "Brocoli, huile d'olive"], color: "#10B981" },
  { name: "Collation", time: "16:00", calories: 250, items: ["Yaourt grec", "Fruits rouges, granola"], color: "#C89B3C" },
  { name: "Dîner", time: "20:00", calories: 470, items: ["Saumon, patate douce", "Salade verte"], color: "#A855F7" },
]

export default function NutritionPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <h1 className="text-lg font-bold text-white">Nutrition</h1>
        <p className="text-xs text-gray-400 mt-0.5">Aujourd&apos;hui</p>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-[20px] p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-2 gap-4">
            {macros.map((m) => {
              const pct = Math.round((parseInt(m.value.replace(/\s/g, "")) / parseInt(m.target)) * 100)
              return (
                <div key={m.label}>
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </div>
                  <p className="text-lg font-black text-white">{m.value}</p>
                  <p className="text-[10px] text-gray-500">/ {m.target} {m.unit}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: m.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-28 space-y-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mb-2 px-1">REPAS</h3>
        {meals.map((meal) => (
          <div
            key={meal.name}
            className="rounded-[20px] p-4 flex items-center gap-4 border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${meal.color}15` }}>
              {meal.name === "Petit-déjeuner" ? "🌅" : meal.name === "Déjeuner" ? "☀️" : meal.name === "Collation" ? "⚡" : "🌙"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{meal.name}</p>
                <span className="text-xs font-bold text-white">{meal.calories} kcal</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{meal.time}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {meal.items.map((item) => (
                  <span key={item} className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
