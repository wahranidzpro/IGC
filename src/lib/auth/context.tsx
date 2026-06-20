'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { db, Member } from '@/lib/db/dexie-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { canAccessApp } from '@/lib/auth/authorization';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { getDeviceFingerprint, getDeviceInfo } from '@/lib/device';

type Role = 'admin' | 'reception' | 'coach' | 'adherent' | null;
type LoginMode = 'admin' | 'adherent';
export type UserRole = 'admin' | 'reception' | 'coach' | 'member' | 'adherent'

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  name: string;
  phone?: string;
  supabaseUserId: string;
  gymUserId?: string;
  coachId?: number | string;
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

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role;
  user: AuthUser | Member | null;
  loginMode: LoginMode;
  login: (username: string, password: string, mode?: LoginMode) => Promise<{ success: boolean; error?: string }>;
  loginAsAdherent: (phone: string, rfidCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  hasAccess: (minLevel: number) => boolean;
  dashboardPath: string;
  loading: boolean;
  isStructureLocked: boolean;
  checkStructureLock: () => Promise<boolean>;
  accessStatus: { granted: boolean; message: string; reason: string } | null;
  checkAccess: () => Promise<boolean>;
  sessionId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authLog(tag: string, msg: string, data?: unknown) {
  const line = `[AUTH:${tag}] ${msg}${data ? ' ' + JSON.stringify(data).substring(0, 150) : ''}`;
  logger.info(line);
}

async function setServerCookie(username: string, role: string, supabaseUserId?: string, accessToken?: string) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    await fetch('/api/auth/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, role, supabaseUserId }),
    });
  } catch (err) {
    authLog('COOKIE', 'Failed to set server cookie', err);
  }
}

function clearAuthCookie() {
  fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
  authLog('COOKIE', 'Cleared auth cookie');
}

async function fetchGymUserFromDB(supabaseUserId: string): Promise<{
  id: string; username: string; role: Role; name: string; phone?: string
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase as any)
      .from('gym_users')
      .select('id, username, role, name, phone')
      .eq('auth_user_id', supabaseUserId)
      .maybeSingle();
    if (result.error || !result.data) {
      authLog('GYM_USER', 'Not found or error', result.error);
      return null;
    }
    return { id: result.data.id, username: result.data.username, role: result.data.role as Role, name: result.data.name, phone: result.data.phone || undefined };
  } catch (err) {
    authLog('GYM_USER', 'Exception', err);
    return null;
  }
}

