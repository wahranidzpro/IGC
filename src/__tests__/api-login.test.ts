import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockGetServiceClient, mockFrom, mockSelect, mockEq, mockMaybeSingle, mockInsert } = vi.hoisted(() => ({
  mockGetServiceClient: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockInsert: vi.fn(),
}))

mockSelect.mockReturnValue({ eq: mockEq })
mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
mockInsert.mockReturnValue({ then: vi.fn() })
mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
mockGetServiceClient.mockReturnValue({ from: mockFrom })

vi.mock('@/lib/supabase/service-client', () => ({ getServiceClient: mockGetServiceClient }))

// Rate limiter extracted from route
class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map()
  private maxAttempts: number
  private windowMs: number

  constructor(maxAttempts = 5, windowMs = 60_000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  check(ip: string): boolean {
    const now = Date.now()
    const entry = this.attempts.get(ip)
    if (!entry || now > entry.resetAt) {
      this.attempts.set(ip, { count: 1, resetAt: now + this.windowMs })
      return true
    }
    if (entry.count >= this.maxAttempts) return false
    entry.count++
    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [key, val] of this.attempts) {
      if (now > val.resetAt) this.attempts.delete(key)
    }
  }

  getCount(ip: string): number {
    return this.attempts.get(ip)?.count || 0
  }
}

// Login validation logic extracted from route
async function validateLogin(username: string, password: string, bcryptCompare: (pw: string, hash: string) => Promise<boolean>) {
  const { data: user, error: dbError } = await mockFrom('gym_users')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (dbError) return { status: 500, error: 'Database error' }
  if (!user) return { status: 401, error: 'Invalid credentials' }
  if (user.is_locked) return { status: 403, error: 'Account locked' }

  let passwordMatch = false
  if (user.password_hash) {
    passwordMatch = await bcryptCompare(password, user.password_hash)
  }

  if (!passwordMatch) return { status: 401, error: 'Invalid credentials' }
  return { status: 200, user }
}

describe('Rate limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows first attempt', () => {
    const limiter = new RateLimiter(5, 60000)
    expect(limiter.check('127.0.0.1')).toBe(true)
  })

  it('allows up to 5 attempts', () => {
    const limiter = new RateLimiter(5, 60000)
    for (let i = 0; i < 5; i++) {
      expect(limiter.check('127.0.0.1')).toBe(true)
    }
  })

  it('blocks after 5 attempts', () => {
    const limiter = new RateLimiter(5, 60000)
    for (let i = 0; i < 5; i++) limiter.check('127.0.0.1')
    expect(limiter.check('127.0.0.1')).toBe(false)
  })

  it('resets after window expires', () => {
    const limiter = new RateLimiter(5, 60000)
    for (let i = 0; i < 5; i++) limiter.check('127.0.0.1')
    vi.advanceTimersByTime(60001)
    expect(limiter.check('127.0.0.1')).toBe(true)
  })

  it('tracks different IPs independently', () => {
    const limiter = new RateLimiter(5, 60000)
    for (let i = 0; i < 5; i++) limiter.check('192.168.1.1')
    expect(limiter.check('192.168.1.1')).toBe(false)
    expect(limiter.check('10.0.0.1')).toBe(true)
  })

  it('cleanup removes stale entries', () => {
    const limiter = new RateLimiter(5, 60000)
    limiter.check('127.0.0.1')
    vi.advanceTimersByTime(120000)
    limiter.cleanup()
    expect(limiter.getCount('127.0.0.1')).toBe(0)
  })
})

describe('Login validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid credentials return success', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 1, username: 'admin', password_hash: '$2a$10$hash', role: 'admin', is_locked: false },
      error: null,
    })
    const bcryptCompare = vi.fn().mockResolvedValue(true)

    const result = await validateLogin('admin', 'password', bcryptCompare)
    expect(result.status).toBe(200)
  })

  it('invalid credentials return 401', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await validateLogin('unknown', 'password', vi.fn())
    expect(result.status).toBe(401)
    expect(result.error).toBe('Invalid credentials')
  })

  it('account locked returns 403', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 1, username: 'locked_user', password_hash: '$2a$10$hash', role: 'admin', is_locked: true },
      error: null,
    })

    const result = await validateLogin('locked_user', 'password', vi.fn())
    expect(result.status).toBe(403)
    expect(result.error).toBe('Account locked')
  })

  it('wrong password returns 401', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 1, username: 'admin', password_hash: '$2a$10$hash', role: 'admin', is_locked: false },
      error: null,
    })
    const bcryptCompare = vi.fn().mockResolvedValue(false)

    const result = await validateLogin('admin', 'wrong', bcryptCompare)
    expect(result.status).toBe(401)
  })
})
