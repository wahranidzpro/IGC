import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { error } from '@/lib/api-response'
import { verifyAuthenticated } from '@/lib/api-auth'
import { getServiceClient } from '@/lib/supabase/service-client'
import { STAFF_ROLES } from '@/lib/constants/roles'
import { withCsrf } from '@/lib/api-middleware'

const DeleteMemberSchema = z.object({
  memberId: z.number(),
})

const CreateMemberSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phone: z.string().optional().default(''),
  birthDate: z.string().optional().default(''),
  address: z.string().optional().default(''),
  gender: z.enum(['male', 'female', 'other']).optional().default('other'),
  bloodType: z.string().optional().default(''),
  photo: z.string().optional().default(''),
  coachId: z.number().optional().nullable(),
  programId: z.number().optional().nullable(),
  sessionsLeft: z.number().optional().default(0),
  programAmount: z.number().optional().default(0),
  amountPaid: z.number().optional().default(0),
  balanceDue: z.number().optional().default(0),
  discount: z.number().optional().default(0),
  advance: z.number().optional().default(0),
  subscriptionType: z.enum(['free_session', 'subscription']).optional().default('free_session'),
  subscriptionDuration: z.string().optional().default(''),
  status: z.string().optional().default('active'),
  fidelityPoints: z.number().optional().default(0),
  rfidCode: z.string().optional().default(''),
  referredBy: z.number().optional().nullable(),
  isBlocked: z.boolean().optional().default(false),
  blockReason: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  weightCurrent: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  fitnessGoal: z.string().optional().nullable(),
  experienceLevel: z.string().optional().nullable(),
  createMobileAccess: z.boolean().optional().default(false),
  password: z.string().optional().default(''),
})

export const DELETE = withCsrf(async (request: NextRequest) => {
  try {
    const auth = await verifyAuthenticated(request)
    if (!auth.authorized || !auth.role) {
      return error('Non authentifié', 401, 'UNAUTHORIZED')
    }
    if (!STAFF_ROLES.includes(auth.role)) {
      return error('Accès réservé au personnel', 403, 'FORBIDDEN')
    }

    const supabase = getServiceClient()
    if (!supabase) {
      return error('Supabase non configuré', 503, 'SERVICE_UNAVAILABLE')
    }

    const body = await request.json()
    const parsed = DeleteMemberSchema.safeParse(body)
    if (!parsed.success) {
      return error('memberId requis', 400, 'VALIDATION_ERROR')
    }

    const { memberId } = parsed.data

    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from('synced_members').delete().eq('local_id', memberId),
      supabase.from('synced_payments').delete().eq('member_id', memberId),
      supabase.from('synced_checkins').delete().eq('member_id', memberId),
      supabase.from('synced_points_ledger').delete().eq('member_id', memberId),
    ])

    const errors = [r1, r2, r3, r4].filter(r => r.error).map(r => r.error?.message)
    if (errors.length > 0) {
      return error(errors.join('; '), 500, 'DELETE_ERROR')
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : 'Erreur interne', 500, 'INTERNAL_ERROR')
  }
})

export const POST = withCsrf(async (request: NextRequest) => {
  try {
    const auth = await verifyAuthenticated(request)
    if (!auth.authorized || !auth.role) {
      return error('Non authentifié', 401, 'UNAUTHORIZED')
    }

    if (!STAFF_ROLES.includes(auth.role)) {
      return error('Accès réservé au personnel', 403, 'FORBIDDEN')
    }

    const supabase = getServiceClient()
    if (!supabase) {
      return error('Supabase non configuré', 503, 'SERVICE_UNAVAILABLE')
    }

    const body = await request.json()
    const parsed = CreateMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      }, { status: 400 })
    }

    const data = parsed.data

    const now = new Date().toISOString()

    const memberRecord = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      birth_date: data.birthDate,
      address: data.address,
      gender: data.gender,
      blood_type: data.bloodType,
      photo: data.photo,
      coach_id: data.coachId ?? null,
      program_id: data.programId ?? null,
      sessions_left: data.sessionsLeft,
      program_amount: data.programAmount,
      amount_paid: data.amountPaid,
      balance_due: data.balanceDue,
      discount: data.discount,
      advance: data.advance,
      subscription_type: data.subscriptionType,
      subscription_duration: data.subscriptionDuration,
      status: data.status,
      fidelity_points: data.fidelityPoints,
      rfid_code: data.rfidCode,
      referred_by: data.referredBy ?? null,
      is_blocked: data.isBlocked,
      block_reason: data.blockReason ?? null,
      email: data.email ?? null,
      emergency_contact_name: data.emergencyContactName ?? null,
      emergency_contact_phone: data.emergencyContactPhone ?? null,
      allergies: data.allergies ?? null,
      weight: data.weight ?? null,
      weight_current: data.weightCurrent ?? null,
      height: data.height ?? null,
      fitness_goal: data.fitnessGoal ?? null,
      experience_level: data.experienceLevel ?? null,
      created_at: now,
      updated_at: now,
    }

    const { data: createdMember, error: memberError } = await supabase
      .from('synced_members')
      .insert(memberRecord)
      .select()
      .single()

    if (memberError) {
      return error(memberError.message, 500, 'DB_ERROR')
    }

    let cloudUserResult = null

    if (data.createMobileAccess && data.password && data.phone) {
      try {
        const username = data.phone.replace(/\s/g, '')
        const email = `${username}@infinitygym.local`
        const fullName = `${data.firstName} ${data.lastName}`

        const { data: existingUser } = await supabase
          .from('gym_users')
          .select('id')
          .eq('username', username)
          .maybeSingle()

        if (!existingUser) {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: data.password,
            email_confirm: true,
            user_metadata: { username, role: 'adherent', name: fullName },
          })

          if (!authError && authData?.user) {
            const passwordHash = bcrypt.hashSync(data.password, 10)

            const { data: gymUser, error: gymError } = await supabase
              .from('gym_users')
              .insert({
                username,
                password_hash: passwordHash,
                role: 'adherent',
                name: fullName,
                phone: data.phone,
                auth_user_id: authData.user.id,
                is_locked: false,
              })
              .select()
              .single()

            if (!gymError && gymUser) {
              await supabase.from('profiles').insert({
                user_id: authData.user.id,
                full_name: fullName,
                phone: data.phone,
                role: 'adherent',
              })

              cloudUserResult = {
                authUserId: authData.user.id,
                gymUserId: gymUser.id,
              }
            }
          }
        }
      } catch {
        // Cloud user creation is best-effort; member was already created
      }
    }

    return NextResponse.json({
      success: true,
      member: createdMember,
      cloudUser: cloudUserResult,
    }, { status: 201 })
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : 'Erreur interne', 500, 'INTERNAL_ERROR')
  }
})
