"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useLanguage } from "@/lib/context/language-context"
import { useState } from "react"
import {
  Home, LogOut, Users, Settings, CreditCard, TrendingDown,
  Package, UserCheck, ClipboardList, MessageSquare,
  Building2, ChevronDown, Trophy, UserPlus, Calendar,
  Wrench, Box, Languages, Database, BarChart3, DoorOpen, Wifi,
  Activity, ShoppingCart, QrCode, Dumbbell, Fingerprint, Gift, ShoppingBag,
  ChevronLeft, ChevronRight, Clock,
} from "lucide-react"

interface NavItem {
  href: string
  labelKey: string
  icon: React.ReactNode
  roles: string[]
}

interface NavSection {
  titleKey: string
  icon: React.ReactNode
  items: NavItem[]
  defaultOpen?: boolean
}

const navSections: NavSection[] = [
  {
    titleKey: "sidebar.principal",
    icon: <Home className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: "/admin", labelKey: "sidebar.dashboard", icon: <Home className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/coach", labelKey: "sidebar.dashboard", icon: <Home className="w-5 h-5" />, roles: ["coach"] },
      { href: "/checkin", labelKey: "sidebar.checkin", icon: <QrCode className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/members", labelKey: "sidebar.members", icon: <Users className="w-5 h-5" />, roles: ["admin", "reception", "coach"] },
      { href: "/members/habits", labelKey: "sidebar.habits", icon: <BarChart3 className="w-5 h-5" />, roles: ["admin"] },
      { href: "/pos", labelKey: "sidebar.pos", icon: <ShoppingCart className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/products", labelKey: "sidebar.products", icon: <Package className="w-5 h-5" />, roles: ["admin", "reception"] },
    ],
  },
  {
    titleKey: "sidebar.materiel",
    icon: <Wrench className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: "/equipment", labelKey: "sidebar.equipment", icon: <Box className="w-5 h-5" />, roles: ["admin"] },
      { href: "/consumables", labelKey: "sidebar.consumables", icon: <ShoppingBag className="w-5 h-5" />, roles: ["admin"] },
    ],
  },
  {
    titleKey: "sidebar.gestion",
    icon: <Dumbbell className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: "/coaches", labelKey: "sidebar.coaches", icon: <UserCheck className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/programs-plans", labelKey: "sidebar.programs", icon: <ClipboardList className="w-5 h-5" />, roles: ["admin", "reception"] },
    ],
  },
  {
    titleKey: "sidebar.access",
    icon: <DoorOpen className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: "/rfid", labelKey: "sidebar.rfid", icon: <Fingerprint className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/turnstiles", labelKey: "sidebar.turnstiles", icon: <DoorOpen className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/turnstiles/logs", labelKey: "sidebar.access.logs", icon: <QrCode className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/turnstiles/install", labelKey: "sidebar.turnstiles.install", icon: <Wifi className="w-5 h-5" />, roles: ["admin"] },
    ],
  },
  {
    titleKey: "sidebar.finance",
    icon: <CreditCard className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: "/finance/assistant", labelKey: "sidebar.finance.assistant", icon: <BarChart3 className="w-5 h-5" />, roles: ["admin"] },
      { href: "/payments", labelKey: "sidebar.payments", icon: <CreditCard className="w-5 h-5" />, roles: ["admin"] },
      { href: "/expenses", labelKey: "sidebar.expenses", icon: <TrendingDown className="w-5 h-5" />, roles: ["admin"] },
    ],
  },
  {
    titleKey: "sidebar.administration",
    icon: <Settings className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: "/notifications", labelKey: "sidebar.notifications", icon: <MessageSquare className="w-5 h-5" />, roles: ["admin", "reception"] },
      { href: "/admin/rewards", labelKey: "sidebar.rewards", icon: <Gift className="w-5 h-5" />, roles: ["admin"] },
      { href: "/admin/audit", labelKey: "sidebar.audit", icon: <Activity className="w-5 h-5" />, roles: ["admin"] },
      { href: "/admin/staff-sessions", labelKey: "sidebar.sessions_staff", icon: <Clock className="w-5 h-5" />, roles: ["admin"] },
      { href: "/admin/loyalty", labelKey: "sidebar.loyalty", icon: <Gift className="w-5 h-5" />, roles: ["admin"] },
      { href: "/admin/database", labelKey: "sidebar.database", icon: <Database className="w-5 h-5" />, roles: ["admin"] },
      { href: "/settings/access", labelKey: "sidebar.pin", icon: <Settings className="w-5 h-5" />, roles: ["admin"] },
    ],
  },
  {
    titleKey: "sidebar.rentabilisation",
    icon: <Trophy className="w-4 h-4" />,
    defaultOpen: false,
    items: [
      { href: "/commissions", labelKey: "sidebar.commissions", icon: <CreditCard className="w-5 h-5" />, roles: ["admin"] },
      { href: "/private-coaching", labelKey: "sidebar.coaching", icon: <UserPlus className="w-5 h-5" />, roles: ["admin"] },
      { href: "/events", labelKey: "sidebar.events", icon: <Calendar className="w-5 h-5" />, roles: ["admin"] },
    ],
  },
  {
    titleKey: "sidebar.config",
    icon: <Building2 className="w-4 h-4" />,
    defaultOpen: false,
    items: [
      { href: "/settings/general", labelKey: "sidebar.settings", icon: <Building2 className="w-5 h-5" />, roles: ["admin"] },
    ],
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { role, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navSections.forEach((section) => {
      initial[section.titleKey] = section.defaultOpen || false
    })
    return initial
  })

  const toggleSection = (titleKey: string) => {
    setOpenSections((prev) => ({ ...prev, [titleKey]: !prev[titleKey] }))
  }

  const effectiveRole = role || "adherent"

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(effectiveRole)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="relative h-full">
      <aside
        className={`${collapsed ? "w-[72px]" : "w-[280px]"} h-full flex flex-col flex-shrink-0 transition-all duration-500 ease-out relative overflow-hidden`}
      >
        {/* Sidebar glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,17,32,0.97)] via-[rgba(10,15,25,0.95)] to-[rgba(5,5,5,0.97)] backdrop-blur-[24px] border-r border-[rgba(255,255,255,0.06)]" />

        {/* Subtle glow edge */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[rgba(10,132,255,0.12)] to-transparent" />

        {/* Gold glow accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,155,60,0.12)] to-transparent" />

        {/* Logo section */}
        <div className={`relative z-10 flex items-center ${collapsed ? "justify-center py-5" : "px-5 py-5"} border-b border-[rgba(255,255,255,0.06)]`}>
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo container with gold glow */}
            <div className={`relative rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 ${collapsed ? "w-11 h-11" : "w-[52px] h-[52px]"} group-hover:scale-105`}>
              {/* Gold gradient overlay for logo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/20 to-[#E0B85D]/5 rounded-2xl" />
              <Image
                src="/logo-transparent.png"
                alt="IGC"
                fill
                className="object-contain relative z-10 drop-shadow-[0_0_20px_rgba(200,155,60,0.3)]"
                style={{ filter: "brightness(1) contrast(1.1) drop-shadow(0 0 8px rgba(200,155,60,0.4))" }}
                sizes="52px"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-black text-white tracking-tight leading-tight">Infinity</span>
                <span className="text-[11px] font-bold tracking-[0.2em] bg-gradient-to-r from-[#C89B3C] to-[#E0B85D] bg-clip-text text-transparent uppercase">Gym Center</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto scrollbar-gold px-2 py-3 space-y-1">
          {filteredSections.map((section) => (
            <div key={section.titleKey} className="space-y-0.5">
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.titleKey)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(168,178,199,0.35)] hover:text-[rgba(168,178,199,0.7)] transition-colors duration-200"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-300 ${openSections[section.titleKey] ? "rotate-0" : "-rotate-90"}`}
                  />
                  {t(section.titleKey)}
                </button>
              )}
              {(!collapsed ? openSections[section.titleKey] : false) &&
                section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative ${
                        isActive
                          ? "bg-gradient-to-r from-[rgba(10,132,255,0.15)] via-[rgba(0,212,255,0.08)] to-[rgba(200,155,60,0.1)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)]"
                          : "text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.04)] hover:shadow-[0_0_15px_rgba(10,132,255,0.04)] border border-transparent"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      {isActive && (
                        <>
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-[#0A84FF] via-[#00D4FF] to-[#C89B3C] shadow-[0_0_12px_rgba(10,132,255,0.5)]" />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(10,132,255,0.05)] to-transparent opacity-50" />
                        </>
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(10,132,255,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      <span className={`shrink-0 transition-all duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_12px_rgba(10,132,255,0.5)]" : "group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(10,132,255,0.2)]"}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="font-medium text-sm whitespace-nowrap">{t(item.labelKey)}</span>
                      )}
                      {isActive && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#0A84FF] via-[#00D4FF] to-[#C89B3C] shadow-[0_0_10px_rgba(10,132,255,0.6)] shrink-0 animate-pulse" />
                      )}
                    </Link>
                  )
                })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={`relative z-10 ${collapsed ? "px-2 py-3 space-y-2" : "px-4 py-3 space-y-1"} border-t border-[rgba(255,255,255,0.06)]`}>
          {!collapsed && (
            <button
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200 border border-transparent text-sm font-medium"
            >
              <Languages className="w-5 h-5 shrink-0" />
              {lang === "fr" ? "العربية" : "Fran\u00e7ais"}
            </button>
          )}
          <button
            onClick={logout}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[#A8B2C7] hover:text-[#FF4D4D] hover:bg-[rgba(255,77,77,0.06)] transition-all duration-200 border border-transparent hover:border-[rgba(255,77,77,0.12)] text-sm font-medium ${collapsed ? "justify-center px-0" : ""}`}
            title="D\u00e9connexion"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{t("sidebar.logout")}</span>}
          </button>
        </div>
      </aside>

      {/* Floating collapse toggle on the right edge */}
      <button
        onClick={onToggle}
        className={`absolute top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-12 rounded-r-xl bg-[rgba(8,17,32,0.95)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] border-l-0 text-[#A8B2C7] hover:text-white hover:border-[rgba(10,132,255,0.3)] transition-all duration-300 group shadow-lg ${
          collapsed ? "right-0 translate-x-0" : "-right-6"
        }`}
        title={collapsed ? "D\u00e9velopper" : "R\u00e9duire"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <ChevronLeft className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        )}
      </button>
    </div>
  )
}
