import Link from "next/link"
import Image from "next/image"

const footerLinks = [
  {
    title: "Infinity Gym Center",
    links: [
      { label: "Activités", href: "/activites" },
      { label: "Abonnements", href: "/abonnements" },
      { label: "Coaches", href: "/coachs" },
      { label: "Galerie", href: "/galerie" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Espace adhérent",
    links: [
      { label: "Se connecter", href: "/login" },
      { label: "S'inscrire", href: "/signup" },
      { label: "Mon dashboard", href: "/dashboard" },
      { label: "Mon QR code", href: "/dashboard/qr" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "CGV", href: "#" },
      { label: "Mentions légales", href: "#" },
      { label: "Politique de confidentialité", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.jpg"
                alt="Infinity Gym Center"
                width={44}
                height={47}
                className="rounded-full"
              />
              <span className="text-xl font-bold">Infinity Gym Center</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Votre salle de sport premium à Saïda. Musculation, cardio, cross-training et cours
              collectifs dans un environnement moderne et haut de gamme.
            </p>
            <p className="text-white/40 text-xs mt-4">
              Saïda, Algérie · Ambition nationale
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-sm mb-4 text-white/90">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Infinity Gym Center. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            {["Facebook", "Instagram", "TikTok", "YouTube"].map((name) => (
              <Link
                key={name}
                href="#"
                className="text-white/40 hover:text-brand-red transition-colors text-sm"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
