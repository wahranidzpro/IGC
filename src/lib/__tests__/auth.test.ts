/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ROLE_HIERARCHY } from '@/lib/constants/roles';
import { getDashboardPath } from '@/lib/auth/context';

const { mockVerifyCookie, mockFrom, mockSelect, mockEq, mockMaybeSingle } = vi.hoisted(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com';
  return {
    mockVerifyCookie: vi.fn(),
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
    mockEq: vi.fn(),
    mockMaybeSingle: vi.fn(),
  };
});

mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
mockSelect.mockReturnValue({ eq: mockEq });
mockFrom.mockReturnValue({ select: mockSelect });

vi.mock('@/lib/cookie-signature', () => ({
  verifyCookie: mockVerifyCookie,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom }),
}));

import { verifyAdmin, verifyAuthenticated, verifyDeviceKey } from '@/lib/api-auth';

function mockRequest(cookieValue?: string) {
  return {
    cookies: {
      get: vi.fn((name: string) =>
        name === 'infinity-gym-auth' && cookieValue !== undefined
          ? { value: cookieValue }
          : undefined,
      ),
    },
    headers: new Headers(),
  } as any;
}

describe('ROLE_HIERARCHY', () => {
  it('admin has level 100', () => {
    expect(ROLE_HIERARCHY.admin).toBe(100);
  });

  it('reception and staff have level 60', () => {
    expect(ROLE_HIERARCHY.reception).toBe(60);
    expect(ROLE_HIERARCHY.staff).toBe(60);
  });

  it('coach has level 40', () => {
    expect(ROLE_HIERARCHY.coach).toBe(40);
  });

  it('member has level 10', () => {
    expect(ROLE_HIERARCHY.member).toBe(10);
  });

  it('unknown role resolves to 0 access', () => {
    expect((ROLE_HIERARCHY as any).unknown).toBeUndefined();
  });
});

describe('getDashboardPath', () => {
  it('returns /admin for admin', () => {
    expect(getDashboardPath('admin')).toBe('/admin');
  });

  it('returns /admin for staff', () => {
    expect(getDashboardPath('staff')).toBe('/admin');
  });

  it('returns /reception for reception', () => {
    expect(getDashboardPath('reception')).toBe('/reception');
  });

  it('returns /coach for coach', () => {
    expect(getDashboardPath('coach')).toBe('/coach');
  });

  it('returns /dashboard for member', () => {
    expect(getDashboardPath('member')).toBe('/dashboard');
  });

  it('returns /dashboard for unknown roles', () => {
    expect(getDashboardPath('adherent')).toBe('/dashboard');
    expect(getDashboardPath('')).toBe('/dashboard');
  });
});

describe('verifyAdmin', () => {
  beforeEach(() => {
    mockVerifyCookie.mockReset();
    mockMaybeSingle.mockReset();
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockEq.mockClear();
  });

  it('returns authorized for valid admin cookie', async () => {
    mockVerifyCookie.mockResolvedValue({ username: 'admin', role: 'admin' });
    const req = mockRequest('signed-cookie');
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authorized: true, role: 'admin' });
  });

  it('falls back to supabase check when cookie is not admin but db says admin', async () => {
    mockVerifyCookie.mockResolvedValue({ username: 'staffuser', role: 'staff' });
    mockMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });
    const req = mockRequest('signed-cookie');
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authorized: true, role: 'admin' });
  });

  it('returns unauthorized for non-admin cookie and db', async () => {
    mockVerifyCookie.mockResolvedValue({ username: 'coach', role: 'coach' });
    mockMaybeSingle.mockResolvedValue({ data: { role: 'coach' }, error: null });
    const req = mockRequest('signed-cookie');
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authorized: false, error: 'Admin access required' });
  });

  it('returns unauthorized without cookie', async () => {
    mockVerifyCookie.mockResolvedValue(null);
    const req = mockRequest();
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authorized: false, error: 'Not authenticated' });
  });

  it('returns unauthorized when cookie data is incomplete', async () => {
    mockVerifyCookie.mockResolvedValue({ some: 'data' });
    const req = mockRequest('signed-cookie');
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authorized: false, error: 'Not authenticated' });
  });
});

describe('verifyAuthenticated', () => {
  beforeEach(() => {
    mockVerifyCookie.mockReset();
  });

  it('returns authorized with username and role for valid cookie', async () => {
    mockVerifyCookie.mockResolvedValue({ username: 'receptionist', role: 'reception' });
    const req = mockRequest('signed-cookie');
    const result = await verifyAuthenticated(req);
    expect(result).toEqual({ authorized: true, username: 'receptionist', role: 'reception' });
  });

  it('returns unauthorized without cookie', async () => {
    mockVerifyCookie.mockResolvedValue(null);
    const req = mockRequest();
    const result = await verifyAuthenticated(req);
    expect(result).toEqual({ authorized: false, error: 'Not authenticated' });
  });

  it('returns unauthorized when data is incomplete', async () => {
    mockVerifyCookie.mockResolvedValue({ username: 'nobody' });
    const req = mockRequest('signed-cookie');
    const result = await verifyAuthenticated(req);
    expect(result).toEqual({ authorized: false, error: 'Not authenticated' });
  });
});

describe('verifyDeviceKey', () => {
  beforeEach(() => {
    vi.stubEnv('DEVICE_API_KEY', 'test-key-123');
  });

  it('returns valid with correct x-api-key header', () => {
    const req = { headers: new Headers({ 'x-api-key': 'test-key-123' }) } as any;
    const result = verifyDeviceKey(req);
    expect(result).toEqual({ valid: true });
  });

  it('returns invalid with wrong x-api-key header', () => {
    const req = { headers: new Headers({ 'x-api-key': 'wrong-key' }) } as any;
    const result = verifyDeviceKey(req);
    expect(result).toEqual({ valid: false, error: 'Invalid API key' });
  });

  it('returns invalid without x-api-key header', () => {
    const req = { headers: new Headers() } as any;
    const result = verifyDeviceKey(req);
    expect(result).toEqual({ valid: false, error: 'Missing x-api-key header' });
  });
});
