"use client"

import { useRouter } from "next/navigation"
import { Flame, TrendingUp, Target } from "lucide-react"
import type { Gender } from "./theme"

interface BlocProgrèsProps {
  gender: Gender
  sessionsThisMonth: number
  progressPct: number
  goalsCount: number
}

export default function BlocProgrès({ gender, sessionsThisMonth, progressPct, goalsCount }: BlocProgrèsProps) {
  const router = useRouter()
  const primary = gender === "male" ? "#0A84FF" : gender === "female" ? "#10B981" : "#7C3AED"

  const items = [
    { icon: Flame, value: sessionsThisMonth, label: "Séances", unit: "ce mois-ci", color: "#FF6B35" },
    { icon: TrendingUp, value: `+${progressPct}%`, label: "Progrès", unit: "ce mois-ci", color: primary },
    { icon: Target, value: goalsCount, label: "Objectifs", unit: "en cours", color: "#C89B3C" },
  ]

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">MES PROGRÈS</h3>
        <button
          onClick={() => router.push("/dashboard/progress")}
          className="text-[10px] font-bold"
          style={{ color: primary }}
        >
          VOIR PLUS &gt;
        </button>
      </div>

      <button onClick={() => router.push("/dashboard/progress")} className="w-full rounded-[20px] p-4 border text-left transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.04]" style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
        cursor: "pointer",
      }}>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${item.color}15` }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <p className="text-lg font-black text-white">{item.value}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{item.label}</p>
              <p className="text-[8px] text-gray-500">{item.unit}</p>
            </div>
          ))}
        </div>
      </button>
    </div>
  )
}
