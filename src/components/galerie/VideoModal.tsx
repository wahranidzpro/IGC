"use client"

import { useEffect, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertCircle } from "lucide-react"
import VideoPlayer from "@/components/ui/VideoPlayer"

interface VideoModalProps {
  src: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export default function VideoModal({ src, title, isOpen, onClose }: VideoModalProps) {
  const [error, setError] = useState(false)
  const isYouTube = src.includes("youtube.com/embed")

  useEffect(() => {
    setError(false)
  }, [src])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-brand-black"
            onClick={(e) => e.stopPropagation()}
          >
            {error ? (
              <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-gray-400">
                <AlertCircle className="w-10 h-10 text-brand-red/60" />
                <p className="text-sm">Vidéo temporairement indisponible</p>
              </div>
            ) : isYouTube ? (
              <iframe
                src={src + "?autoplay=1&rel=0"}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={title}
              />
            ) : (
              <VideoPlayer src={src} title={title} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
