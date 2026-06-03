"use client"

import { Clock, Dumbbell, Target, Flame } from "lucide-react"

interface HomeTrainingCardProps {
  title: string
  duration: string
  difficulty: "Débutant" | "Intermédiaire" | "Avancé"
  calories: string
  exercises: number
  image?: string
}

export default function HomeTrainingCard({ title, duration, difficulty, calories, exercises, image }: HomeTrainingCardProps) {
  const difficultyColor =
    difficulty === "Débutant" ? "bg-green-500/20 text-green-400" :
    difficulty === "Intermédiaire" ? "bg-yellow-500/20 text-yellow-400" :
    "bg-red-500/20 text-red-400"

  return (
    <div className="group bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all duration-500 hover:-translate-y-1">
      {image && (
        <div className="aspect-video bg-zinc-800 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      )}
      {!image && (
        <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <Dumbbell className="w-16 h-16 text-zinc-700" />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-brand-orange transition-colors">{title}</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Clock className="w-4 h-4 text-brand-orange" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Flame className="w-4 h-4 text-brand-orange" />
            <span>{calories}</span>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${difficultyColor} col-span-2`}>
            <Target className="w-3 h-3" />
            <span>{difficulty}</span>
            <span className="text-zinc-500 mx-1">·</span>
            <span>{exercises} exercices</span>
          </div>
        </div>
      </div>
    </div>
  )
}
