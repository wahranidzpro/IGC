"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CalendarDays, Dumbbell, Bot, TrendingUp, Apple, User } from "lucide-react"

const actions = [
  { label: "Planning", href: "/dashboard/planning", icon: CalendarDays, color: "#0A84FF", gradient: "from-[#0A84FF] to-[#0066CC]" },
  { label: "Exercice", href: "/dashboard/workout", icon: Dumbbell, color: "#FF4D4D", gradient: "from-[#FF4D4D] to-[#CC0000]" },
  { label: "Coach IA", href: "/dashboard/ai-coach", icon: Bot, color: "#7C3AED", gradient: "from-[#7C3AED] to-[#5B21B6]" },
  { label: "Progrès", href: "/dashboard/progress", icon: TrendingUp, color: "#10B981", gradient: "from-[#10B981] to-[#059669]" },
  { label: "Nutrition", href: "/dashboard/nutrition", icon: Apple, color: "#FF6B35", gradient: "from-[#FF6B35] to-[#E55D2B]" },
  { label: "Profil", href: "/dashboard/profile", icon: User, color: "#00D4FF", gradient: "from-[#00D4FF] to-[#0099CC]" },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 20, stiffness: 200 } },
}

export default function ActionsRapides() {
  const router = useRouter()

  return (
    <div className="px-4 mt-6">
      <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mb-3 px-1">ACCÈS RAPIDES</h3>
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <motion.button
            key={a.href}
            variants={itemAnim}
            onClick={() => router.push(a.href)}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-[20px] p-4 text-left transition-colors duration-200 border"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
              style={{ background: `${a.color}18` }}
            >
              <a.icon className="w-5 h-5" style={{ color: a.color }} />
            </div>
            <p className="text-[11px] font-bold text-white leading-tight">{a.label}</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
