/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, isSupabaseConfigured } from './client';
import { db } from '../db/dexie-db';
import type { Payment, CheckIn, PointsLedger, PinUser } from '../db/dexie-db';
import { ENTITY_REGISTRY } from '@/lib/sync/registry';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 100;

let isProcessing = false

function checkConfig() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  }
  return supabase;
}

async function logSync(
  operation: string,
  recordsSynced: number,
  status: 'success' | 'error',
  error?: string
) {
  try {
    const s = checkConfig();
    await (s.from('sync_logs') as any).insert([{
      operation,
      records_synced: recordsSynced,
      status,
      error_message: error || null,
    }]);
  } catch {
    logger.error(`Failed to write sync log for ${operation}`);
  }
}

export async function syncMembersToCloud() {
  const s = checkConfig();
  const pendingMembers = await db.members.where('syncStatus').equals('pending').toArray();

  if (pendingMembers.length === 0) {
    return { synced: 0, message: 'No pending members to sync' };
  }

  let synced = 0;
  let lastError: string | undefined;

  for (const m of pendingMembers) {
    try {
      const { error } = await (s.rpc as any)('upsert_synced_member', {
        p_local_id: m.id,
        p_phone: m.phone || '',
        p_first_name: m.firstName || '',
        p_last_name: m.lastName || '',
        p_birth_date: m.birthDate || '',
        p_address: m.address || '',
        p_gender: m.gender || 'other',
        p_blood_type: m.bloodType || '',
        p_photo: m.photo || '',
        p_coach_id: m.coachId ?? null,
        p_program_id: m.programId ?? null,
        p_sessions_left: m.sessionsLeft ?? 0,
        p_program_amount: m.programAmount ?? 0,
        p_amount_paid: m.amountPaid ?? 0,
        p_balance_due: m.balanceDue ?? 0,
        p_discount: m.discount ?? 0,
        p_advance: m.advance ?? 0,
        p_subscription_type: m.subscriptionType || 'free_session',
        p_subscription_duration: m.subscriptionDuration || '',
        p_status: m.status || 'active',
        p_fidelity_points: m.fidelityPoints ?? 0,
        p_rfid_code: m.rfidCode || '',
        p_is_blocked: m.isBlocked ?? false,
        p_block_reason: m.blockReason || null,
        p_block_date: m.blockDate ? m.blockDate.toISOString() : null,
        p_blocked_until: m.blockedUntil ? m.blockedUntil.toISOString() : null,
        p_email: m.email || null,
        p_emergency_contact_name: m.emergencyContactName || null,
        p_emergency_contact_phone: m.emergencyContactPhone || null,
        p_allergies: m.allergies || null,
        p_weight: m.weight ?? null,
        p_weight_current: m.weightCurrent ?? null,
        p_height: m.height ?? null,
        p_fitness_goal: m.fitnessGoal || null,
        p_experience_level: m.experienceLevel || null,
        p_referred_by: m.referredBy ?? 0,
        p_updated_at: m.updatedAt ? m.updatedAt.toISOString() : new Date().toISOString(),
      });

      if (error) {
        lastError = error.message;
        logger.error(`[Sync] Member ${m.id} error:`, error);
        continue;
      }

      await db.members.update(m.id!, { syncStatus: 'synced' });
      synced++;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.error(`[Sync] Member ${m.id} exception:`, err);
    }
  }

  await logSync('members', synced, lastError ? 'error' : 'success', lastError);
  return { synced, total: pendingMembers.length, error: lastError };
}

export async function syncPaymentsToCloud() {
  const s = checkConfig();
  const allPayments = await db.payments.toArray();

  if (allPayments.length === 0) {
    return { synced: 0, message: 'No payments to sync' };
  }

  const existingIds = new Set<number>();
  const allIds = allPayments.map((p: Payment) => p.id).filter((id): id is number => id != null);
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch = allIds.slice(i, i + BATCH_SIZE);
    const { data: existing } = await s
      .from('synced_payments')
      .select('local_id')
      .in('local_id', batch);
    if (existing) {
      existing.forEach((r: { local_id: number }) => existingIds.add(r.local_id));
    }
  }

  const pendingPayments = allPayments.filter((p: Payment) => p.id && !existingIds.has(p.id));

  if (pendingPayments.length === 0) {
    return { synced: 0, message: 'All payments already synced' };
  }

  let synced = 0;
  let lastError: string | undefined;

  for (let i = 0; i < pendingPayments.length; i += BATCH_SIZE) {
    const batch = pendingPayments.slice(i, i + BATCH_SIZE);
    const records = batch.map((p: Payment) => ({
      local_id: p.id,
      member_id: p.memberId,
      amount: p.amount,
      type: p.type,
      mode: p.mode,
      date: new Date(p.date).toISOString(),
      notes: p.description,
      created_at: new Date(p.createdAt).toISOString(),
    }));

    const { error } = await (s.from('synced_payments') as any).upsert(records, { onConflict: 'local_id' });

    if (error) {
      lastError = error.message;
      logger.error('Payments batch error:', error);
    } else {
      synced += batch.length;
    }
  }

  await logSync('payments', synced, lastError ? 'error' : 'success', lastError);
  return { synced, total: pendingPayments.length, error: lastError };
}

