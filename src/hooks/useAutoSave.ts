'use client';

import { useCallback } from 'react';
import { db } from '@/lib/db/dexie-db';
import { ENTITY_REGISTRY, SyncEntityConfig } from '@/lib/sync/registry';
import { enqueueAndProcess } from '@/lib/offline/queue';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/lib/auth/context';
import type { AuditAction, OfflineQueueItem } from '@/lib/db/dexie-db';


function getUserName(user: { username?: string; email?: string; name?: string } | string | null | undefined): string {
  if (!user) return 'unknown';
  if (typeof user === 'string') return user;
  if (user.username) return user.username;
  if (user.email) return user.email;
  if (user.name) return user.name;
  return 'unknown';
}

interface AutoSaveOptions {
  entityName: string;
  onCreate?: AuditAction;
  onUpdate?: AuditAction;
  onDelete?: AuditAction;
  priority?: OfflineQueueItem['priority'];
}

export function useAutoSave<T extends { id?: number }>({ entityName, onCreate, onUpdate, onDelete, priority = 'important' }: AutoSaveOptions) {
  const { user, role } = useAuth();
  const config = ENTITY_REGISTRY[entityName] as SyncEntityConfig<T> | undefined;

  const pushToCloud = useCallback(async (item: Partial<T> & { id?: number }, action: OfflineQueueItem['action'] = 'update') => {
    if (!config) return;
    const params = config.toCloudRecord(item);
    const payload = { ...params, p_updated_at: new Date().toISOString() };
    const recordId = item.id?.toString();
    await enqueueAndProcess(entityName, action, payload, priority, recordId);
  }, [entityName, config, priority]);

  const save = useCallback(async (data: Partial<T>): Promise<number | undefined> => {
    const now = new Date();
    const item = { ...data, createdAt: now, version: 1 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await (config?.dexieTable || (db as any)[entityName]).add(item);

    if (onCreate && user) {
      logAudit({ action: onCreate, newValue: JSON.stringify(data) }, getUserName(user), role || 'unknown');
    }

    pushToCloud({ ...item, id }, 'create');
    return id;
  }, [entityName, config, onCreate, user, role, pushToCloud]);

  const update = useCallback(async (id: number, data: Partial<T>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldItem = await (config?.dexieTable || (db as any)[entityName]).get(id);
    const oldVersion: number = (oldItem as { version?: number })?.version || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (config?.dexieTable || (db as any)[entityName]).update(id, { ...data, version: oldVersion + 1, updatedAt: new Date() } as any);

    if (onUpdate && user) {
      logAudit({
        action: onUpdate,
        oldValue: oldItem ? JSON.stringify(oldItem) : undefined,
        newValue: JSON.stringify(data),
      }, getUserName(user), role || 'unknown');
    }

    pushToCloud({ ...data, id, version: oldVersion + 1 }, 'update');
  }, [entityName, config, onUpdate, user, role, pushToCloud]);

  const remove = useCallback(async (id: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldItem = await (config?.dexieTable || (db as any)[entityName]).get(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (config?.dexieTable || (db as any)[entityName]).delete(id);

    if (onDelete && user) {
      logAudit({
        action: onDelete,
        oldValue: oldItem ? JSON.stringify(oldItem) : undefined,
      }, getUserName(user), role || 'unknown');
    }

    await enqueueAndProcess(entityName, 'delete', { id: id.toString() }, 'critical', id.toString());
  }, [entityName, config, onDelete, user, role]);

  return { save, update, remove };
}
