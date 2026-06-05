"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { CoachSidebar } from "@/components/coach/CoachSidebar"
import { CoachHeader } from "@/components/coach/CoachHeader"
import { useState } from "react"

const bottomNavItems = [
  { label: "Dashboard", href: "/coach", icon: "LayoutDashboard" },
  { label: "Clients", href: "/coach/members", icon: "Users" },
  { label: "Planning", href: "/coach/schedule", icon: "Calendar" },
  { label: "Messages", href: "/coach/messages", icon: "MessageSquare" },
  { label: "Profil", href: "/coach/profile", icon: "User" },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, role, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (role && role !== "admin" && role !== "coach") {
      router.push("/dashboard")
    }
  }, [role, router])

  if (!user) return null

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #050505 0%, #081120 40%, #0A1628 70%, #050505 100%)" }}>
      {/* Coach Sidebar - desktop */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40">
        <CoachSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 relative z-10 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        {/* Coach Header */}
        <CoachHeader />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-[#050505] via-[#081120] to-[#050505] border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {bottomNavItems.map((item) => {
            const active = item.href === "/coach"
              ? pathname === "/coach"
              : pathname.startsWith(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                  active ? "text-[#C89B3C]" : "text-white/40 hover:text-white/60"
                }`}
              >
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
