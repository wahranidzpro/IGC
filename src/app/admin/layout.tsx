"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, Receipt, DollarSign, DoorOpen, LogOut, Menu, X,
} from "lucide-react"

const navItems = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Membres", href: "/admin/membres", icon: Users },
  { label: "Abonnements", href: "/admin/abonnements", icon: Receipt },
  { label: "Revenus", href: "/admin/revenus", icon: DollarSign },
  { label: "Présences", href: "/admin/presence", icon: DoorOpen },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
        return (
          <button
            key={item.href}
            onClick={() => { router.push(item.href); onNavigate?.() }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!user) return null

  const role = user.role
  if (role !== "admin" && role !== "reception" && role !== "coach") {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r h-screen shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/logo.jpg"
              alt="Infinity Gym Center"
              width={40}
              height={43}
              className="rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold text-primary">IGC Admin</h1>
              <p className="text-xs text-muted-foreground">Panneau d'administration</p>
            </div>
          </div>
        </div>
        <SidebarNav />
        <div className="p-4 border-t">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Retour au site
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="" width={28} height={30} className="rounded-full" />
            <h1 className="text-lg font-bold text-primary">IGC Admin</h1>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden bg-card border-b px-4 pb-4 space-y-2">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => { router.push("/dashboard"); setMobileOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Retour au site
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
