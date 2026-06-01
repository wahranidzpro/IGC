export type UserRole = "admin" | "reception" | "coach" | "member"
export const USER_ROLES: UserRole[] = ["admin", "reception", "coach", "member"]
export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  reception: 60,
  staff: 60,
  coach: 40,
  member: 10,
}

export type MemberStatus = "active" | "inactive" | "suspended" | "expired"
export const MEMBER_STATUSES: MemberStatus[] = ["active", "inactive", "suspended", "expired"]

export type MembershipType = "monthly" | "quarterly" | "yearly" | "custom"
export const MEMBERSHIP_TYPES: MembershipType[] = ["monthly", "quarterly", "yearly", "custom"]

export type MembershipStatus = "active" | "expired" | "cancelled" | "pending"
export const MEMBERSHIP_STATUSES: MembershipStatus[] = ["active", "expired", "cancelled", "pending"]

export type PaymentMethod = "cash" | "card" | "transfer" | "mobile_money"
export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "transfer", "mobile_money"]

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"
export const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "completed", "failed", "refunded"]

export type PaymentCategory = "subscription" | "registration" | "product" | "other"
export const PAYMENT_CATEGORIES: PaymentCategory[] = ["subscription", "registration", "product", "other"]

export type DeviceType = "turnstile" | "scanner" | "tablet" | "gate"
export const DEVICE_TYPES: DeviceType[] = ["turnstile" , "scanner", "tablet", "gate"]

export type DeviceDirection = "entry" | "exit" | "both"
export const DEVICE_DIRECTIONS: DeviceDirection[] = ["entry", "exit", "both"]

export type AttendanceType = "entry" | "exit"
export const ATTENDANCE_TYPES: AttendanceType[] = ["entry", "exit"]

export type AttendanceMethod = "rfid" | "qr" | "manual" | "pin" | "facial"
export const ATTENDANCE_METHODS: AttendanceMethod[] = ["rfid", "qr", "manual", "pin", "facial"]
