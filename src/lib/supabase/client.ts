'use client';

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

export async function signUpUser(email: string, password: string, metadata: { username: string; role: string; name: string; pin: string }) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

export async function signInUser(username: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@infinitygym.local`,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithPin(pin: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: users, error } = await (supabase.from('gym_users') as any)
    .select('*')
    .eq('pin', pin)
    .eq('is_locked', false)
    .single();
  if (error || !users) throw new Error('PIN invalide');
  return users;
}

export async function signOutUser() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: gymUser } = await (supabase.from('gym_users') as any)
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()
    .catch(() => ({ data: null }));
  return { ...user, gym_user: gymUser };
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}


