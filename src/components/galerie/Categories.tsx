"use client"

import { motion } from "framer-motion"
import { Dumbbell, Heart, Zap, Apple, Footprints, Sparkles } from "lucide-react"
import { categories } from "@/lib/galerie/mockData"

const iconMap: Record<string, React.ElementType> = {
  Dumbbell, Heart, Zap, Apple, Footprints, Sparkles,
}

const gradientMap: Record<string, string> = {
  musculation: "from-red-500 to-orange-500",
  cardio: "from-green-500 to-emerald-500",
  yoga: "from-purple-500 to-pink-500",
  running: "from-blue-500 to-cyan-500",
  crossfit: "from-amber-500 to-red-500",
  nutrition: "from-lime-500 to-green-500",
}

interface CategoriesProps {
  active: string | null
  onSelect: (id: string | null) => void
}

export default function Categories({ active, onSelect }: CategoriesProps) {
  return (
    <section id="categories" className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-wrap justify-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(null)}
            className={`px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
              active === null
                ? "bg-brand-red text-white shadow-lg shadow-red-500/25"
                : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10"
            }`}
          >
            Tous
          </motion.button>

          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Heart
            const isActive = active === cat.id
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(isActive ? null : cat.id)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${gradientMap[cat.id]} text-white shadow-lg`
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                <span className={`text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}>
                  {cat.count}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
