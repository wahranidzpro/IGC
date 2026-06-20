import { db } from '@/lib/db/dexie-db'

export interface OrphanMemberIssue {
  type: 'orphan_coach' | 'orphan_referred_by' | 'orphan_program' | 'deleted_with_children'
  memberId: number
  memberName: string
  field: string
  value: number | null
  detail: string
}

export async function detectOrphanMembers(): Promise<OrphanMemberIssue[]> {
  const issues: OrphanMemberIssue[] = []
  const members = await db.members.toArray()
  const coaches = await db.coaches.toArray()
  const programs = await db.programs.toArray()
  const coachIds = new Set(coaches.map(c => c.id))
  const programIds = new Set(programs.map(p => p.id))
  const memberIds = new Set(members.map(m => m.id))

  for (const member of members) {
    if (member.coachId && !coachIds.has(member.coachId)) {
      issues.push({ type: 'orphan_coach', memberId: member.id!, memberName: `${member.firstName} ${member.lastName}`, field: 'coachId', value: member.coachId, detail: `Coach #${member.coachId} n'existe plus` })
    }
    if (member.referredBy && !memberIds.has(member.referredBy)) {
      issues.push({ type: 'orphan_referred_by', memberId: member.id!, memberName: `${member.firstName} ${member.lastName}`, field: 'referredBy', value: member.referredBy, detail: `Parrain #${member.referredBy} n'existe plus` })
    }
    if (member.programId && !programIds.has(member.programId)) {
      issues.push({ type: 'orphan_program', memberId: member.id!, memberName: `${member.firstName} ${member.lastName}`, field: 'programId', value: member.programId, detail: `Programme #${member.programId} n'existe plus` })
    }
  }
  return issues
}
