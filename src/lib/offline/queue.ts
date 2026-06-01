import { db, OfflineQueueItem } from '@/lib/db/dexie-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const MAX_RETRIES = 5;
const PROCESS_INTERVAL_MS = 2000;

let processing = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

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

async function processItem(item: OfflineQueueItem): Promise<boolean> {
  const { id, entity, action, payload, recordId, retryCount } = item;
  if (!id) return false;

  try {
    await db.offlineQueue.update(id, { status: 'processing', updatedAt: new Date() });

    let success = false;
    const s = supabase!;

    if (entity === 'member') {
      if (action === 'delete') {
        if (!recordId) return false;
        const { error } = await s.from('synced_members').delete().eq('local_id', recordId as any);
        success = !error;
      } else {
        const { error } = await (s.rpc as any)('upsert_synced_member', payload);
        success = !error;
      }
    } else if (entity === 'payment') {
      const { error } = await (s.from('synced_payments').upsert(payload, { onConflict: 'local_id' }) as any);
      success = !error;
    } else if (entity === 'checkin') {
      const { error } = await (s.from('synced_checkins').upsert(payload, { onConflict: 'local_id' }) as any);
      success = !error;
    } else if (entity === 'product' || entity === 'products') {
      const { error } = await (s.rpc as any)('upsert_synced_product', payload);
      success = !error;
    } else if (entity === 'program' || entity === 'programs') {
      const { error } = await (s.rpc as any)('upsert_synced_program', payload);
      success = !error;
    } else if (entity === 'subscriptionPlan' || entity === 'subscriptionPlans') {
      const { error } = await (s.rpc as any)('upsert_synced_subscription_plan', payload);
      success = !error;
    } else if (entity === 'sale') {
      const { error } = await (s.rpc as any)('upsert_synced_sale', payload);
      success = !error;
    } else if (entity === 'pinUser') {
      if (!recordId) return false;
      const rid = String(recordId);
      const spu = s.from('synced_pin_users') as any;
      const { data: existing } = await spu.select('id').eq('local_id', rid).maybeSingle();
      if (action === 'delete') {
        await spu.delete().eq('local_id', rid);
      } else if (!existing) {
        await spu.insert(payload);
      } else {
        await spu.update(payload).eq('local_id', rid);
      }
      success = true;
    } else if (entity === 'pointsLedger') {
      const { error } = await (s.from('synced_points_ledger').upsert(payload, { onConflict: 'local_id' }) as any);
      success = !error;
    }

    if (success) {
      await db.offlineQueue.update(id, { status: 'completed', updatedAt: new Date() });
      return true;
    } else {
      throw new Error('Sync failed');
    }
  } catch (err: any) {
    const newRetryCount = retryCount + 1;
    const now = new Date();
    const nextRetryAt = new Date(now.getTime() + getBackoffDelay(newRetryCount));

    if (newRetryCount >= MAX_RETRIES) {
      await db.offlineQueue.update(id, {
        status: 'failed',
        retryCount: newRetryCount,
        lastError: err?.message || String(err),
        updatedAt: now,
      });
      logger.error('[QUEUE] Max retries reached', { entity, action, recordId, error: err?.message });
    } else {
      await db.offlineQueue.update(id, {
        status: 'pending',
        retryCount: newRetryCount,
        lastError: err?.message || String(err),
        updatedAt: now,
        nextRetryAt,
      });
    }
    return false;
  }
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (processing) return { processed: 0, failed: 0 };
  if (!isSupabaseConfigured || !supabase) return { processed: 0, failed: 0 };

  const online = await checkConnectivity();
  if (!online) return { processed: 0, failed: 0 };

  processing = true;
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
    processing = false;
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
        retryCount: 0,
        nextRetryAt: undefined,
        updatedAt: new Date(),
      });
    }
  }
  return failedItems.length;
}

export async function clearCompleted(olderThanMs = 86400000) {
  const cutoff = new Date(Date.now() - olderThanMs);
  const count = await db.offlineQueue
    .where('status')
    .equals('completed')
    .and(i => i.updatedAt < cutoff)
    .delete();
  return count;
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
  if (processing) return { processed: 0, failed: 0 };
  if (!isSupabaseConfigured || !supabase) return { processed: 0, failed: 0 };

  const online = await checkConnectivity();
  if (!online) return { processed: 0, failed: 0 };

  processing = true;
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
    processing = false;
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
  payload: any,
  priority: OfflineQueueItem['priority'] = 'important',
  recordId?: string | number,
) {
  await enqueue(entity, action, payload, priority, recordId);
  processQueue();
}
