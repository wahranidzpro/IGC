import { Star } from "lucide-react"
import SectionWrapper, { SectionHeader } from "./SectionWrapper"

const testimonials = [
  {
    name: "Amine K.",
    role: "Membre depuis 2024",
    text: "La meilleure salle de Saïda. Le matériel est neuf, l'espace est immense et les coachs sont vraiment à l'écoute. Je recommande à 100%.",
    rating: 5,
  },
  {
    name: "Sara M.",
    role: "Membre depuis 2023",
    text: "Je suis venue pour perdre du poids et j'ai trouvé bien plus qu'une salle : une famille. Les cours collectifs sont top et l'ambiance est incroyable.",
    rating: 5,
  },
  {
    name: "Rachid B.",
    role: "Membre depuis 2025",
    text: "Espace musculation digne des plus grandes salles européennes. Du matériel Technogym, une propreté irréprochable et un personnel compétent.",
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <SectionWrapper dark>
      <SectionHeader title="Ils nous font confiance" subtitle="Découvrez les avis de nos membres" />
      <div className="grid md:grid-cols-3 gap-6">
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
