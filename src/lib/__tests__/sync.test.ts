/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockTxFrom, mockTxRpc, mockTxChain,
  mockMembers, mockPayments, mockCheckins, mockPointsLedger,
  mockPinUsers, mockSettings, mockWorkoutPrograms, mockNutritionPrograms,
  mockSchedules, mockProgressLogs, mockAccessLogs, mockProfiles, mockClubInfo,
  mockRegistryDexieTable,
} = vi.hoisted(() => {
  function makeTable<T extends { id?: number }>() {
    let data: T[] = [];
    const chain: any = {};
    const col = {
      toArray: vi.fn(() => Promise.resolve([...data])),
      count: vi.fn(() => Promise.resolve(data.length)),
      first: vi.fn(() => Promise.resolve(data[0] ?? undefined)),
      delete: vi.fn(() => { const n = data.length; data = []; return Promise.resolve(n); }),
      modify: vi.fn((fn: any) => {
        if (typeof fn === 'function') data.forEach((d, i) => { data[i] = { ...d, ...fn(d) }; });
        else data.forEach((d, i) => { data[i] = { ...d, ...fn }; });
        return Promise.resolve();
      }),
      limit: vi.fn(() => col),
      and: vi.fn(() => col),
      equals: vi.fn(() => col),
    };
    Object.assign(chain, col);
    return {
      _reset: (d: T[]) => { data = [...d]; },
      _getData: () => data,
      toArray: vi.fn(() => Promise.resolve([...data])),
      count: vi.fn(() => Promise.resolve(data.length)),
      add: vi.fn((item: T) => {
        const id = data.reduce((m, d) => Math.max(m, d.id ?? 0), 0) + 1;
        data.push({ ...item, id } as T);
        return Promise.resolve(id);
      }),
      update: vi.fn((id: number, changes: any) => {
        const idx = data.findIndex(d => d.id === id);
        if (idx >= 0) { data[idx] = { ...data[idx], ...changes }; return Promise.resolve(1); }
        return Promise.resolve(0);
      }),
      put: vi.fn((item: T) => {
        const idx = data.findIndex(d => d.id === item.id);
        if (idx >= 0) data[idx] = item;
        else data.push(item);
        return Promise.resolve(item.id ?? data.length);
      }),
      get: vi.fn((id: number) => Promise.resolve(data.find(d => d.id === id))),
      bulkAdd: vi.fn((items: T[]) => { items.forEach(i => { const id = data.length + 1; data.push({ ...i, id } as T); }); return Promise.resolve(); }),
      where: vi.fn(() => chain),
      filter: vi.fn(() => chain),
      orderBy: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve(data[0])),
        last: vi.fn(() => Promise.resolve(data[data.length - 1])),
        toArray: vi.fn(() => Promise.resolve([...data])),
      })),
    };
  }

  const chain: any = {};
  Object.assign(chain, {
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
  });

  return {
    mockTxFrom: vi.fn().mockReturnValue(chain),
    mockTxRpc: vi.fn(),
    mockTxChain: chain,
    mockMembers: makeTable(),
    mockPayments: makeTable(),
    mockCheckins: makeTable(),
    mockPointsLedger: makeTable(),
    mockPinUsers: makeTable(),
    mockSettings: makeTable(),
    mockWorkoutPrograms: makeTable(),
    mockNutritionPrograms: makeTable(),
    mockSchedules: makeTable(),
    mockProgressLogs: makeTable(),
    mockAccessLogs: makeTable(),
    mockProfiles: makeTable(),
    mockClubInfo: makeTable(),
    mockRegistryDexieTable: makeTable(),
  };
});

vi.mock('@/lib/db/dexie-db', () => ({
  db: {
    members: mockMembers,
    payments: mockPayments,
    checkins: mockCheckins,
    pointsLedger: mockPointsLedger,
    pinUsers: mockPinUsers,
    settings: mockSettings,
    workoutPrograms: mockWorkoutPrograms,
    nutritionPrograms: mockNutritionPrograms,
    schedules: mockSchedules,
    progressLogs: mockProgressLogs,
    accessLogs: mockAccessLogs,
    profiles: mockProfiles,
    clubInfo: mockClubInfo,
  },
  OfflineQueueItem: {} as any,
  Member: {} as any,
  Payment: {} as any,
  CheckIn: {} as any,
  PointsLedger: {} as any,
  PinUser: {} as any,
  WorkoutProgramCache: {} as any,
  NutritionProgramCache: {} as any,
  ScheduleCache: {} as any,
  ProgressLogCache: {} as any,
  AccessLogCache: {} as any,
  ProfileCache: {} as any,
  ClubInfoCache: {} as any,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: mockTxFrom, rpc: mockTxRpc },
  isSupabaseConfigured: true,
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/sync/registry', () => ({
  ENTITY_REGISTRY: {
    products: {
      dexieTable: mockRegistryDexieTable,
      supabaseTable: 'synced_products',
      rpcName: 'upsert_synced_product',
      toCloudRecord: (item: any) => ({ p_local_id: item.id, p_name: item.name }),
      fromCloudRecord: (r: any) => ({ id: r.local_id, name: r.name }),
    },
  },
}));

