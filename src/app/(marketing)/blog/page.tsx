"use client"

import Link from "next/link"
import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import Newsletter from "@/components/marketing/Newsletter"
import { ArrowRight } from "lucide-react"

const articles = [
  {
    title: "Comment débuter la musculation sans se blesser",
    excerpt: "Découvrez les bonnes pratiques pour commencer la musculation en toute sécurité et maximiser vos résultats dès les premières semaines.",
    category: "Conseils",
    date: "15 Mai 2026",
    image: "https://images.unsplash.com/photo-1532386236358-a33d8a9844f0?w=600&q=80",
  },
  {
    title: "Les bienfaits du cross-training sur le corps",
    excerpt: "Le cross-training transforme votre condition physique. Voici pourquoi cette discipline complète séduit de plus en plus d'adeptes.",
    category: "Entraînement",
    date: "8 Mai 2026",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
  },
  {
    title: "Nutrition sportive : que manger avant et après l'effort ?",
    excerpt: "Optimisez vos performances et votre récupération grâce à une alimentation adaptée à vos objectifs fitness.",
    category: "Nutrition",
    date: "1 Mai 2026",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
  },
  {
    title: "5 erreurs à éviter quand on fait du cardio",
    excerpt: "Le cardio est essentiel mais mal fait, il peut être contre-productif. Évitez ces erreurs courantes pour des séances efficaces.",
    category: "Conseils",
    date: "22 Avril 2026",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
  },
  {
    title: "Pourquoi Saïda a besoin d'une salle de sport premium",
    excerpt: "Infinity Gym Center arrive pour révolutionner le fitness à Saïda et proposer des installations dignes des plus grands clubs.",
    category: "Infinity",
    date: "15 Avril 2026",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  },
  {
    title: "Programme abdos : 30 jours pour des résultats visibles",
    excerpt: "Suivez notre programme abdos progressif sur 30 jours et constatez les résultats par vous-même.",
    category: "Programmes",
    date: "8 Avril 2026",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80",
  },
]

export default function BlogPage() {
  return (
    <>
      <Hero
        title="Blog"
        subtitle="Conseils fitness, nutrition, programmes d'entraînement et actualités Infinity Gym Center."
        height="medium"
        image="https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=1920&q=80"
      />

      <SectionWrapper>
        <div className="flex flex-wrap gap-2 mb-10">
          {["Tous", "Conseils", "Entraînement", "Nutrition", "Programmes", "Infinity"].map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                cat === "Tous"
                  ? "bg-brand-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.title}
              href="#"
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div
                className="aspect-[16/9] bg-cover bg-center"
                style={{ backgroundImage: `url(${article.image})` }}
              />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-brand-red bg-brand-red/5 px-2.5 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>
                <h3 className="font-bold text-base mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-gray-700 group-hover:text-brand-red group-hover:gap-2 transition-all">
                  Lire l&apos;article <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionWrapper>

      <Newsletter />
    </>
  )
}
