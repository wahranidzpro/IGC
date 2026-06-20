import type {
  UserRole, MemberStatus, MembershipType, MembershipStatus,
  PaymentMethod, PaymentStatus, PaymentCategory,
  DeviceType, DeviceDirection, AttendanceType, AttendanceMethod,
} from "./enums"

export interface Profile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
  avatarUrl: string | null
  isActive: boolean
  lastLogin: string | null
  deviceFingerprint: string | null
  deviceLocked: boolean
  transferOtp: string | null
  transferOtpExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileInsert {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  role?: UserRole
  avatarUrl?: string | null
  isActive?: boolean
  deviceFingerprint?: string | null
  deviceLocked?: boolean
}

export interface ProfileUpdate extends Partial<ProfileInsert> {
  deviceFingerprint?: string | null
  deviceLocked?: boolean
  transferOtp?: string | null
  transferOtpExpiresAt?: string | null
}

export interface Club {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  openingHours: Record<string, { open: string; close: string }> | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface ClubInsert {
  name: string
  slug: string
  address?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  openingHours?: Record<string, { open: string; close: string }> | null
  isActive?: boolean
  metadata?: Record<string, unknown> | null
}

export type ClubUpdate = Partial<ClubInsert>

export interface Member {
  id: string
  profileId: string
  clubId: string | null
  rfidCode: string | null
  birthDate: string | null
  gender: string | null
  bloodType: string | null
  weight: number | null
  height: number | null
  emergencyContact: string | null
  emergencyPhone: string | null
  fitnessGoal: string | null
  experienceLevel: string | null
  notes: string | null
  tags: string[]
  status: MemberStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface MemberInsert {
  profileId: string
  clubId?: string | null
  rfidCode?: string | null
  birthDate?: string | null
  gender?: string | null
  bloodType?: string | null
  weight?: number | null
  height?: number | null
  emergencyContact?: string | null
  emergencyPhone?: string | null
  fitnessGoal?: string | null
  experienceLevel?: string | null
  notes?: string | null
  tags?: string[]
  status?: MemberStatus
}

export type MemberUpdate = Partial<MemberInsert>

export interface Membership {
  id: string
  memberId: string
  planName: string
  type: MembershipType
  startDate: string
  endDate: string
  sessionsTotal: number | null
  sessionsUsed: number
  amount: number
  status: MembershipStatus
  autoRenew: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface MembershipInsert {
  memberId: string
  planName: string
  type: MembershipType
  startDate: string
  endDate: string
  sessionsTotal?: number | null
  sessionsUsed?: number
  amount: number
  status?: MembershipStatus
  autoRenew?: boolean
  notes?: string | null
}

export type MembershipUpdate = Partial<MembershipInsert>

export interface Payment {
  id: string
  memberId: string
  membershipId: string | null
  amount: number
  method: PaymentMethod
  category: PaymentCategory
  status: PaymentStatus
  reference: string | null
  notes: string | null
  paidAt: string
  createdAt: string
  updatedAt: string
}

export interface PaymentInsert {
  memberId: string
  membershipId?: string | null
  amount: number
  method: PaymentMethod
  category: PaymentCategory
  status?: PaymentStatus
  reference?: string | null
  notes?: string | null
  paidAt?: string
}

export type PaymentUpdate = Partial<PaymentInsert>

export interface Attendance {
  id: string
  memberId: string
  deviceId: string | null
  clubId: string | null
  type: AttendanceType
  method: AttendanceMethod
  timestamp: string
  createdAt: string
}

export interface AttendanceInsert {
  memberId: string
  deviceId?: string | null
  clubId?: string | null
  type: AttendanceType
  method: AttendanceMethod
  timestamp?: string
}

export type AttendanceUpdate = Partial<AttendanceInsert>

export interface Device {
  id: string
  clubId: string
  name: string
  type: DeviceType
  direction: DeviceDirection | null
  ipAddress: string | null
  port: number | null
  location: string | null
  isActive: boolean
  lastHeartbeat: string | null
  firmware: string | null
  createdAt: string
  updatedAt: string
}

export interface DeviceInsert {
  clubId: string
  name: string
  type: DeviceType
  direction?: DeviceDirection | null
  ipAddress?: string | null
  port?: number | null
  location?: string | null
  isActive?: boolean
  firmware?: string | null
}

export type DeviceUpdate = Partial<DeviceInsert>

export interface QrToken {
  id: string
  memberId: string
  token: string
  isUsed: boolean
  expiresAt: string
  usedAt: string | null
  deviceId: string | null
  createdAt: string
}

export interface QrTokenInsert {
  memberId: string
  token: string
  isUsed?: boolean
  expiresAt: string
  deviceId?: string | null
}

export type QrTokenUpdate = Partial<QrTokenInsert>

export interface RfidCard {
  id: string
  memberId: string
  rfidCode: string
  isActive: boolean
  assignedAt: string
  lastUsed: string | null
  createdAt: string
  updatedAt: string
}

export interface RfidCardInsert {
  memberId: string
  rfidCode: string
  isActive?: boolean
}

export type RfidCardUpdate = Partial<RfidCardInsert>

export interface Coach {
  id: string
  profileId: string
  clubId: string | null
  speciality: string | null
  bio: string | null
  certifications: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CoachInsert {
  profileId: string
  clubId?: string | null
  speciality?: string | null
  bio?: string | null
  certifications?: string[]
  isActive?: boolean
}

export type CoachUpdate = Partial<CoachInsert>

export interface Notification {
  id: string
  memberId: string
  type: "abonnement" | "coach" | "promo" | "system"
  title: string
  description: string
  isRead: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface NotificationInsert {
  memberId: string
  type: "abonnement" | "coach" | "promo" | "system"
  title: string
  description: string
  isRead?: boolean
  metadata?: Record<string, unknown> | null
}

export type NotificationUpdate = Partial<NotificationInsert>

export interface MemberCoach {
  id: string
  memberId: string
  coachId: string
  assignedAt: string
  isActive: boolean
  createdAt: string
}

export interface MemberCoachInsert {
  memberId: string
  coachId: string
  isActive?: boolean
}

export type MemberCoachUpdate = Partial<MemberCoachInsert>

export interface WorkoutProgram {
  id: string
  coachId: string
  name: string
  description: string | null
  exercises: Exercise[]
  assignedTo: string[]
  createdAt: string
  updatedAt: string
}

export interface WorkoutProgramInsert {
  coachId: string
  name: string
  description?: string | null
  exercises?: Exercise[]
  assignedTo?: string[]
}

export type WorkoutProgramUpdate = Partial<WorkoutProgramInsert>

export interface NutritionProgram {
  id: string
  coachId: string
  name: string
  description: string | null
  meals: MealPlan[]
  assignedTo: string[]
  createdAt: string
  updatedAt: string
}

export interface NutritionProgramInsert {
  coachId: string
  name: string
  description?: string | null
  meals?: MealPlan[]
  assignedTo?: string[]
}

export type NutritionProgramUpdate = Partial<NutritionProgramInsert>

export interface ProgressLog {
  id: string
  memberId: string
  coachId: string
  weight: number | null
  bodyFat: number | null
  muscleMass: number | null
  waistCircumference: number | null
  notes: string | null
  loggedAt: string
  createdAt: string
}

export interface ProgressLogInsert {
  memberId: string
  coachId: string
  weight?: number | null
  bodyFat?: number | null
  muscleMass?: number | null
  waistCircumference?: number | null
  notes?: string | null
  loggedAt?: string
}

export type ProgressLogUpdate = Partial<ProgressLogInsert>

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface MessageInsert {
  senderId: string
  receiverId: string
  content: string
  isRead?: boolean
}

export type MessageUpdate = Partial<MessageInsert>

export interface Schedule {
  id: string
  coachId: string
  memberId: string | null
  title: string
  description: string | null
  startTime: string
  endTime: string
  type: "coaching" | "class" | "appointment"
  createdAt: string
  updatedAt: string
}

export interface ScheduleInsert {
  coachId: string
  memberId?: string | null
  title: string
  description?: string | null
  startTime: string
  endTime: string
  type: "coaching" | "class" | "appointment"
}

export type ScheduleUpdate = Partial<ScheduleInsert>

export interface Exercise {
  name: string
  sets: number
  reps: string
  weight: string
  rest: string
  notes: string
}

export interface MealPlan {
  name: string
  time: string
  items: { name: string; portion: string }[]
  calories: number
  protein: number
  carbs: number
  fat: number
}
