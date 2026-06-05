"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"

import { photos } from "@/lib/galerie/mockData"
import Lightbox from "./Lightbox"

interface GaleriePhotosProps {
  categoryFilter: string | null
}

export default function GaleriePhotos({ categoryFilter }: GaleriePhotosProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = categoryFilter
    ? photos.filter((p) => p.category === categoryFilter)
    : photos

  const columns = useMemo(() => {
    const cols: (typeof photos)[] = [[], [], []]
    filtered.forEach((photo, i) => {
      cols[i % 3].push(photo)
    })
    return cols
  }, [filtered])

  if (filtered.length === 0) return null

  return (
    <section id="galerie" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Galerie Photos
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Immortalisez chaque instant de votre parcours fitness
          </p>
        </motion.div>

        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-4">
              {col.map((photo, i) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: (i % 5) * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setLightboxIndex(filtered.indexOf(photo))}
                  className="group relative rounded-2xl overflow-hidden border border-white/5 w-full"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    style={{ minHeight: ci === 1 ? "280px" : "220px" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium">{photo.photographer}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        <div className="sm:hidden grid grid-cols-2 gap-3">
          {filtered.slice(0, 8).map((photo, i) => (
            <motion.button
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setLightboxIndex(i)}
              className="group relative rounded-xl overflow-hidden aspect-square"
            >
              <img src={photo.src} alt={photo.alt} loading="lazy" className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>
      </div>

      <Lightbox
        images={filtered.map((p) => ({ src: p.src, alt: p.alt }))}
        index={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  )
}
