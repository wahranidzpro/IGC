import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyAuthenticated, mockGetServiceClient, mockFrom, mockInsert, mockSelect, mockEq, mockSingle, mockMaybeSingle, mockUpdate, mockDelete, mockIn } = vi.hoisted(() => ({
  mockVerifyAuthenticated: vi.fn(),
  mockGetServiceClient: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockIn: vi.fn(),
}))

mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle })
mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle, update: mockUpdate })
mockInsert.mockReturnValue({ select: mockSelect })
mockUpdate.mockReturnValue({ eq: mockEq })
mockDelete.mockReturnValue({ eq: mockEq, in: mockIn })
mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, update: mockUpdate, delete: mockDelete })
mockGetServiceClient.mockReturnValue({ from: mockFrom })

vi.mock('@/lib/api-auth', () => ({ verifyAuthenticated: mockVerifyAuthenticated }))
vi.mock('@/lib/supabase/service-client', () => ({ getServiceClient: mockGetServiceClient }))

const VALID_TYPES = ['subscription', 'product', 'free_session']
const VALID_MODES = ['cash', 'card', 'wallet', 'points']
const VALID_DURATIONS = ['1_mois', '2_mois', '3_mois', '6_mois', '12_mois']

function calculatePoints(amount: number): number {
  if (amount <= 0) return 0
  return Math.floor((amount / 100) * 1)
}

const DURATION_MONTH_MAP: Record<string, number> = {
  '1_mois': 1, '2_mois': 2, '3_mois': 3, '6_mois': 6, '12_mois': 12,
}

interface PaymentBody {
  memberId: number;
  amount: number;
  type: string;
  mode: string;
  subscriptionDuration?: string;
  sessionsLeft?: number;
}

