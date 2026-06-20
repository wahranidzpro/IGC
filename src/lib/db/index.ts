export { GymDatabase, db, DAYS } from './dexie-db';
export type {
  SubscriptionType, SubscriptionDuration,
  Program, Member, Coach, CoachAvailability, Payment, Task, Expense, Product, CheckIn, PinUser,
  AuditAction, AuditLog, Settings, Sale, PrivateSession, SaleItem, LoyaltySettings,
  PointsLedger, Referral, AIChatLog, OfflineQueueItem,
  EventType, EventStatus, RegistrationStatus, GymEvent, EventRegistration,
  ProductCategory, ContractType, AbsenceType, AbsenceStatus, PayrollStatus,
  Employee, Absence, PayrollRecord, SubscriptionPlan,
  WhatsAppCampaign, MessageTemplate, Campaign, Reward,
  WorkoutProgramCache, NutritionProgramCache, ScheduleCache,
  ProgressLogCache, AccessLogCache, ProfileCache, ClubInfoCache,
  SyncConflict, ConflictStrategy, SyncDirection, QueuePriority,
} from './types';
export { DAYS as DAYS_CONST, SEED_PRODUCT_CATEGORIES, SEED_PRODUCTS } from './defaults';

export async function initializeDatabase() {
  const { initializeDatabase: init } = await import('./dexie-db');
  return init();
}
