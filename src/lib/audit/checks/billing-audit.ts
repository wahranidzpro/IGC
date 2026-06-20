import { db } from '@/lib/db/dexie-db'
import { DURATION_DAYS } from '@/lib/constants/subscriptions'

export interface BillingIssue {
  type: 'active_no_recent_payment' | 'missing_expected_payment' | 'negative_balance' | 'amount_mismatch' | 'incomplete_subscription_chain'
  memberId: number
  memberName: string
  amount?: number
  detail: string
}

export async function detectBillingIssues(): Promise<BillingIssue[]> {
  const issues: BillingIssue[] = []
  const members = await db.members.toArray()
  const payments = await db.payments.toArray()
  const subscriptionPlans = await db.subscriptionPlans.toArray()

  // Build price map from subscription plans
  const planPriceMap = new Map<string, number>()
  for (const plan of subscriptionPlans) {
    if (plan.type && plan.price) {
      planPriceMap.set(plan.type, plan.price)
    }
  }

  for (const member of members) {
    const memberPayments = payments.filter(p => p.memberId === member.id!)
    const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || `#${member.id}`

    // Active member with no recent payment (> 6 months)
    if (member.status === 'active' || member.status === 'expired') {
      const lastPayment = memberPayments
        .filter(p => p.type === 'subscription')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

      if (!lastPayment) {
        issues.push({
          type: 'active_no_recent_payment',
          memberId: member.id!,
          memberName,
          detail: `${memberName} n'a aucun paiement d'abonnement`,
        })
      } else {
        const monthsSinceLastPayment = (Date.now() - new Date(lastPayment.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
        if (monthsSinceLastPayment > 6) {
          issues.push({
            type: 'active_no_recent_payment',
            memberId: member.id!,
            memberName,
            detail: `${memberName} - dernier paiement il y a ${Math.round(monthsSinceLastPayment)} mois (${new Date(lastPayment.date).toLocaleDateString()})`,
          })
        }
      }
    }

    // Check for subscription payment chain gaps
    const subscriptionPayments = memberPayments
      .filter(p => p.type === 'subscription')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (subscriptionPayments.length > 1) {
      for (let i = 1; i < subscriptionPayments.length; i++) {
        const prev = subscriptionPayments[i - 1]
        const curr = subscriptionPayments[i]
        
        const prevEnd = new Date(prev.date)
        const durationDays = DURATION_DAYS[member.subscriptionDuration as keyof typeof DURATION_DAYS] || 30
        prevEnd.setDate(prevEnd.getDate() + durationDays)

        const currStart = new Date(curr.date)
        const gapDays = Math.round((currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24))

        // Gap > 30 days between expected end and next payment
        if (gapDays > 30) {
          issues.push({
            type: 'incomplete_subscription_chain',
            memberId: member.id!,
            memberName,
            detail: `${memberName} - trou de ${gapDays} jours entre paiement #${prev.id} (${new Date(prev.date).toLocaleDateString()}) et #${curr.id} (${new Date(curr.date).toLocaleDateString()})`,
          })
        }
      }
    }

    // Negative balance
    if ((member.balanceDue ?? 0) < 0) {
      issues.push({
        type: 'negative_balance',
        memberId: member.id!,
        memberName,
        amount: member.balanceDue,
        detail: `${memberName} a un solde négatif de ${member.balanceDue} DA`,
      })
    }

    // Amount mismatch (subscription price vs expected plan price)
    if (member.subscriptionType && planPriceMap.has(member.subscriptionType)) {
      const expectedPrice = planPriceMap.get(member.subscriptionType)!
      const lastSubPayment = subscriptionPayments[subscriptionPayments.length - 1]
      if (lastSubPayment && lastSubPayment.amount !== expectedPrice) {
        issues.push({
          type: 'amount_mismatch',
          memberId: member.id!,
          memberName,
          amount: lastSubPayment.amount,
          detail: `${memberName} - paiement ${lastSubPayment.amount} DA vs ${expectedPrice} DA attendu pour ${member.subscriptionType}`,
        })
      }
    }
  }

  return issues
}

export async function reconcileMemberBalance(memberId: number): Promise<{ expectedBalance: number; actualBalance: number }> {
  const expectedBalance = 0 // Members shouldn't have a balance due in this system
  const member = await db.members.get(memberId)
  const actualBalance = member?.balanceDue ?? 0
  return { expectedBalance, actualBalance }
}
