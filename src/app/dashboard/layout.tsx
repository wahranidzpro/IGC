"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, QrCode, CreditCard, DoorOpen, Dumbbell,
  Apple, TrendingUp, Users, MessageSquare, Bell, User, Settings,
  ChevronDown, LogOut, Menu, X,
} from "lucide-react"

const navSections = [
  {
    label: "Général",
    items: [
      { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
      { label: "Mon QR", href: "/dashboard/qr", icon: QrCode },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Sport",
    items: [
      { label: "Abonnement", href: "/dashboard/membership", icon: CreditCard },
      { label: "Présences", href: "/dashboard/attendance", icon: DoorOpen },
      { label: "Entraînements", href: "/dashboard/workout", icon: Dumbbell },
      { label: "Progrès", href: "/dashboard/progress", icon: TrendingUp },
    ],
  },
  {
    label: "Bien-être",
    items: [
      { label: "Nutrition", href: "/dashboard/nutrition", icon: Apple },
      { label: "Mon coach", href: "/dashboard/coach", icon: Users },
    ],
  },
  {
    label: "Compte",
    items: [
      { label: "Profil", href: "/dashboard/profile", icon: User },
      { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

const bottomNavItems = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mon QR", href: "/dashboard/qr", icon: QrCode },
  { label: "Sport", href: "/dashboard/workout", icon: Dumbbell },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Profil", href: "/dashboard/profile", icon: User },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggle = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  useEffect(() => {
    const current = navSections.find((s) =>
      s.items.some((item) => pathname === item.href)
    )
    if (current) {
      setOpenSections((prev) => ({ ...prev, [current.label]: true }))
    }
  }, [pathname])

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
      {navSections.map((section) => (
        <div key={section.label}>
          <button
            onClick={() => toggle(section.label)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
          >
            {section.label}
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform",
                openSections[section.label] && "rotate-180"
              )}
            />
          </button>
          {openSections[section.label] !== false && (
            <div className="space-y-0.5 mt-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href
                return (
                  <button
                    key={item.href}
                    onClick={() => { onNavigate?.(); window.location.href = item.href }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-brand-black text-white h-screen shrink-0 fixed left-0 top-0 z-40">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="" width={38} height={40} className="rounded-full" />
            <div>
              <h1 className="text-base font-bold leading-tight">Infinity</h1>
              <p className="text-[10px] text-white/40">Gym Center</p>
            </div>
          </Link>
        </div>

        <SidebarNav />

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red text-xs font-bold">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email?.split("@")[0]}</p>
              <p className="text-[10px] text-white/40">Membre</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-brand-black">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="" width={24} height={26} className="rounded-full" />
            <span className="text-sm font-bold">Infinity Gym</span>
          </div>
          <button onClick={() => router.push("/dashboard/notifications")} className="relative">
            <Bell className="w-5 h-5 text-brand-black" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red rounded-full" />
          </button>
        </header>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-brand-black text-white h-full overflow-y-auto">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/logo.jpg" alt="" width={32} height={34} className="rounded-full" />
                  <span className="font-bold text-sm">Infinity Gym</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setSidebarOpen(false)} />
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => { logout(); setSidebarOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-brand-black border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {bottomNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors",
                  active ? "text-brand-red" : "text-white/40 hover:text-white/60"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "fill-brand-red/10")} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
