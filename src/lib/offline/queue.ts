import { db, OfflineQueueItem } from '@/lib/db/dexie-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { ENTITY_REGISTRY } from '@/lib/sync/registry';

const MAX_RETRIES = 5;
const PROCESS_INTERVAL_MS = 2000;

let processingCount = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

function acquireLock(): boolean {
  if (processingCount > 0) return false;
  processingCount++;
  return true;
}

function releaseLock(): void {
  processingCount = Math.max(0, processingCount - 1);
}

const TIER_CONFIG = {
  critical: { intervalMs: 1000, limit: 20 },
  important: { intervalMs: 5000, limit: 10 },
  heavy: { intervalMs: 30000, limit: 5 },
};

const tierIntervals: Record<string, ReturnType<typeof setInterval> | null> = {
  critical: null,
  important: null,
  heavy: null,
};

export async function checkConnectivity(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '_health_', password: '_check_' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.status !== 0;
  } catch {
    return false;
  }
}

export async function enqueue(
  entity: string,
  action: OfflineQueueItem['action'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  priority: OfflineQueueItem['priority'] = 'important',
  recordId?: string | number,
): Promise<number> {
  const now = new Date();
  const id = await db.offlineQueue.add({
    entity,
    action,
    payload,
    recordId,
    priority,
    status: 'pending',
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    createdAt: now,
    updatedAt: now,
  } as OfflineQueueItem);
  return id as number;
}

function getBackoffDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 16000);
}

const LEGACY_TABLE_MAP: Record<string, string> = {
  member: 'synced_members',
  payment: 'synced_payments',
  checkin: 'synced_checkins',
  pinUser: 'synced_pin_users',
  pointsLedger: 'synced_points_ledger',
};

const ENTITY_ALIAS: Record<string, string> = {
  product: 'products',
  program: 'programs',
  subscriptionPlan: 'subscriptionPlans',
  sale: 'sales',
};

function resolveEntityConfig(entity: string): { rpcName?: string; tableName: string } | null {
  let config = ENTITY_REGISTRY[entity];
  if (config) return { rpcName: config.rpcName, tableName: config.supabaseTable };

  const canonical = ENTITY_ALIAS[entity];
  if (canonical) {
    config = ENTITY_REGISTRY[canonical];
    if (config) return { rpcName: config.rpcName, tableName: config.supabaseTable };
  }

  const legacyTable = LEGACY_TABLE_MAP[entity];
  if (legacyTable) {
    config = ENTITY_REGISTRY[legacyTable] || ENTITY_REGISTRY[Object.keys(ENTITY_REGISTRY).find(k => ENTITY_REGISTRY[k].supabaseTable === legacyTable) || ''];
    if (config) return { rpcName: config.rpcName, tableName: config.supabaseTable };
    return { tableName: legacyTable };
  }

  return null;
}

