export type SubscriptionType = 'free_session' | 'subscription';
export type SubscriptionDuration = '1_mois' | '2_mois' | '3_mois' | '6_mois' | '12_mois';

export interface Program {
  id?: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  address: string;
  gender: 'male' | 'female' | 'other';
  bloodType: string;
  photo: string;
  coachId?: number;
  programId?: number;
  sessionsLeft: number;
  programAmount: number;
  amountPaid: number;
  balanceDue: number;
  discount: number;
  advance: number;
  subscriptionType: SubscriptionType;
  subscriptionDuration: SubscriptionDuration | '';
  status: 'active' | 'inactive' | 'expired';
  fidelityPoints: number;
  rfidCode: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
  referredBy?: number;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  weight?: number;
  weightCurrent?: number;
  height?: number;
  fitnessGoal?: string;
  experienceLevel?: string;
  isBlocked?: boolean;
  blockReason?: string;
  blockDate?: Date;
  blockedUntil?: Date;
}

export interface Coach {
  id?: number;
  name: string;
  phone: string;
  availability: CoachAvailability[];
  programIds: number[];
  isActive: boolean;
  createdAt: Date;
  syncStatus?: 'pending' | 'synced';
  updatedAt?: Date;
}

export interface CoachAvailability {
  day: string;
  start: string;
  end: string;
}

export interface Payment {
  id?: number;
  memberId: number;
  amount: number;
  type: 'subscription' | 'product' | 'coaching' | 'event' | 'commission';
  mode: 'cash' | 'card' | 'wallet' | 'points';
  date: Date;
  description: string;
  createdAt: Date;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'todo' | 'in_progress' | 'done';
  assignedTo?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id?: number;
  category: string;
  amount: number;
  date: Date;
  description: string;
  createdAt: Date;
  syncStatus?: 'pending' | 'synced';
  updatedAt?: Date;
}

export interface Product {
  id?: number;
  barcode: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  photo: string;
  categoryId?: number;
  createdAt: Date;
}

export interface CheckIn {
  id?: number;
  memberId: number;
  timestamp: Date;
  type: 'checkin' | 'checkout';
}

export interface PinUser {
  id?: number;
  username: string;
  password: string;
  role: 'admin' | 'reception' | 'coach' | 'adherent';
  name: string;
  phone?: string;
  coachId?: number;
  isLocked: boolean;
  createdAt: Date;
}

export type AuditAction =
  | 'member_create'
  | 'member_edit'
  | 'member_delete'
  | 'member_restore'
  | 'member_block'
  | 'member_unblock'
  | 'member_recharge'
  | 'payment_create'
  | 'payment_refund'
  | 'pos_transaction'
  | 'subscription_change'
  | 'early_unlock'
  | 'manual_override'
  | 'settings_change'
  | 'admin_recovery'
  | 'product_create'
  | 'product_edit'
  | 'product_delete'
  | 'program_create'
  | 'program_edit'
  | 'program_delete'
  | 'plan_create'
  | 'plan_edit'
  | 'plan_delete'
  | 'event_create'
  | 'event_edit'
  | 'event_delete'
  | 'event_register'
  | 'event_cancel'
  | 'pos_subscription';

export interface AuditLog {
  id?: number;
  action: AuditAction;
  memberId?: number;
  memberName?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedByRole: string;
  reason?: string;
  isSuspicious: boolean;
  createdAt: Date;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

export interface Sale {
  id?: number;
  items: SaleItem[];
  total: number;
  paid: number;
  change: number;
  paymentMode?: string;
  discountPercent?: number;
  cardType?: string;
  createdAt: Date;
  updatedAt?: Date;
  syncStatus?: 'pending' | 'synced';
}

export interface PrivateSession {
  id?: number;
  memberId: number;
  memberName: string;
  coachId: number;
  coachName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  syncStatus?: 'pending' | 'synced';
  updatedAt?: Date;
}

export interface SaleItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
  rewardId?: number;
}

export interface LoyaltySettings {
  id?: number;
  key: string;
  value: string;
}

export interface PointsLedger {
  id?: number;
  memberId: number;
  memberName: string;
  points: number;
  type: 'earn' | 'spend' | 'adjust' | 'expire';
  reason: string;
  referenceId?: number;
  referenceType?: 'payment' | 'subscription' | 'pos' | 'admin' | 'checkin' | 'bonus' | 'referral';
  balanceAfter: number;
  createdAt: Date;
}