import {
  syncMembersToCloud,
  syncPaymentsToCloud,
  syncCheckinsToCloud,
  syncPointsLedgerToCloud,
  syncPinUsersToCloud,
  syncPinUsersFromCloud,
  syncAll,
  pullAllEntities,
  getSyncStatus,
  syncEntityToCloud,
  pullEntityFromCloud,
} from '@/lib/supabase/sync';

function resetChains() {
  mockTxChain.select.mockReset().mockReturnThis();
  mockTxChain.eq.mockReset().mockReturnThis();
  mockTxChain.in.mockReset().mockReturnThis();
  mockTxChain.order.mockReset().mockReturnThis();
  mockTxChain.limit.mockReset().mockReturnThis();
  mockTxChain.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  mockTxChain.insert.mockReset().mockResolvedValue({ error: null });
  mockTxChain.upsert.mockReset().mockResolvedValue({ error: null });
  mockTxChain.delete.mockReset().mockReturnThis();
  mockTxChain.update.mockReset().mockReturnThis();
}

describe('syncMembersToCloud', () => {
  beforeEach(() => {
    mockMembers._reset([]);
    mockTxRpc.mockReset();
    resetChains();
  });

  it('returns 0 synced when no pending members', async () => {
    const result = await syncMembersToCloud();
    expect(result.synced).toBe(0);
    expect(result.message).toContain('No pending members');
  });

  it('syncs pending members and marks them synced', async () => {
    const now = new Date();
    mockMembers._reset([
      { id: 1, firstName: 'John', lastName: 'Doe', phone: '0555000011', status: 'active', syncStatus: 'pending', updatedAt: now } as any,
    ]);
    mockTxRpc.mockResolvedValue({ data: 1, error: null });

    const result = await syncMembersToCloud();
    expect(result.synced).toBe(1);
    expect(mockTxRpc).toHaveBeenCalledWith('upsert_synced_member', expect.objectContaining({ p_phone: '0555000011' }));
  });

  it('handles rpc error gracefully', async () => {
    const now = new Date();
    mockMembers._reset([
      { id: 1, firstName: 'Jane', lastName: 'Smith', phone: '0555000022', status: 'active', syncStatus: 'pending', updatedAt: now } as any,
    ]);
    mockTxRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const result = await syncMembersToCloud();
    expect(result.synced).toBe(0);
    expect(result.error).toBe('RPC failed');
  });
});

describe('syncPaymentsToCloud', () => {
  beforeEach(() => {
    mockPayments._reset([]);
    resetChains();
  });

  it('returns 0 when no payments exist', async () => {
    const result = await syncPaymentsToCloud();
    expect(result.synced).toBe(0);
    expect(result.message).toContain('No payments');
  });

  it('syncs unsynced payments', async () => {
    mockPayments._reset([
      { id: 1, memberId: 1, amount: 5000, type: 'subscription', mode: 'cash', date: new Date(), description: 'Test', createdAt: new Date() } as any,
    ]);
    mockTxChain.in.mockResolvedValue({ data: [], error: null });

    const result = await syncPaymentsToCloud();
    expect(result.synced).toBe(1);
    expect(mockTxChain.upsert).toHaveBeenCalled();
  });

  it('skips already synced payments', async () => {
    mockPayments._reset([
      { id: 1, memberId: 1, amount: 5000, type: 'subscription', mode: 'cash', date: new Date(), description: 'Test', createdAt: new Date() } as any,
    ]);
    mockTxChain.in.mockResolvedValue({ data: [{ local_id: 1 }], error: null });

    const result = await syncPaymentsToCloud();
    expect(result.synced).toBe(0);
    expect(result.message).toContain('already synced');
  });
});

describe('syncCheckinsToCloud', () => {
  beforeEach(() => {
    mockCheckins._reset([]);
    resetChains();
  });

  it('returns 0 when no checkins exist', async () => {
    const result = await syncCheckinsToCloud();
    expect(result.synced).toBe(0);
  });

  it('syncs unsynced checkins', async () => {
    mockCheckins._reset([
      { id: 1, memberId: 1, timestamp: new Date(), type: 'checkin' } as any,
    ]);
    mockTxChain.in.mockResolvedValue({ data: [], error: null });

    const result = await syncCheckinsToCloud();
    expect(result.synced).toBe(1);
    expect(mockTxChain.upsert).toHaveBeenCalled();
  });
});

