/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockOfflineQueue, mockQueueData, mockSupabaseFrom, mockSupabaseRpc, mockSupabaseChain } = vi.hoisted(() => {
  const data: any[] = [];
  let idCounter = 0;

  function filteredData(filterFn: (item: any) => boolean) {
    const items = data.filter(filterFn);
    const col = {
      toArray: vi.fn(() => Promise.resolve([...items])),
      count: vi.fn(() => Promise.resolve(items.length)),
      first: vi.fn(() => Promise.resolve(items[0] ?? undefined)),
      delete: vi.fn(() => {
        const ids = new Set(items.map(i => i.id));
        let deleted = 0;
        for (let i = data.length - 1; i >= 0; i--) {
          if (ids.has(data[i].id)) { data.splice(i, 1); deleted++; }
        }
        return Promise.resolve(deleted);
      }),
      modify: vi.fn((fn: any) => {
        const changeFn = typeof fn === 'function' ? fn : () => fn;
        items.forEach(item => {
          const idx = data.indexOf(item);
          if (idx >= 0) data[idx] = { ...data[idx], ...changeFn(data[idx]) };
        });
        return Promise.resolve();
      }),
      limit: vi.fn((n: number) => filteredData(i => items.includes(i)).limitResults(n)),
      and: vi.fn((fn: (item: any) => boolean) => filteredData(i => items.includes(i) && fn(i))),
      equals: vi.fn(() => filteredData(i => items.includes(i))),
      limitResults: (n: number) => {
        const limited = items.slice(0, n);
        return {
          toArray: vi.fn(() => Promise.resolve([...limited])),
          count: vi.fn(() => Promise.resolve(limited.length)),
          first: vi.fn(() => Promise.resolve(limited[0] ?? undefined)),
          delete: vi.fn(() => {
            const ids = new Set(limited.map(i => i.id));
            let deleted = 0;
            for (let i = data.length - 1; i >= 0; i--) {
              if (ids.has(data[i].id)) { data.splice(i, 1); deleted++; }
            }
            return Promise.resolve(deleted);
          }),
          modify: vi.fn((fn: any) => {
            const changeFn = typeof fn === 'function' ? fn : () => fn;
            limited.forEach(item => {
              const idx = data.indexOf(item);
              if (idx >= 0) data[idx] = { ...data[idx], ...changeFn(data[idx]) };
            });
            return Promise.resolve();
          }),
        };
      },
    };
    return col;
  }

  const sbChain: any = {};
  Object.assign(sbChain, {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    mockOfflineQueue: {
      _reset: () => { data.length = 0; idCounter = 0; },
      _getData: () => data,
      add: vi.fn((item: any) => {
        idCounter++;
        data.push({ ...item, id: idCounter });
        return Promise.resolve(idCounter);
      }),
      update: vi.fn((id: number, changes: any) => {
        const idx = data.findIndex((d: any) => d.id === id);
        if (idx >= 0) { data[idx] = { ...data[idx], ...changes }; return Promise.resolve(1); }
        return Promise.resolve(0);
      }),
      bulkDelete: vi.fn((ids: number[]) => {
        for (const id of ids) {
          const idx = data.findIndex((d: any) => d.id === id);
          if (idx >= 0) data.splice(idx, 1);
        }
        return Promise.resolve();
      }),
      where: vi.fn((field: string) => ({
        equals: vi.fn((val: any) => filteredData(i => i[field] === val)),
        startsWithAnyOf: vi.fn(() => filteredData(() => true)),
        above: vi.fn(() => filteredData(() => true)),
        below: vi.fn(() => filteredData(() => true)),
      })),
      toArray: vi.fn(() => Promise.resolve([...data])),
      count: vi.fn(() => Promise.resolve(data.length)),
      put: vi.fn((item: any) => {
        const idx = data.findIndex((d: any) => d.id === item.id);
        if (idx >= 0) data[idx] = item;
        else { idCounter++; data.push({ ...item, id: idCounter }); }
        return Promise.resolve(item.id ?? idCounter);
      }),
      orderBy: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve(data[0])),
        last: vi.fn(() => Promise.resolve(data[data.length - 1])),
        toArray: vi.fn(() => Promise.resolve([...data])),
      })),
    },
    mockQueueData: data,
    mockSupabaseFrom: vi.fn().mockReturnValue(sbChain),
    mockSupabaseRpc: vi.fn(),
    mockSupabaseChain: sbChain,
  };
});

