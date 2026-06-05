"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import FeatureCard from "@/components/marketing/FeatureCard"
import ServicesGrid from "@/components/marketing/ServicesGrid"
import StatsBanner from "@/components/marketing/StatsBanner"
import Testimonials from "@/components/marketing/Testimonials"
import Newsletter from "@/components/marketing/Newsletter"
import { useTheme } from "@/lib/context/theme-context"
import { Dumbbell, Heart, Zap, Users, ArrowRight } from "lucide-react"

const spaces = [
  {
    title: "Musculation",
    description: "Entraînement de force avec matériel Technogym et Hammer Strength. Développez votre puissance.",
    items: ["Machines haut de gamme", "Poids libres jusqu'à 150kg", "Zone deadlift & squat"],
    image: "/images/musculation.jpg",
    href: "/activites",
  },
  {
    title: "Cardio Training",
    description: "Brûlez un maximum de calories avec nos appareils connectés dernière génération.",
    items: ["Tapis de course, rameurs, vélos", "Programmes connectés", "Zone HIIT dédiée"],
    image: "/images/cardio.jpg",
    href: "/activites",
  },
  {
    title: "Cross Training",
    description: "Des séances WOD à haute intensité pour réveiller l'athlète qui sommeille en vous.",
    items: ["Box, medecine-ball, kettlebells", "WOD quotidiens", "Zone fonctionnelle 200m²"],
    image: "/images/cross-training.jpg",
    href: "/activites",
  },
  {
    title: "Cours collectifs",
    description: "Enchaînez les cours coachés pour un entraînement efficace et motivant en groupe.",
    items: ["BodyPump, RPM, Yoga", "Coach diplômés", "Jusqu'à 30 cours/semaine"],
    image: "/images/cours-collectifs.jpg",
    href: "/activites",
  },
  {
    title: "Boxing",
    description: "Retrouvez l'ambiance des meilleurs clubs de boxe dans un espace dédié en libre accès.",
    items: ["Ring professionnel", "Sacs de frappe", "Cours coachés disponibles"],
    image: "/images/boxing.jpg",
    href: "/activites",
  },
  {
    title: "Espace Sport de Force",
    description: "Un espace dédié au powerlifting et à l'haltérophilie avec du matériel de compétition.",
    items: ["Plateforme Eleiko", "Cages à squat", "Matériel compétition"],
    image: "/images/sport-force.jpg",
    href: "/activites",
  },
]

const services = [
  {
    icon: <Dumbbell className="w-8 h-8" />,
    title: "Équipement haut de gamme",
    description: "Technogym, Hammer Strength, Eleiko — du matériel professionnel pour des résultats optimaux.",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Coaching personnalisé",
    description: "Un coach dédié pour vous accompagner, vous motiver et atteindre vos objectifs plus rapidement.",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Application mobile",
    description: "Suivez vos performances, réservez vos cours et contrôlez votre accès depuis votre téléphone.",
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Bien-être & Récupération",
    description: "Espace stretching, hydromassage et zone de récupération pour prendre soin de votre corps.",
  },
]

function RevealSection({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`} style={style}>
      {children}
    </div>
  )
}

function AccentBar() {
  return (
    <div className="h-2 w-full flex">
      <div className="flex-1 bg-brand-red" />
      <div className="flex-1 bg-brand-accent" />
      <div className="flex-1 bg-brand-gold" />
      <div className="flex-1 bg-brand-blue" />
      <div className="flex-1 bg-brand-green" />
    </div>
  )
}

export default function HomePage() {
  // no video found — all content uses images and cards
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <>
      <Hero
        title="Repoussez vos limites"
        subtitle="Salle de sport premium à Saïda. Musculation, cardio, cross-training et cours collectifs — 7J/7 dans un environnement moderne et motivant."
        cta={{ label: "Découvrir nos abonnements", href: "/abonnements" }}
        secondaryCta={{ label: "Visiter la salle", href: "/galerie-media" }}
        image="/images/hero-home.jpg"
      >
      </Hero>

      <RevealSection>
        <StatsBanner
          stats={[
            { value: "1000+", label: "Membres actifs" },
            { value: "1500m²", label: "Espace d'entraînement" },
            { value: "30+", label: "Cours par semaine" },
            { value: "15+", label: "Coachs diplômés" },
          ]}
        />
      </RevealSection>

      <AccentBar />

      <SectionWrapper>
        <RevealSection>
          <SectionHeader
            title="Nos espaces"
            subtitle="Des zones dédiées pour chaque type d'entraînement, avec du matériel haut de gamme"
          />
        </RevealSection>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space, i) => (
            <RevealSection key={space.title} style={{ transitionDelay: `${i * 100}ms` }}>
              <FeatureCard {...space} />
            </RevealSection>
          ))}
        </div>
        <RevealSection>
          <div className="text-center mt-10">
            <Link
              href="/activites"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-red via-brand-accent to-brand-red bg-[length:200%_100%] hover:bg-right-top text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-brand-red/30 animate-gradient"
            >
              Voir toutes les activités <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </RevealSection>
      </SectionWrapper>

      <SectionWrapper dark>
        <RevealSection>
          <SectionHeader
            title="Pourquoi nous choisir ?"
            subtitle="Ce qui fait d'Infinity Gym Center la salle de sport référence à Saïda"
          />
        </RevealSection>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <RevealSection key={s.title} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? "#fff" : "#0B0B0B" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
                  {s.description}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </SectionWrapper>

      <RevealSection>
        <ServicesGrid />
      </RevealSection>

      <AccentBar />

      <RevealSection>
        <Testimonials />
      </RevealSection>

      <AccentBar />

      <RevealSection>
        <Newsletter />
      </RevealSection>
    </>
  )
}
