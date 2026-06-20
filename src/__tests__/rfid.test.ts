import { describe, it, expect, vi, beforeEach } from 'vitest';

// Antipassback logic extracted from the route handler
function createAntipassback(windowMs = 5000, cleanupThreshold = 1000) {
  const recentScans = new Map<string, number>();
  return {
    check: (rfidUid: string): boolean => {
      const now = Date.now();
      const lastScan = recentScans.get(rfidUid);
      if (lastScan && now - lastScan < windowMs) return false;
      recentScans.set(rfidUid, now);
      if (recentScans.size > cleanupThreshold) {
        for (const [key, time] of recentScans) {
          if (now - time > windowMs) recentScans.delete(key);
        }
      }
      return true;
    },
    clear: () => recentScans.clear(),
    size: () => recentScans.size,
  };
}

describe('Antipassback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows first scan of a card', () => {
    const ap = createAntipassback(5000);
    expect(ap.check('RFID001')).toBe(true);
  });

  it('rejects duplicate scan within window', () => {
    const ap = createAntipassback(5000);
    ap.check('RFID001');
    expect(ap.check('RFID001')).toBe(false);
  });

  it('allows different cards independently', () => {
    const ap = createAntipassback(5000);
    ap.check('RFID001');
    expect(ap.check('RFID002')).toBe(true);
  });

  it('allows re-scan after window expires', () => {
    const ap = createAntipassback(5000);
    ap.check('RFID001');
    vi.advanceTimersByTime(6000);
    expect(ap.check('RFID001')).toBe(true);
  });

  it('rejects if still inside window after partial wait', () => {
    const ap = createAntipassback(5000);
    ap.check('RFID001');
    vi.advanceTimersByTime(3000);
    expect(ap.check('RFID001')).toBe(false);
  });

  it('cleans up old entries when threshold exceeded', () => {
    const ap = createAntipassback(5000, 3);
    ap.check('RFID001');
    vi.advanceTimersByTime(6000);
    ap.check('RFID002');
    ap.check('RFID003');
    ap.check('RFID004'); // this triggers cleanup
    expect(ap.size()).toBeLessThanOrEqual(3);
  });
});

// Subscription expiry logic extracted from the route
function isSubscriptionExpired(
  subscriptionType: string,
  subscriptionDuration: string | null,
  createdAt: string,
  sessionsLeft: number,
): boolean {
  if (subscriptionType === 'subscription' && subscriptionDuration) {
    const durationMap: Record<string, number> = {
      '1_mois': 30, '2_mois': 60, '3_mois': 90,
      '6_mois': 180, '12_mois': 365,
    };
    const days = durationMap[subscriptionDuration] || 30;
    const created = new Date(createdAt).getTime();
    const expiry = created + days * 24 * 60 * 60 * 1000;
    return Date.now() > expiry;
  }
  if (subscriptionType === 'free_session' && (sessionsLeft ?? 0) <= 0) {
    return true;
  }
  return false;
}

describe('Subscription expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('does not expire a fresh 1 month subscription', () => {
    vi.setSystemTime(new Date('2025-01-15'));
    expect(isSubscriptionExpired('subscription', '1_mois', '2025-01-01', 0)).toBe(false);
  });

  it('expires a 1 month subscription after 30 days', () => {
    vi.setSystemTime(new Date('2025-02-05'));
    expect(isSubscriptionExpired('subscription', '1_mois', '2025-01-01', 0)).toBe(true);
  });

  it('expires a 3 month subscription after 90 days', () => {
    vi.setSystemTime(new Date('2025-04-05'));
    expect(isSubscriptionExpired('subscription', '3_mois', '2025-01-01', 0)).toBe(true);
  });

  it('does not expire a 12 month subscription early', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    expect(isSubscriptionExpired('subscription', '12_mois', '2025-01-01', 0)).toBe(false);
  });

  it('expires free_session with zero sessions left', () => {
    expect(isSubscriptionExpired('free_session', null, '2025-01-01', 0)).toBe(true);
  });

  it('does not expire free_session with sessions remaining', () => {
    expect(isSubscriptionExpired('free_session', null, '2025-01-01', 5)).toBe(false);
  });

  it('uses default 30 days for unknown duration', () => {
    vi.setSystemTime(new Date('2025-02-15'));
    expect(isSubscriptionExpired('subscription', 'unknown', '2025-01-01', 0)).toBe(true);
  });
});

