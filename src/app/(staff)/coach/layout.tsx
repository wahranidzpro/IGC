"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { CoachSidebar } from "@/components/coach/CoachSidebar"
import { CoachHeader } from "@/components/coach/CoachHeader"
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Info,
} from "lucide-react"

const bottomNavItems = [
  { label: "Dashboard", href: "/coach", icon: LayoutDashboard },
  { label: "Adhérents", href: "/coach/members", icon: Users },
  { label: "Planning", href: "/coach/schedule", icon: Calendar },
  { label: "Messages", href: "/coach/messages", icon: MessageSquare },
  { label: "Infos", href: "/coach/progress", icon: Info },
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
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto pb-[85px] lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30" style={{ background: "rgba(8,15,35,0.95)" }}>
        <div className="flex items-center justify-around h-[85px] border-t border-[rgba(255,255,255,0.06)]">
          {bottomNavItems.map((item) => {
            const active = item.href === "/coach"
              ? pathname === "/coach"
              : pathname.startsWith(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-200"
                style={{ color: active ? "#0A84FF" : "rgba(184,192,204,0.4)" }}
              >
                <span className="relative inline-flex">
                  <item.icon className="w-5 h-5" style={{ filter: active ? "drop-shadow(0 0 8px rgba(10,132,255,0.5))" : "none" }} />
                </span>
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