describe('syncPointsLedgerToCloud', () => {
  beforeEach(() => {
    mockPointsLedger._reset([]);
    resetChains();
  });

  it('returns 0 when no ledger entries exist', async () => {
    const result = await syncPointsLedgerToCloud();
    expect(result.synced).toBe(0);
  });

  it('syncs unsynced ledger entries', async () => {
    mockPointsLedger._reset([
      { id: 1, memberId: 1, memberName: 'John', points: 100, type: 'earn', reason: 'purchase', balanceAfter: 100, createdAt: new Date() } as any,
    ]);
    mockTxChain.in.mockResolvedValue({ data: [], error: null });

    const result = await syncPointsLedgerToCloud();
    expect(result.synced).toBe(1);
  });
});

describe('syncPinUsersToCloud', () => {
  beforeEach(() => {
    mockPinUsers._reset([]);
    resetChains();
  });

  it('returns 0 when no pin users exist', async () => {
    const result = await syncPinUsersToCloud();
    expect(result.synced).toBe(0);
  });

  it('syncs all pin users', async () => {
    mockPinUsers._reset([
      { id: 1, username: 'admin', password: 'hash', role: 'admin', name: 'Admin', isLocked: false, createdAt: new Date() } as any,
    ]);

    const result = await syncPinUsersToCloud();
    expect(result.synced).toBe(1);
    expect(mockTxChain.upsert).toHaveBeenCalled();
  });
});

describe('syncPinUsersFromCloud', () => {
  beforeEach(() => {
    mockPinUsers._reset([]);
    resetChains();
  });

  it('pulls pin users from cloud and adds missing ones', async () => {
    mockTxChain.order.mockResolvedValue({
      data: [{ local_id: 10, username: 'clouduser', password: 'hash', role: 'reception', name: 'Cloud', phone: null, is_locked: false, created_at: new Date().toISOString() }],
      error: null,
    });

    const result = await syncPinUsersFromCloud();
    expect(result.synced).toBe(1);
  });

  it('returns 0 when no pin users in cloud', async () => {
    mockTxChain.order.mockResolvedValue({ data: [], error: null });

    const result = await syncPinUsersFromCloud();
    expect(result.synced).toBe(0);
  });

  it('handles fetch error', async () => {
    mockTxChain.order.mockResolvedValue({ data: null, error: { message: 'Network error' } });

    const result = await syncPinUsersFromCloud();
    expect(result.synced).toBe(0);
    expect(result.error).toBe('Network error');
  });
});

describe('syncAll', () => {
  beforeEach(() => {
    [mockMembers, mockPayments, mockCheckins, mockPointsLedger,
     mockPinUsers, mockWorkoutPrograms, mockNutritionPrograms, mockSchedules,
     mockProgressLogs, mockAccessLogs, mockProfiles, mockClubInfo].forEach(t => t._reset([]));
    resetChains();
  });

  it('runs all sync tasks and returns results', async () => {
    const results = await syncAll();
    expect(results).toBeInstanceOf(Object);
    expect(Object.keys(results).length).toBeGreaterThan(0);
  });
});

describe('pullAllEntities', () => {
  beforeEach(() => {
    [mockMembers, mockPayments, mockCheckins, mockPointsLedger,
     mockWorkoutPrograms, mockNutritionPrograms, mockSchedules,
     mockProgressLogs, mockAccessLogs, mockProfiles, mockClubInfo].forEach(t => t._reset([]));
    resetChains();
  });

  it('pulls all entities from cloud', async () => {
    const results = await pullAllEntities();
    expect(results).toBeInstanceOf(Object);
  }, 20000);
});

describe('getSyncStatus', () => {
  beforeEach(() => {
    mockMembers._reset([]);
    mockPayments._reset([]);
    mockCheckins._reset([]);
    mockPointsLedger._reset([]);
    resetChains();
  });

  it('returns sync status counts', async () => {
    mockMembers._reset([
      { id: 1, firstName: 'Test', phone: '0555000000', status: 'active', syncStatus: 'pending', updatedAt: new Date() } as any,
    ]);
    mockTxChain.order.mockResolvedValue({ data: [], error: null });

    const status = await getSyncStatus();
    expect(status.members.total).toBe(1);
    expect(status.members.pending).toBe(1);
    expect(status.payments.total).toBe(0);
    expect(status.isConfigured).toBe(true);
  });
});

describe('syncEntityToCloud', () => {
  beforeEach(() => {
    mockTxRpc.mockReset();
  });

  it('returns error for unknown entity', async () => {
    const result = await syncEntityToCloud('nonexistent');
    expect(result.synced).toBe(0);
    expect(result.error).toContain('Unknown entity');
  });
});

describe('pullEntityFromCloud', () => {
  beforeEach(() => {
    resetChains();
  });

  it('returns error for unknown entity', async () => {
    const result = await pullEntityFromCloud('nonexistent');
    expect(result.synced).toBe(0);
    expect(result.error).toContain('Unknown entity');
  });
});
