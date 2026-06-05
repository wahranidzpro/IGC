"use client"

import Link from "next/link"
import { ClipboardList, Apple, BarChart3, ArrowRight, User } from "lucide-react"

interface CoachSetupPromptProps {
  sectionLabel?: string
}

const features = [
  { icon: BarChart3, label: "Suivi des progrès", desc: "Évaluez et suivez l'évolution de vos clients" },
  { icon: ClipboardList, label: "Programmes sur mesure", desc: "Créez des programmes adaptés à chaque objectif" },
  { icon: Apple, label: "Plans nutritionnels", desc: "Élaborez des stratégies alimentaires personnalisées" },
]

export default function CoachSetupPrompt({ sectionLabel }: CoachSetupPromptProps) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C89B3C]/20 to-[#E0B85D]/5 flex items-center justify-center mx-auto mb-4 border border-[#C89B3C]/20">
            <User className="w-8 h-8 text-[#C89B3C]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {sectionLabel ? `Accès à la section ${sectionLabel}` : "Bienvenue sur votre espace coach"}
          </h2>
          <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
            Créez votre profil coach pour activer cette section et commencer à gérer vos clients.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {features.map((f) => (
              <div key={f.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] text-center">
                <f.icon className="w-5 h-5 text-[#C89B3C] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-white mb-0.5">{f.label}</p>
                <p className="text-[10px] text-white/40 leading-tight">{f.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/coach/profile"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20"
          >
            Créer mon profil coach <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
  )
}
