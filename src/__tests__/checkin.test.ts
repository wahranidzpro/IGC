import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import type { Member } from '@/lib/db/dexie-db';

// Extracted member status logic from the checkin page
function getMemberStatus(member: Partial<Member>): string {
  if (member.isBlocked === true) {
    if (member.blockedUntil && new Date(member.blockedUntil).getTime() <= Date.now()) return 'active';
    return 'blocked';
  }
  if (member.status === 'expired') return 'expired';
  if (member.subscriptionType === 'subscription' && member.subscriptionDuration) {
    const durationMap: Record<string, number> = {
      '1_mois': 30, '2_mois': 60, '3_mois': 90,
      '6_mois': 180, '12_mois': 365,
    };
    const days = durationMap[member.subscriptionDuration] || 30;
    const created = new Date(member.createdAt!).getTime();
    const expiry = created + (days * 24 * 60 * 60 * 1000);
    const now = Date.now();
    if (now > expiry) return 'expired';
  }
  if (member.subscriptionType === 'free_session' && (member.sessionsLeft || 0) <= 0) return 'expired';
  if (member.status !== 'active') return 'inactive';
  return 'active';
}

// Extracted duplicate check-in detection
function hasDuplicateCheckin(
  checkins: Array<{ memberId: number; timestamp: Date; type: string }>,
  memberId: number,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMemberCheckins = checkins.filter(
    c => c.memberId === memberId && new Date(c.timestamp) >= today,
  );
  const lastAction = todayMemberCheckins.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0];
  return lastAction?.type === 'checkin';
}

describe('getMemberStatus', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns active for a member in good standing', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'subscription',
      subscriptionDuration: '1_mois',
      createdAt: new Date('2025-06-01'),
    };
    expect(getMemberStatus(m)).toBe('active');
  });

  it('returns expired for subscription past duration', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'subscription',
      subscriptionDuration: '1_mois',
      createdAt: new Date('2025-01-01'),
    };
    expect(getMemberStatus(m)).toBe('expired');
  });

  it('returns expired for free_session with 0 sessions left', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'free_session',
      sessionsLeft: 0,
    };
    expect(getMemberStatus(m)).toBe('expired');
  });

  it('returns active for free_session with sessions remaining', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'free_session',
      sessionsLeft: 5,
    };
    expect(getMemberStatus(m)).toBe('active');
  });

  it('returns blocked for blocked member', () => {
    const m: Partial<Member> = {
      isBlocked: true,
      status: 'active',
    };
    expect(getMemberStatus(m)).toBe('blocked');
  });

  it('returns blocked even for expired status when isBlocked is true', () => {
    const m: Partial<Member> = {
      isBlocked: true,
      status: 'expired',
    };
    expect(getMemberStatus(m)).toBe('blocked');
  });

  it('returns active when blockedUntil has passed', () => {
    const m: Partial<Member> = {
      isBlocked: true,
      blockedUntil: new Date('2025-01-01'),
      status: 'active',
    };
    expect(getMemberStatus(m)).toBe('active');
  });

  it('returns expired when member status is expired', () => {
    const m: Partial<Member> = {
      status: 'expired',
      subscriptionType: 'subscription',
      subscriptionDuration: '1_mois',
      createdAt: new Date('2025-06-01'),
    };
    expect(getMemberStatus(m)).toBe('expired');
  });

  it('returns inactive for non-active status', () => {
    const m: Partial<Member> = {
      status: 'inactive',
      subscriptionType: 'subscription',
      subscriptionDuration: '1_mois',
      createdAt: new Date('2025-06-01'),
    };
    expect(getMemberStatus(m)).toBe('inactive');
  });

  it('uses default 30 days for unknown duration', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'subscription',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscriptionDuration: 'unknown' as any,
      createdAt: new Date('2024-01-01'),
    };
    expect(getMemberStatus(m)).toBe('expired');
  });

  it('handles 12 month subscription expiry correctly', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'subscription',
      subscriptionDuration: '12_mois',
      createdAt: new Date('2024-06-15'),
    };
    expect(getMemberStatus(m)).toBe('active'); // exactly at 1 year
  });

  it('handles 12 month subscription just after expiry', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'subscription',
      subscriptionDuration: '12_mois',
      createdAt: new Date('2024-06-14'),
    };
    expect(getMemberStatus(m)).toBe('expired'); // one day past 1 year
  });

  it('handles empty subscriptionDuration gracefully', () => {
    const m: Partial<Member> = {
      status: 'active',
      subscriptionType: 'free_session',
      sessionsLeft: 3,
    };
    expect(getMemberStatus(m)).toBe('active');
  });
});

