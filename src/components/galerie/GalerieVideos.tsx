"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Eye, Clock } from "lucide-react"
import { videos } from "@/lib/galerie/mockData"
import VideoModal from "./VideoModal"

interface GalerieVideosProps {
  categoryFilter: string | null
}

export default function GalerieVideos({ categoryFilter }: GalerieVideosProps) {
  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState("")

  const filtered = categoryFilter
    ? videos.filter((v) => v.category === categoryFilter)
    : videos

  if (filtered.length === 0) return null

  return (
    <section id="videos" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Vidéos d&apos;Entraînement
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Des séances guidées par nos coachs professionnels pour tous les niveaux
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((video, i) => (
            <motion.button
              key={video.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => { setModalSrc(video.src); setModalTitle(video.title) }}
              className="group relative rounded-2xl overflow-hidden bg-brand-black/40 border border-white/5 text-left w-full"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-brand-red/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-red-500/30">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {video.duration}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm truncate">{video.title}</h3>
                <span className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                  <Eye className="w-3 h-3" />
                  {video.views} vues
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <VideoModal
        src={modalSrc || ""}
        title={modalTitle}
        isOpen={!!modalSrc}
        onClose={() => setModalSrc(null)}
      />
    </section>
  )
}
