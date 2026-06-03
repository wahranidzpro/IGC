import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import PricingCard from "@/components/marketing/PricingCard"
import Newsletter from "@/components/marketing/Newsletter"
import { Check } from "lucide-react"

const plans = [
  {
    id: "mensuel",
    name: "Classic",
    price: "4 500 DA",
    period: "/ mois",
    description: "Accès à la salle en heures creuses",
    features: [
      "Musculation & cardio training",
      "Cours collectifs sélectionnés",
      "Application mobile",
      "Bilan de forme offert",
    ],
    cta: { label: "Je m'abonne", href: "/signup" },
  },
  {
    id: "trimestriel",
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
    id: "annuel",
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
        image="/images/hero-abonnements.jpg"
      />

      <SectionWrapper>
        <SectionHeader
          title="Choisissez votre formule"
          subtitle="Des abonnements flexibles avec ou sans engagement"
        />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} id={plan.id}>
              <PricingCard name={plan.name} price={plan.price} period={plan.period} description={plan.description} highlighted={plan.highlighted} features={plan.features} cta={plan.cta} />
            </div>
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

      <section id="etudiant" className="py-20 bg-gradient-to-br from-zinc-900 to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Tarif Étudiant</h2>
          <p className="text-zinc-400 text-lg mb-6">
            Présente ta carte étudiant et bénéficie de <strong className="text-brand-red">-20%</strong> sur tous nos abonnements.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-white font-bold text-xl">
            3 600 DA <span className="text-zinc-400 text-sm font-normal">/ mois</span>
          </div>
        </div>
      </section>

      <section id="coaching" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 via-brand-accent/5 to-brand-red/5" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Coaching Personnalisé</h2>
          <p className="text-zinc-400 text-lg mb-6">
            Ajoute un suivi coaching individuel à ton abonnement pour des résultats optimaux.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            {[
              { title: "Coaching individuel", price: "+3 000 DA/mois", desc: "2 séances/semaine avec ton coach" },
              { title: "Coaching premium", price: "+5 000 DA/mois", desc: "4 séances/semaine + suivi nutrition" },
            ].map((opt) => (
              <div key={opt.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold text-white mb-1">{opt.title}</h3>
                <p className="text-2xl font-black text-brand-red mb-1">{opt.price}</p>
                <p className="text-sm text-zinc-400">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  )
}
