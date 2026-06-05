import { createServerSupabaseClient } from '@/lib/supabase/server';

const recentScans = new Map<string, number>();
const ANTIPASSBACK_WINDOW = 5000;
const CLEANUP_THRESHOLD = 1000;

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RFID_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, reason: 'SERVER_MISCONFIGURED', openDoor: false }, { status: 500 });
    }
    const headerKey = request.headers.get('x-api-key');
    if (!headerKey || headerKey !== apiKey) {
      return Response.json({ success: false, reason: 'UNAUTHORIZED', openDoor: false }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const { rfid, uid, cardno, device_id, method, timestamp } = body;

    const rfidUid = rfid || uid || cardno;
    if (!rfidUid) {
      return Response.json({ success: false, reason: 'NO_IDENTIFIER', openDoor: false }, { status: 400 });
    }

    const now = Date.now();
    const lastScan = recentScans.get(rfidUid);
    if (lastScan && now - lastScan < ANTIPASSBACK_WINDOW) {
      return Response.json({ success: false, reason: 'ANTIPASSBACK', openDoor: false }, { status: 429 });
    }
    recentScans.set(rfidUid, now);

    if (recentScans.size > CLEANUP_THRESHOLD) {
      for (const [key, time] of recentScans) {
        if (now - time > ANTIPASSBACK_WINDOW) recentScans.delete(key);
      }
    }

    const blockedCard = await (supabase.from('blocked_cards') as any)
      .select('id')
      .eq('rfid_uid', rfidUid)
      .eq('is_active', true)
      .maybeSingle()
      .then((r: any) => r.data);

    if (blockedCard) {
      return Response.json({ success: false, reason: 'CARD_BLOCKED', openDoor: false }, { status: 403 });
    }

    const turnstileMember = await (supabase.from('turnstile_members') as any)
      .select('*')
      .eq('rfid_code', rfidUid)
      .eq('is_active', true)
      .maybeSingle()
      .then((r: any) => r.data);

    if (!turnstileMember) {
      return Response.json({ success: false, reason: 'CARD_NOT_FOUND', openDoor: false }, { status: 404 });
    }

    const memberLocalId = turnstileMember.member_local_id;

    const syncedMember = await (supabase.from('synced_members') as any)
      .select('*')
      .eq('local_id', memberLocalId)
      .maybeSingle()
      .then((r: any) => r.data);

    if (!syncedMember) {
      return Response.json({ success: false, reason: 'MEMBER_NOT_FOUND', openDoor: false }, { status: 404 });
    }

    if (syncedMember.is_blocked || syncedMember.status === 'blocked') {
      return Response.json({ success: false, reason: 'MEMBER_BLOCKED', openDoor: false }, { status: 403 });
    }

    const restrictions = await (supabase.from('access_restrictions') as any)
      .select('*')
      .eq('member_local_id', memberLocalId)
      .maybeSingle()
      .then((r: any) => r.data);

    if (restrictions) {
      const currentHour = new Date().getHours();
      if (restrictions.restrict_by_hour) {
        const startHour = restrictions.hour_start ?? 0;
        const endHour = restrictions.hour_end ?? 24;
        if (currentHour < startHour || currentHour >= endHour) {
          return Response.json({ success: false, reason: 'ACCESS_RESTRICTED', openDoor: false }, { status: 403 });
        }
      }
    }

    const activeSession = await (supabase.from('active_sessions') as any)
      .select('id')
      .eq('member_local_id', memberLocalId)
      .eq('is_active', true)
      .maybeSingle()
      .then((r: any) => r.data);

    if (activeSession) {
      return Response.json({ success: false, reason: 'ALREADY_INSIDE', openDoor: false }, { status: 409 });
    }

    const turnstileId = device_id ? (Number.isNaN(parseInt(device_id, 10)) ? null : parseInt(device_id, 10)) : null;
    const eventMethod = method || 'rfid';

    await (supabase.from('access_logs') as any).insert({
      turnstile_id: turnstileId,
      member_local_id: memberLocalId,
      event_type: 'entry',
      access_granted: true,
      reason: 'access_granted',
      timestamp: timestamp || new Date().toISOString(),
    });

    await (supabase.from('active_sessions') as any).insert({
      member_local_id: memberLocalId,
      turnstile_id: turnstileId,
      entry_time: new Date().toISOString(),
      is_active: true,
    });

    const displayName = syncedMember.first_name
      ? `${syncedMember.first_name} ${syncedMember.last_name || ''}`.trim()
      : `Member #${memberLocalId}`;

    return Response.json({
      success: true,
      member: { name: displayName, local_id: memberLocalId },
      access: 'GRANTED',
      openDoor: true,
    });
  } catch (err) {
    console.error('RFID check error:', err);
    return Response.json({ success: false, reason: 'SERVER_ERROR', openDoor: false }, { status: 500 });
  }
}
