import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import Newsletter from "@/components/marketing/Newsletter"

const coaches = [
  {
    name: "Mohamed A.",
    role: "Head Coach",
    speciality: "Musculation & Powerlifting",
    bio: "10 ans d'expérience en coaching sportif. Ancien compétiteur de powerlifting, il accompagne les membres vers leurs objectifs de force.",
    image: "/images/coach-mohamed.jpg",
  },
  {
    name: "Ines B.",
    role: "Coach Fitness",
    speciality: "Cardio & Perte de poids",
    bio: "Spécialiste en entraînement cardiovasculaire et nutrition. Elle aide nos membres à transformer leur corps durablement.",
    image: "/images/coach-ines.jpg",
  },
  {
    name: "Karim D.",
    role: "Coach Cross Training",
    speciality: "HIIT & Functional Training",
    bio: "Passionné de cross-training et de sports fonctionnels. Il conçoit des WOD intenses qui repoussent vos limites.",
    image: "/images/coach-karim.jpg",
  },
  {
    name: "Sarah M.",
    role: "Coach Cours Collectifs",
    speciality: "BodyPump, RPM, Yoga",
    bio: "Experte en cours collectifs et bien-être. Elle anime nos sessions avec énergie et bienveillance.",
    image: "/images/coach-sarah.jpg",
  },
  {
    name: "Redouane K.",
    role: "Coach Boxing",
    speciality: "Boxe anglaise & K1",
    bio: "Ancien boxeur professionnel avec 8 ans de carrière. Il encadre nos sessions boxing pour tous niveaux.",
    image: "/images/coach-redouane.jpg",
  },
  {
    name: "Myriam T.",
    role: "Coach Bien-être",
    speciality: "Stretching & Récupération",
    bio: "Spécialiste en mobilité et récupération. Elle accompagne les membres pour améliorer leur souplesse et prévenir les blessures.",
    image: "/images/coach-myriam.jpg",
  },
]

export default function CoachsPage() {
  return (
    <>
      <Hero
        title="Nos coaches"
        subtitle="Une équipe de professionnels diplômés passionnés par leur métier, dédiée à votre réussite."
        height="large"
        image="/images/hero-coachs.jpg"
      />

      <SectionWrapper>
        <SectionHeader
          title="Rencontrez votre coach"
          subtitle="Des experts à votre écoute pour vous guider vers vos objectifs"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <div
              key={coach.name}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div
                className="w-20 h-20 rounded-full bg-cover bg-center mx-auto mb-4"
                style={{ backgroundImage: `url(${coach.image})` }}
              />
              <h3 className="text-lg font-bold text-center">{coach.name}</h3>
              <p className="text-sm text-brand-red font-semibold text-center mt-0.5">{coach.role}</p>
              <p className="text-xs text-gray-400 text-center mt-1">{coach.speciality}</p>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed text-center">{coach.bio}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper dark>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Rencontrez l&apos;un de nos coaches et découvrez
            l&apos;expérience Infinity Gym Center.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-brand-red text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Rencontrer un coach
          </a>
        </div>
      </SectionWrapper>

      <Newsletter />
    </>
  )
}
