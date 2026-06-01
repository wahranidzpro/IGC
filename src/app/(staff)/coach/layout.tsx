"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

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
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "coach") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0B0B0B] via-[#150606] to-[#0B0B0B]">
        <div className="animate-spin w-10 h-10 border-4 border-[#E10600] border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!user) return null

  return (
    <>
      {children}
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
    </>
  )
}
