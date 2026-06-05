"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "@/lib/context/theme-context"
import { ArrowUp, Mail, MapPin, Phone, Clock } from "lucide-react"

const footerGroups = [
  {
    title: "Infinity Gym Center",
    links: [
      { label: "Activités", href: "/activites" },
      { label: "Abonnements", href: "/abonnements" },
      { label: "Nos coachs", href: "/coachs" },
      { label: "Home Training", href: "/home-training" },
      { label: "Nutrition", href: "/nutrition" },
      { label: "Fidélité", href: "/fidelite" },
      { label: "Galerie Média", href: "/galerie-media" },
      { label: "Contact", href: "/contact" },
      { label: "Bons plans", href: "/bon-plan" },
    ],
  },
  {
    title: "Espace adhérent",
    links: [
      { label: "Se connecter", href: "/login" },
      { label: "S'inscrire", href: "/abonnements" },
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

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const socials = [
  { icon: FacebookIcon, href: "https://www.facebook.com/100090491113441/?locale=pl_PL", label: "Facebook" },
  { icon: InstagramIcon, href: "https://www.instagram.com/infin.itygym/", label: "Instagram" },
  { icon: YouTubeIcon, href: "#", label: "YouTube" },
  { icon: TikTokIcon, href: "#", label: "TikTok" },
]

const contactInfo = [
  { icon: MapPin, text: "Saïda, Algérie" },
  { icon: Phone, text: "+213 (0) 123 456 789" },
  { icon: Mail, text: "infinity.gym.ig@gmail.com" },
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
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <Image
                src="/logo-transparent.png"
                alt="Infinity Gym Center"
                width={44}
                height={47}
                className="rounded-xl transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              />
              <div>
                <span className="text-lg font-bold group-hover:text-brand-orange transition-colors cursor-pointer">Infinity Gym Center</span>
                <p className="text-xs opacity-50">Saïda · Ambition nationale</p>
              </div>
            </Link>

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
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
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
