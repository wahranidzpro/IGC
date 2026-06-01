'use client'
import { createContext, useContext, createElement, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

interface User { id: string; email?: string; role?: string; name?: string; username?: string; pin?: string; is_locked?: boolean; coachId?: string | number; firstName?: string }

interface AccessStatus {
  granted: boolean
  message: string
  reason?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  role: string | null
  accessStatus: AccessStatus | null
  login: (username: string, password: string, mode?: string) => Promise<{ success: boolean; error?: string }>
  loginAsAdherent: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  checkAccess: () => Promise<void>
  createUserInCloud: (user: { username: string; password: string; pin: string; role: string; name: string; phone?: string }) => Promise<{ id?: string }>
  updateUserInCloud: (data: Record<string, any>) => Promise<void>
  deleteUserFromCloud: (userId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, error: null, role: null, accessStatus: null,
  login: async () => ({ success: false }),
  loginAsAdherent: async () => ({ success: false }),
  logout: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
  checkAccess: async () => {},
  createUserInCloud: async () => ({}),
  updateUserInCloud: async () => {},
  deleteUserFromCloud: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null)

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email, ...data.user.user_metadata as any })
      setLoading(false)
    })
  }, [])

  const role = user?.role || null

  const logout = async () => {
    await supabase?.auth.signOut()
    setUser(null)
    setAccessStatus(null)
  }

  const signOut = logout

  const checkAccess = async () => {
    setAccessStatus({ granted: true, message: 'Accès autorisé' })
  }

  const login = async (username: string, password: string, mode?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error: err } = await supabase!.auth.signInWithPassword({
        email: `${username}@app.local`,
        password,
      })
      if (err) return { success: false, error: err.message }
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email, ...data.user.user_metadata as any })
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  const loginAsAdherent = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error: err } = await supabase!.auth.signInWithPassword({
        email: `${phone}@adherent.local`,
        password,
      })
      if (err) return { success: false, error: err.message }
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email, ...data.user.user_metadata as any })
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  return createElement(AuthContext.Provider, {
    value: {
      user, loading, error, role, accessStatus,
      login, loginAsAdherent, logout, signOut,
      refreshUser: async () => {},
      checkAccess,
      createUserInCloud,
      updateUserInCloud,
      deleteUserFromCloud,
    }
  }, children)
}

export async function createUserInCloud(user: { username: string; password: string; pin: string; role: string; name: string; phone?: string }): Promise<{ id?: string }> {
  try {
    const { data, error } = await (supabase!.from('users') as any).insert({
      username: user.username,
      password: user.password,
      pin: user.pin,
      role: user.role,
      name: user.name,
      phone: user.phone || user.username,
    }).select('id').single()
    if (error) throw error
    return { id: data?.id }
  } catch (e) {
    return {}
  }
}

export async function updateUserInCloud(data: Record<string, any>): Promise<void> {
  try {
    const username = data.username
    if (!username) return
    await (supabase!.from('users') as any).update(data).eq('username', username)
  } catch {}
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  try {
    await (supabase!.from('users') as any).delete().eq('username', userId)
  } catch {}
}

export function useAuth() {
  return useContext(AuthContext)
}
