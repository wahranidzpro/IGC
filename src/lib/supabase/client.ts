import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

export function safeSupabase<T>(operation: (client: NonNullable<typeof supabase>) => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured || !supabase) return Promise.resolve(fallback)
  return operation(supabase).catch(() => Promise.resolve(fallback))
}

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

export async function signUpUser(email: string, password: string) {
  return safeSupabase((client) => client.auth.signUp({ email, password }), null)
}

export async function signInUser(email: string, password: string) {
  return safeSupabase((client) => client.auth.signInWithPassword({ email, password }), null)
}

export async function signInWithPin(username: string, pin: string) {
  return safeSupabase(async (client) => {
    const { data } = await client.auth.signInWithPassword({ email: `${username}@app.local`, password: pin })
    return data
  }, null)
}

export async function signOutUser() {
  return safeSupabase((client) => client.auth.signOut(), undefined)
}

export async function getCurrentUser() {
  return safeSupabase(async (client) => {
    const { data } = await client.auth.getUser()
    return data.user
  }, null)
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}

export async function syncLocalUsersToCloud() {
  return safeSupabase(async () => { /* stub */ }, undefined)
}
