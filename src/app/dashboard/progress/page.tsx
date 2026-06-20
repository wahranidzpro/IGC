"use client"

import { Flame, Clock, Dumbbell, TrendingUp } from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"

const kpis = [
  { icon: Dumbbell, value: "12", label: "Séances", color: "#0A84FF" },
  { icon: Flame, value: "3 200", label: "Calories", color: "#FF6B35" },
  { icon: Clock, value: "6h30", label: "Durée", color: "#10B981" },
]

const weightData = [
  { week: "S-8", poids: 82.5 },
  { week: "S-6", poids: 81.0 },
  { week: "S-4", poids: 79.5 },
  { week: "S-2", poids: 78.4 },
  { week: "S-0", poids: 78.0 },
]

const badges = [
  { name: "10 séances", earned: true, emoji: "🏅" },
  { name: "25 séances", earned: true, emoji: "🏅" },
  { name: "50 séances", earned: false, emoji: "🔒" },
  { name: "100 séances", earned: false, emoji: "🔒" },
]

export default function ProgressPage() {
  const maxWeight = Math.max(...weightData.map((w) => w.poids))
  const minWeight = Math.min(...weightData.map((w) => w.poids))
  const range = maxWeight - minWeight || 1

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <h1 className="text-lg font-bold text-white">Mes Progrès</h1>
        <p className="text-xs text-gray-400 mt-0.5">Cette semaine</p>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-[20px] p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-3 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${k.color}15` }}>
                  <k.icon className="w-5 h-5" style={{ color: k.color }} />
                </div>
                <p className="text-lg font-black text-white">{k.value}</p>
                <p className="text-[10px] text-gray-400">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mb-3 px-1">ÉVOLUTION DU POIDS</h3>
        <div className="rounded-[20px] p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
            {weightData.map((d, i) => {
              const heightPct = ((d.poids - minWeight) / range) * 80 + 10
              return (
                <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-white">{d.poids}</span>
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, #0A84FF, #0066CC)`,
                      opacity: 0.6 + (i / weightData.length) * 0.4,
                    }}
                  />
                  <span className="text-[9px] text-gray-500 mt-1">{d.week}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
            <span>{minWeight} kg</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>{maxWeight} kg</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-28" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mb-3 px-1">BADGES</h3>
        <div className="grid grid-cols-4 gap-3">
          {badges.map((b) => (
            <div
              key={b.name}
              className="rounded-2xl p-4 text-center border"
              style={{
                background: b.earned ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                borderColor: b.earned ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
                opacity: b.earned ? 1 : 0.5,
              }}
            >
              <div className="text-3xl mb-2">{b.emoji}</div>
              <p className="text-[10px] font-bold text-white leading-tight">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
