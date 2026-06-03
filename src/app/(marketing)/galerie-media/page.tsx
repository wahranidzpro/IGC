"use client"

import { useState } from "react"
import HeroMedia from "@/components/galerie/HeroMedia"
import Categories from "@/components/galerie/Categories"
import GalerieVideos from "@/components/galerie/GalerieVideos"
import GaleriePhotos from "@/components/galerie/GaleriePhotos"
import ExercicesPopulaires from "@/components/galerie/ExercicesPopulaires"
import Transformations from "@/components/galerie/Transformations"
import ReseauxSociaux from "@/components/galerie/ReseauxSociaux"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import Newsletter from "@/components/marketing/Newsletter"

export default function GalerieMediaPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  return (
    <>
      <HeroMedia />
      <Categories active={activeCategory} onSelect={setActiveCategory} />
      <GalerieVideos categoryFilter={activeCategory} />
      <GaleriePhotos categoryFilter={activeCategory} />
      <ExercicesPopulaires />
      <Transformations />
      <SectionWrapper dark>
        <SectionHeader
          title="Prêt à Rejoindre l'Aventure ?"
          subtitle="Commencez votre transformation dès aujourd'hui dans la salle la plus motivante de la ville"
        />
        <div className="text-center mt-8">
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-red to-red-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105"
          >
            Réserver une séance d&apos;essai
          </a>
        </div>
      </SectionWrapper>
      <ReseauxSociaux />
      <Newsletter />
    </>
  )
}
