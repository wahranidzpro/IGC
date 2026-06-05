"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"
import AccessDenied from "@/components/auth/AccessDenied"
import { cn } from "@/lib/utils"
import { startHeartbeat } from "@/lib/device"
import { AdherentSidebar } from "@/components/dashboard/AdherentSidebar"
import { createBrowserClient } from "@supabase/ssr"
import {
  LayoutDashboard, Dumbbell, MessageSquare, Bell, User,
  Menu, X, Bot,
} from "lucide-react"

const bottomNavItems = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Coach IA", href: "/ai-coach", icon: Bot },
  { label: "Sport", href: "/dashboard/workout", icon: Dumbbell },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Profil", href: "/dashboard/profile", icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout, accessStatus } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    document.body.classList.add('dashboard-active')
    return () => document.body.classList.remove('dashboard-active')
  }, [])

  useEffect(() => {
    const stop = user ? startHeartbeat() : undefined
    return () => stop?.()
  }, [user])

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-session")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user?.id}`,
        },
        (payload: any) => {
          const profile = payload.new as any
          if (profile.device_fingerprint === null && profile.device_locked === false) {
            logout()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, logout])

  if (!user) return null
  if (accessStatus && accessStatus.granted === false) {
    return <AccessDenied />
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #030712 0%, #071326 40%, #081120 70%, #030712 100%)" }}>
      {/* Watermark logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div
          className="w-[60%] h-[60%] max-w-[800px] max-h-[800px] opacity-[0.05]"
          style={{
            backgroundImage: 'url("/logo-transparent.png")',
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "sepia(0.5) saturate(1.5) hue-rotate(-15deg) brightness(0.9)",
          }}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40">
        <AdherentSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 relative z-10 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 glass-strong px-4 h-14 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]" style={{ background: "rgba(7,19,38,0.95)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#C89B3C] p-0.5 flex items-center justify-center">
              <Image src="/logo-transparent.png" alt="" width={18} height={18} className="object-contain" />
            </div>
            <span className="text-sm font-bold text-white">Infinity Gym</span>
          </div>
          <button onClick={() => router.push("/dashboard/notifications")} className="relative text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF4D4D] rounded-full shadow-[0_0_6px_rgba(255,77,77,0.6)]" />
          </button>
        </header>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72">
              <AdherentSidebar onToggle={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Bottom navigation mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30" style={{ background: "rgba(7,19,38,0.97)" }}>
        <div className="flex items-center justify-around h-14 border-t border-[rgba(255,255,255,0.06)]">
          {bottomNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-200",
                  active ? "text-[#C89B3C]" : "text-[rgba(184,192,204,0.4)] hover:text-[rgba(184,192,204,0.7)]"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_rgba(200,155,60,0.5)]")} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
