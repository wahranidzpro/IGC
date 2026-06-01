import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import PricingCard from "@/components/marketing/PricingCard"
import Newsletter from "@/components/marketing/Newsletter"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Classic",
    price: "4 500 DA",
    period: "/ mois",
    description: "Accès à la salle en heures creuses",
    features: [
      "Accès salle 8h-16h en semaine",
      "Musculation & cardio training",
      "Cours collectifs sélectionnés",
      "Application mobile",
      "Bilan de forme offert",
    ],
    cta: { label: "Je m'abonne", href: "/signup" },
  },
  {
    name: "Premium",
    price: "6 500 DA",
    period: "/ mois",
    description: "Accès illimité à tous les espaces",
    highlighted: true,
    features: [
      "Accès illimité 6h-23h, 7J/7",
      "Tous les espaces : muscu, cardio, cross, boxing",
      "Tous les cours collectifs",
      "Application mobile avec suivi",
      "2 séances coaching perso offertes",
      "Accès événements exclusifs",
    ],
    cta: { label: "Je m'abonne", href: "/signup" },
  },
  {
    name: "Ultimate",
    price: "8 500 DA",
    period: "/ mois",
    description: "L'expérience fitness ultime",
    features: [
      "Tout l'abonnement Premium",
      "Coaching personnalisé illimité",
      "Bilan nutritionnel",
      "Accès prioritaire aux cours",
      "Invitations événements VIP",
      "Frais d'adhésion offerts",
      "Accès à toutes les futures salles du réseau",
    ],
    cta: { label: "Je m'abonne", href: "/signup" },
  },
]

const included = [
  { title: "Ouvert 6h-23h", sub: "7J/7, même les jours fériés" },
  { title: "Matériel premium", sub: "Technogym, Hammer Strength, Eleiko" },
  { title: "Coaches diplômés", sub: "Encadrement professionnel" },
  { title: "Espace bien-être", sub: "Hydromassage & stretching" },
  { title: "Application mobile", sub: "Badge, cours, suivi" },
  { title: "Sans engagement", sub: "Ou engagement 1 an - vous choisissez" },
]

export default function AbonnementsPage() {
  return (
    <>
      <Hero
        title="Nos abonnements"
        subtitle="Des formules adaptées à tous les objectifs et tous les budgets. Rejoignez la salle de sport premium de Saïda."
        height="large"
        image="https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=1920&q=80"
      />

      <SectionWrapper>
        <SectionHeader
          title="Choisissez votre formule"
          subtitle="Des abonnements flexibles avec ou sans engagement"
        />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper dark>
        <SectionHeader title="Tout compris dans vos abonnements" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {included.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white text-sm">{item.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <Newsletter />
    </>
  )
}
