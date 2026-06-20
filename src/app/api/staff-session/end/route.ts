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
    return NextResponse.json({ success: false, error: auth.error || 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
  }

  const { data: session, error: fetchError } = await supabase
    .from('staff_sessions')
    .select('id, username')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ success: false, error: 'Session introuvable' }, { status: 404 });
  }

  if (session.username !== auth.username) {
    return NextResponse.json({ success: false, error: 'Vous ne pouvez fermer que votre propre session' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('staff_sessions')
    .update({ status: 'closed', logout_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Failed to close session' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const POST = withCsrf(handlePost);
