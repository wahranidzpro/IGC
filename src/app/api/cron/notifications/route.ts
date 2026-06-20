/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const results = {
    birthdays: [] as { memberId: string; name: string; phone: string | null }[],
    expirations: [] as { memberId: string; name: string; phone: string | null; daysLeft: number }[],
    notificationsCreated: 0,
  }

  const today = new Date()
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const { data: members } = await supabase
    .from('synced_members')
  .select('*')

  if (!members) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  const typedMembers = members as any[]

  for (const m of typedMembers) {
    const birthDate = m.birth_date as string | null
    if (birthDate && birthDate.length >= 5) {
      const memberBirthday = birthDate.substring(5)
      if (memberBirthday === todayStr) {
        results.birthdays.push({
          memberId: m.local_id,
          name: `${m.first_name} ${m.last_name}`,
          phone: m.phone,
        })
      }
    }
  }

  if (results.birthdays.length > 0) {
    for (const b of results.birthdays) {
      const { error: notifError } = await supabase.from('notifications').insert({
        member_id: b.memberId,
        type: 'promo',
        title: "Joyeux anniversaire !",
        description: `L'équipe IGC vous souhaite un joyeux anniversaire ${b.name} ! Profitez de votre journée spéciale.`,
        metadata: { source: 'cron_birthday' },
      })
      if (!notifError) results.notificationsCreated++
    }
  }

  for (const m of typedMembers) {
    if (m.status !== 'active') continue
    const endDate = m.end_date as string | null
    if (!endDate) continue
    const end = new Date(endDate)
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft >= 0 && daysLeft <= 7) {
      results.expirations.push({
        memberId: m.local_id,
        name: `${m.first_name} ${m.last_name}`,
        phone: m.phone,
        daysLeft,
      })
    }
  }

  if (results.expirations.length > 0) {
    for (const e of results.expirations) {
      const { error: notifError } = await supabase.from('notifications').insert({
        member_id: e.memberId,
        type: 'abonnement',
        title: `Abonnement expire dans ${e.daysLeft} jour${e.daysLeft > 1 ? 's' : ''}`,
        description: `Bonjour ${e.name}, votre abonnement arrive à expiration dans ${e.daysLeft} jour${e.daysLeft > 1 ? 's' : ''}. Pensez à le renouveler dès maintenant !`,
        metadata: { source: 'cron_expiration', daysLeft: e.daysLeft },
      })
      if (!notifError) results.notificationsCreated++
    }
  }

  return NextResponse.json({
    success: true,
    data: results,
  })
}
