"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"

interface AdminStatsCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  color?: "blue" | "gold" | "green" | "turquoise" | "violet" | "red" | "orange" | "yellow"
}

const colorMap: Record<string, {
  gradient: string; glow: string; iconBg: string; iconColor: string; border: string
}> = {
  blue: {
    gradient: "from-[#0A84FF] to-[#00D4FF]",
    glow: "shadow-[#0A84FF]/20",
    iconBg: "bg-[#0A84FF]/10",
    iconColor: "text-[#0A84FF]",
    border: "border-[#0A84FF]/30",
  },
  green: {
    gradient: "from-[#10B981] to-[#34D399]",
    glow: "shadow-[#10B981]/20",
    iconBg: "bg-[#10B981]/10",
    iconColor: "text-[#10B981]",
    border: "border-[#10B981]/30",
  },
  turquoise: {
    gradient: "from-[#00D4FF] to-[#0A84FF]",
    glow: "shadow-[#00D4FF]/20",
    iconBg: "bg-[#00D4FF]/10",
    iconColor: "text-[#00D4FF]",
    border: "border-[#00D4FF]/30",
  },
  gold: {
    gradient: "from-[#C89B3C] to-[#E0B85D]",
    glow: "shadow-[#C89B3C]/20",
    iconBg: "bg-[#C89B3C]/10",
    iconColor: "text-[#C89B3C]",
    border: "border-[#C89B3C]/30",
  },
  violet: {
    gradient: "from-[#7C3AED] to-[#A855F7]",
    glow: "shadow-[#7C3AED]/20",
    iconBg: "bg-[#7C3AED]/10",
    iconColor: "text-[#7C3AED]",
    border: "border-[#7C3AED]/30",
  },
  red: {
    gradient: "from-[#FF4D4D] to-[#FF6B6B]",
    glow: "shadow-[#FF4D4D]/20",
    iconBg: "bg-[#FF4D4D]/10",
    iconColor: "text-[#FF4D4D]",
    border: "border-[#FF4D4D]/30",
  },
  orange: {
    gradient: "from-[#FF6B35] to-[#FF8C42]",
    glow: "shadow-[#FF6B35]/20",
    iconBg: "bg-[#FF6B35]/10",
    iconColor: "text-[#FF6B35]",
    border: "border-[#FF6B35]/30",
  },
  yellow: {
    gradient: "from-[#E0B85D] to-[#FCD34D]",
    glow: "shadow-[#E0B85D]/20",
    iconBg: "bg-[#E0B85D]/10",
    iconColor: "text-[#E0B85D]",
    border: "border-[#E0B85D]/30",
  },
}

function AnimatedValue({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    startTime.current = null
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value, duration])

  return <>{display.toLocaleString("fr-FR")}</>
}

export default function AdminStatsCard({
  label, value, sub, icon: Icon, trend, trendValue, color = "blue",
}: AdminStatsCardProps) {
  const c = colorMap[color] || colorMap.blue
  const isNumeric = typeof value === "number"

  return (
    <div
      className={`glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 border ${c.border} ${c.glow} hover:shadow-xl group`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A8B2C7]">
          {label}
        </span>
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
        </div>
      </div>
      <div className="text-3xl font-black text-white tracking-tight">
        {isNumeric ? <AnimatedValue value={value as number} /> : value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {trend && trend !== "neutral" ? (
          <div className="flex items-center gap-1 text-xs">
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-[#10B981]" />
            ) : (
              <TrendingDown className="w-3 h-3 text-[#FF4D4D]" />
            )}
            <span className={trend === "up" ? "text-[#10B981]" : "text-[#FF4D4D]"}>
              {trendValue}
            </span>
          </div>
        ) : trend === "neutral" ? (
          <div className="flex items-center gap-1 text-xs text-[#A8B2C7]">
            <Minus className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        ) : null}
        {sub && <span className="text-xs text-[#A8B2C7]">{sub}</span>}
      </div>
    </div>
  )
}
