"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MapPin, Users, Clock } from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"

const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]

const classes = [
  { time: "09:00", name: "CROSS TRAINING", duration: "45 min", coach: "Karim", spots: 5, total: 20, image: "/images/cross-training.jpg" },
  { time: "10:30", name: "YOGA FLOW", duration: "60 min", coach: "Inès", spots: 2, total: 15, image: "/images/cours-collectifs.jpg" },
  { time: "14:00", name: "HIIT", duration: "30 min", coach: "Ahmed", spots: 0, total: 12, image: "/images/cardio.jpg" },
  { time: "17:00", name: "BOXING", duration: "60 min", coach: "Redouane", spots: 8, total: 16, image: "/images/boxing.jpg" },
  { time: "18:30", name: "PILATES", duration: "50 min", coach: "Myriam", spots: 3, total: 14, image: "/images/bien-etre.jpg" },
]

const filters = ["Tous", "Cardio", "Force", "Yoga", "Boxe"]

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(3)
  const [activeFilter, setActiveFilter] = useState("Tous")

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
    >
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <h1 className="text-lg font-bold text-white">Planning</h1>
        <p className="text-xs text-gray-400 mt-0.5">Réservez vos cours</p>
      </div>

      <div className="px-4 mt-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-[400px]">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-200"
              style={{
                background: selectedDay === i ? "#0A84FF" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedDay === i ? "rgba(10,132,255,0.5)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: selectedDay === i ? "white" : "rgba(255,255,255,0.4)" }}>
                {day}
              </span>
              <span className="text-lg font-black" style={{ color: selectedDay === i ? "white" : "rgba(255,255,255,0.7)" }}>
                {10 + i}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={{
              background: activeFilter === f ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.04)",
              color: activeFilter === f ? "#0A84FF" : "rgba(255,255,255,0.5)",
              border: `1px solid ${activeFilter === f ? "rgba(10,132,255,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3 pb-28">
        {classes.map((c) => {
          const full = c.spots === 0
          return (
            <div
              key={`${c.time}-${c.name}`}
              className="relative rounded-[20px] overflow-hidden border"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${c.image})` }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,21,59,0.95) 0%, rgba(8,21,59,0.7) 100%)" }} />

              <div className="relative flex items-center p-4 gap-4">
                <div className="min-w-[60px] text-center">
                  <p className="text-lg font-black text-white">{c.time}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{c.duration}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />{c.coach}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(c.total - c.spots) / c.total * 100}%`,
                          background: full ? "rgba(255,77,77,0.6)" : "rgba(16,185,129,0.6)",
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${full ? "text-red-400" : "text-green-400"}`}>
                      {full ? "COMPLET" : `${c.spots} places`}
                    </span>
                  </div>
                </div>

                <button
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{
                    background: full ? "rgba(255,77,77,0.1)" : "rgba(10,132,255,0.1)",
                    borderColor: full ? "rgba(255,77,77,0.2)" : "rgba(10,132,255,0.2)",
                  }}
                  disabled={full}
                >
                  <span className={`text-lg ${full ? "text-red-400" : "text-white"}`}>
                    {full ? "✕" : "→"}
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
