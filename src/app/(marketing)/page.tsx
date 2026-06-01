import Link from "next/link"
import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import FeatureCard from "@/components/marketing/FeatureCard"
import StatsBanner from "@/components/marketing/StatsBanner"
import Testimonials from "@/components/marketing/Testimonials"
import Newsletter from "@/components/marketing/Newsletter"
import { Dumbbell, Heart, Zap, Users, ArrowRight } from "lucide-react"

const spaces = [
  {
    title: "Musculation",
    description: "Entraînement de force avec matériel Technogym et Hammer Strength. Développez votre puissance et sculptez votre corps.",
    items: ["Machines haut de gamme", "Poids libres jusqu'à 150kg", "Zone deadlift & squat"],
    image: "https://images.unsplash.com/photo-1532386236358-a33d8a9844f0?w=600&q=80",
    href: "/activites",
  },
  {
    title: "Cardio Training",
    description: "Brûlez un maximum de calories et améliorez votre endurance avec nos appareils connectés dernière génération.",
    items: ["Tapis de course, rameurs, vélos", "Programmes connectés", "Zone HIIT dédiée"],
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    href: "/activites",
  },
  {
    title: "Cross Training",
    description: "Des séances WOD à haute intensité pour réveiller l'athlète qui sommeille en vous.",
    items: ["Box, medecine-ball, kettlebells", "WOD quotidiens", "Zone fonctionnelle 200m²"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
    href: "/activites",
  },
  {
    title: "Cours collectifs",
    description: "Enchaînez les cours coachés pour un entraînement efficace et motivant en groupe.",
    items: ["BodyPump, RPM, Yoga", "Coach diplômés", "Jusqu'à 30 cours/semaine"],
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80",
    href: "/activites",
  },
  {
    title: "Boxing",
    description: "Retrouvez l'ambiance des meilleurs clubs de boxe dans un espace dédié en libre accès.",
    items: ["Ring professionnel", "Sacs de frappe", "Cours coachés disponibles"],
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80",
    href: "/activites",
  },
  {
    title: "Espace Sport de Force",
    description: "Un espace dédié au powerlifting et à l'haltérophilie avec du matériel de compétition.",
    items: ["Plateforme Eleiko", "Cages à squat", "Matériel compétition"],
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80",
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

export default function HomePage() {
  return (
    <>
      <Hero
        title="Repoussez vos limites"
        subtitle="Salle de sport premium à Saïda. Musculation, cardio, cross-training et cours collectifs — 7J/7 dans un environnement moderne et motivant."
        cta={{ label: "Découvrir nos abonnements", href: "/abonnements" }}
        secondaryCta={{ label: "Visiter la salle", href: "/galerie" }}
        image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
      >
        <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/50">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
            Ouvert 6h - 23h
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
            7J/7
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
            Essai gratuit
          </span>
        </div>
      </Hero>

      <StatsBanner
        stats={[
          { value: "1000+", label: "Membres actifs" },
          { value: "1500m²", label: "Espace d'entraînement" },
          { value: "30+", label: "Cours par semaine" },
          { value: "15+", label: "Coachs diplômés" },
        ]}
      />

      <SectionWrapper>
        <SectionHeader
          title="Nos espaces"
          subtitle="Des zones dédiées pour chaque type d'entraînement, avec du matériel haut de gamme"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <FeatureCard key={space.title} {...space} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/activites"
            className="inline-flex items-center gap-2 bg-brand-black text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
          >
            Voir toutes les activités <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SectionWrapper>

      <SectionWrapper dark>
        <SectionHeader
          title="Pourquoi nous choisir ?"
          subtitle="Ce qui fait d'Infinity Gym Center la salle de sport référence à Saïda"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.title} className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                {s.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <Testimonials />

      <Newsletter />
    </>
  )
}
