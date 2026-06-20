import { db, type SaleItem } from '@/lib/db/dexie-db'

export interface DeletionImpact {
  entityType: 'member' | 'coach' | 'product'
  entityId: number
  entityName: string
  relatedRecords: { table: string; count: number }[]
  totalAffected: number
  canDelete: boolean
}

type DbWithReferrals = {
  referrals: {
    where(field: string): { equals(val: number): { toArray(): Promise<Array<{ id?: number }>> } }
  }
}

export async function analyzeMemberDeletion(memberId: number): Promise<DeletionImpact> {
  const member = await db.members.get(memberId)
  if (!member) throw new Error(`Member #${memberId} not found`)

  const relatedRecords: { table: string; count: number }[] = []

  const payments = await db.payments.where('memberId').equals(memberId).toArray()
  if (payments.length) relatedRecords.push({ table: 'payments', count: payments.length })

  const checkins = await db.checkins.where('memberId').equals(memberId).toArray()
  if (checkins.length) relatedRecords.push({ table: 'checkins', count: checkins.length })

  const sales = await db.sales.toArray()
  const salesByMember = new Map<number, typeof sales>()
  for (const sale of sales) {
    if (!sale.items) continue
    for (const item of sale.items) {
      const mId = (item as SaleItem & { memberId: number }).memberId
      if (!mId) continue
      if (!salesByMember.has(mId)) salesByMember.set(mId, [])
      salesByMember.get(mId)!.push(sale)
    }
  }
  const memberSales = salesByMember.get(memberId) || []
  if (memberSales.length) relatedRecords.push({ table: 'sales', count: memberSales.length })

  const points = await db.pointsLedger.where('memberId').equals(memberId).toArray()
  if (points.length) relatedRecords.push({ table: 'pointsLedger', count: points.length })

  const sessions = await db.privateSessions.where('memberId').equals(memberId).toArray()
  if (sessions.length) relatedRecords.push({ table: 'privateSessions', count: sessions.length })

  try {
    const referrals = await (db as unknown as DbWithReferrals).referrals.where('sponsorId').equals(memberId).toArray()
    if (referrals.length) relatedRecords.push({ table: 'referrals', count: referrals.length })
  } catch {} // referrals table not yet in schema

  const totalAffected = relatedRecords.reduce((sum, r) => sum + r.count, 0)

  return {
    entityType: 'member',
    entityId: memberId,
    entityName: `${member.firstName} ${member.lastName}`,
    relatedRecords,
    totalAffected,
    canDelete: totalAffected === 0,
  }
}

export async function analyzeCoachDeletion(coachId: number): Promise<DeletionImpact> {
  const coach = await db.coaches.get(coachId)
  if (!coach) throw new Error(`Coach #${coachId} not found`)

  const relatedRecords: { table: string; count: number }[] = []

  const members = await db.members.where('coachId').equals(coachId).toArray()
  if (members.length) relatedRecords.push({ table: 'members', count: members.length })

  const sessions = await db.privateSessions.where('coachId').equals(coachId).toArray()
  if (sessions.length) relatedRecords.push({ table: 'privateSessions', count: sessions.length })

  const totalAffected = relatedRecords.reduce((sum, r) => sum + r.count, 0)

  return {
    entityType: 'coach',
    entityId: coachId,
    entityName: coach.name,
    relatedRecords,
    totalAffected,
    canDelete: totalAffected === 0,
  }
}

export async function analyzeProductDeletion(productId: number): Promise<DeletionImpact> {
  const product = await db.products.get(productId)
  if (!product) throw new Error(`Product #${productId} not found`)

  const relatedRecords: { table: string; count: number }[] = []

  const sales = await db.sales.toArray()
  const salesByProduct = new Map<number, typeof sales>()
  for (const sale of sales) {
    if (!sale.items) continue
    for (const item of sale.items) {
      if (!item.productId) continue
      if (!salesByProduct.has(item.productId)) salesByProduct.set(item.productId, [])
      salesByProduct.get(item.productId)!.push(sale)
    }
  }
  const productSales = salesByProduct.get(productId) || []
  if (productSales.length) relatedRecords.push({ table: 'sales', count: productSales.length })

  const totalAffected = relatedRecords.reduce((sum, r) => sum + r.count, 0)

  return {
    entityType: 'product',
    entityId: productId,
    entityName: product.name,
    relatedRecords,
    totalAffected,
    canDelete: totalAffected === 0,
  }
}