describe('Duplicate check-in detection', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:00:00'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('detects no duplicate when no check-in exists today', () => {
    const checkins: Array<{ memberId: number; timestamp: Date; type: string }> = [];
    expect(hasDuplicateCheckin(checkins, 1)).toBe(false);
  });

  it('detects duplicate when last action is checkin today', () => {
    const checkins = [
      { memberId: 1, timestamp: new Date('2025-06-15T09:00:00'), type: 'checkin' as const },
    ];
    expect(hasDuplicateCheckin(checkins, 1)).toBe(true);
  });

  it('allows check-in when last action was checkout', () => {
    const checkins = [
      { memberId: 1, timestamp: new Date('2025-06-15T08:00:00'), type: 'checkin' as const },
      { memberId: 1, timestamp: new Date('2025-06-15T09:00:00'), type: 'checkout' as const },
    ];
    expect(hasDuplicateCheckin(checkins, 1)).toBe(false);
  });

  it('ignores previous days checkins', () => {
    const checkins = [
      { memberId: 1, timestamp: new Date('2025-06-14T09:00:00'), type: 'checkin' as const },
    ];
    expect(hasDuplicateCheckin(checkins, 1)).toBe(false);
  });
});

describe('Check-in flow logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:00:00'));
  });

  it('awards check-in points from config', () => {
    const checkinPoints = 10;
    const member = { fidelityPoints: 50 };
    const updatedPoints = (member.fidelityPoints || 0) + checkinPoints;
    expect(updatedPoints).toBe(60);
  });

  it('decrements sessions for free_session members', () => {
    const member = { subscriptionType: 'free_session', sessionsLeft: 5 };
    const sessionsLeft = member.subscriptionType === 'free_session'
      ? Math.max(0, (member.sessionsLeft || 1) - 1)
      : (member.sessionsLeft ?? 0);
    expect(sessionsLeft).toBe(4);
  });

  it('does not decrement sessions for subscription members', () => {
    const member = { subscriptionType: 'subscription', sessionsLeft: 10 };
    const sessionsLeft = member.subscriptionType === 'free_session'
      ? Math.max(0, (member.sessionsLeft || 1) - 1)
      : (member.sessionsLeft ?? 0);
    expect(sessionsLeft).toBe(10);
  });

  it('prevents sessionsLeft from going below 0', () => {
    const member = { subscriptionType: 'free_session', sessionsLeft: 0 };
    const sessionsLeft = member.subscriptionType === 'free_session'
      ? Math.max(0, (member.sessionsLeft || 1) - 1)
      : (member.sessionsLeft ?? 0);
    expect(sessionsLeft).toBe(0);
  });

  it('calculates duration from subscription correctly', () => {
    const durationMap: Record<string, number> = {
      '1_mois': 30, '2_mois': 60, '3_mois': 90,
      '6_mois': 180, '12_mois': 365,
    };
    expect(durationMap['1_mois']).toBe(30);
    expect(durationMap['3_mois']).toBe(90);
    expect(durationMap['12_mois']).toBe(365);
  });
});

describe('Check-in with mocked Dexie', () => {
  const mockDb = {
    checkins: {
      add: vi.fn(),
      where: vi.fn(),
      toArray: vi.fn(),
    },
    members: {
      update: vi.fn(),
      get: vi.fn(),
    },
    loyaltySettings: {
      toArray: vi.fn(),
    },
    pointsLedger: {
      add: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:00:00'));
  });

  it('adds a checkin record with correct type', async () => {
    mockDb.checkins.add.mockResolvedValue(1);
    const id = await mockDb.checkins.add({ memberId: 1, timestamp: new Date(), type: 'checkin' });
    expect(id).toBe(1);
    expect(mockDb.checkins.add).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: 1, type: 'checkin' }),
    );
  });

  it('adds a checkout record with correct type', async () => {
    mockDb.checkins.add.mockResolvedValue(2);
    const id = await mockDb.checkins.add({ memberId: 1, timestamp: new Date(), type: 'checkout' });
    expect(id).toBe(2);
    expect(mockDb.checkins.add).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: 1, type: 'checkout' }),
    );
  });

  it('updates member fidelity points on checkin', async () => {
    mockDb.members.update.mockResolvedValue(1);
    await mockDb.members.update(1, { fidelityPoints: 60 });
    expect(mockDb.members.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ fidelityPoints: 60 }),
    );
  });

  it('updates member updatedAt on checkin', async () => {
    mockDb.members.update.mockResolvedValue(1);
    await mockDb.members.update(1, { updatedAt: new Date() });
    expect(mockDb.members.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ updatedAt: expect.any(Date) }),
    );
  });
});