async function resolveCoachId(username: string, phone?: string): Promise<string | undefined> {
  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: gu } = await (supabase as any)
        .from('gym_users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (gu?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: coach } = await (supabase as any)
          .from('coaches')
          .select('id')
          .eq('profile_id', gu.id)
          .maybeSingle();
        if (coach?.id) return coach.id as string;
      }
    } catch {}
  }
  try {
    const pinUser = await db.pinUsers.where('username').equals(username).first();
    if (pinUser?.coachId) return String(pinUser.coachId);
    if (phone) {
      const coach = await db.coaches.where('phone').equals(phone).first();
      if (coach?.id) return String(coach.id);
    }
  } catch {}
  return undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<AuthUser | Member | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('admin');
  const [isStructureLocked, setIsStructureLocked] = useState(false);
  const [accessStatus, setAccessStatus] = useState<{ granted: boolean; message: string; reason: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const authSubscriptionRef = useRef<{ data: { subscription: { unsubscribe: () => void } } } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const loading = !isInitialized

  const hasRole = useCallback((...roles: UserRole[]) => {
    return roles.includes((role ?? 'member') as UserRole)
  }, [role])

  const hasAccess = useCallback((minLevel: number) => {
    return (ROLE_HIERARCHY[role ?? 'member'] ?? 0) >= minLevel
  }, [role])

  const dashboardPath = getDashboardPath(role ?? 'member')

  const checkAccess = useCallback(async (overrideUserId?: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      setAccessStatus({ granted: true, message: 'Mode local - accès autorisé', reason: 'LOCAL_MODE' });
      return true;
    }

    const uid: string | null | undefined = overrideUserId || (user && 'supabaseUserId' in user ? (user as AuthUser).supabaseUserId : user?.id?.toString());
    if (!uid) {
      setAccessStatus({ granted: false, message: 'Session non trouvée', reason: 'NO_SESSION' });
      return false;
    }

    try {
      const result = await canAccessApp(uid);
      setAccessStatus({
        granted: result.granted,
        message: result.message,
        reason: result.reason,
      });
      return result.granted;
    } catch {
      setAccessStatus({ granted: false, message: 'Erreur de vérification', reason: 'ERROR' });
      return false;
    }
  }, [user]);

  const initAuth = useCallback(async () => {
    authLog('INIT', 'Starting auth initialization...');

    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          authLog('INIT', `Supabase session found for: ${session.user.email}`);

          const gymUser = await fetchGymUserFromDB(session.user.id);

          if (gymUser) {
            const authUser: AuthUser = {
              id: gymUser.id,
              email: session.user.email || '',
              username: gymUser.username,
              role: gymUser.role,
              name: gymUser.name,
              phone: gymUser.phone,
              supabaseUserId: session.user.id,
              gymUserId: gymUser.id,
            };

            if (gymUser.role === 'coach') {
              authUser.coachId = await resolveCoachId(gymUser.username, gymUser.phone);
            }

            setIsAuthenticated(true);
            setRole(gymUser.role);
            setUser(authUser);
            setLoginMode('admin');
            await setServerCookie(gymUser.username, gymUser.role || '', session.user.id, session.access_token);
            authLog('INIT', `Session restored for: ${gymUser.username} (${gymUser.role})`);

            await checkAccess(session.user.id);
          } else {
            authLog('INIT', 'Supabase session exists but no gym_user found');
            await supabase.auth.signOut();
            clearAuthCookie();
          }
        } else {
          authLog('INIT', 'No Supabase session, checking cookie fallback...');

          let sessionData: { authenticated: boolean; username?: string; role?: string; supabaseUserId?: string; user?: { id: string; username: string; role: string; name: string; phone: string | null; supabaseUserId: string } } | null = null;
          try {
            const res = await fetch('/api/auth/session');
            if (res.ok) sessionData = await res.json();
          } catch {}
          if (sessionData?.user) {
            const { user: u } = sessionData;
            const authUser: AuthUser = {
              id: u.id,
              email: '',
              username: u.username,
              role: u.role as Role,
              name: u.name,
              phone: u.phone || undefined,
              supabaseUserId: u.supabaseUserId,
              gymUserId: u.id,
            };
            if (authUser.role === 'coach') {
              authUser.coachId = await resolveCoachId(u.username, u.phone || undefined);
            }
            setIsAuthenticated(true);
            setRole(authUser.role);
            setUser(authUser);
            setLoginMode('admin');
            authLog('INIT', `Cookie session restored for: ${u.username}`);
          }
        }

        authSubscriptionRef.current = supabase.auth.onAuthStateChange(async (event, session) => {
          authLog('AUTH_STATE', `Event: ${event}`, { hasSession: !!session });
          if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setRole(null);
            setUser(null);
            setLoginMode('admin');
            clearAuthCookie();
          }
        });
      } else {
        authLog('INIT', 'Supabase not configured - running in local mode');
      }
    } catch (err) {
      authLog('INIT', 'Auth init error', err);
    }

    setIsInitialized(true);
    authLog('INIT', 'Auth initialization complete');
  }, [checkAccess]);

  const checkStructureLock = useCallback(async (): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: s } = await (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
          .from('settings')
          .select('value')
          .eq('key', 'structure_locked')
          .maybeSingle();
        if (s) {
          const isLocked = s.value === 'true';
          setIsStructureLocked(isLocked);
          return isLocked;
        }
      } catch {}
    }
    try {
      const locked = await db.settings.where('key').equals('structure_locked').first();
      const isLocked = locked?.value === 'true';
      setIsStructureLocked(isLocked);
      return isLocked;
    } catch {
      return false;
    }
  }, []);

  const initialMountedRef = useRef(false);
  useEffect(() => {
    if (!initialMountedRef.current) {
      initialMountedRef.current = true;
      checkStructureLock();
      initAuth();
    }
    return () => {
      if (authSubscriptionRef.current?.data.subscription) {
        authSubscriptionRef.current.data.subscription.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, [checkStructureLock, initAuth]);

  const loginAsAdherent = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phone.replace(/\D/g, '');
    try {
      if (isSupabaseConfigured && supabase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id, first_name, last_name, phone')
          .ilike('phone', `%${cleanPhone}`)
          .maybeSingle();
        if (profile) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: gymUser } = await (supabase as any)
            .from('gym_users')
            .select('password_hash')
            .eq('phone', profile.phone)
            .maybeSingle();
          if (gymUser?.password_hash) {
            const isHashed = gymUser.password_hash.startsWith('$2a$') || gymUser.password_hash.startsWith('$2b$') || gymUser.password_hash.startsWith('$2$');
            const valid = isHashed ? await bcrypt.compare(password, gymUser.password_hash) : password === gymUser.password_hash;
            if (!valid) return { success: false, error: 'Mot de passe incorrect' };
          } else {
            return { success: false, error: 'Mot de passe incorrect' };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: memberRow } = await (supabase as any)
            .from('members')
            .select('id, status')
            .eq('profile_id', profile.id)
            .maybeSingle();
          if (memberRow && (memberRow.status === 'active' || memberRow.status === 'inactive')) {
            setIsAuthenticated(true);
            setRole('adherent');
             
            setUser({
              id: memberRow.id,
              profileId: profile.id,
              firstName: profile.first_name,
              lastName: profile.last_name,
              phone: profile.phone,
              status: memberRow.status,
            } as unknown as Member);
            setLoginMode('adherent');
            await setServerCookie(profile.phone || profile.id || '', 'adherent', profile.id);
            return { success: true };
          }
          if (memberRow) {
            return { success: false, error: 'Votre abonnement a expiré. Veuillez contacter l\'administration.' };
          }
        }
      }
      const all = await db.members.toArray();
      const found = all.find(m => m.phone.replace(/[\s\-\+\(\)]/g, '').startsWith(cleanPhone));

      if (!found) {
        return { success: false, error: 'Numéro de téléphone non trouvé' };
      }
      if (found.status !== 'active' && found.status !== 'inactive') {
        return { success: false, error: 'Votre abonnement a expiré. Veuillez contacter l\'administration.' };
      }

      const pinUser = await db.pinUsers.where('username').equals(found.phone.replace(/\s/g, '')).first();
      if (pinUser) {
        const isHashed = pinUser.password.startsWith('$2a$') || pinUser.password.startsWith('$2b$') || pinUser.password.startsWith('$2$');
        const valid = isHashed ? await bcrypt.compare(password, pinUser.password) : password === pinUser.password;
        if (!valid) return { success: false, error: 'Mot de passe incorrect' };
      } else {
        return { success: false, error: 'Mot de passe incorrect' };
      }

      setIsAuthenticated(true);
      setRole('adherent');
      setUser(found);
      setLoginMode('adherent');
      await setServerCookie(found.phone || found.id?.toString() || '', 'adherent');
      return { success: true };
    } catch (err) {
      authLog('LOGIN', 'Adherent login error', err);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  };

  const login = async (username: string, password: string, mode: LoginMode = 'admin'): Promise<{ success: boolean; error?: string }> => {
    if (mode === 'adherent') {
      return loginAsAdherent(username, password);
    }

    authLog('LOGIN', `Login attempt: ${username}`);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        authLog('LOGIN', `Cloud login failed: ${data.error}, trying local fallback`);
        const localUser = await db.pinUsers.where('username').equals(username).first();
        if (localUser) {
          const isHashed = localUser.password.startsWith('$2a$') || localUser.password.startsWith('$2b$') || localUser.password.startsWith('$2$');
          const valid = isHashed ? await bcrypt.compare(password, localUser.password) : password === localUser.password;
          if (valid) {
            authLog('LOGIN', `Local fallback SUCCESS for: ${username}`);
            const authUser: AuthUser = {
              id: String(localUser.id),
              email: `${localUser.username}@infinitygym.local`,
              username: localUser.username,
              role: localUser.role as Role,
              name: localUser.name,
              phone: localUser.phone,
              supabaseUserId: '',
              gymUserId: String(localUser.id),
            };
            if (localUser.role === 'coach' && localUser.coachId) {
              authUser.coachId = String(localUser.coachId);
            }
            setIsAuthenticated(true);
            setRole(authUser.role);
            setUser(authUser);
            setLoginMode('admin');
            if (['admin', 'reception', 'coach'].includes(localUser.role as string)) {
              try {
                const startRes = await fetch('/api/staff-session/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    username: localUser.username,
                    name: localUser.name,
                    role: localUser.role,
                    deviceFingerprint: getDeviceFingerprint(),
                    deviceInfo: getDeviceInfo(),
                  }),
                });
                const startData = await startRes.json();
                if (startData.sessionId) setSessionId(startData.sessionId);
              } catch (err) {
                authLog('STAFF_SESSION', 'Failed to start staff session', err);
              }
            }
            await setServerCookie(localUser.username, localUser.role || '', '');
            return { success: true };
          }
        }
        return { success: false, error: data.error === 'Supabase not configured' ? 'Supabase n\'est pas configuré. Contactez l\'administration.' : (data.error || 'Identifiants invalides') };
      }

      const { user: apiUser } = data;

      if (!apiUser.role) {
        authLog('LOGIN', `No role for ${username}`);
        return { success: false, error: 'Compte sans rôle défini' };
      }

      if (apiUser.is_locked) {
        return { success: false, error: 'Compte verrouillé' };
      }

      // Sign in to Supabase Auth so RLS works client-side
      if (supabase) {
        try {
          const email = `${apiUser.username}@infinitygym.local`;
          await supabase.auth.signInWithPassword({ email, password });
        } catch (authErr) {
          authLog('LOGIN', 'Supabase Auth signIn failed (non-critical)', authErr);
        }
      }

      const supabaseUserId = apiUser.supabaseUserId || apiUser.id;
      const authUser: AuthUser = {
        id: apiUser.id,
        email: `${apiUser.username}@infinitygym.local`,
        username: apiUser.username,
        role: apiUser.role as Role,
        name: apiUser.name || apiUser.username,
        phone: apiUser.phone,
        supabaseUserId,
      };

      if (authUser.role === 'coach') {
        authUser.coachId = await resolveCoachId(apiUser.username, apiUser.phone);
      }

      setIsAuthenticated(true);
      setRole(authUser.role);
      setUser(authUser);
      setLoginMode('admin');
      if (['admin', 'reception', 'coach'].includes(authUser.role as string)) {
        try {
          const startRes = await fetch('/api/staff-session/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: authUser.username,
              name: authUser.name,
              role: authUser.role,
              deviceFingerprint: getDeviceFingerprint(),
              deviceInfo: getDeviceInfo(),
            }),
          });
          const startData = await startRes.json();
          if (startData.sessionId) setSessionId(startData.sessionId);
        } catch (err) {
          authLog('STAFF_SESSION', 'Failed to start staff session', err);
        }
      }
      authLog('LOGIN', `Login SUCCESS: ${username} (${authUser.role})`);

      await checkAccess(authUser.supabaseUserId);
      return { success: true };
    } catch (err) {
      authLog('LOGIN', 'Login exception', err);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  const logout = useCallback(async () => {
    if (sessionId) {
      fetch('/api/staff-session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setLoginMode('admin');
    setAccessStatus(null);
    clearAuthCookie();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        authLog('LOGOUT', 'Supabase signOut error', err);
      }
    }

    authLog('LOGOUT', 'User logged out');
  }, [sessionId]);

  useEffect(() => {
    const isStaff = role && ['admin', 'reception', 'coach'].includes(role);
    if (!isStaff || !sessionId) return;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/staff-session/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            deviceFingerprint: getDeviceFingerprint(),
          }),
        });
        const data = await res.json();
        if (data.closed === true) {
          authLog('STAFF_SESSION', 'Session closed by admin, logging out');
          logout();
        }
      } catch (err) {
        authLog('STAFF_SESSION', 'Heartbeat error', err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [role, sessionId, logout]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        loginMode,
        login,
        loginAsAdherent,
        logout,
        hasRole,
        hasAccess,
        dashboardPath,
        loading,
        isStructureLocked,
        checkStructureLock,
        accessStatus,
        checkAccess,
        sessionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function createUserInCloud(userData: { username: string; password: string; pin: string; role: string; name: string; phone?: string }) {
  authLog('CREATE', `Creating cloud user: ${userData.username} (role: ${userData.role})`);
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) {
    authLog('CREATE', `Failed: ${res.status}`, data);
    throw new Error(data.error || 'Failed to create user');
  }
  authLog('CREATE', `Created successfully: ${userData.username}`);
  return data;
}

async function updateUserInCloud(updateData: { id?: string; username?: string; password?: string; pin?: string; role?: string; name?: string; phone?: string; is_locked?: boolean }) {
  authLog('UPDATE', `Updating cloud user: ${updateData.username || updateData.id}`);
  const res = await fetch('/api/auth/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) {
    authLog('UPDATE', `Failed: ${res.status}`, data);
    throw new Error(data.error || 'Failed to update user');
  }
  authLog('UPDATE', `Updated successfully: ${updateData.username || updateData.id}`);
  return data;
}

async function deleteUserFromCloud(username: string) {
  authLog('DELETE', `Deleting cloud user: ${username}`);
  const res = await fetch(`/api/auth/users?username=${encodeURIComponent(username)}`, { method: 'DELETE' });
  if (!res.ok) {
    authLog('DELETE', `Failed: ${res.status}`);
  } else {
    authLog('DELETE', `Deleted: ${username}`);
  }
}

export { createUserInCloud, updateUserInCloud, deleteUserFromCloud };
