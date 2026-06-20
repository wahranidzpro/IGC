"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Dumbbell, Monitor, Clock, Target, CheckCircle, Star, Users } from "lucide-react"
import HomeTrainingCard from "@/components/marketing/HomeTrainingCard"

const programs = [
  { title: "Full Body Express", duration: "20 min", difficulty: "Intermédiaire" as const, calories: "250 kcal", exercises: 8, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop" },
  { title: "HIIT Brûle-Graisse", duration: "15 min", difficulty: "Avancé" as const, calories: "350 kcal", exercises: 12, image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop" },
  { title: "Yoga Récupération", duration: "30 min", difficulty: "Débutant" as const, calories: "120 kcal", exercises: 15, image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&h=400&fit=crop" },
  { title: "Sculpture Musculaire", duration: "35 min", difficulty: "Intermédiaire" as const, calories: "300 kcal", exercises: 10, image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop" },
  { title: "Cardio Dance", duration: "25 min", difficulty: "Débutant" as const, calories: "280 kcal", exercises: 20, image: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=600&h=400&fit=crop" },
  { title: "Renforcement Core", duration: "15 min", difficulty: "Avancé" as const, calories: "200 kcal", exercises: 10, image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&h=400&fit=crop" },
]

const benefits = [
  { icon: Clock, text: "Entraîne-toi quand tu veux, où tu veux" },
  { icon: Target, text: "Programmes adaptés à ton niveau" },
  { icon: Dumbbell, text: "Aucun équipement nécessaire" },
  { icon: Monitor, text: "Vidéos HD avec coach professionnel" },
  { icon: Star, text: "Nouveaux programmes chaque semaine" },
  { icon: Users, text: "Défis entre membres et classements" },
]

export default function HomeTrainingPage() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 4
      const y = (e.clientY / window.innerHeight - 0.5) * 4
      el.style.setProperty("--mx", `${x}px`)
      el.style.setProperty("--my", `${y}px`)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section ref={sectionRef} className="relative min-h-[85vh] flex items-center overflow-hidden" style={{ perspective: "1000px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cyan/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-orange/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold tracking-wider uppercase mb-6">
                Home Training
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
                Ta salle de sport à{" "}
                <span className="text-brand-cyan">domicile</span>
              </h1>
              <p className="text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
                Des programmes complets conçus par nos coachs professionnels. Accessibles depuis ton espace adhérent, 
                où que tu sois, sans aucun équipement nécessaire.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/abonnements" className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-red text-white px-8 py-4 rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-brand-orange/30">
                  Découvrir les abonnements <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/abonnements" className="group inline-flex items-center gap-2 border border-zinc-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-zinc-800 transition-all">
                  Voir les abonnements
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="aspect-[4/3] relative rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl">
                  <Image src="https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=600&fit=crop" alt="Home Training" fill className="object-cover opacity-60" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-brand-cyan" />
                    </div>
                    <div>
                      <p className="text-white font-bold">1,200+</p>
                      <p className="text-zinc-400 text-xs">Programmes suivis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Pourquoi choisir le{" "}
              <span className="text-brand-cyan">Home Training</span> ?
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              La flexibilité de s&apos;entraîner chez soi avec la qualité d&apos;un coaching professionnel.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.text} className="flex items-start gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <p className="text-white font-medium pt-2">{benefit.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section id="videos" className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Un coach dans ton{" "}
                <span className="text-brand-red">salon</span>
              </h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Nos coachs ont conçu des séances filmées en HD avec des instructions claires, 
                des variantes pour tous les niveaux et une musique motivante.
              </p>
              <ul className="space-y-3">
                {["Instructions pas à pas", "Caméras multiples angles", "Musique d'ambiance intégrée"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle className="w-5 h-5 text-brand-cyan" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/B12MXF0bSFo"
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  title="Séance démo Full Body"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section id="programmes" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold tracking-wider uppercase mb-4">
              Programmes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Trouve le programme qui te{" "}
              <span className="text-brand-red">correspond</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Du débutant à l&apos;avancé, du cardio à la musculation, il y a un programme pour chaque objectif.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <HomeTrainingCard key={program.title} {...program} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/abonnements" className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-red text-white px-8 py-4 rounded-xl font-bold hover:brightness-110 transition-all shadow-xl shadow-brand-orange/30">
              Voir nos abonnements — dès 4 500 DA <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Planning */}
      <section id="planning" className="py-20 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Planning <span className="text-brand-cyan">Hebdomadaire</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Un programme varié chaque semaine pour ne jamais t&apos;ennuyer.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 max-w-4xl mx-auto">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, i) => (
              <div key={day} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center hover:border-brand-cyan/30 transition-all">
                <p className="text-zinc-500 text-xs font-semibold uppercase mb-3">{day}</p>
                <p className="text-white text-sm font-medium">{["Full Body", "HIIT", "Yoga", "Cardio", "Sculpture", "HIIT", "Repos"][i]}</p>
                <p className="text-zinc-500 text-[10px] mt-1">{["20 min", "15 min", "30 min", "25 min", "35 min", "15 min", ""][i]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/10 via-brand-red/5 to-brand-cyan/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Prêt à transformer ta{" "}
            <span className="text-brand-red">maison</span> en salle de sport ?
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
            Programmes Home Training inclus dans tous nos abonnements dès <span className="text-white font-bold">4 500 DA/mois</span>.
            Entraîne-toi chez toi quand tu veux, où tu veux.
          </p>
          <Link href="/abonnements" className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-red text-white px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-brand-orange/30">
            Voir nos abonnements <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </main>
  )
}