async function processItem(item: OfflineQueueItem): Promise<boolean> {
  const { id, entity, action, payload, recordId, retryCount } = item;
  if (!id) return false;

  try {
    await db.offlineQueue.update(id, { status: 'processing', updatedAt: new Date() });

    const config = resolveEntityConfig(entity);
    if (!config) {
      throw new Error(`Unknown entity: ${entity}`);
    }

    const s = supabase!;
    let success = false;

    if (action === 'delete') {
      if (!recordId) {
        await db.offlineQueue.update(id, { status: 'failed', retryCount: MAX_RETRIES, lastError: 'No recordId for delete', updatedAt: new Date() });
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (s.from(config.tableName) as any).delete().eq('local_id', recordId);
      success = !error;
    } else if (config.rpcName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (s.rpc as any)(config.rpcName, payload);
      success = !error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (s.from(config.tableName) as any).upsert(payload, { onConflict: 'local_id' });
      success = !error;
    }

    if (success) {
      await db.offlineQueue.update(id, { status: 'completed', retryCount: 0, updatedAt: new Date() });
      return true;
    } else {
      throw new Error('Sync failed');
    }
  } catch (err: unknown) {
    const newRetryCount = retryCount + 1;
    const now = new Date();
    const nextRetryAt = new Date(now.getTime() + getBackoffDelay(newRetryCount));
    const errMsg = err instanceof Error ? err.message : String(err);

    if (newRetryCount >= MAX_RETRIES) {
      await db.offlineQueue.update(id, {
        status: 'failed',
        retryCount: newRetryCount,
        lastError: errMsg,
        updatedAt: now,
      });
      logger.error('[QUEUE] Max retries reached', { entity, action, recordId, error: errMsg });
    } else {
      await db.offlineQueue.update(id, {
        status: 'pending',
        retryCount: newRetryCount,
        lastError: errMsg,
        updatedAt: now,
        nextRetryAt,
      });
    }
    return false;
  }
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (!acquireLock()) return { processed: 0, failed: 0 };
  if (!isSupabaseConfigured || !supabase) { releaseLock(); return { processed: 0, failed: 0 }; }

  const online = await checkConnectivity();
  if (!online) { releaseLock(); return { processed: 0, failed: 0 }; }

  let processed = 0;
  let failed = 0;

  try {
    const priorityOrder: OfflineQueueItem['priority'][] = ['critical', 'important', 'heavy'];
    for (const p of priorityOrder) {
      const items = await db.offlineQueue
        .where('status')
        .equals('pending')
        .and(item => item.priority === p && (!item.nextRetryAt || new Date(item.nextRetryAt) <= new Date()))
        .limit(20)
        .toArray();

      for (const item of items) {
        const ok = await processItem(item);
        if (ok) processed++;
        else failed++;
      }
    }
  } finally {
    releaseLock();
  }

  return { processed, failed };
}

export async function getQueueStatus() {
  const pending = await db.offlineQueue.where('status').equals('pending').count();
  const processing = await db.offlineQueue.where('status').equals('processing').count();
  const failed = await db.offlineQueue.where('status').equals('failed').count();
  const completed = await db.offlineQueue.where('status').equals('completed').count();

  const byPriority = {
    critical: await db.offlineQueue.where('priority').equals('critical').and(i => i.status === 'pending').count(),
    important: await db.offlineQueue.where('priority').equals('important').and(i => i.status === 'pending').count(),
    heavy: await db.offlineQueue.where('priority').equals('heavy').and(i => i.status === 'pending').count(),
  };

  return { pending, processing, failed, completed, byPriority };
}

export async function retryFailed() {
  const failedItems = await db.offlineQueue.where('status').equals('failed').toArray();
  for (const item of failedItems) {
    if (item.id) {
      await db.offlineQueue.update(item.id, {
        status: 'pending',
        nextRetryAt: undefined,
        updatedAt: new Date(),
      });
    }
  }
  return failedItems.length;
}

export async function clearCompleted(olderThanMs = 86400000) {
  const cutoff = new Date(Date.now() - olderThanMs);
  const completedItems = await db.offlineQueue
    .where('status')
    .equals('completed')
    .and(item => item.syncStatus === 'synced' && item.updatedAt < cutoff)
    .toArray();
  const ids = completedItems.map(i => i.id).filter(Boolean) as number[];
  if (ids.length > 0) {
    await db.offlineQueue.bulkDelete(ids);
  }
  return ids.length;
}

export function startQueueProcessor() {
  if (intervalId) return;
  processQueue();
  intervalId = setInterval(() => { processQueue(); }, PROCESS_INTERVAL_MS);
}

export function stopQueueProcessor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function processQueueByTier(priority: OfflineQueueItem['priority']): Promise<{ processed: number; failed: number }> {
  if (!acquireLock()) return { processed: 0, failed: 0 };
  if (!isSupabaseConfigured || !supabase) { releaseLock(); return { processed: 0, failed: 0 }; }

  const online = await checkConnectivity();
  if (!online) { releaseLock(); return { processed: 0, failed: 0 }; }

  let processed = 0;
  let failed = 0;

  try {
    const config = TIER_CONFIG[priority];
    const items = await db.offlineQueue
      .where('status')
      .equals('pending')
      .and(item => item.priority === priority && (!item.nextRetryAt || new Date(item.nextRetryAt) <= new Date()))
      .limit(config.limit)
      .toArray();

    for (const item of items) {
      const ok = await processItem(item);
      if (ok) processed++;
      else failed++;
    }
  } finally {
    releaseLock();
  }

  return { processed, failed };
}

export function startTieredProcessor() {
  for (const tier of ['critical', 'important', 'heavy'] as const) {
    if (tierIntervals[tier]) continue;
    processQueueByTier(tier);
    tierIntervals[tier] = setInterval(() => {
      processQueueByTier(tier);
    }, TIER_CONFIG[tier].intervalMs);
  }
}

export function stopTieredProcessor() {
  for (const tier of Object.keys(tierIntervals)) {
    if (tierIntervals[tier]) {
      clearInterval(tierIntervals[tier]!);
      tierIntervals[tier] = null;
    }
  }
}

export async function enqueueAndProcess(
  entity: string,
  action: OfflineQueueItem['action'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  priority: OfflineQueueItem['priority'] = 'important',
  recordId?: string | number,
) {
  await enqueue(entity, action, payload, priority, recordId);
  processQueue().catch((err) => {
    console.error('Queue processing failed:', err);
  });
}
