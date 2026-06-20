"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, type AuthUser } from "@/lib/auth/context"
import type { Member } from "@/lib/db/dexie-db"
import { cn } from "@/lib/utils"
import {
  Home, Users, ClipboardList, Calendar, Apple, BarChart3, Star, Trophy,
  ChevronLeft, ChevronRight, LogOut, Infinity,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: "/coach", label: "Tableau de Bord", icon: <Home className="w-[22px] h-[22px]" /> },
  { href: "/coach/members", label: "Mes Clients", icon: <Users className="w-[22px] h-[22px]" /> },
  { href: "/coach/programs", label: "Programmes", icon: <ClipboardList className="w-[22px] h-[22px]" /> },
  { href: "/coach/schedule", label: "S\u00e9ances", icon: <Calendar className="w-[22px] h-[22px]" /> },
  { href: "/coach/nutrition", label: "Nutrition", icon: <Apple className="w-[22px] h-[22px]" /> },
  { href: "/coach/progress", label: "\u00c9valuations", icon: <BarChart3 className="w-[22px] h-[22px]" /> },
  { href: "/coach/avis", label: "Avis Clients", icon: <Star className="w-[22px] h-[22px]" /> },
  { href: "/coach/challenges", label: "Challenges", icon: <Trophy className="w-[22px] h-[22px]" /> },
]

interface CoachSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function CoachSidebar({ collapsed = false, onToggle }: CoachSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const coachName = user && 'name' in user ? (user as AuthUser).name : user && 'firstName' in user ? `${(user as Member).firstName} ${(user as Member).lastName}`.trim() : 'Coach'

  const isActive = (href: string) =>
    href === "/coach" ? pathname === "/coach" : pathname.startsWith(href)

  return (
    <div className="relative h-full">
      <aside
        className={cn(
          "h-full flex flex-col flex-shrink-0 transition-all duration-500 ease-out relative overflow-hidden",
          collapsed ? "w-[72px]" : "w-[280px]",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#081120] via-[#0a1525] to-[#060d18] backdrop-blur-[24px] border-r border-[rgba(200,155,60,0.08)]" />

        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[rgba(200,155,60,0.15)] to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,155,60,0.2)] to-transparent" />

        <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-radial from-[rgba(200,155,60,0.04)] to-transparent" />

        <div className={cn(
          "relative z-10 flex items-center border-b border-[rgba(200,155,60,0.08)]",
          collapsed ? "justify-center py-5" : "px-5 py-5",
        )}>
          <Link href="/coach" className="flex items-center gap-3 group">
            <div className={cn(
              "relative rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500",
              collapsed ? "w-11 h-11" : "w-[56px] h-[56px]",
              "group-hover:scale-105",
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/25 to-[#E0B85D]/5 rounded-2xl" />
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_30px_rgba(200,155,60,0.15)]" />
              <Infinity className="w-7 h-7 relative z-10 text-[#C89B3C] drop-shadow-[0_0_12px_rgba(200,155,60,0.5)]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight leading-tight bg-gradient-to-r from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] bg-clip-text text-transparent">
                  Infinity
                </span>
                <span className="text-[10px] font-bold tracking-[0.25em] bg-gradient-to-r from-[#C89B3C] to-[#E0B85D] bg-clip-text text-transparent uppercase">
                  ESPACE COACH
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto scrollbar-gold px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative",
                  active
                    ? "bg-gradient-to-r from-[rgba(200,155,60,0.15)] via-[rgba(200,155,60,0.08)] to-transparent text-white shadow-[0_0_25px_rgba(200,155,60,0.1)] border border-[rgba(200,155,60,0.2)]"
                    : "text-[rgba(168,178,199,0.7)] hover:text-[#E0B85D] hover:bg-[rgba(200,155,60,0.04)] hover:shadow-[0_0_15px_rgba(200,155,60,0.03)] border border-transparent",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] shadow-[0_0_12px_rgba(200,155,60,0.6)]" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(200,155,60,0.06)] to-transparent" />
                  </>
                )}
                <span className={cn(
                  "shrink-0 transition-all duration-300",
                  active
                    ? "scale-110 drop-shadow-[0_0_12px_rgba(200,155,60,0.5)] text-[#D6A84F]"
                    : "group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(200,155,60,0.2)]",
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="font-semibold text-sm whitespace-nowrap relative z-10">
                    {item.label}
                  </span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D6A84F] shadow-[0_0_10px_rgba(200,155,60,0.6)] shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className={cn(
          "relative z-10 border-t border-[rgba(200,155,60,0.08)]",
          collapsed ? "px-2 py-3" : "px-4 py-4",
        )}>
          {collapsed ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center text-[#081120] font-black text-sm shadow-[0_0_20px_rgba(200,155,60,0.3)]">
                  {coachName[0].toUpperCase()}
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-[rgba(168,178,199,0.5)] hover:text-[#FF4D4D] hover:bg-[rgba(255,77,77,0.06)] transition-all duration-200 border border-transparent hover:border-[rgba(255,77,77,0.12)]"
                title="D\u00e9connexion"
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] flex items-center justify-center text-[#081120] font-black text-lg shadow-[0_0_25px_rgba(200,155,60,0.35)]">
                    {coachName[0].toUpperCase()}
                  </div>
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#C89B3C]/30 to-[#E0B85D]/10 blur-sm -z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{coachName}</p>
                  <p className="text-[10px] font-bold tracking-[0.15em] bg-gradient-to-r from-[#C89B3C] to-[#E0B85D] bg-clip-text text-transparent uppercase">
                    Coach Premium
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[rgba(168,178,199,0.5)] uppercase tracking-[0.1em]">Niveau Elite</span>
                <div className="flex items-center gap-0.5 ml-auto">
                  {[1, 2, 3, 4, 4.5].map((star, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-[10px]",
                        i < 4 ? "text-[#D6A84F]" : "text-[rgba(214,168,79,0.35)]",
                      )}
                    >
                      &#9733;
                    </span>
                  ))}
                  <span className="text-[10px] font-bold text-[#D6A84F] ml-1">4.5</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[rgba(168,178,199,0.6)] hover:text-[#FF4D4D] hover:bg-[rgba(255,77,77,0.06)] transition-all duration-200 border border-transparent hover:border-[rgba(255,77,77,0.12)] text-sm font-medium"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0" />
                <span>D\u00e9connexion</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <button
        onClick={onToggle}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-12 rounded-r-xl bg-[#081120] backdrop-blur-[12px] border border-[rgba(200,155,60,0.15)] border-l-0 text-[rgba(200,155,60,0.6)] hover:text-[#D6A84F] hover:border-[rgba(200,155,60,0.3)] transition-all duration-300 group shadow-lg",
          collapsed ? "right-0 translate-x-0" : "-right-6",
        )}
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
