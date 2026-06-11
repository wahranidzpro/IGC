"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

interface BackButtonProps {
  href?: string
  label?: string
}

export default function BackButton({ href, label = "Retour" }: BackButtonProps) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-20 pt-2 pb-1 px-2" style={{ background: "linear-gradient(180deg, #020B22 0%, transparent 100%)" }}>
      <button
        onClick={() => (href ? router.push(href) : router.back())}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white/70 hover:text-white transition-all duration-200 active:scale-95"
        style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <ChevronLeft className="w-4 h-4" />
        {label}
      </button>
    </div>
  )
}
