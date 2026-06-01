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
  { label: "Espace musculation", desc: "Machines Technogym et poids libres", image: "https://images.unsplash.com/photo-1532386236358-a33d8a9844f0?w=600&q=80" },
  { label: "Zone cardio", desc: "Tapis de course et vélos connectés", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80" },
  { label: "Zone cross training", desc: "Espace fonctionnel 200m²", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80" },
  { label: "Studio cours collectifs", desc: "Sonorisation et écrans géants", image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80" },
  { label: "Ring de boxe", desc: "Ring réglementaire professionnel", image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80" },
  { label: "Espace bien-être", desc: "Hydromassage et stretching", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80" },
  { label: "Vestiaires premium", desc: "Douches et casiers sécurisés", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80" },
  { label: "Hall d'accueil", desc: "Espace détente et nutrition", image: "https://images.unsplash.com/photo-1534105615256-b1c9f5bee7c4?w=600&q=80" },
]

export default function GaleriePage() {
  return (
    <>
      <Hero
        title="Galerie"
        subtitle="Découvrez nos installations premium à travers notre galerie photos."
        height="medium"
        image="https://images.unsplash.com/photo-1534105615256-b1c9f5bee7c4?w=1920&q=80"
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

      <Newsletter />
    </>
  )
}
