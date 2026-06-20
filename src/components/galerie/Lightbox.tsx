"use client"

import { useEffect, useCallback, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface LightboxProps {
  images: { src: string; alt: string }[]
  index: number
  isOpen: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function Lightbox({ images, index, isOpen, onClose, onIndexChange }: LightboxProps) {
  const [loaded, setLoaded] = useState(false)

  const goNext = useCallback(() => {
    setLoaded(false)
    onIndexChange((index + 1) % images.length)
  }, [index, images.length, onIndexChange])

  const goPrev = useCallback(() => {
    setLoaded(false)
    onIndexChange((index - 1 + images.length) % images.length)
  }, [index, images.length, onIndexChange])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    },
    [onClose, goNext, goPrev]
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={images[index]?.alt}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: loaded ? 1 : 0.3, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-[90vw] max-h-[85vh] w-full h-full relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[index]?.src}
              alt={images[index]?.alt}
              fill
              className="object-contain rounded-lg"
              sizes="90vw"
              onLoad={() => setLoaded(true)}
            />
          </motion.div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
