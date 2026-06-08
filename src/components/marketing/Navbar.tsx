"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/context/theme-context"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Menu, X, ChevronDown, Dumbbell, Users, CreditCard, Image as ImageIcon, Phone, Sparkles } from "lucide-react"

const megaMenuItems = [
  {
    label: "Activités",
    href: "/activites",
    icon: Dumbbell,
    mega: [
      { label: "Musculation", href: "/activites#musculation" },
      { label: "Cardio", href: "/activites#cardio" },
      { label: "Cross Training", href: "/activites#cross" },
      { label: "Cours collectifs", href: "/activites#cours" },
      { label: "Boxing", href: "/activites#boxing" },
    ],
  },
  {
    label: "Abonnements",
    href: "/abonnements",
    icon: CreditCard,
    mega: [
      { label: "Mensuel", href: "/abonnements#mensuel" },
      { label: "Trimestriel", href: "/abonnements#trimestriel" },
      { label: "Annuel", href: "/abonnements#annuel" },
      { label: "Étudiant", href: "/abonnements#etudiant" },
      { label: "Coaching", href: "/abonnements#coaching" },
    ],
  },
  {
    label: "Coaches",
    href: "/coachs",
    icon: Users,
    mega: [
      { label: "Nos coachs", href: "/coachs" },
    ],
  },
  {
    label: "Home Training",
    href: "/home-training",
    icon: Dumbbell,
    mega: [
      { label: "Programmes à domicile", href: "/home-training#programmes" },
      { label: "Vidéos d'entraînement", href: "/home-training#videos" },
      { label: "Planning hebdomadaire", href: "/home-training#planning" },
    ],
  },
  {
    label: "Nutrition",
    href: "/nutrition",
    icon: Sparkles,
    mega: [
      { label: "Conseils nutrition", href: "/nutrition#conseils" },
      { label: "Recettes healthy", href: "/nutrition#recettes" },
      { label: "Coach nutrition", href: "/nutrition#coach" },
    ],
  },
  {
    label: "Média",
    href: "/galerie-media",
    icon: ImageIcon,
    mega: [
      { label: "Galerie photos", href: "/galerie-media#galerie" },
      { label: "Vidéos d'entraînement", href: "/galerie-media#videos" },
      { label: "Transformations", href: "/galerie-media#transformations" },
    ],
  },
  {
    label: "Contact",
    href: "/contact",
    icon: Phone,
  },
]

const megaLabels = new Set(["Activités", "Abonnements", "Coaches", "Home Training", "Nutrition", "Média"])

export default function Navbar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMega, setOpenMega] = useState<string | null>(null)
  const isDark = theme === "dark"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setOpenMega(null)
  }, [pathname])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? isDark
            ? "bg-gradient-to-r from-[#0A0A0A] via-[#1A0808] to-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl shadow-black/50"
            : "bg-white/95 backdrop-blur-xl shadow-lg"
          : "bg-gradient-to-b from-black/60 to-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className={cn(
            "font-bold text-lg tracking-tight transition-colors shrink-0",
            isDark ? "text-white" : "text-brand-black"
          )}>
            Infinity Gym
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {megaMenuItems.map((item) => {
              const isMega = megaLabels.has(item.label)
              const active = pathname === item.href || pathname.startsWith(item.href + "#")
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => isMega && setOpenMega(item.label)}
                  onMouseLeave={() => isMega && setOpenMega(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      active
                        ? isDark
                          ? "text-white bg-white/10"
                          : "text-brand-red bg-brand-red/5"
                        : isDark
                          ? "text-white/70 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-brand-black hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {isMega && (
                      <ChevronDown className={cn(
                        "w-3 h-3 transition-transform duration-200",
                        openMega === item.label && "rotate-180"
                      )} />
                    )}
                  </Link>

                  {isMega && item.mega && openMega === item.label && (
                    <div className={cn(
                      "absolute top-full left-0 mt-1 w-56 rounded-2xl p-2 shadow-2xl border transition-all duration-200",
                      isDark
                        ? "bg-black/90 backdrop-blur-xl border-white/10"
                        : "bg-white/90 backdrop-blur-xl border-gray-100"
                    )}>
                      {item.mega.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                            isDark
                              ? "text-white/70 hover:text-white hover:bg-white/5"
                              : "text-gray-600 hover:text-brand-black hover:bg-gray-50"
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">

            <Link
              href="/login"
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isDark
                  ? "text-white/70 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-brand-black hover:bg-gray-100"
              )}
            >
              Se connecter
            </Link>

          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn("p-2", isDark ? "text-white" : "text-brand-black")}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className={cn(
          "lg:hidden border-t max-h-[80vh] overflow-y-auto",
          isDark ? "bg-black/95 backdrop-blur-md border-white/10" : "bg-white/95 backdrop-blur-md border-gray-100"
        )}>
          <div className="px-4 py-4 space-y-1">
            {megaMenuItems.map((item) => {
              const active = pathname === item.href
              return (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? isDark ? "text-white bg-white/10" : "text-brand-red bg-brand-red/5"
                        : isDark ? "text-white/70 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-brand-black hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </div>
              )
            })}
            <hr className={cn("my-3", isDark ? "border-white/10" : "border-gray-100")} />
            <Link
              href="/login"
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isDark ? "text-white/70 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-brand-black hover:bg-gray-50"
              )}
            >
              Se connecter
            </Link>

          </div>
        </div>
      )}
    </header>
  )
}
