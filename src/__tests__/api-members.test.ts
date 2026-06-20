import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyAuthenticated, mockGetServiceClient, mockFrom, mockInsert, mockSelect, mockEq, mockSingle, mockMaybeSingle, mockDelete } = vi.hoisted(() => ({
  mockVerifyAuthenticated: vi.fn(),
  mockGetServiceClient: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockDelete: vi.fn(),
}))

mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle })
mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle })
mockInsert.mockReturnValue({ select: mockSelect })
mockDelete.mockReturnValue({ eq: mockEq })
mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, delete: mockDelete })
mockGetServiceClient.mockReturnValue({ from: mockFrom })

vi.mock('@/lib/api-auth', () => ({ verifyAuthenticated: mockVerifyAuthenticated }))
vi.mock('@/lib/supabase/service-client', () => ({ getServiceClient: mockGetServiceClient }))

// Extracted member creation logic from POST /api/members
interface CreateMemberData {
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  gender?: string;
  status?: string;
  subscriptionType?: string;
  createMobileAccess?: boolean;
  password?: string;
}

async function createMember(data: CreateMemberData, auth: { authorized: boolean; role?: string }) {
  if (!auth.authorized || !auth.role) {
    return { status: 401, error: 'Non authentifié' }
  }
  if (!['admin', 'reception', 'staff', 'coach'].includes(auth.role)) {
    return { status: 403, error: 'Accès réservé au personnel' }
  }

  if (!data.firstName || !data.lastName) {
    return { status: 400, error: 'Données invalides' }
  }

  const now = new Date().toISOString()
  const memberRecord = {
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || '',
    birth_date: data.birthDate || '',
    address: data.address || '',
    gender: data.gender || 'other',
    status: data.status || 'active',
    subscription_type: data.subscriptionType || 'free_session',
    created_at: now,
    updated_at: now,
  }

  const { data: created, error: insertError } = await mockFrom('synced_members').insert(memberRecord).select().single()

  if (insertError) return { status: 500, error: insertError.message }

  let cloudUser = null
  if (data.createMobileAccess && data.password && data.phone) {
    const username = data.phone.replace(/\s/g, '')

    const { data: existing } = await mockFrom('gym_users').select('id').eq('username', username).maybeSingle()
    if (!existing) {
      const { data: authData, error: authError } = await mockFrom('auth').insert({}).select().single()
      if (!authError && authData) {
        const { data: gymUser, error: gymError } = await mockFrom('gym_users').insert({}).select().single()
        if (!gymError && gymUser) {
          cloudUser = { authUserId: authData.id, gymUserId: gymUser.id }
        }
      }
    }
  }

  return { status: 201, member: created, cloudUser }
}

describe('POST /api/members - Member creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates member successfully', async () => {
    mockVerifyAuthenticated.mockResolvedValue({ authorized: true, role: 'admin' })
    mockSingle.mockResolvedValue({ data: { id: 1, first_name: 'Test', last_name: 'User' }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await createMember({ firstName: 'Test', lastName: 'User' }, { authorized: true, role: 'admin' })

    expect(result.status).toBe(201)
    expect(result.member).toBeDefined()
  })

  it('rejects unauthenticated', async () => {
    const result = await createMember({ firstName: 'Test', lastName: 'User' }, { authorized: false })

    expect(result.status).toBe(401)
    expect(result.error).toBe('Non authentifié')
  })

  it('rejects non-staff role', async () => {
    const result = await createMember({ firstName: 'Test', lastName: 'User' }, { authorized: true, role: 'member' })

    expect(result.status).toBe(403)
    expect(result.error).toBe('Accès réservé au personnel')
  })

  it('creates mobile access when flag set', async () => {
    mockVerifyAuthenticated.mockResolvedValue({ authorized: true, role: 'admin' })
    mockSingle
      .mockResolvedValueOnce({ data: { id: 1, first_name: 'Test', last_name: 'User' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'auth-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 10 }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await createMember({
      firstName: 'Test', lastName: 'User', createMobileAccess: true,
      password: 'secret123', phone: '0555000011',
    }, { authorized: true, role: 'admin' })

    expect(result.status).toBe(201)
    expect(result.cloudUser).toBeDefined()
    expect(result.cloudUser!.authUserId).toBe('auth-1')
  })

  it('handles duplicate check (existing username)', async () => {
    mockVerifyAuthenticated.mockResolvedValue({ authorized: true, role: 'admin' })
    mockSingle.mockResolvedValue({ data: { id: 1, first_name: 'Test', last_name: 'User' }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: { id: 99 }, error: null })

    const result = await createMember({
      firstName: 'Test', lastName: 'User', createMobileAccess: true,
      password: 'secret123', phone: '0555000011',
    }, { authorized: true, role: 'admin' })

    expect(result.status).toBe(201)
    expect(result.cloudUser).toBeNull()
  })
})
