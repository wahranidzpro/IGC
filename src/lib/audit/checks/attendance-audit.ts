import { db } from '@/lib/db/dexie-db'

export interface AttendanceIssue {
  type: 'orphan_checkout' | 'stale_session' | 'missing_checkout' | 'rapid_checkin'
  checkinId?: number
  memberId: number
  memberName: string
  timestamp: Date
  detail: string
}

export async function detectAttendanceIssues(): Promise<AttendanceIssue[]> {
  const issues: AttendanceIssue[] = []
  const checkins = await db.checkins.orderBy('timestamp').toArray()
  const members = await db.members.toArray()
  const memberMap = new Map(members.map(m => [m.id!, `${m.firstName} ${m.lastName}`]))

  const memberCheckins = new Map<number, typeof checkins>()
  for (const c of checkins) {
    const list = memberCheckins.get(c.memberId) || []
    list.push(c)
    memberCheckins.set(c.memberId, list)
  }

  for (const [memberId, entries] of memberCheckins) {
    const memberName = memberMap.get(memberId) || `#${memberId}`

    entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (entries[0]?.type === 'checkout') {
      issues.push({
        type: 'orphan_checkout',
        checkinId: entries[0].id,
        memberId,
        memberName,
        timestamp: new Date(entries[0].timestamp),
        detail: `Checkout sans checkin précédent pour ${memberName}`,
      })
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.type === 'checkin') {
        const nextEntry = entries[i + 1]
        if (!nextEntry || nextEntry.type !== 'checkout') {
          const hoursSince = (Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60)
          if (hoursSince > 12) {
            issues.push({
              type: 'missing_checkout',
              checkinId: entry.id,
              memberId,
              memberName,
              timestamp: new Date(entry.timestamp),
              detail: `Checkin sans checkout depuis ${Math.round(hoursSince)}h pour ${memberName}`,
            })
          }
        } else if (nextEntry && nextEntry.type === 'checkout') {
          const diffMs = new Date(nextEntry.timestamp).getTime() - new Date(entry.timestamp).getTime()
          if (diffMs < 60000 && diffMs >= 0) {
            issues.push({
              type: 'rapid_checkin',
              checkinId: entry.id,
              memberId,
              memberName,
              timestamp: new Date(entry.timestamp),
              detail: `Checkin suivi d'un checkout ${Math.round(diffMs / 1000)}s plus tard pour ${memberName}`,
            })
          }
        }
      }
    }
  }

  return issues
}
