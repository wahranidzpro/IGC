import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuthenticated } from '@/lib/api-auth';
import { withCsrf } from '@/lib/api-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

async function handlePost(request: NextRequest) {
  const auth = await verifyAuthenticated(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { username?: string; name?: string; role?: string; deviceFingerprint?: string; deviceInfo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { username, name, role, deviceFingerprint, deviceInfo } = body;

  if (!username || !name || !role) {
    return NextResponse.json({ error: 'username, name, and role are required' }, { status: 400 });
  }

  const { data: gymUser, error: userError } = await supabase
    .from('gym_users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!gymUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const gymUserId = gymUser.id;

  let previousClosed = false;

  const { data: activeSessions } = await supabase
    .from('staff_sessions')
    .select('id')
    .eq('gym_user_id', gymUserId)
    .eq('status', 'active')
    .limit(1);

  if (activeSessions && activeSessions.length > 0) {
    const { error: closeError } = await supabase
      .from('staff_sessions')
      .update({ status: 'expired', logout_at: new Date().toISOString() })
      .eq('gym_user_id', gymUserId)
      .eq('status', 'active');

    if (closeError) {
      return NextResponse.json({ error: 'Failed to close previous session' }, { status: 500 });
    }

    previousClosed = true;
  }

  const ipAddress = getClientIp(request);

  const { data: newSession, error: insertError } = await supabase
    .from('staff_sessions')
    .insert({
      gym_user_id: gymUserId,
      username,
      name,
      role,
      device_fingerprint: deviceFingerprint || null,
      device_info: deviceInfo || null,
      ip_address: ipAddress,
      login_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      status: 'active',
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  return NextResponse.json({ sessionId: newSession.id, previousClosed });
}

export const POST = withCsrf(handlePost);
