import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { signCookie } from '@/lib/cookie-signature';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from('gym_users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (user.is_locked) {
    return NextResponse.json({ error: 'Account locked' }, { status: 403 });
  }

  let passwordMatch = false;
  let pinMatch = false;

  if (user.password_hash) {
    const isHashed = user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2$');
    passwordMatch = isHashed ? await bcrypt.compare(password, user.password_hash) : password === user.password_hash;
  }

  if (!passwordMatch && user.pin) {
    const isHashed = user.pin.startsWith('$2a$') || user.pin.startsWith('$2b$') || user.pin.startsWith('$2$');
    pinMatch = isHashed ? await bcrypt.compare(password, user.pin) : password === user.pin;
  }

  if (!passwordMatch && !pinMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const supabaseUserId = user.auth_user_id || user.id;
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
