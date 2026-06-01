import type {
  Profile, Club, Member, Membership, Payment, Attendance, Device, QrToken,
} from "./models"

export interface MemberWithProfile extends Member {
  profile: Profile
  club: Club | null
}

export interface MemberWithRelations extends MemberWithProfile {
  activeMembership: Membership | null
  recentAttendance: Attendance[]
  lastPayment: Payment | null
}

export interface AttendanceWithMember extends Attendance {
  member: MemberWithProfile
  device: Device | null
}

export interface MembershipWithPayments extends Membership {
  payments: Payment[]
  member: MemberWithProfile
}

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  newMembersThisMonth: number
  todayCheckins: number
  monthlyRevenue: number
  revenueChange: number
  membersByStatus: Record<string, number>
  recentActivity: AttendanceWithMember[]
  expiringMemberships: (Membership & { member: MemberWithProfile })[]
  topDevices: (Device & { usageCount: number })[]
}

export interface ClubDashboard {
  club: Club
  stats: DashboardStats
  recentPayments: Payment[]
  activeDevices: Device[]
  pendingApprovals: number
}

export interface MemberQrTokens extends Member {
  qrTokens: QrToken[]
}