export async function syncCheckinsToCloud() {
  const s = checkConfig();
  const allCheckins = await db.checkins.toArray();

  if (allCheckins.length === 0) {
    return { synced: 0, message: 'No check-ins to sync' };
  }

  const existingIds = new Set<number>();
  const allIds = allCheckins.map((c: CheckIn) => c.id).filter((id): id is number => id != null);
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch = allIds.slice(i, i + BATCH_SIZE);
    const { data: existing } = await s
      .from('synced_checkins')
      .select('local_id')
      .in('local_id', batch);
    if (existing) {
      existing.forEach((r: { local_id: number }) => existingIds.add(r.local_id));
    }
  }

  const pendingCheckins = allCheckins.filter((c: CheckIn) => c.id && !existingIds.has(c.id));

  if (pendingCheckins.length === 0) {
    return { synced: 0, message: 'All check-ins already synced' };
  }

  let synced = 0;
  let lastError: string | undefined;

  for (let i = 0; i < pendingCheckins.length; i += BATCH_SIZE) {
    const batch = pendingCheckins.slice(i, i + BATCH_SIZE);
    const records = batch.map((c: CheckIn) => ({
      local_id: c.id,
      member_id: c.memberId,
      timestamp: new Date(c.timestamp).toISOString(),
      type: c.type,
    }));

    const { error } = await (s.from('synced_checkins') as any).upsert(records, { onConflict: 'local_id' });

    if (error) {
      lastError = error.message;
      logger.error('Check-ins batch error:', error);
    } else {
      synced += batch.length;
    }
  }

  await logSync('checkins', synced, lastError ? 'error' : 'success', lastError);
  return { synced, total: pendingCheckins.length, error: lastError };
}

export async function syncPointsLedgerToCloud() {
  const s = checkConfig();
  const allLedger = await db.pointsLedger.toArray();

  if (allLedger.length === 0) {
    return { synced: 0, message: 'No points ledger entries to sync' };
  }

  const existingIds = new Set<number>();
  const allIds = allLedger.map((l: PointsLedger) => l.id).filter((id): id is number => id != null);
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch = allIds.slice(i, i + BATCH_SIZE);
    const { data: existing } = await s
      .from('synced_points_ledger')
      .select('local_id')
      .in('local_id', batch);
    if (existing) {
      existing.forEach((r: { local_id: number }) => existingIds.add(r.local_id));
    }
  }

  const pendingLedger = allLedger.filter((l: PointsLedger) => l.id && !existingIds.has(l.id));

  if (pendingLedger.length === 0) {
    return { synced: 0, message: 'All points ledger entries already synced' };
  }

  let synced = 0;
  let lastError: string | undefined;

  for (let i = 0; i < pendingLedger.length; i += BATCH_SIZE) {
    const batch = pendingLedger.slice(i, i + BATCH_SIZE);
    const records = batch.map((l: PointsLedger) => ({
      local_id: l.id,
      member_id: l.memberId,
      points: l.points,
      type: l.type,
      reference_id: l.referenceId,
      created_at: new Date(l.createdAt).toISOString(),
    }));

    const { error } = await (s.from('synced_points_ledger') as any).upsert(records, { onConflict: 'local_id' });

    if (error) {
      lastError = error.message;
      logger.error('Points ledger batch error:', error);
    } else {
      synced += batch.length;
    }
  }

  await logSync('points_ledger', synced, lastError ? 'error' : 'success', lastError);
  return { synced, total: pendingLedger.length, error: lastError };
}

