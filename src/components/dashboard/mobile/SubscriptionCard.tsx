"use client"

import { useRouter } from "next/navigation"
import { Crown, ChevronRight } from "lucide-react"
import type { Gender } from "./theme"

interface SubscriptionCardProps {
  gender: Gender
  planName: string
  startDate: string
  endDate: string
  daysLeft: number
  isActive: boolean
}

export default function SubscriptionCard({ gender, planName, endDate, daysLeft, isActive }: SubscriptionCardProps) {
  const router = useRouter()
  const primary = gender === "male" ? "#0A84FF" : gender === "female" ? "#10B981" : "#7C3AED"

  if (!isActive) {
    return (
      <div className="relative z-20 -mt-6 flex justify-center px-4">
        <button onClick={() => router.push("/dashboard/membership")} className="w-full max-w-md glass rounded-3xl p-4 border border-white/10 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.06]" style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.04)", cursor: "pointer" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Crown className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Aucun abonnement</p>
              <p className="text-[10px] text-gray-400">Souscrivez pour accéder à la salle</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative z-20 -mt-6 flex justify-center px-4">
      <button onClick={() => router.push("/dashboard/membership")} className="w-full max-w-md rounded-3xl p-4 flex items-center justify-between border text-left transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.04]" style={{
        backdropFilter: "blur(20px)",
        background: gender === "male" ? "rgba(10,132,255,0.08)" : gender === "female" ? "rgba(16,185,129,0.08)" : "rgba(124,58,237,0.08)",
        borderColor: gender === "male" ? "rgba(10,132,255,0.2)" : gender === "female" ? "rgba(16,185,129,0.2)" : "rgba(124,58,237,0.2)",
        boxShadow: `0 8px 32px ${primary}15`,
        cursor: "pointer",
      }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${primary}20` }}
          >
            <Crown className="w-5 h-5" style={{ color: primary }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{planName}</p>
            <p className="text-[10px] text-gray-400">Accès illimité</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Fin</p>
            <p className="text-xs font-bold text-white">
              {new Date(endDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black" style={{ color: primary }}>J-{daysLeft}</p>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: primary }} />
        </div>
      </button>
    </div>
  )
}
