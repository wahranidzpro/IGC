"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dumbbell, Plus, Clock, Check, Play, ChevronRight, Flag, Zap, X, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { getExerciseGif } from "@/data/exercise-gifs"

interface Exercise {
  name: string
  sets: number
  reps: string
  weight: string
  done: boolean
  gifUrl?: string | null
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

function ExerciseGifThumb({ name, size = 80 }: { name: string; size?: number }) {
  const [gifUrl, setGifUrl] = useState<string | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getExerciseGif(name).then((url) => {
      if (!cancelled) {
        setGifUrl(url)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [name])

  if (loading) {
    return (
      <div
        className="shrink-0 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
      </div>
    )
  }

  if (!gifUrl) {
    return (
      <div
        className="shrink-0 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center overflow-hidden border border-white/5"
        style={{ width: size, height: size }}
      >
        <Dumbbell className="w-6 h-6 text-gray-600" />
      </div>
    )
  }

  return (
    <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: size, height: size }}>
      <img
        src={gifUrl}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  )
}

export default function WorkoutPage() {
  const [activeDay, setActiveDay] = useState(0)
  const [workouts, setWorkouts] = useState<WorkoutDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)

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

  const toggleExercise = useCallback((index: number) => {
    setWorkouts((prev) => {
      if (!prev) return prev
      const copy = prev.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }))
      copy[activeDay].exercises[index].done = !copy[activeDay].exercises[index].done
      return copy
    })
  }, [activeDay])

  const selectedEx = selectedExercise !== null ? current.exercises[selectedExercise] : null

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

      <motion.div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" layout>
        {workouts.map((w, i) => (
          <motion.button
            key={i}
            onClick={() => { setActiveDay(i); setSelectedExercise(null) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeDay === i
                ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                : "glass text-gray-300 border border-white/10 hover:border-brand-red/30"
            }`}
          >
            {w.day}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        key={activeDay}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-strong rounded-2xl border border-white/10 shadow-lg overflow-hidden"
      >
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
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-bold">{done}/{total}</span>
            <Flag className="w-4 h-4 text-white/70" />
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {current.exercises.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                ex.done ? "bg-green-500/5" : "hover:bg-white/5"
              }`}
              onClick={() => setSelectedExercise(i)}
            >
              <ExerciseGifThumb name={ex.name} size={64} />

              <button
                onClick={(e) => { e.stopPropagation(); toggleExercise(i) }}
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
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20"
      >
        <Play className="w-4 h-4" />
        {done === 0 ? "Commencer la séance" : done === total ? "Séance terminée ✓" : "Continuer la séance"}
      </motion.button>

      <AnimatePresence>
        {selectedEx && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedExercise(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(180deg, #0D1B3E 0%, #081021 100%)" }}
            >
              <div className="relative">
                <ExerciseGifThumb name={selectedEx.name} size={320} />
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedEx.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {current.focus} · {current.day}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 rounded-2xl p-4 text-center border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <p className="text-2xl font-black text-white">{selectedEx.sets}</p>
                    <p className="text-xs text-gray-400 mt-1">Séries</p>
                  </div>
                  <div className="flex-1 rounded-2xl p-4 text-center border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <p className="text-2xl font-black text-white">{selectedEx.reps}</p>
                    <p className="text-xs text-gray-400 mt-1">Répétitions</p>
                  </div>
                  {selectedEx.weight !== "--" && (
                    <div className="flex-1 rounded-2xl p-4 text-center border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <p className="text-2xl font-black text-white">{selectedEx.weight}</p>
                      <p className="text-xs text-gray-400 mt-1">Charge</p>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { toggleExercise(selectedExercise!); setSelectedExercise(null) }}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                    selectedEx.done
                      ? "bg-gray-600/50 text-gray-400"
                      : "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                  }`}
                >
                  {selectedEx.done ? "Déjà complété ✓" : "Marquer comme complété"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