// API key validation
function validateApiKey(envKey: string | undefined, headerKey: string | null): { valid: boolean; reason?: string; status: number } {
  if (!envKey) return { valid: false, reason: 'SERVER_MISCONFIGURED', status: 500 };
  if (!headerKey || headerKey !== envKey) return { valid: false, reason: 'UNAUTHORIZED', status: 401 };
  return { valid: true, status: 200 };
}

describe('API key validation', () => {
  it('returns 500 when RFID_API_KEY is not configured', () => {
    const result = validateApiKey(undefined, 'some-key');
    expect(result.valid).toBe(false);
    expect(result.status).toBe(500);
    expect(result.reason).toBe('SERVER_MISCONFIGURED');
  });

  it('returns 401 when no API key header is provided', () => {
    const result = validateApiKey('test-key', null);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.reason).toBe('UNAUTHORIZED');
  });

  it('returns 401 when wrong API key is provided', () => {
    const result = validateApiKey('test-key', 'wrong-key');
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.reason).toBe('UNAUTHORIZED');
  });

  it('returns valid when correct key is provided', () => {
    const result = validateApiKey('test-key', 'test-key');
    expect(result.valid).toBe(true);
    expect(result.status).toBe(200);
  });
});

// RFID identifier extraction
function extractRfidUid(body: Record<string, unknown>): string | null {
  return (body.rfid || body.uid || body.cardno || null) as string | null;
}

describe('RFID identifier extraction', () => {
  it('extracts from rfid field', () => {
    expect(extractRfidUid({ rfid: 'ABC' })).toBe('ABC');
  });

  it('extracts from uid field (alias)', () => {
    expect(extractRfidUid({ uid: 'ABC' })).toBe('ABC');
  });

  it('extracts from cardno field (alias)', () => {
    expect(extractRfidUid({ cardno: 'ABC' })).toBe('ABC');
  });

  it('prioritizes rfid over aliases', () => {
    expect(extractRfidUid({ rfid: 'PRIMARY', uid: 'SECONDARY' })).toBe('PRIMARY');
  });

  it('returns null when no identifier present', () => {
    expect(extractRfidUid({})).toBeNull();
  });
});

// RFID card lookup logic test
describe('RFID card lookup', () => {
  it('simulates card assignment to member', () => {
    const members = new Map<number, { name: string; rfidCode: string }>();
    members.set(1, { name: 'Ahmed Benali', rfidCode: 'RFID001' });
    const found = Array.from(members.values()).find(m => m.rfidCode === 'RFID001');
    expect(found?.name).toBe('Ahmed Benali');
  });

  it('handles unknown card gracefully', () => {
    const members = new Map<number, { name: string; rfidCode: string }>();
    members.set(1, { name: 'Ahmed Benali', rfidCode: 'RFID001' });
    const found = Array.from(members.values()).find(m => m.rfidCode === 'UNKNOWN');
    expect(found).toBeUndefined();
  });

  it('detects duplicate RFID codes across members', () => {
    const members = [
      { name: 'Alice', rfidCode: 'RFID001' },
      { name: 'Bob', rfidCode: 'RFID001' },
    ];
    const rfids = members.map(m => m.rfidCode);
    const dupRfids = rfids.filter((r, i) => rfids.indexOf(r) !== i);
    expect(dupRfids).toHaveLength(1);
    expect(dupRfids[0]).toBe('RFID001');
  });

  it('detects no duplicates when codes are unique', () => {
    const members = [
      { name: 'Alice', rfidCode: 'RFID001' },
      { name: 'Bob', rfidCode: 'RFID002' },
    ];
    const rfids = members.map(m => m.rfidCode);
    const dupRfids = rfids.filter((r, i) => rfids.indexOf(r) !== i);
    expect(dupRfids).toHaveLength(0);
  });
});
