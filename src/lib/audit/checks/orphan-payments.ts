import { db } from '@/lib/db/dexie-db'

export interface OrphanPaymentIssue {
  type: 'orphan_payment' | 'orphan_checkin' | 'orphan_points' | 'orphan_private_session'
  recordId: number
  memberId: number
  detail: string
}

export async function detectOrphanPayments(): Promise<OrphanPaymentIssue[]> {
  const issues: OrphanPaymentIssue[] = []
  const members = await db.members.toArray()
  const memberIds = new Set(members.map(m => m.id))

  const payments = await db.payments.toArray()
  for (const p of payments) {
    if (!memberIds.has(p.memberId)) {
      issues.push({ type: 'orphan_payment', recordId: p.id!, memberId: p.memberId, detail: `Paiement #${p.id} (${p.amount} DA) lié au membre #${p.memberId} qui n'existe pas` })
    }
  }

  const checkins = await db.checkins.toArray()
  for (const c of checkins) {
    if (!memberIds.has(c.memberId)) {
      issues.push({ type: 'orphan_checkin', recordId: c.id!, memberId: c.memberId, detail: `Checkin #${c.id} lié au membre #${c.memberId} qui n'existe pas` })
    }
  }

  const points = await db.pointsLedger.toArray()
  for (const p of points) {
    if (!memberIds.has(p.memberId)) {
      issues.push({ type: 'orphan_points', recordId: p.id!, memberId: p.memberId, detail: `Point #${p.id} (${p.points} pts) lié au membre #${p.memberId} qui n'existe pas` })
    }
  }

  return issues
}

export async function cleanupOrphanPayments(): Promise<number> {
  const members = await db.members.toArray()
  const memberIds = new Set(members.map(m => m.id))
  let count = 0

  const payments = await db.payments.where('memberId').noneOf([...memberIds].filter((id): id is number => id !== undefined)).toArray()
  for (const p of payments) {
    await db.payments.delete(p.id!)
    count++
  }

  const checkins = await db.checkins.where('memberId').noneOf([...memberIds].filter((id): id is number => id !== undefined)).toArray()
  for (const c of checkins) {
    await db.checkins.delete(c.id!)
    count++
  }

  const points = await db.pointsLedger.where('memberId').noneOf([...memberIds].filter((id): id is number => id !== undefined)).toArray()
  for (const p of points) {
    await db.pointsLedger.delete(p.id!)
    count++
  }

  return count
}
