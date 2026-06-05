"use client"

import Link from "next/link"
import { ArrowRight, Apple, Book, Calculator, Sparkles } from "lucide-react"
import AlgerianRecipes from "@/components/nutrition/AlgerianRecipes"

export default function NutritionPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-black to-zinc-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-brand-emerald/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-gold/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold tracking-wider uppercase mb-6">
              Nutrition Sportive
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              Mange healthy, performe{" "}
              <span className="text-brand-emerald">mieux</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
              Découvre nos conseils nutrition adaptés aux sportifs algériens. Recettes traditionnelles revisitées, 
              plans alimentaires personnalisés et suivi par nos coachs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/abonnements" className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-emerald to-emerald-700 text-white px-8 py-4 rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-brand-emerald/30">
                Voir les abonnements <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/abonnements" className="group inline-flex items-center gap-2 border border-zinc-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-zinc-800 transition-all">
                Voir les abonnements
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Nutrition Matters */}
      <section id="conseils" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                La nutrition, clé de ta{" "}
                <span className="text-brand-emerald">réussite</span>
              </h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Chez Infinity Gym, on ne se limite pas à la musculation. On t&apos;accompagne sur tous les aspects 
                de ta santé : alimentation, hydratation, sommeil et récupération.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Apple, text: "Des conseils adaptés à la cuisine algérienne" },
                  { icon: Calculator, text: "Calculateur de macros et calories personnalisé" },
                  { icon: Book, text: "Programmes alimentaires par objectif (prise de masse / sèche)" },
                  { icon: Sparkles, text: "Suivi hebdomadaire avec ton coach" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.text} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-emerald/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-brand-emerald" />
                      </div>
                      <p className="text-zinc-300 pt-2">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=800&fit=crop" alt="Nutrition sportive" className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </section>

      {/* Recipes */}
      <section id="recettes" className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold tracking-wider uppercase mb-4">
              Recettes Healthy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Nos recettes algériennes{" "}
              <span className="text-brand-emerald">healthy</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Des plats traditionnels revisités pour allier plaisir et nutrition sportive.
            </p>
          </div>
          <AlgerianRecipes />
        </div>
      </section>

      {/* CTA / Coach */}
      <section id="coach" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/10 via-transparent to-brand-gold/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Prêt à transformer ton{" "}
            <span className="text-brand-emerald">alimentation</span> ?
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
            Coaching nutrition inclus dans nos formules Premium dès <span className="text-white font-bold">6 500 DA/mois</span>.
            Atteins tes objectifs plus vite avec un suivi personnalisé.
          </p>
          <Link href="/abonnements" className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-emerald to-emerald-700 text-white px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-brand-emerald/30">
            Voir les abonnements <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </main>
  )
}