vi.mock('@/lib/db/dexie-db', () => ({
  db: { offlineQueue: mockOfflineQueue },
  OfflineQueueItem: {} as any,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: mockSupabaseFrom, rpc: mockSupabaseRpc },
  isSupabaseConfigured: true,
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  enqueue,
  processQueue,
  getQueueStatus,
  retryFailed,
  clearCompleted,
  checkConnectivity,
  processQueueByTier,
  enqueueAndProcess,
} from '@/lib/offline/queue';

function resetAll() {
  mockOfflineQueue._reset();
  mockSupabaseFrom.mockClear();
  mockSupabaseRpc.mockClear();
  mockSupabaseChain.select.mockReset().mockReturnThis();
  mockSupabaseChain.eq.mockReset().mockReturnThis();
  mockSupabaseChain.in.mockReset().mockReturnThis();
  mockSupabaseChain.order.mockReset().mockReturnThis();
  mockSupabaseChain.limit.mockReset().mockReturnThis();
  mockSupabaseChain.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  mockSupabaseChain.insert.mockReset().mockResolvedValue({ error: null });
  mockSupabaseChain.upsert.mockReset().mockResolvedValue({ error: null });
  mockSupabaseChain.delete.mockReset().mockReturnThis();
  mockSupabaseChain.update.mockReset().mockReturnThis();
  mockSupabaseChain.single.mockReset().mockResolvedValue({ data: null, error: null });
  mockOfflineQueue.add.mockClear();
  mockOfflineQueue.update.mockClear();
}

describe('enqueue', () => {
  beforeEach(resetAll);

  it('adds an item to the offline queue', async () => {
    const id = await enqueue('member', 'create', { name: 'Test' }, 'important');
    expect(id).toBeGreaterThan(0);
    expect(mockOfflineQueue.add).toHaveBeenCalledOnce();
    const added = mockOfflineQueue.add.mock.calls[0][0];
    expect(added.entity).toBe('member');
    expect(added.action).toBe('create');
    expect(added.priority).toBe('important');
    expect(added.status).toBe('pending');
    expect(added.retryCount).toBe(0);
    expect(added.maxRetries).toBe(5);
  });

  it('adds item with critical priority', async () => {
    await enqueue('payment', 'update', { amount: 5000 }, 'critical', 42);
    const added = mockOfflineQueue.add.mock.calls[0][0];
    expect(added.priority).toBe('critical');
    expect(added.recordId).toBe(42);
  });

  it('adds item with heavy priority', async () => {
    await enqueue('checkin', 'create', { memberId: 1 }, 'heavy');
    const added = mockOfflineQueue.add.mock.calls[0][0];
    expect(added.priority).toBe('heavy');
  });

  it('defaults to important priority', async () => {
    await enqueue('member', 'create', { name: 'Test' });
    const added = mockOfflineQueue.add.mock.calls[0][0];
    expect(added.priority).toBe('important');
  });
});

describe('checkConnectivity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns false when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));
    const result = await checkConnectivity();
    expect(result).toBe(false);
  });

  it('returns true when fetch succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ status: 200 })));
    const result = await checkConnectivity();
    expect(result).toBe(true);
  });
});

