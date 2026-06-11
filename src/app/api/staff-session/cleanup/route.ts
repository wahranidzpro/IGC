import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Admin access required' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: sessions, error: fetchError } = await supabase
    .from('staff_sessions')
    .select('id')
    .eq('status', 'active')
    .lt('last_heartbeat_at', fiveMinutesAgo);

  if (fetchError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const ids = sessions?.map(s => s.id) || [];

  if (ids.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const { error: updateError } = await supabase
    .from('staff_sessions')
    .update({ status: 'expired', logout_at: new Date().toISOString() })
    .in('id', ids);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to expire sessions' }, { status: 500 });
  }

  return NextResponse.json({ cleaned: ids.length });
}
