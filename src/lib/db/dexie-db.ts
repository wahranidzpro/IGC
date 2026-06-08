import Dexie, { Table } from 'dexie';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

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
  referredBy?: number; // Member ID of the sponsor
  // New fields for adherent info
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  weight?: number;
  weightCurrent?: number;
  height?: number;
  fitnessGoal?: string;
  experienceLevel?: string;
  // Block/Blacklist
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
  assignedTo?: number; // coachId or memberId? maybe coachId for simplicity
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
  pin: string;
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
  | 'event_cancel';

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
  referenceType?: 'payment' | 'subscription' | 'pos' | 'admin';
  balanceAfter: number;
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
  payload: any;
  recordId?: string | number;
  priority: 'critical' | 'important' | 'heavy';
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  nextRetryAt?: Date;
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

export interface Reward {
  id?: number;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  image: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    let part = '';
    for (let j = 0; j < 4; j++) {
      part += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(part);
  }
  return parts.join('-');
}

export async function getRecoveryCode(): Promise<string | null> {
  const entry = await db.settings.where('key').equals('admin_recovery_code').first();
  return entry?.value || null;
}

export async function validateRecoveryAttempt(): Promise<{ allowed: boolean; remaining: number; lockedUntil: number }> {
  const attemptsEntry = await db.settings.where('key').equals('recovery_attempts').first();
  const lastAttemptEntry = await db.settings.where('key').equals('recovery_last_attempt').first();
  const attempts = attemptsEntry ? parseInt(attemptsEntry.value) : 0;
  const lastAttempt = lastAttemptEntry ? parseInt(lastAttemptEntry.value) : 0;
  const now = Date.now();
  const lockoutWindow = 3600000;

  if (attempts >= 3) {
    const elapsed = now - lastAttempt;
    if (elapsed < lockoutWindow) {
      const remaining = Math.ceil((lockoutWindow - elapsed) / 60000);
      return { allowed: false, remaining: 0, lockedUntil: lastAttempt + lockoutWindow };
    }
    await db.settings.where('key').equals('recovery_attempts').modify({ value: '0' });
    return { allowed: true, remaining: 3, lockedUntil: 0 };
  }

  return { allowed: true, remaining: 3 - attempts, lockedUntil: 0 };
}

export async function recordRecoveryAttempt() {
  const attemptsEntry = await db.settings.where('key').equals('recovery_attempts').first();
  const attempts = attemptsEntry ? parseInt(attemptsEntry.value) : 0;
  await db.settings.where('key').equals('recovery_attempts').modify({ value: String(attempts + 1) });
  await db.settings.where('key').equals('recovery_last_attempt').modify({ value: String(Date.now()) });
}

export async function resetRecoveryAttempts() {
  await db.settings.where('key').equals('recovery_attempts').modify({ value: '0' });
  await db.settings.where('key').equals('recovery_last_attempt').modify({ value: '0' });
}

export async function invalidateAllSessions() {
  document.cookie = 'infinity-gym-auth=; path=/; max-age=0';
}

