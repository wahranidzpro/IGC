import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username') || undefined;
  const role = searchParams.get('role') || undefined;
  const status = searchParams.get('status') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));

  let query = supabase
    .from('staff_sessions')
    .select('*', { count: 'exact' });

  if (username) {
    query = query.ilike('username', `%${username}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (from) {
    query = query.gte('login_at', from);
  }
  if (to) {
    query = query.lte('login_at', to);
  }

  query = query
    .order('login_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data: sessions, count: total, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: activeCount }, { count: todayCount }] = await Promise.all([
    supabase.from('staff_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('staff_sessions').select('*', { count: 'exact', head: true }).gte('login_at', today),
  ]);

  const formattedSessions = (sessions || []).map((s: any) => ({
    id: s.id,
    gym_user_id: s.gym_user_id,
    username: s.username,
    name: s.name,
    role: s.role,
    device_fingerprint: s.device_fingerprint,
    device_info: s.device_info,
    ip_address: s.ip_address,
    login_at: s.login_at,
    logout_at: s.logout_at,
    last_heartbeat_at: s.last_heartbeat_at,
    status: s.status,
    duration: formatDuration(s.login_at, s.logout_at || s.last_heartbeat_at, s.status),
  }));

  return NextResponse.json({
    sessions: formattedSessions,
    total: total || 0,
    page,
    limit,
    totalPages: Math.ceil((total || 0) / limit),
    activeCount: activeCount || 0,
    todayCount: todayCount || 0,
  });
}

function formatDuration(loginAt: string, endAt: string | null, status: string): string {
  if (status === 'active') return 'En cours';

  if (!endAt) return 'En cours';

  const start = new Date(loginAt).getTime();
  const end = new Date(endAt).getTime();
  const diffMs = end - start;

  if (diffMs < 0) return '0m';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return '< 1m';
}
