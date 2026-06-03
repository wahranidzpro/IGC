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
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: `${users.username}@infinitygym.local`,
    password: users.password_hash,
  });
  if (signInError) throw signInError;
  return data;
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

export async function syncLocalUsersToCloud(localUsers: Array<{ username: string; password: string; pin: string; role: string; name: string; isLocked: boolean }>) {
  if (!supabase) return { synced: 0 };
  let synced = 0;
  for (const u of localUsers) {
    const { data: existing } = await (supabase.from('gym_users') as any)
      .select('id')
      .eq('username', u.username)
      .single()
      .catch(() => ({ data: null }));
    if (!existing) {
      const email = `${u.username}@infinitygym.local`;
      const { data: authData } = await supabase.auth.admin?.createUser({
        email,
        password: u.password,
        email_confirm: true,
        user_metadata: { username: u.username, role: u.role, name: u.name, pin: u.pin },
      }) || { data: null };
      if (authData?.user) {
        await (supabase.from('gym_users') as any).insert([{
          id: authData.user.id,
          username: u.username,
          password_hash: u.password,
          pin: u.pin,
          role: u.role,
          name: u.name,
          is_locked: u.isLocked,
        }]);
        synced++;
      }
    }
  }
  return { synced };
}
