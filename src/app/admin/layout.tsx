"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/layout/Sidebar"
import { Bell, Menu, X } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0B0B0B] via-[#150606] to-[#0B0B0B]">
        <div className="animate-spin w-10 h-10 border-4 border-[#E10600] border-t-transparent rounded-full" />
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
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 h-14">
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo-transparent.png" alt="" width={24} height={26} />
            <span className="text-sm font-bold">Infinity Gym</span>
          </div>
          <button className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E10600] rounded-full" />
          </button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
