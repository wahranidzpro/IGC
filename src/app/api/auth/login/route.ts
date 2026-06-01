import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  if (supabaseServiceKey && supabaseUrl) {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: gymUser } = await serviceClient
      .from('gym_users')
      .select('is_locked')
      .eq('username', username)
      .maybeSingle();

    if (gymUser?.is_locked) {
      return NextResponse.json({ error: 'Account locked' }, { status: 403 });
    }
  }

  const email = `${username}@infinitygym.local`;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: data.user?.id,
      username,
      role: data.user?.user_metadata?.role || 'adherent',
      name: data.user?.user_metadata?.name || null,
      phone: data.user?.user_metadata?.phone || null,
    },
  });
}