describe('processQueue', () => {
  beforeEach(() => {
    resetAll();
    mockSupabaseRpc.mockReset();
  });

  it('returns 0 when queue is empty', async () => {
    const result = await processQueue();
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('processes items from queue', async () => {
    const now = new Date();
    mockQueueData.push(
      { id: 1, entity: 'member', action: 'create', payload: { p_local_id: 1, p_phone: '0555000001', p_first_name: 'A', p_last_name: 'B', p_status: 'active', p_subscription_type: 'free_session', p_gender: 'male' }, priority: 'critical', status: 'pending', retryCount: 0, maxRetries: 5, createdAt: now, updatedAt: now },
    );
    mockSupabaseRpc.mockResolvedValue({ error: null });

    const result = await processQueue();
    expect(result.processed).toBe(1);
  });

  it('handles processing errors', async () => {
    mockQueueData.push({
      id: 1, entity: 'member', action: 'create', payload: {}, priority: 'critical', status: 'pending', retryCount: 0, maxRetries: 5, createdAt: new Date(), updatedAt: new Date(),
    });
    mockSupabaseRpc.mockResolvedValue({ error: { message: 'DB error' } });

    const result = await processQueue();
    expect(result.failed).toBe(1);
  });
});

describe('processQueueByTier', () => {
  beforeEach(resetAll);

  it('processes items for given priority tier', async () => {
    mockQueueData.push({
      id: 1, entity: 'payment', action: 'create', payload: { local_id: 1, member_id: 1, amount: 5000, type: 'subscription', mode: 'cash', date: new Date().toISOString(), created_at: new Date().toISOString() },
      priority: 'important', status: 'pending', retryCount: 0, maxRetries: 5, createdAt: new Date(), updatedAt: new Date(),
    });
    mockSupabaseChain.upsert.mockResolvedValue({ error: null });

    const result = await processQueueByTier('important');
    expect(result.processed).toBe(1);
  });

  it('returns 0 for empty tier', async () => {
    const result = await processQueueByTier('heavy');
    expect(result.processed).toBe(0);
  });
});

describe('getQueueStatus', () => {
  beforeEach(resetAll);

  it('returns all zeros for empty queue', async () => {
    const status = await getQueueStatus();
    expect(status.pending).toBe(0);
    expect(status.processing).toBe(0);
    expect(status.failed).toBe(0);
    expect(status.completed).toBe(0);
    expect(status.byPriority.critical).toBe(0);
    expect(status.byPriority.important).toBe(0);
    expect(status.byPriority.heavy).toBe(0);
  });

  it('returns counts for queued items', async () => {
    const now = new Date();
    mockQueueData.push(
      { id: 1, entity: 'member', action: 'create', payload: {}, priority: 'critical', status: 'pending', retryCount: 0, maxRetries: 5, createdAt: now, updatedAt: now },
      { id: 2, entity: 'payment', action: 'update', payload: {}, priority: 'important', status: 'failed', retryCount: 3, maxRetries: 5, lastError: 'error', createdAt: now, updatedAt: now },
      { id: 3, entity: 'checkin', action: 'create', payload: {}, priority: 'heavy', status: 'completed', retryCount: 0, maxRetries: 5, createdAt: now, updatedAt: now },
    );

    const status = await getQueueStatus();
    expect(status.pending).toBe(1);
    expect(status.failed).toBe(1);
    expect(status.completed).toBe(1);
    expect(status.byPriority.critical).toBe(1);
  });
});

describe('retryFailed', () => {
  beforeEach(resetAll);

  it('resets failed items back to pending', async () => {
    const now = new Date();
    mockQueueData.push(
      { id: 1, entity: 'member', action: 'create', payload: {}, priority: 'important', status: 'failed', retryCount: 5, maxRetries: 5, lastError: 'Error', createdAt: now, updatedAt: now },
    );

    const count = await retryFailed();
    expect(count).toBe(1);
    expect(mockQueueData[0].status).toBe('pending');
    expect(mockQueueData[0].retryCount).toBe(5);
    expect(mockQueueData[0].nextRetryAt).toBeUndefined();
  });

  it('returns 0 when no failed items', async () => {
    const count = await retryFailed();
    expect(count).toBe(0);
  });
});

describe('clearCompleted', () => {
  beforeEach(resetAll);

  it('removes completed items older than cutoff', async () => {
    const oldDate = new Date(Date.now() - 90000000);
    const recentDate = new Date();
    mockQueueData.push(
      { id: 1, entity: 'member', action: 'create', payload: {}, priority: 'important', status: 'completed', syncStatus: 'synced', retryCount: 0, maxRetries: 5, createdAt: oldDate, updatedAt: oldDate },
      { id: 2, entity: 'member', action: 'create', payload: {}, priority: 'important', status: 'completed', syncStatus: 'synced', retryCount: 0, maxRetries: 5, createdAt: recentDate, updatedAt: recentDate },
    );

    const count = await clearCompleted(86400000);
    expect(count).toBe(1);
  });
});

describe('enqueueAndProcess', () => {
  beforeEach(resetAll);

  it('enqueues and triggers processing', async () => {
    await enqueueAndProcess('member', 'create', { name: 'Test' }, 'important', 1);
    expect(mockOfflineQueue.add).toHaveBeenCalledOnce();
  });
});
