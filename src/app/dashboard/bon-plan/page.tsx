"use client"

import { Gift, Tag, Percent, ShoppingBag, ChevronRight, Clock } from "lucide-react"

const deals = [
  {
    title: "-30% sur les compléments",
    partner: "MyProtein",
    code: "IGC30",
    desc: "Protéines, BCAA, créatine",
    expires: "15 juin 2026",
    color: "from-amber-500 to-orange-600",
    icon: ShoppingBag,
  },
  {
    title: "1 séance offerte",
    partner: "Massage Pro",
    code: "IGC-FREE",
    desc: "Récupération musculaire",
    expires: "30 juin 2026",
    color: "from-green-500 to-emerald-600",
    icon: Gift,
  },
  {
    title: "-20% abonnement fitness",
    partner: "Fitness Plus",
    code: "IGC20",
    desc: "Salle partenaire",
    expires: "31 juillet 2026",
    color: "from-blue-500 to-indigo-600",
    icon: Percent,
  },
  {
    title: "-15% vêtements sport",
    partner: "Nike",
    code: "IGC-NIKE",
    desc: "Code valable en ligne",
    expires: "15 août 2026",
    color: "from-brand-red to-red-600",
    icon: Tag,
  },
]

export default function BonPlanPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-brand-red via-red-700 to-brand-black px-5 pt-6 pb-16 text-white">
        <h1 className="text-xl font-bold">Bons plans</h1>
        <p className="text-sm text-white/70 mt-1">Avantages & réductions exclusifs</p>
      </div>

      <div className="px-4 -mt-10 relative z-10 space-y-3 pb-28">
        {deals.map((deal, i) => (
          <div key={i} className="glass-strong rounded-2xl border border-white/10 overflow-hidden hover:shadow-xl hover:border-brand-red/30 transition-all group">
            <div className={`bg-gradient-to-r ${deal.color} px-4 py-3 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <deal.icon className="w-4 h-4" />
                <span className="text-sm font-bold">{deal.partner}</span>
              </div>
              <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full">{deal.code}</span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-white">{deal.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{deal.desc}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expire le {deal.expires}
                </span>
                <button className="text-xs font-bold text-brand-red flex items-center gap-0.5 group-hover:gap-1 transition-all">
                  Utiliser <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
