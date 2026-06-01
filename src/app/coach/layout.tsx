"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/layout/Sidebar"
import { Bell, Menu, X } from "lucide-react"

const bottomNavItems = [
  { label: "Dashboard", href: "/coach", icon: "LayoutDashboard" },
  { label: "Adhérents", href: "/coach/members", icon: "Users" },
  { label: "Planning", href: "/coach/schedule", icon: "Calendar" },
  { label: "Messages", href: "/coach/messages", icon: "MessageSquare" },
  { label: "Profil", href: "/coach/profile", icon: "User" },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "coach") {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0B0B0B] via-[#150606] to-[#0B0B0B]">
        <div className="animate-spin w-10 h-10 border-4 border-[#E10600] border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo-transparent.png" alt="" width={24} height={26} />
            <span className="text-sm font-bold">Infinity Gym</span>
          </div>
          <button onClick={() => router.push("/coach/messages")} className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E10600] rounded-full" />
          </button>
        </header>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0">
              <Sidebar collapsed={false} onToggle={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-[#0B0B0B] via-[#150606] to-[#0B0B0B] border-t border-white/5 safe-area-bottom">
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
                  active ? "text-[#E10600]" : "text-white/40 hover:text-white/60"
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
