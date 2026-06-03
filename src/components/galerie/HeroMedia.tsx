"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, ArrowDown } from "lucide-react"

const HERO_VIDEOS = [
  "https://videos.pexels.com/video-files/3195396/3195396-uhd_2560_1440_30fps.mp4",
  "https://videos.pexels.com/video-files/3200694/3200694-hd_1280_720_30fps.mp4",
]

export default function HeroMedia() {
  const [videoIndex, setVideoIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVideoIndex((i) => (i + 1) % HERO_VIDEOS.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[90vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {HERO_VIDEOS.map((src, i) => (
        <video
          key={src}
          autoPlay
          muted
          loop={i === videoIndex}
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === videoIndex ? "opacity-100" : "opacity-0"}`}
          style={{ filter: "brightness(0.45)" }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-black/30 to-brand-black/80" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
        >
          Notre{" "}
          <span className="bg-gradient-to-r from-brand-accent via-orange-400 to-brand-red bg-clip-text text-transparent">
            Galerie Média
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Explorez nos vidéos d&apos;entraînement, photos inspirantes et transformations.
          Laissez-vous motiver par la communauté Infinity Gym.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <a
            href="#videos"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-red to-red-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105"
          >
            <Play className="w-5 h-5 fill-white" />
            Voir les vidéos
          </a>
          <a
            href="#galerie"
            className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300"
          >
            Explorer les photos
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#categories"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowDown className="w-6 h-6" />
      </motion.a>
    </section>
  )
}