export async function syncPinUsersToCloud() {
  const s = checkConfig();
  const allUsers = await db.pinUsers.toArray();

  if (allUsers.length === 0) {
    return { synced: 0, message: 'No pin users to sync' };
  }

  const records = allUsers.map((u: PinUser) => ({
    local_id: u.id,
    username: u.username,
    password: u.password,
    pin: u.pin,
    role: u.role,
    name: u.name,
    phone: u.phone || null,
    is_locked: u.isLocked || false,
    created_at: new Date(u.createdAt).toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await (s.from('synced_pin_users') as any).upsert(records, { onConflict: 'local_id' });

  if (error) {
    logger.error('Pin users sync error:', error);
    return { synced: 0, error: error.message };
  }

  await logSync('pin_users', records.length, 'success');
  return { synced: records.length, total: allUsers.length };
}

export async function syncPinUsersFromCloud() {
  const s = checkConfig();
  const { data, error } = await (s.from('synced_pin_users') as any)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Pin users fetch error:', error);
    return { synced: 0, error: error.message };
  }

  if (!data || data.length === 0) {
    return { synced: 0, message: 'No pin users in cloud' };
  }

  let synced = 0;
  for (const cloudUser of data as any[]) {
    const existing = await db.pinUsers.where('username').equals(cloudUser.username).first();
    if (!existing) {
      await db.pinUsers.add({
        id: cloudUser.local_id || undefined,
        username: cloudUser.username,
        password: cloudUser.password,
        pin: cloudUser.pin,
        role: cloudUser.role as any,
        name: cloudUser.name,
        phone: cloudUser.phone,
        isLocked: cloudUser.is_locked || false,
        createdAt: new Date(cloudUser.created_at),
      });
      synced++;
    }
  }

  await logSync('pin_users_fetch', synced, 'success');
  return { synced, total: data.length };
}

// ── Orchestrators ────────────────────────────────────────────

export async function syncAll() {
  if (isProcessing) return {};
  isProcessing = true;
  try {
    const results: Record<string, any> = {};

    const tasks = {
      pinUsers: () => syncPinUsersToCloud(),
      members: () => syncMembersToCloud(),
      payments: () => syncPaymentsToCloud(),
      checkins: () => syncCheckinsToCloud(),
      pointsLedger: () => syncPointsLedgerToCloud(),
    };

    const entries = Object.entries(tasks).map(async ([name, fn]) => {
      results[name] = await syncOne(name, fn);
    });

    const entityEntries = Object.keys(ENTITY_REGISTRY).map(async (name) => {
      results[name] = await syncOne(name, () => syncEntityToCloudImpl(name));
    });

    await Promise.all([...entries, ...entityEntries]);
    return results;
  } finally {
    isProcessing = false;
  }
}

export async function syncAllEntities() {
  if (isProcessing) return {};
  isProcessing = true;
  try {
    const results: Record<string, SyncResult> = {};
    const tasks = Object.keys(ENTITY_REGISTRY).map(async (name) => {
      results[name] = await syncOne(name, () => syncEntityToCloudImpl(name));
    });
    await Promise.all(tasks);
    return results;
  } finally {
    isProcessing = false;
  }
}

export async function pullAllEntities() {
  if (isProcessing) return {};
  isProcessing = true;
  try {
    const results: Record<string, SyncResult> = {};
    const tasks = Object.keys(ENTITY_REGISTRY).map(async (name) => {
      results[name] = await syncOne(name, () => pullEntityFromCloudImpl(name));
    });
    await Promise.all(tasks);
    return results;
  } finally {
    isProcessing = false;
  }
}

// ── Retry helper ──────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      logger.warn(`[Sync] ${label} attempt ${attempt} failed, retrying in ${delay}ms: ${err instanceof Error ? err.message : String(err)}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`[Sync] ${label} exhausted retries`);
}

async function syncOne(entityName: string, fn: () => Promise<any>) {
  try {
    return await withRetry(fn, entityName);
  } catch (e: unknown) {
    logger.error(`${entityName} sync failed after retries:`, e);
    return { synced: 0, total: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Generic entity sync ───────────────────────────────────────

type SyncResult = { synced: number; total: number; error?: string };

async function pushEntityBatch<T>(
  entityName: string,
  items: Array<T & { id?: number }>
): Promise<SyncResult> {
  const s = checkConfig();
  const config = ENTITY_REGISTRY[entityName];
  if (!config) return { synced: 0, total: items.length, error: `Unknown entity: ${entityName}` };

  const existingIds = new Set<number>();
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const ids = batch.map(item => item.id).filter((id): id is number => id != null);
    if (ids.length === 0) continue;
    const { data: existing } = await (s.from(config.supabaseTable) as any)
      .select('local_id')
      .in('local_id', ids);
    if (existing) {
      existing.forEach((e: { local_id: number }) => existingIds.add(e.local_id));
    }
  }

  const newItems = items.filter(item => !item.id || !existingIds.has(item.id));

  let synced = 0;
  let lastError: string | undefined;

  if (config.rpcName) {
    for (const item of newItems) {
      try {
        const params = config.toCloudRecord(item);
        const record = item as any;
        const updatedAt = record.updatedAt;
        const { error } = await (s.rpc as any)(config.rpcName, {
          ...params,
          p_updated_at: updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString(),
        });

        if (error) {
          lastError = error.message;
          continue;
        }
        await config.dexieTable.update(item.id, { syncStatus: 'synced' });
        synced++;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
  } else {
    for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
      const batch = newItems.slice(i, i + BATCH_SIZE);
      const records = batch.map((item) => config.toCloudRecord(item));
      const { error } = await (s.from(config.supabaseTable) as any).upsert(records, { onConflict: 'local_id' });
      if (error) {
        lastError = error.message;
      } else {
        for (const item of batch) {
          if (item.id != null) {
            await config.dexieTable.update(item.id, { syncStatus: 'synced' });
          }
        }
        synced += batch.length;
      }
    }
  }

  return { synced, total: items.length, error: lastError };
}

async function syncEntityToCloudImpl(entityName: string): Promise<SyncResult> {
  const config = ENTITY_REGISTRY[entityName];
  if (!config) return { synced: 0, total: 0, error: `Unknown entity: ${entityName}` };

  const allItems = await config.dexieTable.where('syncStatus').equals('pending').toArray();
  if (allItems.length === 0) return { synced: 0, total: 0 };

  const result = await pushEntityBatch(entityName, allItems);
  await logSync(entityName, result.synced, result.error ? 'error' : 'success', result.error);
  return result;
}

export async function syncEntityToCloud(entityName: string): Promise<SyncResult> {
  if (isProcessing) return { synced: 0, total: 0, error: `Unknown entity: ${entityName}` };
  isProcessing = true;
  try {
    return await syncEntityToCloudImpl(entityName);
  } finally {
    isProcessing = false;
  }
}

async function pullEntityFromCloudImpl(entityName: string): Promise<SyncResult> {
  const s = checkConfig();
  const config = ENTITY_REGISTRY[entityName];
  if (!config) return { synced: 0, total: 0, error: `Unknown entity: ${entityName}` };

  let synced = 0;
  const table = config.dexieTable;
  const PAGE_SIZE = 100;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: records, error } = await (s.from(config.supabaseTable) as any)
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      return { synced, total: 0, error: error.message };
    }

    if (!records || records.length < PAGE_SIZE) {
      hasMore = false;
    }

    if (!records || records.length === 0) {
      break;
    }

    for (const record of records) {
      const existing = record.local_id ? await table.get(record.local_id) : null;
      const localItem = config.fromCloudRecord(record);
      if (existing) {
        const localRecord = await table.get(record.local_id);
        if (localRecord && (localRecord as Record<string, unknown>).syncStatus === 'pending') {
          continue;
        }
        await table.update(record.local_id, localItem);
      } else {
        await table.add(localItem);
      }
      synced++;
    }

    page++;
  }

  await logSync(`${entityName}_pull`, synced, 'success');
  return { synced, total: synced };
}

export async function pullEntityFromCloud(entityName: string): Promise<SyncResult> {
  if (isProcessing) return { synced: 0, total: 0, error: `Unknown entity: ${entityName}` };
  isProcessing = true;
  try {
    return await pullEntityFromCloudImpl(entityName);
  } finally {
    isProcessing = false;
  }
}

export async function getSyncStatus() {
  const pendingMembers = await db.members.where('syncStatus').equals('pending').count();
  const totalMembers = await db.members.count();
  const totalPayments = await db.payments.count();
  const totalCheckins = await db.checkins.count();
  const totalPointsLedger = await db.pointsLedger.count();

  let lastSyncLog: unknown[] | null = null;
  try {
    const s = checkConfig();
    const { data } = await s
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);
    lastSyncLog = data || [];
  } catch {
    lastSyncLog = [];
  }

  return {
    members: { pending: pendingMembers, total: totalMembers },
    payments: { total: totalPayments },
    checkins: { total: totalCheckins },
    pointsLedger: { total: totalPointsLedger },
    lastSyncLog,
    isConfigured: isSupabaseConfigured,
  };
}
