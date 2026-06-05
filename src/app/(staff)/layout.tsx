"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"
import AccessDenied from "@/components/auth/AccessDenied"
import { Sidebar } from "@/components/layout/Sidebar"
import { Bell, Menu, X } from "lucide-react"

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, role, loading, accessStatus } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isCoachRoute = pathname?.startsWith('/coach')
  const isPosRoute = pathname?.startsWith('/pos')

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  if (!user) return null

  if (role !== "admin" && role !== "reception" && role !== "coach") {
    if (accessStatus && accessStatus.granted === false) {
      return <AccessDenied />
    }
    router.push("/dashboard")
    return null
  }

  // For coach routes, render directly without staff layout wrapper
  if (isCoachRoute) return <>{children}</>
  if (isPosRoute) return <>{children}</>

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #050505 0%, #081120 40%, #0A1628 70%, #050505 100%)" }}>
      {/* Fixed watermark background - always centered, behind everything */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div
          className="w-[60%] h-[60%] max-w-[800px] max-h-[800px] opacity-[0.06]"
          style={{
            backgroundImage: 'url("/logo-transparent.png")',
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "sepia(0.5) saturate(1.5) hue-rotate(-15deg) brightness(0.9)",
          }}
        />
      </div>

      {/* Desktop sidebar - fixed */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 relative z-10 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 glass-strong px-4 h-14 flex items-center justify-between">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#C89B3C] p-0.5 flex items-center justify-center">
              <Image src="/logo-transparent.png" alt="" width={18} height={18} className="object-contain" />
            </div>
            <span className="text-sm font-bold text-white">Infinity Gym</span>
          </div>
          <button className="relative text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF4D4D] rounded-full shadow-[0_0_6px_rgba(255,77,77,0.6)]" />
          </button>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
