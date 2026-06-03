"use client"

import { Dumbbell, Salad, Smartphone, Medal, ArrowRight } from "lucide-react"
import Link from "next/link"

const services = [
  {
    icon: Dumbbell,
    title: "Home Training",
    desc: "Entraîne-toi chez toi avec nos programmes vidéo exclusifs. Accessible 24h/24 depuis ton espace membre.",
    href: "/home-training",
    gradient: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/25",
  },
  {
    icon: Salad,
    title: "Coach Nutrition",
    desc: "Conseils personnalisés, recettes algériennes healthy et plans alimentaires adaptés à tes objectifs.",
    href: "/nutrition",
    gradient: "from-emerald-500 to-green-600",
    glow: "shadow-emerald-500/25",
  },
  {
    icon: Smartphone,
    title: "Application Mobile",
    desc: "Suis ta progression, réserve tes séances, accède à ton QR code et reste connecté partout.",
    href: "/dashboard",
    gradient: "from-orange-500 to-red-600",
    glow: "shadow-orange-500/25",
  },
  {
    icon: Medal,
    title: "Programme Fidélité",
    desc: "Gagne des points à chaque séance, débloque des badges et obtiens des récompenses exclusives.",
    href: "/fidelite",
    gradient: "from-yellow-500 to-orange-500",
    glow: "shadow-yellow-500/25",
  },
]

export default function ServicesGrid() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/50 to-black" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold tracking-wider uppercase mb-4">
            Services Exclusifs
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Tout pour atteindre tes{" "}
            <span className="text-brand-red">objectifs</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Au-delà de la salle, bénéficie d&apos;un écosystème complet pour ton bien-être et ta progression.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Link
                key={service.title}
                href={service.href}
                className="group relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Gradient hover effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} p-3 mb-5 shadow-lg ${service.glow} group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-orange transition-colors">
                  {service.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  {service.desc}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-1 text-sm font-semibold text-brand-orange opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  Découvrir <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
