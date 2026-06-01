import { supabase, isSupabaseConfigured } from './client';

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/turnstile-access`
  : '';

export interface Turnstile {
  id: number;
  name: string;
  location: string;
  ip_address: string;
  port: number;
  device_type: string;
  direction: string;
  open_duration_ms?: number;
  antipassback_seconds?: number;
  is_active: boolean;
  last_heartbeat?: string;
  created_at: string;
}

export interface AccessLog {
  id: number;
  member_local_id?: number;
  turnstile_id?: number;
  event_type?: string;
  access_granted?: boolean;
  status?: string;
  method?: string;
  reason?: string;
  raw_payload?: any;
  rfid_uid?: string;
  turnstile_name?: string;
  timestamp: string;
  member_name?: string;
}

function checkConfig() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local');
  }
}

function getClient() {
  checkConfig();
  return supabase!;
}

export async function getTurnstiles() {
  const s = getClient();
  const { data, error } = await s.from('turnstiles').select('*').order('name');
  if (error) throw error;
  return data as Turnstile[];
}

export async function getTurnstile(id: number | string) {
  const s = getClient();
  const { data, error } = await s.from('turnstiles').select('*').eq('id', typeof id === 'string' ? parseInt(id, 10) : id).single();
  if (error) throw error;
  return data as Turnstile;
}

export async function createTurnstile(t: Omit<Turnstile, 'id' | 'created_at' | 'last_heartbeat'>) {
  const s = getClient();
  const { data, error } = await (s.from('turnstiles') as any).insert([t]).select().single();
  if (error) throw error;
  return data as Turnstile;
}

export async function updateTurnstile(id: number, updates: Partial<Turnstile>) {
  const s = getClient();
  const { data, error } = await (s.from('turnstiles') as any).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Turnstile;
}

export async function deleteTurnstile(id: number) {
  const s = getClient();
  const { error } = await s.from('turnstiles').delete().eq('id', id);
  if (error) throw error;
}

export async function getAccessLogs(limit = 100, offset = 0) {
  const s = getClient();
  const { data, error } = await s
    .from('access_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data || []) as AccessLog[];
}

export async function getAccessLogsForMember(memberId: number, limit = 50) {
  const s = getClient();
  const { data, error } = await s
    .from('access_logs')
    .select(`*, turnstile:turnstile_id(name)`)
    .eq('member_local_id', memberId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((r: any) => ({ ...r, turnstile_name: r.turnstile?.name })) as AccessLog[];
}

export function subscribeToAccessLogs(
  callback: (log: AccessLog) => void,
  filter?: { event_type?: string; turnstile_id?: number }
) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const query = supabase
    .channel('access-logs-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'access_logs',
        filter: filter?.event_type ? `event_type=eq.${filter.event_type}` : undefined,
      },
      (payload) => {
        callback(payload.new as AccessLog);
      }
    )
    .subscribe();

  return () => { supabase!.removeChannel(query); };
}

export async function getActiveSessions() {
  const s = getClient();
  const { data, error } = await s
    .from('active_sessions')
    .select(`*, turnstile:turnstile_id(name)`)
    .is('exit_time', null);
  if (error) throw error;
  return data || [];
}

export async function requestAccess(payload: {
  cardno?: string; rfid?: string; uid?: string; qr?: string;
  device_id?: string; method?: string; time?: string;
}) {
  if (!EDGE_FUNCTION_URL) {
    throw new Error('Supabase URL non configurée');
  }
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Id': payload.device_id || '' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Edge function error: ${err}`);
  }
  return res.json() as Promise<{ access: boolean; action: 'OPEN' | 'DENY'; reason?: string }>;
}

export async function getPendingSyncItems() {
  const s = getClient();
  const { data, error } = await s.from('sync_queue').select('*').eq('status', 'pending').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function markSyncDone(id: string) {
  const s = getClient();
  const { error } = await (s.from('sync_queue') as any).update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function getDeviceHealth() {
  const s = getClient();
  const { data, error } = await s.from('device_heartbeats').select('*').order('timestamp', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}
