"use client"

import { useState } from "react"
import { CalendarDays, Clock, Users, Dumbbell, ChevronRight, Search, Filter } from "lucide-react"

const classes = [
  { name: "CrossFit", coach: "Karim", time: "08:00", duration: "45min", level: "Tous niveaux", spots: 5, icon: Dumbbell },
  { name: "Yoga Flow", coach: "Sophie", time: "09:30", duration: "60min", level: "Intermédiaire", spots: 2, icon: Dumbbell },
  { name: "HIIT", coach: "Ahmed", time: "11:00", duration: "30min", level: "Avancé", spots: 0, icon: Dumbbell },
  { name: "Boxe", coach: "Redouane", time: "17:00", duration: "60min", level: "Tous niveaux", spots: 8, icon: Dumbbell },
  { name: "Pilates", coach: "Inès", time: "18:30", duration: "50min", level: "Débutant", spots: 3, icon: Users },
  { name: "Musculation", coach: "Karim", time: "20:00", duration: "60min", level: "Intermédiaire", spots: 1, icon: Dumbbell },
]

export default function BookingPage() {
  const [selectedDay, setSelectedDay] = useState("Aujourd'hui")
  const days = ["Aujourd'hui", "Demain", "Mer 3", "Jeu 4", "Ven 5", "Sam 6"]

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-brand-red via-red-700 to-brand-black px-5 pt-6 pb-16 text-white">
        <h1 className="text-xl font-bold">Réservation</h1>
        <p className="text-sm text-white/70 mt-1">Cours collectifs & coaching</p>
      </div>

      <div className="px-4 -mt-10 relative z-10 space-y-4 pb-28">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedDay === day
                  ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                  : "glass text-gray-400 border border-white/10 hover:border-brand-red/30"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
            />
          </div>
          <button className="p-2.5 rounded-xl glass border border-white/10 text-gray-400 hover:border-brand-red/30">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {classes.map((c, i) => (
            <div key={i} className="glass-strong rounded-2xl border border-white/10 p-4 glass-card-hover">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.coach}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.time}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{c.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{c.level}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      c.spots > 3 ? "text-green-400 bg-green-500/10" : c.spots > 0 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"
                    }`}>
                      {c.spots > 0 ? `${c.spots} place${c.spots > 1 ? "s" : ""}` : "Complet"}
                    </span>
                  </div>
                </div>
                <button
                  disabled={c.spots === 0}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    c.spots > 0
                      ? "bg-brand-red text-white hover:bg-red-700 active:scale-95"
                      : "bg-white/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {c.spots > 0 ? "Réserver" : "Complet"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
