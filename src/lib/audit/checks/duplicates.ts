import { db } from '@/lib/db/dexie-db'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export interface DuplicateIssue {
  type: 'duplicate_phone' | 'duplicate_email' | 'duplicate_rfid'
  memberIds: number[]
  memberNames: string[]
  value: string
}

type SyncedMembersQuery = {
  select(cols: string): Promise<{
    data: Array<{ local_id: number; first_name: string; last_name: string; rfid_code: string | null }> | null
  }>
}

type DbWithReferrals = {
  referrals: {
    where(field: string): { equals(val: number): { toArray(): Promise<Array<{ id?: number }>> } }
    update(key: number, changes: Record<string, unknown>): Promise<number>
  }
}

export async function detectDuplicates(): Promise<DuplicateIssue[]> {
  const issues: DuplicateIssue[] = []
  const members = await db.members.toArray()

  // Duplicate phones
  const phoneMap = new Map<string, typeof members>()
  for (const m of members) {
    if (!m.phone) continue
    const list = phoneMap.get(m.phone) || []
    list.push(m)
    phoneMap.set(m.phone, list)
  }
  for (const [phone, dups] of phoneMap) {
    if (dups.length > 1) {
      issues.push({
        type: 'duplicate_phone',
        memberIds: dups.map(m => m.id!),
        memberNames: dups.map(m => `${m.firstName} ${m.lastName}`),
        value: phone,
      })
    }
  }

  // Duplicate emails
  const emailMap = new Map<string, typeof members>()
  for (const m of members) {
    if (!m.email) continue
    const list = emailMap.get(m.email) || []
    list.push(m)
    emailMap.set(m.email, list)
  }
  for (const [email, dups] of emailMap) {
    if (dups.length > 1) {
      issues.push({
        type: 'duplicate_email',
        memberIds: dups.map(m => m.id!),
        memberNames: dups.map(m => `${m.firstName} ${m.lastName}`),
        value: email,
      })
    }
  }

  // Duplicate RFID codes (synced_members table)
  if (isSupabaseConfigured && supabase) {
    const { data: syncedMembers } = await (supabase.from('synced_members') as unknown as SyncedMembersQuery).select('local_id, first_name, last_name, rfid_code')
    if (syncedMembers) {
      const rfidMap = new Map<string, { local_id: number; first_name: string; last_name: string; rfid_code: string | null }[]>()
      for (const m of syncedMembers) {
        if (!m.rfid_code) continue
        const list = rfidMap.get(m.rfid_code) || []
        list.push(m)
        rfidMap.set(m.rfid_code, list)
      }
      for (const [rfid, dups] of rfidMap) {
        if (dups.length > 1) {
          issues.push({
            type: 'duplicate_rfid',
            memberIds: dups.map(m => m.local_id),
            memberNames: dups.map(m => `${m.first_name} ${m.last_name}`),
            value: rfid,
          })
        }
      }
    }
  }

  return issues
}

export async function mergeDuplicates(keepId: number, removeId: number): Promise<{ merged: number; errors: string[] }> {
  const errors: string[] = []
  let merged = 0

  try {
    // Propagate merge to cloud first
    if (isSupabaseConfigured && supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = supabase as any

      const { error: payErr } = await s.from('synced_payments').update({ member_id: keepId }).eq('member_id', removeId)
      if (payErr) throw new Error(`Cloud payments update failed: ${payErr.message}`)

      const { error: checkErr } = await s.from('synced_checkins').update({ member_id: keepId }).eq('member_id', removeId)
      if (checkErr) throw new Error(`Cloud checkins update failed: ${checkErr.message}`)

      const { error: ptsErr } = await s.from('synced_points_ledger').update({ member_id: keepId }).eq('member_id', removeId)
      if (ptsErr) throw new Error(`Cloud points ledger update failed: ${ptsErr.message}`)

      const { error: delErr } = await s.from('synced_members').delete().eq('local_id', removeId)
      if (delErr) throw new Error(`Cloud member delete failed: ${delErr.message}`)
    }

    // Transfer all payments from remove to keep
    const payments = await db.payments.where('memberId').equals(removeId).toArray()
    for (const p of payments) {
      await db.payments.update(p.id!, { memberId: keepId })
      merged++
    }

    // Transfer checkins
    const checkins = await db.checkins.where('memberId').equals(removeId).toArray()
    for (const c of checkins) {
      await db.checkins.update(c.id!, { memberId: keepId })
      merged++
    }

    // Transfer pointsLedger
    const points = await db.pointsLedger.where('memberId').equals(removeId).toArray()
    for (const p of points) {
      await db.pointsLedger.update(p.id!, { memberId: keepId })
      merged++
    }

    // Transfer private sessions
    const sessions = await db.privateSessions.where('memberId').equals(removeId).toArray()
    for (const s of sessions) {
      await db.privateSessions.update(s.id!, { memberId: keepId })
      merged++
    }

    // Update referrals
    try {
      const referrals = await (db as unknown as DbWithReferrals).referrals.where('sponsorId').equals(removeId).toArray()
      for (const r of referrals) {
        await (db as unknown as DbWithReferrals).referrals.update(r.id!, { sponsorId: keepId })
        merged++
      }
    } catch {} // referrals table not yet in schema

    // Delete the duplicate member
    await db.members.delete(removeId)
    merged++

  } catch (err) {
    errors.push(`Erreur lors de la fusion: ${err}`)
  }

  return { merged, errors }
}
