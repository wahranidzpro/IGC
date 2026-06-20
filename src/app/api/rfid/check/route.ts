import { createServerSupabaseClient } from '@/lib/supabase/server';

const recentScans = new Map<string, number>();
const ANTIPASSBACK_WINDOW = 5000;
const CLEANUP_THRESHOLD = 1000;

export const runtime = 'nodejs';

function respond(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

function respondError(message: string, status: number, code: string) {
  return Response.json({ success: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RFID_API_KEY;
    if (!apiKey) {
      return respondError('Serveur mal configuré', 500, 'SERVER_MISCONFIGURED');
    }
    const headerKey = request.headers.get('x-api-key');
    if (!headerKey || headerKey !== apiKey) {
      return respondError('Non autorisé', 401, 'UNAUTHORIZED');
    }

    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const { rfid, uid, cardno, device_id, timestamp } = body;

    const rfidUid = rfid || uid || cardno;
    if (!rfidUid) {
      return respondError('Identifiant RFID manquant', 400, 'NO_IDENTIFIER');
    }

    const now = Date.now();
    const lastScan = recentScans.get(rfidUid);
    if (lastScan && now - lastScan < ANTIPASSBACK_WINDOW) {
      return respondError('Anti-passback actif', 429, 'ANTIPASSBACK');
    }
    recentScans.set(rfidUid, now);

    if (recentScans.size > CLEANUP_THRESHOLD) {
      for (const [key, time] of recentScans) {
        if (now - time > ANTIPASSBACK_WINDOW) recentScans.delete(key);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockedCard = await (supabase.from('blocked_cards') as any)
      .select('id')
      .eq('rfid_uid', rfidUid)
      .eq('is_active', true)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((r: any) => r.data);

    if (blockedCard) {
      return respondError('Carte bloquée', 403, 'CARD_BLOCKED');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const turnstileMember = await (supabase.from('turnstile_members') as any)
      .select('*')
      .eq('rfid_code', rfidUid)
      .eq('is_active', true)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((r: any) => r.data);

    if (!turnstileMember) {
      return respondError('Carte non trouvée', 404, 'CARD_NOT_FOUND');
    }

    const memberLocalId = turnstileMember.member_local_id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncedMember = await (supabase.from('synced_members') as any)
      .select('*')
      .eq('local_id', memberLocalId)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((r: any) => r.data);

    if (!syncedMember) {
      return respondError('Membre introuvable', 404, 'MEMBER_NOT_FOUND');
    }

    if (syncedMember.is_blocked || syncedMember.status === 'blocked') {
      return respondError('Membre bloqué', 403, 'MEMBER_BLOCKED');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restrictions = await (supabase.from('access_restrictions') as any)
      .select('*')
      .eq('member_local_id', memberLocalId)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((r: any) => r.data);

    if (restrictions) {
      const currentHour = new Date().getHours();
      if (restrictions.restrict_by_hour) {
        const startHour = restrictions.hour_start ?? 0;
        const endHour = restrictions.hour_end ?? 24;
        if (currentHour < startHour || currentHour >= endHour) {
          return respondError('Accès restreint', 403, 'ACCESS_RESTRICTED');
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSession = await (supabase.from('active_sessions') as any)
      .select('id')
      .eq('member_local_id', memberLocalId)
      .eq('is_active', true)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((r: any) => r.data);

    if (activeSession) {
      return respondError('Déjà à l\'intérieur', 409, 'ALREADY_INSIDE');
    }

    const turnstileId = device_id ? (Number.isNaN(parseInt(device_id, 10)) ? null : parseInt(device_id, 10)) : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('access_logs') as any).insert({
      turnstile_id: turnstileId,
      member_local_id: memberLocalId,
      event_type: 'entry',
      access_granted: true,
      reason: 'access_granted',
      timestamp: timestamp || new Date().toISOString(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('active_sessions') as any).insert({
      member_local_id: memberLocalId,
      turnstile_id: turnstileId,
      entry_time: new Date().toISOString(),
      is_active: true,
    });

    const displayName = syncedMember.first_name
      ? `${syncedMember.first_name} ${syncedMember.last_name || ''}`.trim()
      : `Member #${memberLocalId}`;

    return respond({
      member: { name: displayName, local_id: memberLocalId },
      access: 'GRANTED',
      openDoor: true,
    });
  } catch (err) {
    console.error('RFID check error:', err);
    return respondError('Erreur serveur', 500, 'SERVER_ERROR');
  }
}
