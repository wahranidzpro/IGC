export const ROLES = {
  ADMIN: 'admin',
  RECEPTION: 'reception',
  STAFF: 'staff',
  COACH: 'coach',
  MEMBER: 'member',
  ADHERENT: 'adherent',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Staff roles that can access the staff app
export const STAFF_ROLES: readonly string[] = ['admin', 'reception', 'staff', 'coach']

// Admin-level roles
export const ADMIN_ROLES: readonly string[] = ['admin', 'reception']

// Role hierarchy for access control (higher = more access)
export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  reception: 60,
  staff: 60,
  coach: 40,
  member: 10,
}