export async function getLoginAttempts(username: string): Promise<{ count: number; lockedUntil: number }> {
  const entry = await db.settings.where('key').equals(`login_attempts_${username}`).first();
  if (!entry) return { count: 0, lockedUntil: 0 };
  try {
    const data = JSON.parse(entry.value);
    const now = Date.now();
    if (data.lockedUntil && now < data.lockedUntil) {
      return { count: data.count, lockedUntil: data.lockedUntil };
    }
    if (data.lockedUntil && now >= data.lockedUntil) {
      await db.settings.where('key').equals(`login_attempts_${username}`).modify({ value: JSON.stringify({ count: 0, lockedUntil: 0 }) });
      return { count: 0, lockedUntil: 0 };
    }
    return { count: data.count || 0, lockedUntil: 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

export async function recordLoginAttempt(username: string, maxAttempts: number = 5, lockoutMinutes: number = 30): Promise<{ locked: boolean; remaining: number; lockedUntil: number }> {
  const attempts = await getLoginAttempts(username);
  const newCount = attempts.count + 1;
  const now = Date.now();
  let lockedUntil = 0;
  let locked = false;

  if (newCount >= maxAttempts) {
    lockedUntil = now + (lockoutMinutes * 60 * 1000);
    locked = true;
    await db.pinUsers.where('username').equals(username).modify({ isLocked: true });
  }

  await db.settings.where('key').equals(`login_attempts_${username}`).modify({
    value: JSON.stringify({ count: newCount, lockedUntil })
  });

  return { locked, remaining: Math.max(0, maxAttempts - newCount), lockedUntil };
}

export async function resetLoginAttempts(username: string) {
  await db.settings.where('key').equals(`login_attempts_${username}`).modify({
    value: JSON.stringify({ count: 0, lockedUntil: 0 })
  });
  await db.pinUsers.where('username').equals(username).modify({ isLocked: false });
}

export async function unlockAccountWithRecovery(username: string, recoveryCode: string): Promise<{ success: boolean; error?: string }> {
  const storedCode = await getRecoveryCode();
  if (!storedCode || recoveryCode.replace(/\s/g, '').toUpperCase() !== storedCode.replace(/\s/g, '').toUpperCase()) {
    return { success: false, error: 'Code de recuperation invalide' };
  }

  const user = await db.pinUsers.where('username').equals(username).first();
  if (!user) {
    return { success: false, error: 'Utilisateur introuvable' };
  }

  await resetLoginAttempts(username);
  await db.pinUsers.where('username').equals(username).modify({ isLocked: false });

  const { logAudit } = await import('@/lib/audit');
  await logAudit(
    {
      action: 'admin_recovery',
      oldValue: 'account_locked',
      newValue: 'account_unlocked',
      reason: `Account unlocked via recovery: ${username}`,
    },
    'system',
    'recovery'
  );

  return { success: true };
}

export async function performAdminRecovery(
  recoveryCode: string,
  newPassword: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateRecoveryAttempt();
  if (!validation.allowed) {
    return { success: false, error: `Trop de tentatives. Reessayez dans ${validation.lockedUntil ? Math.ceil((validation.lockedUntil - Date.now()) / 60000) : 0} minutes.` };
  }

  const storedCode = await getRecoveryCode();
  if (!storedCode || recoveryCode.replace(/\s/g, '').toUpperCase() !== storedCode.replace(/\s/g, '').toUpperCase()) {
    await recordRecoveryAttempt();
    const val = await validateRecoveryAttempt();
    return { success: false, error: `Code de recuperation invalide. ${val.remaining} tentative(s) restante(s).` };
  }

  const admin = await db.pinUsers.where('username').equals('admin').first();
  if (!admin) {
    return { success: false, error: 'Compte admin introuvable.' };
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const hashedPin = bcrypt.hashSync(newPin, 10);

  await db.pinUsers.update(admin.id!, {
    password: hashedPassword,
    pin: hashedPin,
    isLocked: false,
  });

  await resetRecoveryAttempts();
  await invalidateAllSessions();

  const { logAudit } = await import('@/lib/audit');
  await logAudit(
    {
      action: 'admin_recovery',
      oldValue: 'password_reset',
      newValue: 'password_updated',
      reason: 'Emergency admin recovery executed',
    },
    'system',
    'recovery'
  );

  return { success: true };
}

export const SEED_PRODUCTS = [
  // Boissons
  { name: 'Eau minérale (Petit Modèle - 50cl)', barcode: '', buyPrice: 15, sellPrice: 30, stock: 100, photo: '' },
  { name: 'Eau minérale (Grand Modèle - 1.5L)', barcode: '', buyPrice: 25, sellPrice: 50, stock: 80, photo: '' },
  { name: 'Eau vitaminée / aromatisée', barcode: '', buyPrice: 40, sellPrice: 80, stock: 60, photo: '' },
  { name: 'Boissons isotoniques', barcode: '', buyPrice: 60, sellPrice: 120, stock: 50, photo: '' },
  { name: 'Eau de coco', barcode: '', buyPrice: 70, sellPrice: 140, stock: 40, photo: '' },
  { name: 'Boissons énergisantes (Pre-Workout)', barcode: '', buyPrice: 100, sellPrice: 200, stock: 40, photo: '' },
  { name: 'Shots de pré-entraînement', barcode: '', buyPrice: 60, sellPrice: 150, stock: 40, photo: '' },
  { name: 'Café / Espresso', barcode: '', buyPrice: 20, sellPrice: 60, stock: 100, photo: '' },
  
  // Nutrition
  { name: 'Barres protéinées', barcode: '', buyPrice: 80, sellPrice: 160, stock: 60, photo: '' },
  { name: 'Barres de céréales / énergétiques', barcode: '', buyPrice: 50, sellPrice: 100, stock: 60, photo: '' },
  { name: 'Shakes de protéines prêts à boire', barcode: '', buyPrice: 200, sellPrice: 400, stock: 30, photo: '' },
  { name: 'Sachets de fruits secs', barcode: '', buyPrice: 90, sellPrice: 180, stock: 50, photo: '' },
  { name: 'Bananes à l\'unité', barcode: '', buyPrice: 10, sellPrice: 30, stock: 100, photo: '' },
  
  // Accessoires Sport
  { name: 'Cadenas', barcode: '', buyPrice: 200, sellPrice: 400, stock: 20, photo: '' },
  { name: 'Serviettes en microfibre', barcode: '', buyPrice: 250, sellPrice: 500, stock: 20, photo: '' },
  { name: 'Shakers vides', barcode: '', buyPrice: 150, sellPrice: 300, stock: 25, photo: '' },
  { name: 'Chaussettes de sport', barcode: '', buyPrice: 180, sellPrice: 350, stock: 30, photo: '' },
  { name: 'Écouteurs filaires basiques', barcode: '', buyPrice: 200, sellPrice: 400, stock: 15, photo: '' },
];

export class GymDatabase extends Dexie {
  programs!: Table<Program>;
  members!: Table<Member>;
  coaches!: Table<Coach>;
  payments!: Table<Payment>;
  expenses!: Table<Expense>;
  products!: Table<Product>;
  checkins!: Table<CheckIn>;
  pinUsers!: Table<PinUser>;
  settings!: Table<Settings>;
  sales!: Table<Sale>;
  subscriptionPlans!: Table<SubscriptionPlan>;
  privateSessions!: Table<PrivateSession>;
  auditLogs!: Table<AuditLog>;
  loyaltySettings!: Table<LoyaltySettings>;
  pointsLedger!: Table<PointsLedger>;
  aiChatLogs!: Table<AIChatLog>;
  offlineQueue!: Table<OfflineQueueItem>;
  events!: Table<GymEvent>;
  eventRegistrations!: Table<EventRegistration>;
  productCategories!: Table<ProductCategory>;
  rewards!: Table<Reward>;
  employees!: Table<Employee>;
  absences!: Table<Absence>;
  payrollRecords!: Table<PayrollRecord>;

  constructor() {
    super('InfinityGymDB');
    this.version(13).stores({
      programs: '++id, name, isActive, createdAt',
      members: '++id, firstName, lastName, phone, birthDate, coachId, programId, subscriptionType, status, createdAt, syncStatus',
      coaches: '++id, name, phone, isActive',
      payments: '++id, memberId, type, mode, date, createdAt',
      expenses: '++id, category, date, createdAt',
      products: '++id, barcode, name',
      checkins: '++id, memberId, timestamp, type',
      pinUsers: '++id, username, pin, role',
      settings: '++id, key',
      sales: '++id, createdAt',
      subscriptionPlans: '++id, type, programId, isActive, createdAt',
      privateSessions: '++id, memberId, coachId, date, status, createdAt',
      auditLogs: '++id, action, memberId, performedBy, createdAt, isSuspicious',
      loyaltySettings: '++id, key',
      pointsLedger: '++id, memberId, type, referenceId, createdAt',
    });
    this.version(14).stores({
      aiChatLogs: '++id, memberId, topic, timestamp',
    });
    this.version(15).stores({
      offlineQueue: '++id, entity, status, priority, createdAt, nextRetryAt',
    });
    this.version(16).stores({
      events: '++id, name, type, date, status, createdAt, syncStatus',
      eventRegistrations: '++id, eventId, memberId, status, createdAt, syncStatus',
    });
    this.version(17).stores({
      sales: '++id, createdAt, syncStatus',
    });
    this.version(18).stores({
      employees: '++id, name, phone, position, department, isActive, createdAt, syncStatus',
      absences: '++id, employeeId, type, startDate, endDate, status, createdAt, syncStatus',
      payrollRecords: '++id, employeeId, period, status, createdAt, syncStatus',
    });
    this.version(19).stores({
      coaches: '++id, name, phone, isActive, syncStatus',
      expenses: '++id, category, date, createdAt, syncStatus',
      privateSessions: '++id, memberId, coachId, date, status, createdAt, syncStatus',
    });
    this.version(20).stores({
      productCategories: '++id, name, createdAt',
    });
    this.version(21).stores({
      rewards: '++id, name, pointsRequired, stock, createdAt, syncStatus',
    });
  }
}

export const db = new GymDatabase();
export { DAYS };

export async function initializeDatabase() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const hashPassword = (pw: string) => bcrypt.hashSync(pw, 10);

    const DEFAULT_USERS = [
      { username: 'admin', password: hashPassword('Admin@123'), pin: hashPassword('1234'), role: 'admin' as const, name: 'Admin Principal', isLocked: false, createdAt: new Date() },
      { username: 'reception', password: hashPassword('Reception@123'), pin: hashPassword('5678'), role: 'reception' as const, name: 'Reception', isLocked: false, createdAt: new Date() },
      { username: 'coach', password: hashPassword('Coach@123'), pin: hashPassword('0000'), role: 'coach' as const, name: 'Coach Principal', isLocked: false, createdAt: new Date() },
    ];

    const existingUsers = await db.pinUsers.count();
    if (existingUsers === 0) {
      await db.pinUsers.bulkAdd(DEFAULT_USERS);

      logger.info('========================================');
      logger.info('  FIRST LAUNCH - Default Credentials:');
      logger.info('========================================');
      logger.info('  Admin:     user=admin     pass=Admin@123     pin=1234');
      logger.info('  Reception: user=reception  pass=Reception@123  pin=5678');
      logger.info('  Coach:     user=coach      pass=Coach@123     pin=0000');
      logger.info('========================================');

      const recoveryCode = generateRecoveryCode();
      await db.settings.add({ key: 'admin_recovery_code', value: recoveryCode });
      await db.settings.add({ key: 'recovery_attempts', value: '0' });
      await db.settings.add({ key: 'recovery_last_attempt', value: '0' });
      await db.settings.add({ key: 'recovery_session_token', value: '' });
      logger.info(`  EMERGENCY RECOVERY CODE stored in settings table`);
      logger.info('========================================');
    }

    // Ensure default users ALWAYS exist on every device (sync)
    for (const defaultUser of DEFAULT_USERS) {
      const existing = await db.pinUsers.where('username').equals(defaultUser.username).first();
      if (!existing) {
        await db.pinUsers.add(defaultUser);
        logger.info(`Default user restored: ${defaultUser.username} (${defaultUser.role})`);
      }
    }

    // Ensure recovery code exists for existing databases (migration)
    try {
      const existingRecovery = await db.settings.where('key').equals('admin_recovery_code').first();
      if (!existingRecovery) {
        const recoveryCode = generateRecoveryCode();
        await db.settings.put({ key: 'admin_recovery_code', value: recoveryCode });
        await db.settings.put({ key: 'recovery_attempts', value: '0' });
        await db.settings.put({ key: 'recovery_last_attempt', value: '0' });
        await db.settings.put({ key: 'recovery_session_token', value: '' });
        logger.info(`NEW RECOVERY CODE GENERATED: ${recoveryCode}`);
      }
    } catch (err) {
      logger.error('Recovery code migration failed:', err);
    }

  const usersWithoutUsername = await db.pinUsers.filter(u => !u.username).toArray();
  for (const u of usersWithoutUsername) {
    const uname = u.pin === '1234' ? 'admin' : u.pin === '5678' ? 'reception' : u.pin === '0000' ? 'coach' : u.name.toLowerCase().replace(/\s+/g, '_');
    const isPwHashed = u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2$');
    const isPinHashed = u.pin.startsWith('$2a$') || u.pin.startsWith('$2b$') || u.pin.startsWith('$2$');
    const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);
    await db.pinUsers.update(u.id!, {
      username: uname,
      password: isPwHashed ? u.password : hashPw(u.password),
      pin: isPinHashed ? u.pin : hashPw(u.pin),
    });
  }

  const existingProds = await db.products.toArray();
  const existingNames = new Set(existingProds.map(p => p.name));
  const toAdd = SEED_PRODUCTS.filter(sp => !existingNames.has(sp.name));
  if (toAdd.length > 0) {
    await db.products.bulkAdd(toAdd.map(p => ({ ...p, createdAt: new Date() })));
  }
  const existingProgs = await db.programs.count();
  if (existingProgs === 0) {
    await db.programs.bulkAdd([
      { name: 'Musculation et cardio training', description: 'Salle de musculation et cardio', price: 200, isActive: true, createdAt: new Date() },
      { name: 'Cross training', description: 'Cross training fonctionnel', price: 250, isActive: true, createdAt: new Date() },
      { name: 'Cours collectifs', description: 'Salle de cours collectifs', price: 180, isActive: true, createdAt: new Date() },
      { name: 'RPM Velo collectifs', description: 'Salle de RPM Velo collectifs', price: 220, isActive: true, createdAt: new Date() },
    ]);
  }

  const existingCoaches = await db.coaches.toArray();
  const existingPhones = new Set(existingCoaches.map(c => c.phone));
  
  const coachesToAdd = [
    { name: 'Karim Boudiaf', phone: '0555123456', availability: [
      { day: 'Lundi', start: '08:00', end: '16:00' },
        { day: 'Mardi', start: '08:00', end: '16:00' },
        { day: 'Mercredi', start: '08:00', end: '16:00' },
        { day: 'Jeudi', start: '08:00', end: '16:00' },
        { day: 'Vendredi', start: '08:00', end: '16:00' },
      ], programIds: [1, 2], isActive: true, createdAt: new Date() },
      { name: 'Mohamed Amrani', phone: '0556234567', availability: [
        { day: 'Lundi', start: '14:00', end: '22:00' },
        { day: 'Mardi', start: '14:00', end: '22:00' },
        { day: 'Mercredi', start: '14:00', end: '22:00' },
        { day: 'Jeudi', start: '14:00', end: '22:00' },
        { day: 'Vendredi', start: '14:00', end: '22:00' },
      ], programIds: [1, 3], isActive: true, createdAt: new Date() },
      { name: 'Nadia Amrani', phone: '0557345678', availability: [
        { day: 'Lundi', start: '09:00', end: '17:00' },
        { day: 'Mardi', start: '09:00', end: '17:00' },
        { day: 'Mercredi', start: '09:00', end: '17:00' },
        { day: 'Jeudi', start: '09:00', end: '17:00' },
        { day: 'Samedi', start: '09:00', end: '17:00' },
      ], programIds: [3, 4], isActive: true, createdAt: new Date() },
      { name: 'Sara Benali', phone: '0558456789', availability: [
        { day: 'Mardi', start: '10:00', end: '18:00' },
        { day: 'Mercredi', start: '10:00', end: '18:00' },
        { day: 'Jeudi', start: '10:00', end: '18:00' },
        { day: 'Vendredi', start: '10:00', end: '18:00' },
        { day: 'Samedi', start: '10:00', end: '18:00' },
      ], programIds: [2, 4], isActive: true, createdAt: new Date() },
    ].filter(c => !existingPhones.has(c.phone));

  if (coachesToAdd.length > 0) {
    await db.coaches.bulkAdd(coachesToAdd);
  }

  // Seed subscription plans with realistic Algerian prices
  const existingPlans = await db.subscriptionPlans.count();
  if (existingPlans === 0) {
    await db.subscriptionPlans.bulkAdd([
      { name: 'Musculation 1 mois', type: 'subscription', duration: '1_mois', sessionsCount: 30, price: 4500, description: 'Accès salle musculation + cardio', isActive: true, createdAt: new Date() },
      { name: 'Musculation 3 mois', type: 'subscription', duration: '3_mois', sessionsCount: 90, price: 12000, description: 'Accès salle musculation + cardio -15%', isActive: true, createdAt: new Date() },
      { name: 'Musculation 6 mois', type: 'subscription', duration: '6_mois', sessionsCount: 180, price: 21000, description: 'Accès salle musculation + cardio -25%', isActive: true, createdAt: new Date() },
      { name: 'Musculation 12 mois', type: 'subscription', duration: '12_mois', sessionsCount: 365, price: 35000, description: 'Accès salle musculation + cardio -35%', isActive: true, createdAt: new Date() },
      { name: 'CrossFit 1 mois', type: 'subscription', duration: '1_mois', sessionsCount: 20, price: 5500, description: 'Accès CrossFit', isActive: true, createdAt: new Date() },
      { name: 'CrossFit 3 mois', type: 'subscription', duration: '3_mois', sessionsCount: 60, price: 14500, description: 'Accès CrossFit -12%', isActive: true, createdAt: new Date() },
      { name: 'Cours collectifs 1 mois', type: 'subscription', duration: '1_mois', sessionsCount: 30, price: 4000, description: 'Accès cours collectifs (RPM, Yoga, etc.)', isActive: true, createdAt: new Date() },
      { name: 'Cours collectifs 3 mois', type: 'subscription', duration: '3_mois', sessionsCount: 90, price: 10500, description: 'Accès cours collectifs -13%', isActive: true, createdAt: new Date() },
      { name: 'VIP Tout inclus 1 mois', type: 'subscription', duration: '1_mois', sessionsCount: 50, price: 8000, description: 'Accès total: musculation + cours + coach', isActive: true, createdAt: new Date() },
      { name: 'VIP Tout inclus 12 mois', type: 'subscription', duration: '12_mois', sessionsCount: 500, price: 65000, description: 'Accès total annuel -35%', isActive: true, createdAt: new Date() },
      { name: 'Séance unique', type: 'free_session', duration: '', sessionsCount: 1, price: 500, description: 'Une séance unique', isActive: true, createdAt: new Date() },
      { name: 'Pack 10 séances', type: 'free_session', duration: '', sessionsCount: 10, price: 4000, description: '10 séances libre', isActive: true, createdAt: new Date() },
    ]);
  }

  const existingLoyalty = await db.loyaltySettings.count();
  if (existingLoyalty === 0) {
    await db.loyaltySettings.bulkAdd([
      { key: 'earn_rate_dzd', value: '100' },
      { key: 'earn_rate_points', value: '1' },
      { key: 'redemption_enabled', value: 'true' },
      { key: 'redemption_rate_points', value: '100' },
      { key: 'redemption_rate_dzd', value: '10' },
      { key: 'redemption_max_percent', value: '50' },
      { key: 'pos_redemption_enabled', value: 'true' },
      { key: 'subscription_redemption_enabled', value: 'true' },
    ]);
  }

  if (!isProduction) {
    await seedMembers();
    await seedPayments();
    await seedExpenses();
  }

  // Sync pinUsers from cloud (Supabase) to ensure users created on other devices are available
  try {
    const { syncPinUsersFromCloud } = await import('@/lib/supabase/sync');
    const result = await syncPinUsersFromCloud();
    if (result.synced > 0) {
      logger.info(`Synced ${result.synced} pin users from cloud`);
    }
  } catch {
    // Supabase not configured, skip cloud sync
  }
  } catch (err) {
    logger.error('Erreur initializeDatabase:', err);
  }
}

export async function seedMembers() {
  const programs = await db.programs.toArray();
  const coaches = await db.coaches.toArray();

  // Get existing phone numbers to avoid duplicates
  const existingPhones = new Set((await db.members.toArray()).map(m => m.phone));
  const allSample: Omit<Member, 'id'>[] = [
    { firstName: 'Ahmed', lastName: 'Benali', phone: '0612345678', birthDate: '1990-05-15', address: '12 Rue de la Liberté, Casablanca', gender: 'male', bloodType: 'A+', photo: '', programId: programs[0]?.id, sessionsLeft: 12, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 150, rfidCode: 'RFID001', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'ahmed.benali@email.com', emergencyContactName: 'Fatima Benali', emergencyContactPhone: '0612345679', allergies: 'Arachides', weight: 78, height: 180, fitnessGoal: 'Prise de masse', experienceLevel: 'intermédiaire' },
    { firstName: 'Sara', lastName: 'El Amrani', phone: '0623456789', birthDate: '1995-08-22', address: '45 Avenue Hassan II, Rabat', gender: 'female', bloodType: 'O+', photo: '', programId: programs[1]?.id, sessionsLeft: 8, programAmount: 250, amountPaid: 150, balanceDue: 100, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 80, rfidCode: 'RFID002', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'sara.elamrani@email.com', emergencyContactName: 'Mohamed El Amrani', emergencyContactPhone: '0623456780', allergies: '', weight: 62, height: 165, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Youssef', lastName: 'Idrissi', phone: '0634567890', birthDate: '1988-11-03', address: '8 Rue Atlas, Marrakech', gender: 'male', bloodType: 'B+', photo: '', programId: programs[2]?.id, sessionsLeft: 4, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'active', fidelityPoints: 30, rfidCode: 'RFID003', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'youssef.idrissi@email.com', emergencyContactName: 'Nadia Idrissi', emergencyContactPhone: '0634567891', allergies: 'Lactose', weight: 85, height: 175, fitnessGoal: 'Cardio', experienceLevel: 'avancé' },
    { firstName: 'Fatima', lastName: 'Zahra', phone: '0645678901', birthDate: '1992-02-14', address: '23 Boulevard Mohammed V, Fès', gender: 'female', bloodType: 'AB+', photo: '', programId: programs[3]?.id, sessionsLeft: 20, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 200, rfidCode: 'RFID004', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'fatima.zahra@email.com', emergencyContactName: 'Hassan Zahra', emergencyContactPhone: '0645678902', allergies: 'Sulfites', weight: 55, height: 160, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Omar', lastName: 'Tazi', phone: '0656789012', birthDate: '1985-07-30', address: '15 Rue Al Massira, Tanger', gender: 'male', bloodType: 'O-', photo: '', programId: programs[0]?.id, sessionsLeft: 0, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'expired', fidelityPoints: 500, rfidCode: 'RFID005', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'omar.tazi@email.com', emergencyContactName: 'Amina Tazi', emergencyContactPhone: '0656789013', allergies: '', weight: 90, height: 185, fitnessGoal: 'Prise de masse', experienceLevel: 'avancé' },
    { firstName: 'Nadia', lastName: 'Berrada', phone: '0667890123', birthDate: '1998-12-25', address: '7 Rue des Oliviers, Agadir', gender: 'female', bloodType: 'A-', photo: '', programId: programs[1]?.id, sessionsLeft: 6, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 60, rfidCode: 'RFID006', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'nadia.berrada@email.com', emergencyContactName: 'Karim Berrada', emergencyContactPhone: '0667890124', allergies: 'Gluten', weight: 58, height: 163, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Hassan', lastName: 'Ouazzani', phone: '0678901234', birthDate: '1982-04-18', address: '33 Rue de la Médina, Meknès', gender: 'male', bloodType: 'B-', photo: '', programId: programs[2]?.id, sessionsLeft: 2, programAmount: 180, amountPaid: 100, balanceDue: 80, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'active', fidelityPoints: 45, rfidCode: 'RFID007', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'hassan.ouazzani@email.com', emergencyContactName: 'Saida Ouazzani', emergencyContactPhone: '0678901235', allergies: 'Fruits de mer', weight: 95, height: 178, fitnessGoal: 'Cardio', experienceLevel: 'intermédiaire' },
    { firstName: 'Leila', lastName: 'Benjelloun', phone: '0689012345', birthDate: '1993-09-08', address: '12 Rue Al Andalus, Oujda', gender: 'female', bloodType: 'AB-', photo: '', programId: programs[3]?.id, sessionsLeft: 15, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 120, rfidCode: 'RFID008', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'leila.benjelloun@email.com', emergencyContactName: 'Rachid Benjelloun', emergencyContactPhone: '0689012346', allergies: '', weight: 65, height: 168, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Karim', lastName: 'Fassi', phone: '0690123456', birthDate: '1987-06-12', address: '5 Rue Annakhil, Marrakech', gender: 'male', bloodType: 'A+', photo: '', programId: programs[0]?.id, sessionsLeft: 10, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 90, rfidCode: 'RFID009', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'karim.fassi@email.com', emergencyContactName: 'Salma Fassi', emergencyContactPhone: '0690123457', allergies: 'Arachides', weight: 82, height: 182, fitnessGoal: 'Prise de masse', experienceLevel: 'avancé' },
    { firstName: 'Amina', lastName: 'El Khadraoui', phone: '0611122233', birthDate: '1996-01-20', address: '20 Avenue de la Plage, Tétouan', gender: 'female', bloodType: 'O+', photo: '', programId: programs[1]?.id, sessionsLeft: 5, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'inactive', fidelityPoints: 0, rfidCode: 'RFID010', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'amina.elkhadraoui@email.com', emergencyContactName: 'Mounir El Khadraoui', emergencyContactPhone: '0611122234', allergies: 'Lactose', weight: 60, height: 170, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Rachid', lastName: 'Alaoui', phone: '0622233344', birthDate: '1980-10-05', address: '14 Rue des Jardins, Kénitra', gender: 'male', bloodType: 'B+', photo: '', programId: programs[2]?.id, sessionsLeft: 1, programAmount: 180, amountPaid: 50, balanceDue: 130, discount: 0, advance: 0, subscriptionType: 'free_session', subscriptionDuration: '', status: 'active', fidelityPoints: 10, rfidCode: 'RFID011', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'rachid.alaoui@email.com', emergencyContactName: 'Zineb Alaoui', emergencyContactPhone: '0622233345', allergies: '', weight: 88, height: 176, fitnessGoal: 'Cardio', experienceLevel: 'débutant' },
    { firstName: 'Samira', lastName: 'Bennani', phone: '0633344455', birthDate: '1991-03-17', address: '9 Rue Al Qods, Safi', gender: 'female', bloodType: 'A+', photo: '', programId: programs[3]?.id, sessionsLeft: 18, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 300, rfidCode: 'RFID012', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'samira.bennani@email.com', emergencyContactName: 'Driss Bennani', emergencyContactPhone: '0633344456', allergies: 'Pénicilline', weight: 63, height: 166, fitnessGoal: 'Tonicité', experienceLevel: 'avancé' },
    { firstName: 'Mustapha', lastName: 'Hassani', phone: '0644455566', birthDate: '1983-08-29', address: '18 Rue de l\'Université, El Jadida', gender: 'male', bloodType: 'O+', photo: '', programId: programs[0]?.id, sessionsLeft: 7, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '2_mois', status: 'active', fidelityPoints: 75, rfidCode: 'RFID013', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'mustapha.hassani@email.com', emergencyContactName: 'Khadija Hassani', emergencyContactPhone: '0644455567', allergies: 'Sulfites', weight: 92, height: 188, fitnessGoal: 'Prise de masse', experienceLevel: 'intermédiaire' },
    { firstName: 'Nawal', lastName: 'Fikri', phone: '0655566677', birthDate: '1997-07-11', address: '22 Rue Essaada, Laâyoune', gender: 'female', bloodType: 'B+', photo: '', programId: programs[1]?.id, sessionsLeft: 3, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'expired', fidelityPoints: 25, rfidCode: 'RFID014', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'nawal.fikri@email.com', emergencyContactName: 'Ahmed Fikri', emergencyContactPhone: '0655566678', allergies: 'Gluten', weight: 57, height: 162, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Adil', lastName: 'Mouline', phone: '0666677788', birthDate: '1986-12-01', address: '11 Rue des Fleurs, Salé', gender: 'male', bloodType: 'AB+', photo: '', programId: programs[2]?.id, sessionsLeft: 9, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 110, rfidCode: 'RFID015', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'adil.mouline@email.com', emergencyContactName: 'Souad Mouline', emergencyContactPhone: '0666677789', allergies: '', weight: 80, height: 179, fitnessGoal: 'Cardio', experienceLevel: 'intermédiaire' },
    { firstName: 'Imane', lastName: 'Kabbaj', phone: '0677788899', birthDate: '1994-04-22', address: '16 Rue Al Amal, Temara', gender: 'female', bloodType: 'O+', photo: '', programId: programs[3]?.id, sessionsLeft: 14, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 170, rfidCode: 'RFID016', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'imane.kabbaj@email.com', emergencyContactName: 'Youssef Kabbaj', emergencyContactPhone: '0677788890', allergies: 'Fruits de mer', weight: 64, height: 167, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Driss', lastName: 'Chraibi', phone: '0688899900', birthDate: '1979-09-15', address: '19 Rue Al Inbiaat, Casablanca', gender: 'male', bloodType: 'A-', photo: '', programId: programs[0]?.id, sessionsLeft: 0, programAmount: 200, amountPaid: 0, balanceDue: 200, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '', status: 'inactive', fidelityPoints: 0, rfidCode: 'RFID017', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'driss.chraibi@email.com', emergencyContactName: 'Latifa Chraibi', emergencyContactPhone: '0688899901', allergies: 'Arachides', weight: 100, height: 190, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Meryem', lastName: 'Amrani', phone: '0699900011', birthDate: '1999-02-28', address: '3 Rue Al Manar, Fès', gender: 'female', bloodType: 'B-', photo: '', programId: programs[1]?.id, sessionsLeft: 11, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 95, rfidCode: 'RFID018', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'meryem.amrani@email.com', emergencyContactName: 'Ali Amrani', emergencyContactPhone: '0699900012', allergies: '', weight: 56, height: 164, fitnessGoal: 'Prise de masse', experienceLevel: 'débutant' },
    { firstName: 'Hicham', lastName: 'Bennouna', phone: '0610001111', birthDate: '1984-05-09', address: '25 Rue Al Qods, Rabat', gender: 'male', bloodType: 'AB-', photo: '', programId: programs[2]?.id, sessionsLeft: 16, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 230, rfidCode: 'RFID019', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'hicham.bennouna@email.com', emergencyContactName: 'Nour Bennouna', emergencyContactPhone: '0610001112', allergies: 'Lactose', weight: 76, height: 177, fitnessGoal: 'Cardio', experienceLevel: 'avancé' },
    { firstName: 'Salma', lastName: 'Ouchen', phone: '0620002222', birthDate: '1990-10-31', address: '30 Rue Al Maghreb, Agadir', gender: 'female', bloodType: 'O+', photo: '', programId: programs[3]?.id, sessionsLeft: 22, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 280, rfidCode: 'RFID020', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'salma.ouchen@email.com', emergencyContactName: 'Rachid Ouchen', emergencyContactPhone: '0620002223', allergies: 'Pénicilline', weight: 61, height: 169, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Anas', lastName: 'Lamrani', phone: '0630003333', birthDate: '1995-06-19', address: '17 Rue Annour, Marrakech', gender: 'male', bloodType: 'B+', photo: '', programId: programs[0]?.id, sessionsLeft: 13, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 140, rfidCode: 'RFID021', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'anas.lamrani@email.com', emergencyContactName: 'Hind Lamrani', emergencyContactPhone: '0630003334', allergies: 'Oeufs', weight: 81, height: 181, fitnessGoal: 'Prise de masse', experienceLevel: 'intermédiaire' },
    { firstName: 'Asmaa', lastName: 'Regragui', phone: '0640004444', birthDate: '1989-08-07', address: '4 Rue Al Firdaous, Oujda', gender: 'female', bloodType: 'A+', photo: '', programId: programs[1]?.id, sessionsLeft: 0, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '2_mois', status: 'expired', fidelityPoints: 40, rfidCode: 'RFID022', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'asmaa.regragui@email.com', emergencyContactName: 'Khalid Regragui', emergencyContactPhone: '0640004445', allergies: '', weight: 59, height: 165, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Yassine', lastName: 'Belkadi', phone: '0650005555', birthDate: '1981-01-14', address: '6 Rue Al Qods, Kénitra', gender: 'male', bloodType: 'O-', photo: '', programId: programs[2]?.id, sessionsLeft: 0, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'inactive', fidelityPoints: 20, rfidCode: 'RFID023', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'yassine.belkadi@email.com', emergencyContactName: 'Najat Belkadi', emergencyContactPhone: '0650005556', allergies: 'Sulfites', weight: 87, height: 183, fitnessGoal: 'Cardio', experienceLevel: 'intermédiaire' },
    { firstName: 'Khadija', lastName: 'Sadiki', phone: '0660006666', birthDate: '1992-11-25', address: '28 Rue Al Akhawayn, Ifrane', gender: 'female', bloodType: 'A+', photo: '', programId: programs[3]?.id, sessionsLeft: 10, programAmount: 220, amountPaid: 100, balanceDue: 120, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 50, rfidCode: 'RFID024', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'khadija.sadiki@email.com', emergencyContactName: 'Omar Sadiki', emergencyContactPhone: '0660006667', allergies: 'Gluten', weight: 66, height: 171, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Mehdi', lastName: 'Boukhriss', phone: '0670007777', birthDate: '1993-03-03', address: '2 Rue Al Mouna, Tanger', gender: 'male', bloodType: 'B+', photo: '', programId: programs[0]?.id, sessionsLeft: 25, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 350, rfidCode: 'RFID025', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'mehdi.boukhriss@email.com', emergencyContactName: 'Imane Boukhriss', emergencyContactPhone: '0670007778', allergies: '', weight: 84, height: 186, fitnessGoal: 'Prise de masse', experienceLevel: 'avancé' },
  ];

  const newMembers = allSample.filter(m => !existingPhones.has(m.phone));
  if (newMembers.length > 0) {
    await db.members.bulkAdd(newMembers);
    logger.info(`${newMembers.length} adhérents de test ajoutés`);
  }

  // Seed check-ins for simulation
  const allMembers = await db.members.toArray();
  const existingCheckins = await db.checkins.count();
  if (existingCheckins === 0 && allMembers.length > 0) {
    const now = new Date();
    const checkinsData: Omit<CheckIn, 'id'>[] = [];
    
    // Get 2 specific members for simulation
    const member1 = allMembers.find(m => m.phone === '0678901234') || allMembers[0]; // Hassan
    const member2 = allMembers.find(m => m.phone === '0667890123') || allMembers[1]; // Nadia

    // Member 1 (Hassan Ouazzani) - with Coach Karim Boudiaf (coach ID 1)
    const dates1 = [
      new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // yesterday
      now, // today
    ];

    dates1.forEach((date, i) => {
      const checkinTime = new Date(date);
      checkinTime.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
      checkinsData.push({
        memberId: member1.id!,
        timestamp: checkinTime,
        type: 'checkin'
      });
      
      const checkoutTime = new Date(date);
      checkoutTime.setHours(11 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      checkinsData.push({
        memberId: member1.id!,
        timestamp: checkoutTime,
        type: 'checkout'
      });
    });

    // Member 2 (Nadia Berrada) - with Coach Mohamed Amrani (coach ID 2)
    const dates2 = [
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      now,
    ];

    dates2.forEach((date) => {
      const checkinTime = new Date(date);
      checkinTime.setHours(14 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));
      checkinsData.push({
        memberId: member2.id!,
        timestamp: checkinTime,
        type: 'checkin'
      });
      
      const checkoutTime = new Date(date);
      checkoutTime.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
      checkinsData.push({
        memberId: member2.id!,
        timestamp: checkoutTime,
        type: 'checkout'
      });
    });

    // Update member coach assignments
    await db.members.update(member1.id!, { coachId: 1 }); // Karim Boudiaf
    await db.members.update(member2.id!, { coachId: 2 }); // Mohamed Amrani

    await db.checkins.bulkAdd(checkinsData);
    logger.info(`${checkinsData.length} sessions de check-in simulées`);
  }
}

export async function seedPayments() {
  const existingPayments = await db.payments.count();
  if (existingPayments > 0) return;

  const members = await db.members.toArray();
  if (members.length === 0) return;

  const now = new Date();
  const paymentsData: Omit<Payment, 'id'>[] = [];

  // Plan prices for realistic simulation
  const planPrices: Record<string, number> = {
    'Musculation 1 mois': 4500,
    'Musculation 3 mois': 12000,
    'Musculation 6 mois': 21000,
    'Musculation 12 mois': 35000,
    'CrossFit 1 mois': 5500,
    'CrossFit 3 mois': 14500,
    'Cours collectifs 1 mois': 4000,
    'Cours collectifs 3 mois': 10500,
    'VIP Tout inclus 1 mois': 8000,
    'VIP Tout inclus 12 mois': 65000,
    'Séance unique': 500,
    'Pack 10 séances': 4000,
  };

  // Simulate payments for the last 6 months
  const monthsBack = 6;
  for (let monthOffset = monthsBack; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
    
    // Random number of payments per month (5-15)
    const numPaymentsThisMonth = 5 + Math.floor(Math.random() * 11);
    
    for (let i = 0; i < numPaymentsThisMonth; i++) {
      const member = members[Math.floor(Math.random() * members.length)];
      const paymentDate = new Date(monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime()));
      
      // 70% subscription, 30% product
      const isSubscription = Math.random() < 0.7;
      
      if (isSubscription) {
        const plans = Object.keys(planPrices);
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const amount = planPrices[plan];
        
        paymentsData.push({
          memberId: member.id!,
          amount,
          type: 'subscription',
          mode: Math.random() < 0.6 ? 'cash' : 'card',
          date: paymentDate,
          description: `Abonnement ${plan}`,
          createdAt: paymentDate,
        });
      } else {
        // Product payment (POS)
        const productAmounts = [30, 50, 80, 100, 120, 160, 200, 400, 500];
        const amount = productAmounts[Math.floor(Math.random() * productAmounts.length)];
        
        paymentsData.push({
          memberId: member.id!,
          amount,
          type: 'product',
          mode: Math.random() < 0.7 ? 'cash' : 'card',
          date: paymentDate,
          description: 'Achat produits',
          createdAt: paymentDate,
        });
      }
    }

    // Add some coaching and event payments occasionally (every 2 months)
    if (monthOffset % 2 === 0) {
      const member = members[Math.floor(Math.random() * members.length)];
      const paymentDate = new Date(monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime()));
      
      paymentsData.push({
        memberId: member.id!,
        amount: 2000,
        type: 'coaching',
        mode: 'cash',
        date: paymentDate,
        description: 'Séance coaching privé',
        createdAt: paymentDate,
      });
    }
  }

  // Add some payments for today
  for (let i = 0; i < 3; i++) {
    const member = members[Math.floor(Math.random() * members.length)];
    const paymentDate = new Date(now);
    paymentDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    
    const isSubscription = Math.random() < 0.5;
    
    if (isSubscription) {
      const plans = Object.keys(planPrices);
      const plan = plans[Math.floor(Math.random() * 4)]; // Mostly 1-month plans
      const amount = planPrices[plan];
      
      paymentsData.push({
        memberId: member.id!,
        amount,
        type: 'subscription',
        mode: Math.random() < 0.6 ? 'cash' : 'card',
        date: paymentDate,
        description: `Abonnement ${plan}`,
        createdAt: paymentDate,
      });
    } else {
      const productAmounts = [30, 50, 80, 100, 120, 160];
      const amount = productAmounts[Math.floor(Math.random() * productAmounts.length)];
      
      paymentsData.push({
        memberId: member.id!,
        amount,
        type: 'product',
        mode: Math.random() < 0.7 ? 'cash' : 'card',
        date: paymentDate,
        description: 'Achat produits',
        createdAt: paymentDate,
      });
    }
  }

  await db.payments.bulkAdd(paymentsData);
  logger.info(`${paymentsData.length} paiements simulés`);
}

export async function seedExpenses() {
  const existingExpenses = await db.expenses.count();
  if (existingExpenses > 0) return;

  const now = new Date();
  const expensesData: Omit<Expense, 'id'>[] = [];

  // Fixed monthly expenses
  const fixedExpenses = [
    { category: 'Loyer', amount: 150000, description: 'Loyer mensuel salle sport' },
    { category: 'Salaires', amount: 280000, description: 'Salaires coaches + réception' },
    { category: 'Électricité', amount: 35000, description: 'Facture électricité' },
    { category: 'Eau', amount: 8000, description: 'Facture eau' },
    { category: 'Assurance', amount: 12000, description: 'Assurance local' },
    { category: 'Taxes', amount: 15000, description: 'Taxes locales' },
  ];

  // Simulate 6 months of expenses
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
    
    // Add fixed expenses
    for (const exp of fixedExpenses) {
      const amountVariation = 0.9 + Math.random() * 0.2; // +/- 10%
      expensesData.push({
        category: exp.category,
        amount: Math.round(exp.amount * amountVariation),
        date: monthStart,
        description: exp.description,
        createdAt: monthStart,
      });
    }

    // Random variable expenses
    const numVariable = 2 + Math.floor(Math.random() * 4);
    const variableCategories = ['Entretien', 'Marketing', 'Équipement', 'Autre'];
    
    for (let i = 0; i < numVariable; i++) {
      const category = variableCategories[Math.floor(Math.random() * variableCategories.length)];
      const amounts = category === 'Équipement' ? [15000, 25000, 40000, 50000] : [2000, 5000, 8000, 12000, 15000];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      
      const expenseDate = new Date(monthStart);
      expenseDate.setDate(5 + Math.floor(Math.random() * 20));
      
      expensesData.push({
        category,
        amount,
        date: expenseDate,
        description: `${category} - Maintenance/Approvisionnement`,
        createdAt: expenseDate,
      });
    }
  }

  await db.expenses.bulkAdd(expensesData);
  logger.info(`${expensesData.length} dépenses simulées`);
}
