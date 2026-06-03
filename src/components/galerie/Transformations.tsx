"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Quote, Award } from "lucide-react"
import { transformations } from "@/lib/galerie/mockData"

export default function Transformations() {
  const [showingBefore, setShowingBefore] = useState<Record<string, boolean>>({})

  return (
    <section id="transformations" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Transformations
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Découvrez les résultats incroyables de nos membres
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {transformations.map((t, i) => {
            const showBefore = showingBefore[t.id] ?? true
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden bg-brand-black/40 border border-white/5 hover:border-brand-accent/20 transition-all duration-500"
              >
                <div className="relative cursor-pointer" onClick={() => setShowingBefore((s) => ({ ...s, [t.id]: !s[t.id] }))}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={showBefore ? "before" : "after"}
                        src={showBefore ? t.before : t.after}
                        alt={showBefore ? "Avant" : "Après"}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full">
                      {showBefore ? "Avant" : "Après"}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-brand-accent/90 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                      Cliquez pour {showBefore ? "l'après" : "l'avant"}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold text-lg">{t.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-brand-accent font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      {t.result}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">Durée :</span>
                    <span className="text-xs text-white font-medium">{t.duration}</span>
                  </div>
                  <div className="relative pl-4 border-l-2 border-brand-red/50">
                    <Quote className="w-3.5 h-3.5 text-brand-red/60 absolute -top-1 -left-1.5" />
                    <p className="text-gray-400 text-sm italic leading-relaxed">{t.quote}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
