import { db } from '@/lib/db/dexie-db';
import type { SyncConflict } from '@/lib/db/dexie-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ENTITY_REGISTRY } from '@/lib/sync/registry';

export type { SyncConflict };

export type ConflictResolution = 'local_wins' | 'remote_wins' | 'manual';

const LEGACY_SUPABASE_MAP: Record<string, string> = {
  members: 'synced_members',
  payments: 'synced_payments',
  checkins: 'synced_checkins',
  pinUsers: 'synced_pin_users',
  pointsLedger: 'synced_points_ledger',
};

function getSupabaseTableName(table: string): string | null {
  const registry = ENTITY_REGISTRY[table];
  if (registry) return registry.supabaseTable;
  return LEGACY_SUPABASE_MAP[table] || null;
}

function getRpcName(table: string): string | null {
  const registry = ENTITY_REGISTRY[table];
  if (registry) return registry.rpcName;
  return null;
}

export async function detectConflict(
  table: string,
  recordId: string,
  localData: Record<string, unknown>,
  cloudData: Record<string, unknown>
): Promise<boolean> {
  const localUpdatedAt = localData['updated_at'] ?? localData['updatedAt'];
  const cloudUpdatedAt = cloudData['updated_at'] ?? cloudData['updatedAt'];

  if (!localUpdatedAt || !cloudUpdatedAt) return false;

  const localTime = new Date(String(localUpdatedAt)).getTime();
  const cloudTime = new Date(String(cloudUpdatedAt)).getTime();

  if (isNaN(localTime) || isNaN(cloudTime)) return false;

  return localTime !== cloudTime;
}

export async function addConflict(conflict: SyncConflict): Promise<void> {
  await db.syncConflicts.add({
    table: conflict.table,
    recordId: conflict.recordId,
    localData: conflict.localData,
    cloudData: conflict.cloudData,
    localUpdatedAt: conflict.localUpdatedAt,
    cloudUpdatedAt: conflict.cloudUpdatedAt,
    detectedAt: conflict.detectedAt || new Date().toISOString(),
  });

  if (!isSupabaseConfigured || !supabase) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sync_conflicts') as any).insert({
      table: conflict.table,
      record_id: conflict.recordId,
      local_data: JSON.stringify(conflict.localData),
      cloud_data: JSON.stringify(conflict.cloudData),
      local_updated_at: conflict.localUpdatedAt,
      cloud_updated_at: conflict.cloudUpdatedAt,
      detected_at: conflict.detectedAt || new Date().toISOString(),
    });
  } catch {
    // Cloud insert is best-effort
  }
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  const all = await db.syncConflicts.toArray();
  return all.filter(c => !c.resolvedAt);
}

export async function getAllConflicts(): Promise<SyncConflict[]> {
  return db.syncConflicts.toArray();
}

export async function resolveConflict(
  conflictId: number,
  resolution: ConflictResolution
): Promise<void> {
  const conflict = await db.syncConflicts.get(conflictId);
  if (!conflict) return;

  const resolvedAt = new Date().toISOString();

  if (resolution === 'local_wins') {
    const rpcName = getRpcName(conflict.table);
    const supabaseTable = getSupabaseTableName(conflict.table);

    if (isSupabaseConfigured && supabase) {
      if (rpcName) {
        const config = ENTITY_REGISTRY[conflict.table];
        if (config) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cloudRecord = config.toCloudRecord(conflict.localData as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.rpc as any)(rpcName, {
            ...cloudRecord,
            p_updated_at: new Date().toISOString(),
          });
        }
      } else if (supabaseTable) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from(supabaseTable) as any).upsert(conflict.localData, { onConflict: 'local_id' });
      }
    }
  } else if (resolution === 'remote_wins') {
    const config = ENTITY_REGISTRY[conflict.table];
    if (config) {
      const localRecord = config.fromCloudRecord(conflict.cloudData);
      if (conflict.recordId) {
        if (localRecord && typeof localRecord === 'object' && 'id' in localRecord) {
          const { id, ...rest } = localRecord as { id?: number } & Record<string, unknown>;
          if (id) {
            await config.dexieTable.update(id, rest as Parameters<typeof config.dexieTable.update>[1]);
          } else {
            await config.dexieTable.update(Number(conflict.recordId), rest as Parameters<typeof config.dexieTable.update>[1]);
          }
        }
      }
    } else {
      try {
        const dexieTable = db.table(conflict.table);
        const recordIdNum = /^\d+$/.test(conflict.recordId) ? Number(conflict.recordId) : conflict.recordId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await dexieTable.update(recordIdNum as any, conflict.cloudData as any);
      } catch {
        // Table not found, skip
      }
    }
  }

  await db.syncConflicts.update(conflictId, { resolvedAt, resolution } as Partial<SyncConflict>);

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('sync_conflicts') as any)
        .update({ resolved_at: resolvedAt, resolution })
        .eq('id', conflictId);
    } catch {
      // Best-effort
    }
  }
}
