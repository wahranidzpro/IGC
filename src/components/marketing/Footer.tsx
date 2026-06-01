"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "@/lib/context/theme-context"
import { Globe, Camera, Video, Music2, ArrowUp, Mail, MapPin, Phone, Clock } from "lucide-react"

const footerGroups = [
  {
    title: "Infinity Gym Center",
    links: [
      { label: "Activités", href: "/activites" },
      { label: "Abonnements", href: "/abonnements" },
      { label: "Nos coachs", href: "/coachs" },
      { label: "Galerie", href: "/galerie" },
      { label: "Contact", href: "/contact" },
      { label: "Bons plans", href: "/bon-plan" },
    ],
  },
  {
    title: "Espace adhérent",
    links: [
      { label: "Se connecter", href: "/login" },
      { label: "S'inscrire", href: "/signup" },
      { label: "Mon dashboard", href: "/dashboard" },
      { label: "Mon QR code", href: "/dashboard/qr" },
      { label: "Coach IA", href: "/ai-coach" },
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

const socials = [
  { icon: Globe, href: "https://www.facebook.com/100090491113441/?locale=pl_PL", label: "Facebook" },
  { icon: Camera, href: "https://www.instagram.com/infin.itygym/", label: "Instagram" },
  { icon: Video, href: "#", label: "YouTube" },
  { icon: Music2, href: "#", label: "TikTok" },
]

const contactInfo = [
  { icon: MapPin, text: "Saïda, Algérie" },
  { icon: Phone, text: "+213 (0) 123 456 789" },
  { icon: Mail, text: "contact@infinity-gym.dz" },
  { icon: Clock, text: "6h - 23h · 7J/7" },
]

export default function Footer() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  return (
    <footer className={cn(
      "relative bg-gradient-to-br from-brand-black via-[#1a0808] to-brand-black text-white border-t border-white/5"
    )}>
      <button
        onClick={scrollToTop}
        className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-red text-white shadow-lg shadow-brand-red/30 flex items-center justify-center hover:bg-red-700 transition-all hover:-translate-y-0.5"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-transparent.png"
                alt="Infinity Gym Center"
                width={44}
                height={47}
                className="rounded-xl"
              />
              <div>
                <span className="text-lg font-bold">Infinity Gym Center</span>
                <p className="text-xs opacity-50">Saïda · Ambition nationale</p>
              </div>
            </div>

            <p className={cn(
              "text-sm leading-relaxed max-w-xs mb-6",
              isDark ? "text-white/50" : "text-gray-500"
            )}>
              Votre salle de sport premium à Saïda. Musculation, cardio, cross-training et cours collectifs dans un environnement moderne et haut de gamme.
            </p>

            <div className="space-y-2 mb-6">
              {contactInfo.map((item) => (
                <div key={item.text} className={cn(
                  "flex items-center gap-2 text-xs",
                  isDark ? "text-white/50" : "text-gray-500"
                )}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                      isDark
                        ? "bg-white/5 text-white/40 hover:bg-brand-red hover:text-white"
                        : "bg-gray-200 text-gray-500 hover:bg-brand-red hover:text-white"
                    )}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                )
              })}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm transition-colors",
                        isDark ? "text-white/50 hover:text-brand-red" : "text-gray-500 hover:text-brand-red"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={cn(
          "border-t mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4",
          isDark ? "border-white/5" : "border-gray-200"
        )}>
          <p className={cn(
            "text-xs",
            isDark ? "text-white/30" : "text-gray-400"
          )}>
            &copy; {new Date().getFullYear()} Infinity Gym Center. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className={cn(
              "text-xs transition-colors",
              isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-600"
            )}>CGV</Link>
            <Link href="#" className={cn(
              "text-xs transition-colors",
              isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-600"
            )}>Mentions légales</Link>
            <Link href="#" className={cn(
              "text-xs transition-colors",
              isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-600"
            )}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}