export interface Referral {
  id?: number;
  sponsorId: number;
  sponsorName: string;
  referredId: number;
  referredName: string;
  subscriptionDuration: string;
  pointsAwarded: number;
  status: 'pending' | 'awarded';
  createdAt: Date;
}

export interface AIChatLog {
  id?: number;
  memberId: number;
  memberName: string;
  topic: string;
  query: string;
  timestamp: Date;
}

export interface OfflineQueueItem {
  id?: number;
  entity: string;
  action: 'create' | 'update' | 'delete';
  payload: unknown;
  recordId?: string | number;
  priority: 'critical' | 'important' | 'normal' | 'low' | 'heavy';
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  nextRetryAt?: Date;
  lastSyncedAt?: Date;
}

export type QueuePriority = 'critical' | 'important' | 'normal' | 'low' | 'heavy';

export type SyncDirection = 'local' | 'remote' | 'none';
export type ConflictStrategy = 'local-wins' | 'remote-wins' | 'manual' | 'last-write-wins';

export interface SyncConflict {
  id?: number;
  entityName: string;
  entityId: string | number;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  strategy: ConflictStrategy;
  resolved: boolean;
  resolution?: 'local' | 'remote';
  createdAt: Date;
}

export type EventType = 'competition' | 'workshop' | 'tournament' | 'event';
export type EventStatus = 'open' | 'full' | 'soon' | 'completed';
export type RegistrationStatus = 'registered' | 'checked_in' | 'cancelled';

export interface GymEvent {
  id?: number;
  name: string;
  type: EventType;
  date: string;
  price: number;
  location: string;
  maxParticipants: number;
  participants: number;
  status: EventStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface EventRegistration {
  id?: number;
  eventId: number;
  eventName: string;
  memberId: number;
  memberName: string;
  amountPaid: number;
  status: RegistrationStatus;
  registeredAt: Date;
  checkedInAt?: Date;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface ProductCategory {
  id?: number;
  name: string;
  createdAt: Date;
}

export type ContractType = 'cdi' | 'cdd' | 'freelance' | 'stage' | 'other';
export type AbsenceType = 'vacation' | 'sick' | 'unpaid' | 'other';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PayrollStatus = 'pending' | 'paid' | 'cancelled';

export interface Employee {
  id?: number;
  gymUserId?: string;
  coachId?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  department: string;
  hireDate: string;
  contractType: ContractType;
  baseSalary: number;
  bankName: string;
  bankRib: string;
  emergencyContact: string;
  emergencyPhone: string;
  socialSecurityNumber: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  photo: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface Absence {
  id?: number;
  employeeId: number;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason: string;
  status: AbsenceStatus;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface PayrollRecord {
  id?: number;
  employeeId: number;
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  absenceDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface SubscriptionPlan {
  id?: number;
  name: string;
  type: SubscriptionType;
  duration: SubscriptionDuration | '';
  sessionsCount: number;
  price: number;
  description: string;
  programId?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface WhatsAppCampaign {
  id?: number;
  campaignId?: number;
  template: string;
  memberId: number;
  memberName: string;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface MessageTemplate {
  id?: number;
  name: string;
  content: string;
  category: 'general' | 'event' | 'promotion';
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id?: number;
  name: string;
  templateId: number;
  templateName: string;
  filters: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Reward {
  id?: number;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  image: string;
  productId?: number;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface WorkoutProgramCache {
  id?: number;
  coachId: number;
  memberId: number;
  name: string;
  description: string;
  exercises: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface NutritionProgramCache {
  id?: number;
  coachId: number;
  memberId: number;
  name: string;
  description: string;
  meals: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface ScheduleCache {
  id?: number;
  coachId: number;
  memberId: number;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface ProgressLogCache {
  id?: number;
  memberId: number;
  coachId: number;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  waistCircumference: number | null;
  notes: string;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface AccessLogCache {
  id?: number;
  memberId: number;
  turnstileId: number | null;
  eventType: string;
  accessGranted: boolean;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface ProfileCache {
  id?: number;
  userId: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface ClubInfoCache {
  id?: number;
  clubName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
}
