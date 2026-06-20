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

async function handlePost(request: NextRequest) {
  const auth = await verifyAuthenticated(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, closed: true, reason: auth.error || 'Not authenticated' }, { status: 401 });
  }
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { sessionId?: string; deviceFingerprint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, deviceFingerprint } = body;

  if (!sessionId || !deviceFingerprint) {
    return NextResponse.json({ error: 'sessionId and deviceFingerprint are required' }, { status: 400 });
  }

  const { data: session, error: fetchError } = await supabase
    .from('staff_sessions')
    .select('id, status, username, device_fingerprint')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ ok: false, closed: true, reason: 'Session introuvable' });
  }

  if (session.username !== auth.username) {
    return NextResponse.json({ ok: false, closed: true, reason: 'Session non autorisée' }, { status: 403 });
  }

  if (session.status !== 'active') {
    return NextResponse.json({ ok: false, closed: true, reason: 'Session fermée' });
  }

  if (session.device_fingerprint !== deviceFingerprint) {
    return NextResponse.json({ ok: false, closed: true, reason: 'Appareil différent' });
  }

  const { error: updateError } = await supabase
    .from('staff_sessions')
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: 'active' });
}

export const POST = withCsrf(handlePost);
