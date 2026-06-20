"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import {
  Bot, User, CreditCard, TrendingUp, Apple, Trophy, UserPlus, Gift, Settings, LogOut, ChevronRight,
  Dumbbell, Bell,
} from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"

const menuSections = [
  {
    title: "PERFORMANCE",
    items: [
      { label: "Exercices", href: "/dashboard/workout", icon: Dumbbell, color: "#FF4D4D" },
      { label: "Nutrition", href: "/dashboard/nutrition", icon: Apple, color: "#FF6B35" },
      { label: "Mes Progrès", href: "/dashboard/progress", icon: TrendingUp, color: "#10B981" },
      { label: "Défis & Badges", href: "/dashboard/defis", icon: Trophy, color: "#FF4D4D" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { label: "Coach IA", href: "/dashboard/ai-coach", icon: Bot, color: "#7C3AED" },
    ],
  },
  {
    title: "COMPTE",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell, color: "#0A84FF" },
      { label: "Mon Profil", href: "/dashboard/profile", icon: User, color: "#0A84FF" },
      { label: "Abonnement", href: "/dashboard/membership", icon: CreditCard, color: "#C89B3C" },
      { label: "Bons plans", href: "/dashboard/bon-plan", icon: Gift, color: "#C89B3C" },
      { label: "Parrainage", href: "/dashboard/referral", icon: UserPlus, color: "#00D4FF" },
      { label: "Paramètres", href: "/dashboard/settings", icon: Settings, color: "#6B7280" },
    ],
  },
]

export default function PlusPage() {
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
    >
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#C89B3C] flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-black">IG</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Plus</h1>
            <p className="text-xs text-gray-400">Toutes les fonctionnalités</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2 pb-28 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-500 mb-2 px-1">{section.title}</h3>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {section.items.map((item, idx) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.99]"
                  style={{ borderBottom: idx < section.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${item.color}15` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-white">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => { logout(); router.push("/login") }}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl mt-6 transition-all duration-200 hover:bg-red-500/5 active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <span className="flex-1 text-left text-sm font-bold text-red-400">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
