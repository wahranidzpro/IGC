import { Camera, Globe } from "lucide-react"
import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import Newsletter from "@/components/marketing/Newsletter"

const categories = [
  { name: "Musculation", color: "from-brand-red/20 to-black" },
  { name: "Cardio", color: "from-brand-red/15 to-black" },
  { name: "Cross Training", color: "from-brand-red/25 to-black" },
  { name: "Cours Collectifs", color: "from-brand-red/20 to-black" },
  { name: "Boxing", color: "from-brand-red/30 to-black" },
  { name: "Bien-être", color: "from-brand-red/15 to-black" },
]

const galleryItems = [
  { label: "Espace musculation", desc: "Machines Technogym et poids libres", image: "/images/musculation.jpg" },
  { label: "Zone cardio", desc: "Tapis de course et vélos connectés", image: "/images/cardio.jpg" },
  { label: "Zone cross training", desc: "Espace fonctionnel 200m²", image: "/images/cross-training.jpg" },
  { label: "Studio cours collectifs", desc: "Sonorisation et écrans géants", image: "/images/cours-collectifs.jpg" },
  { label: "Ring de boxe", desc: "Ring réglementaire professionnel", image: "/images/boxing.jpg" },
  { label: "Espace bien-être", desc: "Hydromassage et stretching", image: "/images/bien-etre.jpg" },
  { label: "Vestiaires premium", desc: "Douches et casiers sécurisés", image: "/images/vestiaires.jpg" },
  { label: "Hall d'accueil", desc: "Espace détente et nutrition", image: "/images/hall-accueil.jpg" },
]

export default function GaleriePage() {
  return (
    <>
      <Hero
        title="Galerie"
        subtitle="Découvrez nos installations premium à travers notre galerie photos."
        height="medium"
        image="/images/hero-galerie.jpg"
      />

      <SectionWrapper>
        <SectionHeader
          title="Nos installations"
          subtitle="1500m² dédiés à votre bien-être et à votre performance"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {galleryItems.map((item) => (
            <div
              key={item.label}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-white/60 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper dark>
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <span
              key={cat.name}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r ${cat.color} text-white border border-white/10`}
            >
              {cat.name}
            </span>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <SectionHeader
          title="Suivez-nous"
          subtitle="Retrouvez-nous sur les réseaux sociaux"
        />
        <div className="flex flex-wrap gap-6 justify-center">
          <a
            href="https://www.instagram.com/infin.itygym/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-orange-500 text-white font-bold text-lg shadow-xl shadow-pink-600/20 hover:shadow-pink-600/40 hover:-translate-y-0.5 transition-all"
          >
            <Camera className="w-7 h-7" />
            <span>Instagram</span>
            <span className="text-white/60 text-sm font-normal">@infin.itygym</span>
          </a>
          <a
            href="https://www.facebook.com/100090491113441/?locale=pl_PL"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-white font-bold text-lg shadow-xl shadow-blue-700/20 hover:shadow-blue-700/40 hover:-translate-y-0.5 transition-all"
          >
            <Globe className="w-7 h-7" />
            <span>Facebook</span>
            <span className="text-white/60 text-sm font-normal">Infinity Gym Center</span>
          </a>
        </div>
      </SectionWrapper>

      <Newsletter />
    </>
  )
}
