"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"
import AccessDenied from "@/components/auth/AccessDenied"
import { cn } from "@/lib/utils"
import { startHeartbeat } from "@/lib/device"
import { AdherentSidebar } from "@/components/dashboard/AdherentSidebar"
import NotificationBadge from "@/components/dashboard/mobile/NotificationBadge"
import { createBrowserClient } from "@supabase/ssr"
import {
  LayoutDashboard, Dumbbell, MessageSquare, Bell, User,
  Menu, X, Bot, QrCode, Grid3x3,
} from "lucide-react"

const bottomNavItems = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Coach IA", href: "/ai-coach", icon: Bot },
  { label: "Sport", href: "/dashboard/workout", icon: Dumbbell },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Profil", href: "/dashboard/profile", icon: User },
]

const adherentBottomNav = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profil", href: "/dashboard/profile", icon: User },
  { label: "QR Code", href: "/dashboard/qr", icon: QrCode, isQr: true },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Plus", href: "/dashboard/plus", icon: Grid3x3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, role, loading, logout, accessStatus } = useAuth()
  const isAdherent = role === "adherent"
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [qrMode, setQrMode] = useState(false)
  const [memberId, setMemberId] = useState<string | undefined>()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    const id = setTimeout(() => setSidebarOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname])

  useEffect(() => {
    document.body.classList.add('dashboard-active')
    return () => document.body.classList.remove('dashboard-active')
  }, [])

  useEffect(() => {
    const t = setInterval(() => setQrMode(v => !v), 6000)
    return () => clearInterval(t)
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
        (payload: { new: Record<string, unknown> }) => {
          const profile = payload.new
          if (profile.device_fingerprint === null && profile.device_locked === false) {
            logout()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, logout, supabase])

  useEffect(() => {
    const u = user
    if (!u) return
    (async () => {
      const { data: m } = await supabase.from("members").select("id").eq("profile_id", u.id).maybeSingle()
      if (m) setMemberId((m as { id: string }).id)
    })()
  }, [user, supabase])

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

        <main className={`flex-1 ${isAdherent ? "pb-[85px]" : "pb-20"} lg:pb-0`}>{children}</main>
      </div>

      {/* Bottom navigation mobile - Adherent */}
      {isAdherent && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30" style={{ background: "rgba(8,15,35,0.95)" }}>
          <div className="flex items-center justify-around h-[85px] border-t border-[rgba(255,255,255,0.06)] relative">
            {adherentBottomNav.map((item) => {
              if (item.isQr) {
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
                    style={{ width: 76, height: 76 }}
                  >
                    <div
                      className="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center transition-all duration-700"
                      style={{
                        background: qrMode
                          ? "linear-gradient(135deg, #FF6B35, #FF4D4D)"
                          : "linear-gradient(135deg, #0A84FF, #0066CC)",
                        boxShadow: qrMode
                          ? "0 0 40px rgba(255,107,53,0.7)"
                          : "0 0 30px rgba(0,100,255,0.6)",
                      }}
                    >
                      <span className="transition-all duration-700" style={{ opacity: qrMode ? 0 : 1, position: qrMode ? "absolute" : "relative" }}>
                        <QrCode className="w-5 h-5 text-white" />
                      </span>
                      <span className="transition-all duration-700 flex flex-col items-center" style={{ opacity: qrMode ? 1 : 0, position: qrMode ? "relative" : "absolute" }}>
                        <span className="text-white text-lg font-black leading-none">➜</span>
                        <span className="text-[7px] font-bold text-white/90 leading-tight text-center mt-0.5">
                          ENTRÉE
                        </span>
                      </span>
                    </div>
                  </button>
                )
              }
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-200"
                  style={{ color: active ? "#0A84FF" : "rgba(184,192,204,0.4)" }}
                >
                  <span className="relative inline-flex">
                    {item.label === "Notifications" ? (
                      <>
                        <Bell className="w-5 h-5" style={{ filter: active ? "drop-shadow(0 0 8px rgba(10,132,255,0.5))" : "none" }} />
                        <NotificationBadge memberId={memberId} />
                      </>
                    ) : (
                      <item.icon className="w-5 h-5" style={{ filter: active ? "drop-shadow(0 0 8px rgba(10,132,255,0.5))" : "none" }} />
                    )}
                  </span>
                  <span className="text-[9px] font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Bottom navigation mobile - Staff */}
      {!isAdherent && (
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
      )}
    </div>
  )
}
