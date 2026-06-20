"use client"

import { useState } from "react"
import { Medal } from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"

const tabs = ["Défis", "Badges", "Classement"]

const challenges = [
  { name: "10 séances / mois", current: 7, target: 10, unit: "séances", reward: "Shaker IGC", color: "#0A84FF" },
  { name: "5000 kcal brûlées", current: 2450, target: 5000, unit: "kcal", reward: "Serviette IGC", color: "#FF6B35" },
  { name: "50 km cardio", current: 28, target: 50, unit: "km", reward: "Gourde IGC", color: "#10B981" },
]

const badges = [
  { name: "Débutant", icon: "🏅", earned: true, desc: "5 séances" },
  { name: "Régulier", icon: "🏅", earned: true, desc: "25 séances" },
  { name: "Athlète", icon: "🏅", earned: false, desc: "50 séances" },
  { name: "Légende", icon: "🏅", earned: false, desc: "100 séances" },
]

export default function DefisPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
    >
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <h1 className="text-lg font-bold text-white">Défis</h1>
        <p className="text-xs text-gray-400 mt-0.5">Relevez des défis et gagnez des récompenses</p>
      </div>

      <div className="px-4 mt-4">
        <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-2.5 text-xs font-bold transition-all duration-200"
              style={{
                background: activeTab === i ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.03)",
                color: activeTab === i ? "#0A84FF" : "rgba(255,255,255,0.4)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 && (
        <div className="px-4 mt-5 space-y-4 pb-28">
          {challenges.map((c) => {
            const pct = Math.round((c.current / c.target) * 100)
            return (
              <div
                key={c.name}
                className="rounded-[20px] p-5 border"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <span className="text-xs font-bold" style={{ color: c.color }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: c.color }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-400">{c.current}/{c.target} {c.unit}</span>
                  <span className="text-[10px] text-gray-400">🎁 {c.reward}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 1 && (
        <div className="px-4 mt-5 pb-28">
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
                <div className="text-3xl mb-2">{b.earned ? b.icon : "🔒"}</div>
                <p className="text-[10px] font-bold text-white">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="px-4 mt-5 space-y-2 pb-28">
          {[1, 2, 3, 4, 5].map((pos) => (
            <div
              key={pos}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
              style={{
                background: pos <= 3 ? "rgba(10,132,255,0.06)" : "rgba(255,255,255,0.02)",
                borderLeft: pos <= 3 ? "3px solid #0A84FF" : "3px solid transparent",
              }}
            >
              <span className="w-6 text-center text-sm font-black" style={{ color: pos <= 3 ? "#0A84FF" : "rgba(255,255,255,0.3)" }}>
                #{pos}
              </span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#C89B3C] flex items-center justify-center text-xs font-bold text-white">
                {["K", "S", "A", "M", "L"][pos - 1]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{
                  ["Karim B.", "Sophie M.", "Ahmed R.", "Marie K.", "Lucas P."][pos - 1]
                }</p>
                <p className="text-[10px] text-gray-400">{120 - (pos - 1) * 15} séances</p>
              </div>
              <Medal className="w-5 h-5" style={{ color: pos === 1 ? "#FFD700" : pos === 2 ? "#C0C0C0" : pos === 3 ? "#CD7F32" : "rgba(255,255,255,0.1)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
