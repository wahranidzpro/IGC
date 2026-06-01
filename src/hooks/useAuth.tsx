"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export type UserRole = "admin" | "reception" | "coach" | "member"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
  hasAccess: (minLevel: number) => boolean
  dashboardPath: string
}

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  reception: 60,
  staff: 60,
  coach: 40,
  member: 10,
}

export function getDashboardPath(role: string): string {
  if (role === "admin" || role === "staff") return "/admin"
  if (role === "reception") return "/reception"
  if (role === "coach") return "/coach"
  return "/dashboard"
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const VALID_ROLES = new Set(["admin", "reception", "coach", "staff", "member"])

function mapRole(metaRole?: string): UserRole {
  if (metaRole === "staff") return "reception"
  if (VALID_ROLES.has(metaRole ?? "")) return metaRole as UserRole
  return "member"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const buildUser = useCallback((supabaseUser: User): AuthUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    role: mapRole(supabaseUser.user_metadata?.role),
  }), [])

  useEffect(() => {
    const supabase = createClient()

    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("your-project")) {
      setUser({ id: "dev-user", email: "dev@igc.app", role: "admin" })
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(buildUser(session.user))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const newUser = buildUser(session.user)
        setUser(newUser)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [buildUser])

  const login = async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      const role = mapRole(data.user.user_metadata?.role)
      router.push(getDashboardPath(role))
    }
    return { error: error?.message }
  }

  const signup = async (email: string, password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "member" } },
    })
    return { error: error?.message }
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const hasAccess = (minLevel: number) => {
    if (!user) return false
    return (ROLE_HIERARCHY[user.role] ?? 0) >= minLevel
  }

  return (
    <AuthContext.Provider
      value={{
        user, loading, login, signup, logout,
        hasRole, hasAccess,
        dashboardPath: user ? getDashboardPath(user.role) : "/dashboard",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
