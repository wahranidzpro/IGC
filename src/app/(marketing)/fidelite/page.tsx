"use client"

import Link from "next/link"
import { ArrowRight, Medal, Star, Trophy, Zap, Gift, TrendingUp } from "lucide-react"

const levels = [
  {
    name: "Challenger",
    icon: Star,
    points: "0 - 500 pts",
    color: "from-zinc-400 to-zinc-500",
    textColor: "text-zinc-300",
    bgColor: "bg-zinc-800/50",
    borderColor: "border-zinc-600",
    benefits: ["Accès aux programmes de base", "Newsletter conseils", "Badge Challenger"],
  },
  {
    name: "Machine",
    icon: Zap,
    points: "500 - 2 000 pts",
    color: "from-brand-orange to-brand-red",
    textColor: "text-brand-orange",
    bgColor: "bg-brand-orange/10",
    borderColor: "border-brand-orange/30",
    popular: true,
    benefits: ["Tous les avantages Challenger", "1 séance coaching offerte", "10% sur la boutique", "Badge Machine"],
  },
  {
    name: "GOAT",
    icon: Trophy,
    points: "2 000+ pts",
    color: "from-yellow-400 to-yellow-600",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    benefits: ["Tous les avantages Machine", "4 séances coaching offertes", "25% sur la boutique", "Badge GOAT exclusif", "Invitation événements VIP"],
  },
]

const earnWays = [
  { icon: Medal, text: "5 points par séance de sport" },
  { icon: TrendingUp, text: "10 points par cours collectif" },
  { icon: Gift, text: "50 points pour un parrainage réussi" },
  { icon: Star, text: "100 points pour un abonnement annuel" },
]

export default function FidelitePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-950 via-black to-zinc-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-gold/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-brand-orange/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold tracking-wider uppercase mb-6">
              Programme Fidélité
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              Plus tu t&apos;entraînes, plus tu{" "}
              <span className="text-yellow-400">gagnes</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
              Le programme LEVEL UP récompense ta régularité. Cumule des points à chaque séance, 
              monte en grade et débloque des récompenses exclusives.
            </p>
            <Link href="/signup" className="group inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-yellow-500/30">
              Rejoindre — dès 4 500 DA/mois <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Les 3{" "}
              <span className="text-yellow-400">niveaux</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Chaque palier débloque des avantages supplémentaires. À toi de gravir les échelons.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {levels.map((level) => {
              const Icon = level.icon
              return (
                <div key={level.name} className={`relative rounded-2xl p-8 border ${level.borderColor} ${level.bgColor} backdrop-blur-sm transition-all duration-500 hover:-translate-y-2`}>
                  {level.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-orange to-brand-red text-white text-xs font-bold">
                      Le plus populaire
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.color} p-4 mb-6`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className={`text-2xl font-black mb-2 ${level.textColor}`}>{level.name}</h3>
                  <p className="text-zinc-400 text-sm mb-6">{level.points}</p>
                  <ul className="space-y-3">
                    {level.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3 text-zinc-300 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${level.color}`} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to earn */}
      <section className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Comment gagner des{" "}
              <span className="text-yellow-400">points</span> ?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {earnWays.map((way) => {
              const Icon = way.icon
              return (
                <div key={way.text} className="text-center bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 to-brand-orange/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-yellow-400" />
                  </div>
                  <p className="text-white font-medium">{way.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-brand-orange/5 to-red-500/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Medal className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Prêt à devenir un{" "}
            <span className="text-yellow-400">GOAT</span> ?
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
            Le programme LEVEL UP est inclus dans <span className="text-white font-bold">tous nos abonnements</span>.
            Rejoins Infinity Gym dès 4 500 DA/mois et commence à cumuler des points.
          </p>
          <Link href="/signup" className="group inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-brand-orange text-white px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-yellow-500/30">
            Je m'abonne dès 4 500 DA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </main>
  )
}
