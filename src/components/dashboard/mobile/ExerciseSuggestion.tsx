"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Dumbbell, Zap, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { getExerciseGif } from "@/data/exercise-gifs"
import type { Gender } from "./theme"

const weeklyWorkouts = [
  { day: "Lundi", focus: "Pectoraux & Triceps", duration: "55 min",
    exercises: [
      { name: "Développé couché barre", sets: 4, reps: "10-12", weight: "60 kg" },
      { name: "Développé incliné haltères", sets: 4, reps: "10-12", weight: "24 kg" },
      { name: "Écarté à la poulie vis-à-vis", sets: 3, reps: "15", weight: "15 kg" },
    ] },
  { day: "Mardi", focus: "Cardio & Abdos", duration: "40 min",
    exercises: [
      { name: "Course à pied", sets: 1, reps: "20 min", weight: "--" },
      { name: "Gainage planche", sets: 3, reps: "45 s", weight: "--" },
    ] },
  { day: "Mercredi", focus: "Dos & Biceps", duration: "50 min",
    exercises: [
      { name: "Traction pronation", sets: 4, reps: "8-10", weight: "PDC" },
      { name: "Rowing barre", sets: 4, reps: "10-12", weight: "70 kg" },
      { name: "Curl barre EZ", sets: 4, reps: "10-12", weight: "30 kg" },
    ] },
  { day: "Vendredi", focus: "Jambes & Épaules", duration: "60 min",
    exercises: [
      { name: "Squat barre", sets: 4, reps: "10-12", weight: "80 kg" },
      { name: "Développé militaire", sets: 4, reps: "10-12", weight: "40 kg" },
      { name: "Élévation latérale", sets: 3, reps: "15", weight: "10 kg" },
    ] },
  { day: "Samedi", focus: "Full Body", duration: "45 min",
    exercises: [
      { name: "Développé couché barre", sets: 3, reps: "10", weight: "50 kg" },
      { name: "Squat barre", sets: 3, reps: "10", weight: "60 kg" },
    ] },
]

function getTodaysWorkout() {
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
  const today = dayNames[new Date().getDay()]
  return weeklyWorkouts.find((w) => w.day === today) || weeklyWorkouts[0]
}

interface ExerciseSuggestionProps {
  gender: Gender
}

export default function ExerciseSuggestion({ gender }: ExerciseSuggestionProps) {
  const router = useRouter()
  const primary = gender === "male" ? "#0A84FF" : gender === "female" ? "#10B981" : "#7C3AED"

  const todaysWorkout = useMemo(() => getTodaysWorkout(), [])
  const [suggestedIndex, setSuggestedIndex] = useState(0)
  const [gifUrl, setGifUrl] = useState<string | null | undefined>(undefined)
  const [gifLoading, setGifLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestedIndex(Math.floor(Math.random() * todaysWorkout.exercises.length))
    }, 0)
    return () => clearTimeout(timer)
  }, [todaysWorkout.exercises.length])

  const suggested = todaysWorkout.exercises[suggestedIndex]

  useEffect(() => {
    let cancelled = false
    getExerciseGif(suggested.name).then((url) => {
      if (!cancelled) { setGifUrl(url); setGifLoading(false) }
    })
    return () => { cancelled = true }
  }, [suggested.name])

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">EXERCICE DU JOUR</h3>
        <button
          onClick={() => router.push("/dashboard/workout")}
          className="text-[10px] font-bold"
          style={{ color: primary }}
        >
          VOIR LE PROGRAMME &gt;
        </button>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/dashboard/workout")}
        className="w-full rounded-[20px] overflow-hidden border text-left transition-all duration-200"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-stretch">
          <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden bg-white/[0.02]">
            {gifLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              </div>
            ) : gifUrl ? (
              <Image src={gifUrl!} alt={suggested.name} className="w-full h-full object-cover" unoptimized width={200} height={200} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(8,23,59,0.95) 100%)",
              }}
            />
          </div>

          <div className="flex-1 flex items-center gap-4 pr-4 py-3 pl-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3" style={{ color: primary }} />
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primary }}>
                  {todaysWorkout.day} · {todaysWorkout.focus}
                </p>
              </div>
              <p className="text-sm font-bold text-white truncate">{suggested.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" style={{ color: primary }} />
                  {suggested.sets} × {suggested.reps}
                </span>
                {suggested.weight !== "--" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                    {suggested.weight}
                  </span>
                )}
                <span className="text-[10px] text-gray-500">{todaysWorkout.duration}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
          </div>
        </div>
      </motion.button>
    </div>
  )
}
