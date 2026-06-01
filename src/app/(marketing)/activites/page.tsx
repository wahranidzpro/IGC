import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import FeatureCard from "@/components/marketing/FeatureCard"
import Newsletter from "@/components/marketing/Newsletter"

const espaces = [
  {
    title: "Musculation",
    description: "Espace dédié à la prise de masse et au développement de la force. Machines guidées, poids libres et zone deadlift.",
    items: ["Machines Technogym dernière génération", "Barres olympiques et haltères jusqu'à 50kg", "Cages à squat et bancs de développé"],
    image: "/images/musculation.jpg",
    href: "#",
  },
  {
    title: "Cardio Training",
    description: "Zone cardio connectée pour brûler des calories et améliorer votre endurance cardiovasculaire.",
    items: ["Tapis de course, rameurs, elliptiques", "Vélos connectés avec programmes", "Escaliers et machines à grimper"],
    image: "/images/cardio.jpg",
    href: "#",
  },
  {
    title: "Cross Training",
    description: "Espace fonctionnel de 200m² pour des séances HIIT, WOD et entraînements à haute intensité.",
    items: ["Cordes, medecine-balls, kettlebells", "Box jumps et pneus", "Programmes quotidiens"],
    image: "/images/cross-training.jpg",
    href: "#",
  },
  {
    title: "Cours Collectifs",
    description: "Plus de 30 cours par semaine animés par nos coachs diplômés dans notre studio dédié.",
    items: ["BodyPump, RPM, Yoga, Pilates", "HIIT, Step, Abdos-Fessiers", "Cours en petit groupe"],
    image: "/images/cours-collectifs.jpg",
    href: "#",
  },
  {
    title: "Boxing",
    description: "Espace boxe avec ring professionnel, sacs de frappe et zone de combat.",
    items: ["Ring réglementaire", "Sacs de frappe et paos", "Cours collectifs et coaching individuel"],
    image: "/images/boxing.jpg",
    href: "#",
  },
  {
    title: "Zone Sport de Force",
    description: "Section dédiée au powerlifting et à l'haltérophilie avec équipement compétition.",
    items: ["Plateforme Eleiko", "Barres de compétition", "Matériel compétition"],
    image: "/images/sport-force.jpg",
    href: "#",
  },
  {
    title: "Espace Bien-être",
    description: "Zone stretching, mobilité et récupération pour prendre soin de votre corps après l'effort.",
    items: ["Tapis de sol et blocs yoga", "Rouleaux de massage", "Fauteuil hydromassant"],
    image: "/images/bien-etre.jpg",
    href: "#",
  },
  {
    title: "Espace Femme",
    description: "Un espace réservé aux femmes pour s'entraîner en toute sérénité.",
    items: ["Machines adaptées", "Cours réservés", "Ambiance conviviale et sécurisée"],
    image: "/images/espace-femme.jpg",
    href: "#",
  },
]

export default function ActivitesPage() {
  return (
    <>
      <Hero
        title="Activités & services"
        subtitle="Musculation, cardio, cross-training, boxing, cours collectifs… Trouvez l'activité qui vous correspond et dépassez vos objectifs."
        height="large"
        image="/images/hero-activites.jpg"
      />

      <SectionWrapper>
        <SectionHeader
          title="Tous nos espaces"
          subtitle="Des installations premium pour tous les types d'entraînement"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {espaces.map((espace) => (
            <FeatureCard key={espace.title} {...espace} />
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper dark>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Application Infinity Gym Center
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Suivez votre progression, réservez vos cours, accédez à la salle avec votre
              téléphone et bien plus encore. Votre salle dans votre poche.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Badge d'entrée numérique",
                "Planning des cours en temps réel",
                "Suivi des performances",
                "Programmes d'entraînement personnalisés",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="w-1.5 h-1.5 bg-brand-red rounded-full shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-white/10 rounded-lg text-xs text-white/60">App Store</span>
              <span className="px-4 py-2 bg-white/10 rounded-lg text-xs text-white/60">Google Play</span>
            </div>
          </div>
          <div
            className="aspect-[4/3] rounded-2xl bg-cover bg-center border border-white/10"
            style={{ backgroundImage: "url(/images/activites-app.jpg)" }}
          />
        </div>
      </SectionWrapper>

      <Newsletter />
    </>
  )
}
