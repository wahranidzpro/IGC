import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCookie } from '@/lib/cookie-signature';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function getCookieData(request: NextRequest) {
  const cookie = request.cookies.get('infinity-gym-auth');
  if (!cookie) return null;
  return verifyCookie(cookie.value);
}

export async function verifyAdmin(request: NextRequest): Promise<{ authorized: boolean; role?: string; error?: string }> {
  const authData = await getCookieData(request);
  if (!authData?.username || !authData?.role) return { authorized: false, error: 'Not authenticated' };

  if (authData.role === 'admin') return { authorized: true, role: 'admin' };

  if (!supabaseUrl || !supabaseServiceKey) return { authorized: false, error: 'Supabase not configured' };

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: user } = await supabase.from('gym_users').select('role').eq('username', authData.username).maybeSingle();

  if (user?.role === 'admin') return { authorized: true, role: 'admin' };

  return { authorized: false, error: 'Admin access required' };
}

export function verifyDeviceKey(request: NextRequest): { valid: boolean; error?: string } {
  const key = request.headers.get('x-api-key');
  if (!key) return { valid: false, error: 'Missing x-api-key header' };
  if (key !== process.env.DEVICE_API_KEY) return { valid: false, error: 'Invalid API key' };
  return { valid: true };
}

export async function verifyAuthenticated(request: NextRequest): Promise<{ authorized: boolean; username?: string; role?: string; profileId?: string; error?: string }> {
  const authData = await getCookieData(request);
  if (!authData?.username || !authData?.role) return { authorized: false, error: 'Not authenticated' };
  return {
    authorized: true,
    username: authData.username as string,
    role: authData.role as string,
    profileId: (authData.supabaseUserId as string) || undefined,
  };
}
