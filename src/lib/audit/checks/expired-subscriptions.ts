import { db } from '@/lib/db/dexie-db'

const DURATION_DAYS: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 360,
}

function expiryDate(member: { subscriptionType?: string; subscriptionDuration?: string; createdAt?: Date }): Date | null {
  if (member.subscriptionType !== 'subscription' || !member.subscriptionDuration) return null
  const days = DURATION_DAYS[member.subscriptionDuration]
  if (!days) return null
  return new Date(new Date(member.createdAt!).getTime() + days * 86400000)
}

export interface ExpiredSubscriptionIssue {
  type: 'expired_not_marked' | 'auto_fixable'
  memberId: number
  memberName: string
  expiredSince: Date
  daysOverdue: number
  detail: string
}

export async function detectExpiredSubscriptions(): Promise<ExpiredSubscriptionIssue[]> {
  const issues: ExpiredSubscriptionIssue[] = []
  const members = await db.members.toArray()
  const now = new Date()

  for (const member of members) {
    if (member.subscriptionType !== 'subscription') continue
    if (member.status === 'inactive') continue

    const exp = expiryDate(member)
    if (!exp) continue

    if (exp.getTime() <= now.getTime() && member.status === 'active') {
      const daysOverdue = Math.floor((now.getTime() - exp.getTime()) / 86400000)
      issues.push({
        type: 'expired_not_marked',
        memberId: member.id!,
        memberName: `${member.firstName} ${member.lastName}`,
        expiredSince: exp,
        daysOverdue,
        detail: `${member.firstName} ${member.lastName} - expiré depuis ${daysOverdue} jours (${exp.toLocaleDateString('fr-FR')})`,
      })
    }
  }

  const expiredMembers = members.filter(m => {
    if (m.subscriptionType !== 'subscription') return false
    const exp = expiryDate(m)
    return exp && exp.getTime() <= now.getTime()
  })

  for (const member of expiredMembers) {
    const finalStatus = member.sessionsLeft > 0 ? 'expired' : 'inactive'
    if (member.status !== finalStatus) {
      issues.push({
        type: 'auto_fixable',
        memberId: member.id!,
        memberName: `${member.firstName} ${member.lastName}`,
        expiredSince: expiryDate(member)!,
        daysOverdue: Math.floor((now.getTime() - expiryDate(member)!.getTime()) / 86400000),
        detail: `${member.firstName} ${member.lastName} - devrait être "${finalStatus}" mais est "${member.status}"`,
      })
    }
  }

  return issues
}

export async function fixExpiredSubscriptions(): Promise<{ fixed: number; errors: string[] }> {
  const errors: string[] = []
  let fixed = 0
  const members = await db.members.toArray()
  const now = new Date()

  for (const member of members) {
    if (member.subscriptionType !== 'subscription') continue
    const exp = expiryDate(member)
    if (!exp || exp.getTime() > now.getTime()) continue

    try {
      const newStatus = member.sessionsLeft > 0 ? 'expired' : 'inactive'
      if (member.status !== newStatus) {
        await db.members.update(member.id!, { status: newStatus, updatedAt: new Date() })
        fixed++
      } else {
        fixed++
      }
    } catch (err) {
      errors.push(`Erreur mise à jour ${member.firstName} ${member.lastName}: ${err}`)
    }
  }

  return { fixed, errors }
}
