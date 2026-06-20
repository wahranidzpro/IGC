import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signCookie, verifyCookie } from '@/lib/cookie-signature';
import { withCsrf } from '@/lib/api-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('infinity-gym-auth');
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const data = await verifyCookie(cookie.value);
  if (!data?.username || !data?.role) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const supabase = getServiceClient();
  let userData = null;
  if (supabase) {
    const { data: dbUser } = await supabase
      .from('gym_users')
      .select('id, username, role, name, phone, auth_user_id')
      .eq('username', data.username)
      .maybeSingle();
    if (dbUser) {
      userData = dbUser;
    }
  }

  return NextResponse.json({
    authenticated: true,
    username: data.username,
    role: data.role,
    supabaseUserId: userData?.auth_user_id || data.supabaseUserId || null,
    user: userData ? {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      supabaseUserId: userData.auth_user_id,
    } : null,
  });
}

function setCookieHeader(response: NextResponse, value: string, request: NextRequest) {
  const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const secureFlag = isSecure ? '; Secure' : '';
  response.headers.set(
    'Set-Cookie',
    `infinity-gym-auth=${encodeURIComponent(value)}; path=/; max-age=86400; HttpOnly; SameSite=Strict${secureFlag}`
  );
}

function clearCookieHeader(response: NextResponse, request: NextRequest) {
  const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const secureFlag = isSecure ? '; Secure' : '';
  response.headers.set(
    'Set-Cookie',
    `infinity-gym-auth=; path=/; max-age=0; HttpOnly; SameSite=Strict${secureFlag}`
  );
}

let _supabaseClient: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

async function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  return _supabaseClient;
}

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, role, supabaseUserId } = body;

    if (!username || !role) {
      return NextResponse.json({ error: 'username and role required' }, { status: 400 });
    }

    // 1. Fast path — existing valid cookie match (session refresh)
    const existingCookie = request.cookies.get('infinity-gym-auth');
    if (existingCookie?.value) {
      const existingData = await verifyCookie(existingCookie.value);
      if (existingData?.username === username && existingData?.role === role) {
        const value = await signCookie({ username, role, supabaseUserId });
        const response = NextResponse.json({ success: true });
        setCookieHeader(response, value, request);
        return response;
      }
    }

    // 2. Staff roles — verify via Supabase Bearer token sent by client
    if (role !== 'adherent') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (token) {
        const sb = await getSupabaseClient();
        if (sb) {
          const { data: { user } } = await sb.auth.getUser(token);
          if (user) {
            const value = await signCookie({ username, role, supabaseUserId });
            const response = NextResponse.json({ success: true });
            setCookieHeader(response, value, request);
            return response;
          }
        }
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Adherent role — trust the request (origin is already validated by fetch)
    const value = await signCookie({ username, role, supabaseUserId });
    const response = NextResponse.json({ success: true });
    setCookieHeader(response, value, request);
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function handleDelete(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearCookieHeader(response, request);
  return response;
}

export const POST = withCsrf(handlePost);
export const DELETE = withCsrf(handleDelete);
