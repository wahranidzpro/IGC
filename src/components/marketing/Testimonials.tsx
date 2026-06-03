import { Star } from "lucide-react"
import SectionWrapper, { SectionHeader } from "./SectionWrapper"

const testimonials = [
  {
    name: "Youcef B.",
    role: "Membre depuis 2024",
    text: "Après 3 mois chez Infinity Gym, j'ai perdu 12 kg et gagné en confiance. Les coachs sont super à l'écoute et le matériel est neuf. La meilleure décision de ma vie !",
    rating: 5,
  },
  {
    name: "Meriem K.",
    role: "Membre depuis 2023",
    text: "Je cherchais une salle propre et accueillante pour femmes. L'espace est top, les cours de fitness collectifs sont incroyables et l'ambiance est vraiment familiale. Je recommande !",
    rating: 5,
  },
  {
    name: "Abdelkader H.",
    role: "Membre depuis 2025",
    text: "Ancien footballeur, j'avais besoin d'une salle avec du matériel professionnel pour ma préparation physique. Infinity Gym a tout : Technogym, Hammer Strength, espaces cardio... Le top à Saïda.",
    rating: 5,
  },
  {
    name: "Mohamed L.",
    role: "Membre depuis 2023",
    text: "Je suis passionné de musculation et j'ai enfin trouvé une salle digne de ce nom à Saïda. Rack à squat, barres olympiques, espace deadlift... C'est le paradis pour les passionnés !",
    rating: 5,
  },
  {
    name: "Fatima Z.",
    role: "Membre depuis 2025",
    text: "Le programme Home Training m'a sauvée quand je ne pouvais pas me déplacer. Des séances complètes à la maison avec les vidéos des coachs. Un service exceptionnel !",
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <SectionWrapper dark>
      <SectionHeader title="Ils nous font confiance" subtitle="Découvrez les avis de nos membres" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-brand-red text-brand-red" />
              ))}
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
            <div>
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-white/40">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