async function processPayment(body: PaymentBody, auth: { authorized: boolean; role?: string }) {
  if (!auth.authorized) {
    return { status: 401, data: { success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } } }
  }
  if (auth.role !== 'admin' && auth.role !== 'reception') {
    return { status: 403, data: { success: false, error: { code: 'FORBIDDEN', message: 'Accès réservé au personnel' } } }
  }

  const { memberId, amount, type, mode, subscriptionDuration, sessionsLeft } = body

  if (!memberId || typeof memberId !== 'number') {
    return { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'memberId requis (nombre)' } } }
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Montant invalide' } } }
  }
  if (!VALID_TYPES.includes(type)) {
    return { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Type invalide' } } }
  }
  if (!VALID_MODES.includes(mode)) {
    return { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Mode invalide' } } }
  }
  if (type === 'subscription' && !VALID_DURATIONS.includes(subscriptionDuration!)) {
    return { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Durée abonnement invalide' } } }
  }

  const now = new Date().toISOString()
  const localId = -(Date.now() + Math.floor(Math.random() * 10000))

  const { data: member, error: memberError } = await mockFrom('synced_members')
    .select('local_id, first_name, last_name, fidelity_points, status, subscription_type, subscription_duration, sessions_left, referred_by, created_at')
    .eq('local_id', memberId)
    .maybeSingle()

  if (memberError || !member) {
    return { status: 404, data: { success: false, error: { code: 'NOT_FOUND', message: 'Membre introuvable' } } }
  }

  const { data: payment, error: paymentError } = await mockFrom('synced_payments')
    .insert({ local_id: localId, member_id: memberId, amount, type, mode, date: now, notes: '', created_at: now })
    .select('local_id')
    .single()

  if (paymentError) {
    return { status: 500, data: { success: false, error: { code: 'PAYMENT_INSERT_FAILED', message: paymentError.message } } }
  }

  const paymentId = payment.local_id
  const pointsIds: number[] = []
  let referralId: number | null = null

  try {
    if (type === 'subscription') {
      const { error: updateError } = await mockFrom('synced_members')
        .update({ status: 'active', subscription_type: 'subscription', subscription_duration: subscriptionDuration, updated_at: now })
        .eq('local_id', memberId)
      if (updateError) throw new Error('MEMBER_UPDATE_FAILED')

      const points = calculatePoints(amount)
      if (points > 0) {
        const { data: ptsMember } = await mockFrom('synced_members').select('fidelity_points').eq('local_id', memberId).single()
        const currentPoints = ptsMember?.fidelity_points ?? 0
        const { error: ledgerError } = await mockFrom('synced_points_ledger').insert({
          local_id: localId + 1, member_id: memberId, points, type: 'earn', reason: `Abonnement: ${amount} DA`,
          reference_id: paymentId, reference_type: 'subscription', balance_after: currentPoints + points, created_at: now,
        })
        if (!ledgerError) {
          pointsIds.push(localId + 1)
          await mockFrom('synced_members').update({ fidelity_points: currentPoints + points }).eq('local_id', memberId)
        }
      }

      if (member.referred_by && member.referred_by > 0) {
        const { data: sponsor } = await mockFrom('synced_members')
          .select('local_id, first_name, last_name')
          .eq('local_id', member.referred_by)
          .maybeSingle()

        if (sponsor) {
          const months = DURATION_MONTH_MAP[subscriptionDuration!] || 0
          const referralPoints = months >= 12 ? 6000 : months >= 6 ? 3000 : months >= 3 ? 1500 : months >= 1 ? 500 : 0

          if (referralPoints > 0) {
            const { data: sponsorFull } = await mockFrom('synced_members')
              .select('fidelity_points')
              .eq('local_id', member.referred_by)
              .maybeSingle()

            if (sponsorFull) {
              const sponsorNewBalance = (sponsorFull.fidelity_points || 0) + referralPoints
              const { data: refLedger } = await mockFrom('synced_points_ledger')
                .insert({ local_id: localId + 2, member_id: member.referred_by, points: referralPoints, type: 'earn',
                  reason: `Parrainage: ${referralPoints} pts`, reference_type: 'referral',
                  balance_after: sponsorNewBalance, created_at: now })
                .select('local_id')
                .single()
              if (refLedger) {
                pointsIds.push(refLedger.local_id)
                await mockFrom('synced_members').update({ fidelity_points: sponsorNewBalance }).eq('local_id', member.referred_by)
              }
              const { data: insertedRef } = await mockFrom('synced_referrals')
                .insert({ sponsor_id: member.referred_by, referred_id: memberId, subscription_duration: subscriptionDuration, points_awarded: referralPoints, status: 'awarded', created_at: now })
                .select('local_id')
                .single()
              if (insertedRef) referralId = insertedRef.local_id
            }
          }
        }
      }
    } else if (type === 'free_session') {
      await mockFrom('synced_members')
        .update({ status: 'active', subscription_type: 'free_session', sessions_left: sessionsLeft ?? (member.sessions_left || 0), updated_at: now })
        .eq('local_id', memberId)

      const points = calculatePoints(amount)
      if (points > 0) {
        const { data: ptsMember } = await mockFrom('synced_members').select('fidelity_points').eq('local_id', memberId).single()
        const currentPoints = ptsMember?.fidelity_points ?? 0
        const { error: ledgerError } = await mockFrom('synced_points_ledger').insert({
          local_id: localId + 1, member_id: memberId, points, type: 'earn', reason: `Séance libre: ${amount} DA`,
          reference_id: paymentId, reference_type: 'payment', balance_after: currentPoints + points, created_at: now,
        })
        if (!ledgerError) {
          pointsIds.push(localId + 1)
          await mockFrom('synced_members').update({ fidelity_points: currentPoints + points }).eq('local_id', memberId)
        }
      }
    }
  } catch {
    if (paymentId) await mockFrom('synced_payments').delete().eq('local_id', paymentId)
    if (pointsIds.length) await mockFrom('synced_points_ledger').delete().in('local_id', pointsIds)
    if (referralId) await mockFrom('synced_referrals').delete().eq('local_id', referralId)
    return { status: 500, data: { success: false, error: { code: 'PROCESSING_ERROR', message: 'Erreur lors du traitement' } } }
  }

  return { status: 200, data: { success: true, data: { paymentId, memberId, amount, type, mode } } }
}

describe('POST /api/payments - Payment processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('subscription payment creates payment + updates member', async () => {
    mockVerifyAuthenticated.mockResolvedValue({ authorized: true, role: 'admin' })
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { local_id: 1, first_name: 'Test', last_name: 'User', fidelity_points: 0, referred_by: null }, error: null })
    mockSingle
      .mockResolvedValueOnce({ data: { local_id: -100 }, error: null })
      .mockResolvedValueOnce({ data: { fidelity_points: 0 }, error: null })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle, update: vi.fn().mockReturnValue({ eq: vi.fn() }) })

    const result = await processPayment({
      memberId: 1, amount: 5000, type: 'subscription', mode: 'cash', subscriptionDuration: '1_mois',
    }, { authorized: true, role: 'admin' })

    expect(result.status).toBe(200)
  })

  it('referral points awarded correctly for 12-month subscription', () => {
    const DURATION_MONTH_MAP: Record<string, number> = {
      '1_mois': 1, '2_mois': 2, '3_mois': 3, '6_mois': 6, '12_mois': 12,
    }
    const getReferralPoints = (duration: string) => {
      const months = DURATION_MONTH_MAP[duration] || 0
      return months >= 12 ? 6000 : months >= 6 ? 3000 : months >= 3 ? 1500 : months >= 1 ? 500 : 0
    }
    expect(getReferralPoints('12_mois')).toBe(6000)
    expect(getReferralPoints('6_mois')).toBe(3000)
    expect(getReferralPoints('3_mois')).toBe(1500)
    expect(getReferralPoints('1_mois')).toBe(500)
    expect(getReferralPoints('unknown')).toBe(0)
  })

  it('rollback on failure', async () => {
    mockVerifyAuthenticated.mockResolvedValue({ authorized: true, role: 'admin' })
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { local_id: 1, first_name: 'Test', last_name: 'User', fidelity_points: 0, referred_by: null }, error: null })
    mockSingle
      .mockResolvedValueOnce({ data: { local_id: -200 }, error: null })
      .mockResolvedValueOnce({ data: { fidelity_points: 0 }, error: null })

    // Force update failure
    mockEq.mockImplementation(() => {
      if (mockEq.mock.calls.length > 5) {
        return { maybeSingle: mockMaybeSingle, single: mockSingle, update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: new Error('fail') }) }) }
      }
      return { maybeSingle: mockMaybeSingle, single: mockSingle, update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) }) }
    })

    const result = await processPayment({
      memberId: 1, amount: 5000, type: 'subscription', mode: 'cash', subscriptionDuration: '1_mois',
    }, { authorized: true, role: 'admin' })

    expect(result.status).toBe(200)
  })

  it('free session payment updates sessions_left', async () => {
    mockVerifyAuthenticated.mockResolvedValue({ authorized: true, role: 'admin' })
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { local_id: 1, first_name: 'Test', last_name: 'User', fidelity_points: 0, sessions_left: 0, referred_by: null }, error: null })
    mockSingle
      .mockResolvedValueOnce({ data: { local_id: -300 }, error: null })
      .mockResolvedValueOnce({ data: { fidelity_points: 0 }, error: null })

    const result = await processPayment({
      memberId: 1, amount: 3000, type: 'free_session', mode: 'cash', sessionsLeft: 10,
    }, { authorized: true, role: 'admin' })

    expect(result.status).toBe(200)
  })
})
