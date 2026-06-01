"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

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
  if (role !== "admin" && role !== "reception") {
    router.push("/dashboard")
    return null
  }

  return <>{children}</>
}
