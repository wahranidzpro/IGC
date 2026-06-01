"use client"

import Link from "next/link"
import { Gift, Tag, Percent, ShoppingBag, ChevronRight, Star } from "lucide-react"

const plans = [
  { title: "-30% MyProtein", code: "IGC30", desc: "Compléments sportifs", icon: ShoppingBag, color: "from-amber-500 to-orange-600" },
  { title: "1 séance offerte", code: "IGC-FREE", desc: "Massage récupération", icon: Gift, color: "from-green-500 to-emerald-600" },
  { title: "-20% Fitness Plus", code: "IGC20", desc: "Salle partenaire", icon: Percent, color: "from-blue-500 to-indigo-600" },
  { title: "-15% Nike", code: "IGC-NIKE", desc: "Vêtements sport", icon: Tag, color: "from-brand-red to-red-600" },
]

export default function BonPlanMarketingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="bg-gradient-to-br from-brand-red via-red-700 to-brand-black px-6 pt-16 pb-24 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Bons plans</h1>
          <p className="text-white/70 mt-2">Découvrez les avantages exclusifs réservés aux membres IGC</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 mt-6 bg-white text-brand-red font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/90 transition-all active:scale-95"
          >
            Connectez-vous pour profiter <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-10 max-w-lg mx-auto space-y-3 pb-20">
        {plans.map((plan, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg shadow-black/5 hover:shadow-xl hover:border-brand-red/20 transition-all">
            <div className={`bg-gradient-to-r ${plan.color} px-4 py-3 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <plan.icon className="w-4 h-4" />
                <span className="text-sm font-bold">{plan.title}</span>
              </div>
              <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full">{plan.code}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">{plan.desc}</p>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-br from-brand-red to-red-700 rounded-2xl p-5 text-white text-center mt-6">
          <Star className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-bold">Devenir membre IGC</p>
          <p className="text-xs text-white/70 mt-1">Accédez à tous les avantages exclusifs</p>
          <Link
            href="/login"
            className="inline-block mt-3 bg-white text-brand-red font-bold px-5 py-2 rounded-xl text-xs hover:bg-white/90 transition-all"
          >
            Voir les offres
          </Link>
        </div>
      </div>
    </div>
  )
}
