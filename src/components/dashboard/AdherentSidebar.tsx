"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, QrCode, Bell, MessageSquare, Dumbbell,
  TrendingUp, DoorOpen, CreditCard, Bot, Apple, Users,
  CalendarDays, Gift, UserPlus, User, Settings, ChevronLeft,
  ChevronRight, LogOut,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: <LayoutDashboard className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/workout", label: "Entra\u00eenements", icon: <Dumbbell className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/progress", label: "Mes Progr\u00e8s", icon: <TrendingUp className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/attendance", label: "Pr\u00e9sences", icon: <DoorOpen className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/membership", label: "Abonnement", icon: <CreditCard className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: <Apple className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/coach", label: "Mon Coach", icon: <Users className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/booking", label: "R\u00e9servation", icon: <CalendarDays className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/qr", label: "Mon QR", icon: <QrCode className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/bon-plan", label: "Bons Plans", icon: <Gift className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/referral", label: "Parrainage", icon: <UserPlus className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/messages", label: "Messages", icon: <MessageSquare className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/notifications", label: "Notifications", icon: <Bell className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/profile", label: "Profil", icon: <User className="w-[22px] h-[22px]" /> },
  { href: "/dashboard/settings", label: "Param\u00e8tres", icon: <Settings className="w-[22px] h-[22px]" /> },
  { href: "/ai-coach", label: "Coach IA", icon: <Bot className="w-[22px] h-[22px]" /> },
]

interface AdherentSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function AdherentSidebar({ collapsed = false, onToggle }: AdherentSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const memberName = user && 'name' in user ? (user as any).name : user && 'firstName' in user ? `${(user as any).firstName} ${(user as any).lastName}`.trim() : 'Membre'

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

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
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className={cn(
              "relative rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500",
              collapsed ? "w-11 h-11" : "w-[56px] h-[56px]",
              "group-hover:scale-105",
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/25 to-[#E0B85D]/5 rounded-2xl" />
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_30px_rgba(200,155,60,0.15)]" />
              <span className="relative z-10 text-2xl font-black bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] bg-clip-text text-transparent">
                I
              </span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight leading-tight">Infinity</span>
                <span className="text-[10px] font-bold tracking-[0.25em] bg-gradient-to-r from-[#C89B3C] to-[#E0B85D] bg-clip-text text-transparent uppercase">Espace Membre</span>
              </div>
            )}
          </Link>
        </div>

        <div className="relative z-10 flex items-center px-4 py-2 border-b border-[rgba(200,155,60,0.06)]">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(200,155,60,0.4)]">
              Navigation
            </span>
          )}
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto scrollbar-gold px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative",
                  active
                    ? "bg-gradient-to-r from-[rgba(200,155,60,0.15)] via-[rgba(200,155,60,0.08)] to-[rgba(224,184,93,0.1)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_rgba(200,155,60,0.08)] border border-[rgba(200,155,60,0.2)]"
                    : "text-[#B8C0CC] hover:text-white hover:bg-[rgba(255,255,255,0.04)] hover:shadow-[0_0_15px_rgba(200,155,60,0.04)] border border-transparent",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] shadow-[0_0_12px_rgba(200,155,60,0.5)]" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(200,155,60,0.05)] to-transparent opacity-50" />
                  </>
                )}
                {!active && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(200,155,60,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                <span className={cn(
                  "shrink-0 transition-all duration-300",
                  active ? "scale-110 drop-shadow-[0_0_12px_rgba(200,155,60,0.5)]" : "group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(200,155,60,0.2)]",
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] shadow-[0_0_10px_rgba(200,155,60,0.6)] shrink-0 animate-pulse" />
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
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center text-[#081120] font-black text-sm shadow-[0_0_20px_rgba(200,155,60,0.3)]">
                {memberName[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <div className="relative shrink-0">
                <div className="w-[48px] h-[48px] rounded-full bg-gradient-to-br from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] flex items-center justify-center text-[#081120] font-black text-base shadow-[0_0_25px_rgba(200,155,60,0.35)]">
                  {memberName[0].toUpperCase()}
                </div>
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#C89B3C]/30 to-[#E0B85D]/10 blur-sm -z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{memberName}</p>
                <p className="text-[10px] font-bold tracking-[0.15em] bg-gradient-to-r from-[#C89B3C] to-[#E0B85D] bg-clip-text text-transparent uppercase">
                  Membre Premium
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 w-full py-2.5 rounded-xl text-[#B8C0CC] hover:text-[#FF4D4D] hover:bg-[rgba(255,77,77,0.06)] transition-all duration-200 border border-transparent hover:border-[rgba(255,77,77,0.12)] text-sm font-medium",
              collapsed ? "justify-center px-0" : "px-4",
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>D\u00e9connexion</span>}
          </button>
        </div>
      </aside>

      <button
        onClick={onToggle}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-12 rounded-r-xl bg-[rgba(8,17,32,0.95)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] border-l-0 text-[#B8C0CC] hover:text-white hover:border-[rgba(200,155,60,0.3)] transition-all duration-300 group shadow-lg",
          collapsed ? "right-0 translate-x-0" : "-right-6",
        )}
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
