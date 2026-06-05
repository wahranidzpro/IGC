"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface CoachKPICardProps {
  title: string
  value: string | number
  evolution: number
  subtitle?: string
  icon: React.ReactNode
  gradient?: "gold" | "blue" | "violet" | "cyan"
  delay?: number
}

const gradients: Record<string, { from: string; to: string; glow: string; circleGlow: string }> = {
  gold: {
    from: "#C89B3C",
    to: "#E0B85D",
    glow: "rgba(200,155,60,0.3)",
    circleGlow: "rgba(200,155,60,0.25)",
  },
  blue: {
    from: "#0A84FF",
    to: "#00D4FF",
    glow: "rgba(10,132,255,0.3)",
    circleGlow: "rgba(10,132,255,0.25)",
  },
  violet: {
    from: "#7C3AED",
    to: "#A855F7",
    glow: "rgba(124,58,237,0.3)",
    circleGlow: "rgba(124,58,237,0.25)",
  },
  cyan: {
    from: "#00D4FF",
    to: "#0A84FF",
    glow: "rgba(0,212,255,0.3)",
    circleGlow: "rgba(0,212,255,0.25)",
  },
}

function AnimatedCounter({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let raf: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return <>{display.toLocaleString("fr-FR")}</>
}

export function CoachKPICard({
  title,
  value,
  evolution,
  subtitle,
  icon,
  gradient = "gold",
  delay = 0,
}: CoachKPICardProps) {
  const g = gradients[gradient]
  const isNumeric = typeof value === "number"
  const positive = evolution >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(200,155,60,0.15)]">
        <div
          className="h-[2px] w-full"
          style={{ background: `linear-gradient(90deg, ${g.from}, ${g.to})` }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A8B2C7]">
              {title}
            </span>
            <div
              className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 group-hover:scale-110"
              style={{
                background: `rgba(${g.from === "#C89B3C" ? "200,155,60" : g.from === "#0A84FF" ? "10,132,255" : g.from === "#7C3AED" ? "124,58,237" : "0,212,255"}, 0.1)`,
              }}
            >
              <div
                className="absolute inset-0 rounded-xl blur-md opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${g.circleGlow}, transparent 70%)` }}
              />
              <div className="relative" style={{ color: g.from }}>
                {icon}
              </div>
            </div>
          </div>

          <div className="text-3xl font-black text-white tracking-tight">
            {isNumeric ? <AnimatedCounter target={value as number} /> : value}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                positive ? "text-[#22C55E]" : "text-[#EF4444]"
              }`}
            >
              {positive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(evolution)}%</span>
            </div>
            {subtitle && <span className="text-xs text-[#A8B2C7]">{subtitle}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
