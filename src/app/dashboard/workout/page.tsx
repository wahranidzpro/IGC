"use client"

import { useEffect, useState } from "react"
import { Dumbbell, Plus, Clock, Check, Play, ChevronRight, Flag, Zap, AlertCircle, RefreshCw } from "lucide-react"

interface Exercise {
  name: string
  sets: number
  reps: string
  weight: string
  done: boolean
}

interface WorkoutDay {
  day: string
  focus: string
  duration: string
  exercises: Exercise[]
}

const sampleWorkouts: WorkoutDay[] = [
  {
    day: "Lundi",
    focus: "Pectoraux & Triceps",
    duration: "55 min",
    exercises: [
      { name: "Développé couché barre", sets: 4, reps: "10-12", weight: "60 kg", done: false },
      { name: "Développé incliné haltères", sets: 4, reps: "10-12", weight: "24 kg", done: false },
      { name: "Écarté à la poulie vis-à-vis", sets: 3, reps: "15", weight: "15 kg", done: false },
      { name: "Extension triceps poulie", sets: 4, reps: "12-15", weight: "20 kg", done: false },
      { name: "Dips lestés", sets: 3, reps: "10", weight: "10 kg", done: false },
    ],
  },
  {
    day: "Mercredi",
    focus: "Dos & Biceps",
    duration: "50 min",
    exercises: [
      { name: "Traction pronation", sets: 4, reps: "8-10", weight: "PDC", done: false },
      { name: "Rowing barre", sets: 4, reps: "10-12", weight: "70 kg", done: false },
      { name: "Tirage horizontal", sets: 3, reps: "12", weight: "50 kg", done: false },
      { name: "Curl barre EZ", sets: 4, reps: "10-12", weight: "30 kg", done: false },
      { name: "Curl marteau", sets: 3, reps: "12-15", weight: "14 kg", done: false },
    ],
  },
  {
    day: "Vendredi",
    focus: "Jambes & Épaules",
    duration: "60 min",
    exercises: [
      { name: "Squat barre", sets: 4, reps: "10-12", weight: "80 kg", done: false },
      { name: "Presse à cuisses", sets: 4, reps: "12", weight: "140 kg", done: false },
      { name: "Leg extension", sets: 3, reps: "15", weight: "45 kg", done: false },
      { name: "Développé militaire", sets: 4, reps: "10-12", weight: "40 kg", done: false },
      { name: "Élévation latérale", sets: 3, reps: "15", weight: "10 kg", done: false },
    ],
  },
  {
    day: "Samedi",
    focus: "Cardio & Core",
    duration: "40 min",
    exercises: [
      { name: "Course à pied", sets: 1, reps: "20 min", weight: "--", done: false },
      { name: "Gainage planche", sets: 3, reps: "45 s", weight: "--", done: false },
      { name: "Crunch à la poulie", sets: 3, reps: "15", weight: "25 kg", done: false },
      { name: "Mountain climbers", sets: 3, reps: "30", weight: "--", done: false },
    ],
  },
]

export default function WorkoutPage() {
  const [activeDay, setActiveDay] = useState(0)
  const [workouts, setWorkouts] = useState<WorkoutDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setWorkouts(sampleWorkouts), 300)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 rounded-xl shimmer" />)}
        </div>
        <div className="h-72 rounded-2xl shimmer" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Erreur de chargement</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-brand-red font-medium hover:underline flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!workouts) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Aucun programme</p>
          <p className="text-sm text-gray-400">Votre programme sportif sera disponible ici.</p>
        </div>
      </div>
    )
  }

  const current = workouts[activeDay]
  const total = current.exercises.length
  const done = current.exercises.filter((e) => e.done).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const toggleExercise = (index: number) => {
    setWorkouts((prev) => {
      if (!prev) return prev
      const copy = prev.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }))
      copy[activeDay].exercises[index].done = !copy[activeDay].exercises[index].done
      return copy
    })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Programme sportif</h1>
          <p className="text-sm text-gray-400 mt-0.5">Plan d&apos;entraînement personnalisé</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-red text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {workouts.map((w, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeDay === i
                ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                : "glass text-gray-300 border border-white/10 hover:border-brand-red/30"
            }`}
          >
            {w.day}
          </button>
        ))}
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-brand-red to-red-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Séance</p>
                <p className="text-lg font-bold">{current.focus}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {current.duration}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold">{done}/{total}</span>
            <Flag className="w-4 h-4 text-white/70" />
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {current.exercises.map((ex, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-4 transition-colors ${ex.done ? "bg-green-500/5" : "hover:bg-white/5"}`}>
              <button
                onClick={() => toggleExercise(i)}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  ex.done
                    ? "bg-green-500 border-green-500 text-white scale-110 shadow-md shadow-green-500/30"
                    : "border-white/20 hover:border-brand-red"
                }`}
              >
                {ex.done && <Check className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${ex.done ? "text-gray-500 line-through" : "text-white"}`}>{ex.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {ex.sets} × {ex.reps}
                  </span>
                  {ex.weight !== "--" && (
                    <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">{ex.weight}</span>
                  )}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${ex.done ? "text-green-400/50" : "text-white/20"}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Exercices", value: `${done}/${total}`, sub: `${progress}% complété`, color: "bg-brand-red/10 text-brand-red" },
          { label: "Temps estimé", value: current.duration, sub: "Par séance", color: "bg-brand-blue/10 text-brand-blue" },
          { label: "Intensité", value: current.exercises.length >= 5 ? "Élevée" : "Moyenne", sub: "Cette semaine", color: "bg-amber-500/10 text-amber-400" },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl border border-white/10 p-3">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
            <p className="text-[10px] text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
        <Play className="w-4 h-4" />
        {done === 0 ? "Commencer la séance" : done === total ? "Séance terminée ✓" : "Continuer la séance"}
      </button>
    </div>
  )
}
