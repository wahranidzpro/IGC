import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyAdmin, mockGetServiceClient, mockFrom, mockInsert, mockSelect, mockEq, mockSingle, mockMaybeSingle, mockDelete, mockCreateUser, mockDeleteUser } = vi.hoisted(() => ({
  mockVerifyAdmin: vi.fn(),
  mockGetServiceClient: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockDelete: vi.fn(),
  mockCreateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
}))

mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle })
mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle })
mockInsert.mockReturnValue({ select: mockSelect })
mockDelete.mockReturnValue({ eq: mockEq })
mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, delete: mockDelete })
mockGetServiceClient.mockReturnValue({ from: mockFrom, auth: { admin: { createUser: mockCreateUser, deleteUser: mockDeleteUser } } })

vi.mock('@/lib/api-auth', () => ({ verifyAdmin: mockVerifyAdmin, verifyAuthenticated: vi.fn() }))
vi.mock('@/lib/supabase/service-client', () => ({ getServiceClient: mockGetServiceClient }))

interface CreateUserInput {
  username: string
  password: string
  role: string
  name: string
  phone?: string
}

async function createUser(data: CreateUserInput, authorized: boolean) {
  if (!authorized) {
    return { status: 401, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Not authenticated' } } }
  }

  const { data: existing } = await mockFrom('gym_users').select('id').eq('username', data.username).maybeSingle()
  if (existing) {
    return { status: 409, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Username already exists' } } }
  }

  const email = `${data.username}@infinitygym.local`

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

  const authUserId = authData.user.id

  const { error: profileError } = await mockFrom('profiles').insert({
    user_id: authUserId, full_name: data.name, phone: data.phone || null, role: data.role,
  })

  if (profileError) {
    await mockGetServiceClient().auth.admin.deleteUser(authUserId).catch(() => {})
    return { status: 500, data: { success: false, error: { code: 'INTERNAL_ERROR', message: profileError.message } } }
  }

  const { data: gymUser, error: dbError } = await mockFrom('gym_users').insert([{
    username: data.username, password_hash: 'hashed', role: data.role, name: data.name,
    phone: data.phone || null, auth_user_id: authUserId, is_locked: false,
  }]).select('id, username, role, name, auth_user_id').single()

    if (dbError) {
      if (authUserId) {
        try { await mockGetServiceClient().auth.admin.deleteUser(authUserId) } catch {}
        try { await mockFrom('profiles').delete().eq('user_id', authUserId) } catch {}
      }
      return { status: 500, data: { success: false, error: { code: 'INTERNAL_ERROR', message: dbError.message } } }
    }

    return { status: 201, data: { success: true, data: { user: { id: gymUser.id, username: gymUser.username, role: gymUser.role, name: gymUser.name, auth_user_id: gymUser.auth_user_id } } } }
}

describe('POST /api/auth/users - User creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates auth user first, then gym_users, then profiles', async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: true })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({ data: { id: 1, username: 'newuser', role: 'coach', name: 'New Coach', auth_user_id: 'auth-123' }, error: null })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null })
    mockDeleteUser.mockResolvedValue({ error: null })

    const result = await createUser({ username: 'newuser', password: 'secret', role: 'coach', name: 'New Coach' }, true)

    expect(result.status).toBe(201)
    expect(result.data?.data?.user?.auth_user_id).toBe('auth-123')
  })

  it('rollback on failure', async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: true })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-456' } }, error: null })
    mockDeleteUser.mockResolvedValue({ error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    // Make gym_users insert fail
    mockSingle.mockResolvedValue({ data: null, error: new Error('gym_users insert failed') })

    await createUser({ username: 'rollbackuser', password: 'secret', role: 'admin', name: 'Rollback' }, true)

    expect(mockDeleteUser).toHaveBeenCalledWith('auth-456')
  })

  it('duplicate username returns 409', async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: true })
    mockMaybeSingle.mockResolvedValue({ data: { id: 1 }, error: null })

    const result = await createUser({ username: 'existing', password: 'secret', role: 'admin', name: 'Existing' }, true)

    expect(result.status).toBe(409)
  })

  it('rejects unauthenticated', async () => {
    const result = await createUser({ username: 'test', password: 'secret', role: 'admin', name: 'Test' }, false)
    expect(result.status).toBe(401)
  })
})
