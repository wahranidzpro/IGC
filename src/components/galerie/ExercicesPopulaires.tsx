"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Flame, BarChart3, ChevronRight } from "lucide-react"
import { exercises } from "@/lib/galerie/mockData"

const difficultyColors: Record<string, string> = {
  Facile: "bg-green-500/20 text-green-400 border-green-500/30",
  Intermédiaire: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Avancé: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function ExercicesPopulaires() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <section className="py-16 bg-gradient-to-b from-transparent via-brand-black/30 to-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Exercices Populaires
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Les exercices préférés de notre communauté
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {exercises.map((exo, i) => (
            <motion.div
              key={exo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onMouseEnter={() => setHoveredId(exo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative rounded-2xl overflow-hidden bg-brand-black/40 border border-white/5 hover:border-brand-red/20 transition-all duration-500"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={exo.image}
                  alt={exo.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/20 to-transparent" />
                <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${difficultyColors[exo.difficulty]}`}>
                  {exo.difficulty}
                </span>
              </div>

              <div className="p-4">
                <h3 className="text-white font-bold text-base mb-3 truncate">{exo.name}</h3>
                <div className="space-y-1.5">
                  <span className="flex items-center gap-2 text-gray-400 text-xs">
                    <Clock className="w-3.5 h-3.5 text-brand-accent" />
                    {exo.duration}
                  </span>
                  <span className="flex items-center gap-2 text-gray-400 text-xs">
                    <Flame className="w-3.5 h-3.5 text-brand-red" />
                    {exo.calories}
                  </span>
                </div>
              </div>

              <motion.div
                initial={false}
                animate={{
                  height: hoveredId === exo.id ? "auto" : 0,
                  opacity: hoveredId === exo.id ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <a
                    href={`/activites#${exo.category}`}
                    className="flex items-center justify-center gap-1 text-sm text-brand-accent font-semibold hover:text-white transition-colors w-full"
                  >
                    Voir le détail <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
