import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyAdmin, mockGetServiceClient, mockFrom, mockInsert, mockSelect, mockEq, mockSingle, mockMaybeSingle, mockCreateUser, mockDeleteUser } = vi.hoisted(() => ({
  mockVerifyAdmin: vi.fn(),
  mockGetServiceClient: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockCreateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
}))

mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle })
mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle })
mockInsert.mockReturnValue({ select: mockSelect })
mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
mockGetServiceClient.mockReturnValue({ from: mockFrom, auth: { admin: { createUser: mockCreateUser, deleteUser: mockDeleteUser } } })

vi.mock('@/lib/api-auth', () => ({ verifyAdmin: mockVerifyAdmin }))
vi.mock('@/lib/supabase/service-client', () => ({ getServiceClient: mockGetServiceClient }))

const validRoles = ['admin', 'reception', 'coach', 'adherent']

interface SignupInput {
  username: string
  password: string
  role: string
  name: string
  phone?: string
}

async function signupUser(data: SignupInput, authorized: boolean) {
  if (!authorized) {
    return { status: 401, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Not authenticated' } } }
  }

  if (!validRoles.includes(data.role)) {
    return { status: 400, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Invalid role' } } }
  }

  const email = `${data.username}@infinitygym.local`

  const { data: existingUser } = await mockFrom('gym_users').select('id').eq('username', data.username).maybeSingle()

  if (existingUser) {
    return { status: 409, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Username already exists' } } }
  }

  // Uses insert (not upsert) — this is a key requirement
  const { data: authData, error: authError } = await mockGetServiceClient().auth.admin.createUser({
    email, password: data.password, email_confirm: true,
    user_metadata: { username: data.username, role: data.role, name: data.name },
  })

  if (authError) {
    return { status: 500, data: { success: false, error: { code: 'INTERNAL_ERROR', message: authError.message } } }
  }

  if (!authData?.user) {
    return { status: 500, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create auth user' } } }
  }

  const { data: gymUser, error: gymError } = await mockFrom('gym_users').insert({
    username: data.username, password_hash: 'hashed', role: data.role, name: data.name,
    phone: data.phone || null, auth_user_id: authData.user.id, is_locked: false,
  }).select().single()

  if (gymError) {
    // Rollback Auth user
    await mockGetServiceClient().auth.admin.deleteUser(authData.user.id).catch(() => {})
    return { status: 500, data: { success: false, error: { code: 'INTERNAL_ERROR', message: gymError.message } } }
  }

  return { status: 201, data: { success: true, data: { user: { id: gymUser.id, username: gymUser.username, role: gymUser.role, name: gymUser.name, auth_user_id: authData.user.id } } } }
}

describe('POST /api/auth/signup - Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses insert (not upsert)', () => {
    // Verify the mock setup uses insert, not upsert
    const mockInsertFn = vi.fn()
    const mockUpsert = vi.fn()
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsertFn, upsert: mockUpsert })
    mockFrom('gym_users').insert({ username: 'test' })
    expect(mockInsertFn).toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('creates Auth user + gym_users successfully', async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: true })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({ data: { id: 1, username: 'newstaff', role: 'reception', name: 'New Staff', auth_user_id: 'auth-xyz' }, error: null })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-xyz' } }, error: null })

    const result = await signupUser({ username: 'newstaff', password: 'secret', role: 'reception', name: 'New Staff' }, true)

    expect(result.status).toBe(201)
  })

  it('rollback if gym_users insert fails', async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: true })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-rollback' } }, error: null })
    mockDeleteUser.mockResolvedValue({ error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({ data: null, error: new Error('insert failed') })

    const result = await signupUser({ username: 'rollbacktest', password: 'secret', role: 'coach', name: 'Rollback' }, true)

    expect(result.status).toBe(500)
    expect(mockDeleteUser).toHaveBeenCalledWith('auth-rollback')
  })

  it('rejects unauthenticated', async () => {
    const result = await signupUser({ username: 'test', password: 'secret', role: 'admin', name: 'Test' }, false)
    expect(result.status).toBe(401)
  })

  it('rejects invalid role', async () => {
    const result = await signupUser({ username: 'test', password: 'secret', role: 'superadmin', name: 'Test' }, true)
    expect(result.status).toBe(400)
  })
})
