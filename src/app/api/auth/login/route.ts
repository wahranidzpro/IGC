import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { signCookie } from '@/lib/cookie-signature';
import { withCsrf } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rate-limiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function handlePost(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`login:${ip}`, 10, 60000)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
  }

  
  const supabase = getSupabase();
  if (!supabase) {
    console.error('[LOGIN] Supabase not configured');
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    console.error('[LOGIN] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { username, password } = body;
  console.log('[LOGIN] Attempt for username:', username);

  if (!username || !password) {
    console.log('[LOGIN] Missing username or password');
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  console.log('[LOGIN] Querying gym_users for:', username);
  const { data: user, error } = await supabase
    .from('gym_users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('[LOGIN] DB query error:', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!user) {
    console.log('[LOGIN] User not found:', username);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  console.log('[LOGIN] User found:', user.id, 'role:', user.role, 'auth_user_id:', user.auth_user_id);

  if (user.is_locked) {
    console.log('[LOGIN] Account locked:', username);
    return NextResponse.json({ error: 'Account locked' }, { status: 403 });
  }

  let passwordMatch = false;

  if (user.password_hash) {
    const isHashed = user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2$');
    console.log('[LOGIN] password_hash exists, isHashed:', isHashed, 'hash starts with:', user.password_hash.substring(0, 10));
    passwordMatch = isHashed ? await bcrypt.compare(password, user.password_hash) : password === user.password_hash;
    console.log('[LOGIN] passwordMatch:', passwordMatch);
  } else {
    console.log('[LOGIN] NO password_hash in DB');
  }

  if (!passwordMatch) {
    console.log('[LOGIN] Password mismatch for:', username);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  let supabaseUserId = user.auth_user_id;

  // Auto-create Supabase Auth user if missing (legacy migration)
  if (!supabaseUserId) {
    console.log('[LOGIN] No auth_user_id — creating Supabase Auth user for', user.username);
    const email = `${user.username}@infinitygym.local`;
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: user.username, role: user.role, name: user.name },
    });
    if (authCreateError) {
      console.error('[LOGIN] Failed to create Supabase Auth user:', authCreateError.message);
    } else if (authData?.user) {
      supabaseUserId = authData.user.id;
      const { error: linkError } = await supabase
        .from('gym_users')
        .update({ auth_user_id: authData.user.id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (linkError) console.error('[LOGIN] Failed to link auth_user_id:', linkError.message);
      else console.log('[LOGIN] Linked auth_user_id', authData.user.id, 'to gym_user', user.id);
    }
  }

  if (supabaseUserId) {
    await supabase.from('subscriptions').insert({
      user_id: supabaseUserId, status: 'active', plan_name: 'Standard',
    }).then((r) => {
      if (r.error && !r.error.message?.includes('duplicate key')) {
        console.error('[LOGIN] subscription insert error:', r.error.message);
      }
    });
    await supabase.from('memberships_control').insert({
      user_id: supabaseUserId,
      approved_by_admin: ['admin', 'reception', 'coach'].includes(user.role),
      approved_by_reception: ['admin', 'reception'].includes(user.role),
    }).then((r) => {
      if (r.error && !r.error.message?.includes('duplicate key')) {
        console.error('[LOGIN] memberships_control insert error:', r.error.message);
      }
    });
  }
  const cookieValue = await signCookie({ username: user.username, role: user.role, supabaseUserId });
  const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const secureFlag = isSecure ? '; Secure' : '';
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
      supabaseUserId,
    },
  });

  response.headers.set(
    'Set-Cookie',
    `infinity-gym-auth=${encodeURIComponent(cookieValue)}; path=/; max-age=86400; HttpOnly; SameSite=Strict${secureFlag}`
  );

  return response;
}

export const POST = withCsrf(handlePost);
