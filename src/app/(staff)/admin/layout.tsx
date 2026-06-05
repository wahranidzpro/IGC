"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  if (!user) return null

  if (role !== "admin") {
    router.push("/dashboard")
    return null
  }

  return <>{children}</>
}
