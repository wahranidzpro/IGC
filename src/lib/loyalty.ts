import { db } from '@/lib/db/dexie-db';

export interface LoyaltyConfig {
  earnRateDzd: number;
  earnRatePoints: number;
  redemptionEnabled: boolean;
  redemptionRatePoints: number;
  redemptionRateDzd: number;
  redemptionMaxPercent: number;
  posRedemptionEnabled: boolean;
  subscriptionRedemptionEnabled: boolean;
  earlyPaymentBonusEnabled: boolean;
  earlyPaymentMinAmount: number;
  earlyPaymentBonusPercent: number;
  earlyPaymentMinMonths: number;
}

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  const settings = await db.loyaltySettings.toArray();
  const map = new Map(settings.map(s => [s.key, s.value]));

  return {
    earnRateDzd: Number(map.get('earn_rate_dzd') || '100'),
    earnRatePoints: Number(map.get('earn_rate_points') || '1'),
    redemptionEnabled: map.get('redemption_enabled') !== 'false',
    redemptionRatePoints: Number(map.get('redemption_rate_points') || '100'),
    redemptionRateDzd: Number(map.get('redemption_rate_dzd') || '10'),
    redemptionMaxPercent: Number(map.get('redemption_max_percent') || '50'),
    posRedemptionEnabled: map.get('pos_redemption_enabled') !== 'false',
    subscriptionRedemptionEnabled: map.get('subscription_redemption_enabled') !== 'false',
    earlyPaymentBonusEnabled: map.get('early_payment_bonus_enabled') !== 'false',
    earlyPaymentMinAmount: Number(map.get('early_payment_min_amount') || '5000'),
    earlyPaymentBonusPercent: Number(map.get('early_payment_bonus_percent') || '10'),
    earlyPaymentMinMonths: Number(map.get('early_payment_min_months') || '3'),
  };
}

export async function saveLoyaltyConfig(config: Partial<LoyaltyConfig>): Promise<void> {
  const map: Record<string, string> = {};
  if (config.earnRateDzd !== undefined) map.earn_rate_dzd = String(config.earnRateDzd);
  if (config.earnRatePoints !== undefined) map.earn_rate_points = String(config.earnRatePoints);
  if (config.redemptionEnabled !== undefined) map.redemption_enabled = String(config.redemptionEnabled);
  if (config.redemptionRatePoints !== undefined) map.redemption_rate_points = String(config.redemptionRatePoints);
  if (config.redemptionRateDzd !== undefined) map.redemption_rate_dzd = String(config.redemptionRateDzd);
  if (config.redemptionMaxPercent !== undefined) map.redemption_max_percent = String(config.redemptionMaxPercent);
  if (config.posRedemptionEnabled !== undefined) map.pos_redemption_enabled = String(config.posRedemptionEnabled);
  if (config.subscriptionRedemptionEnabled !== undefined) map.subscription_redemption_enabled = String(config.subscriptionRedemptionEnabled);
  if (config.earlyPaymentBonusEnabled !== undefined) map.early_payment_bonus_enabled = String(config.earlyPaymentBonusEnabled);
  if (config.earlyPaymentMinAmount !== undefined) map.early_payment_min_amount = String(config.earlyPaymentMinAmount);
  if (config.earlyPaymentBonusPercent !== undefined) map.early_payment_bonus_percent = String(config.earlyPaymentBonusPercent);
  if (config.earlyPaymentMinMonths !== undefined) map.early_payment_min_months = String(config.earlyPaymentMinMonths);

  for (const [key, value] of Object.entries(map)) {
    const existing = await db.loyaltySettings.where('key').equals(key).first();
    if (existing) {
      await db.loyaltySettings.update(existing.id!, { value });
    } else {
      await db.loyaltySettings.add({ key, value });
    }
  }
}

export function calculatePointsEarned(amount: number, config: LoyaltyConfig): number {
  if (amount <= 0) return 0;
  return Math.floor((amount / config.earnRateDzd) * config.earnRatePoints);
}

export function calculatePointsValue(points: number, config: LoyaltyConfig): number {
  if (points <= 0) return 0;
  return Math.floor((points / config.redemptionRatePoints) * config.redemptionRateDzd);
}

export function calculateMaxDiscount(total: number, config: LoyaltyConfig): number {
  return Math.floor(total * (config.redemptionMaxPercent / 100));
}

export function calculateEarlyPaymentBonus(amount: number, config: LoyaltyConfig): number {
  if (!config.earlyPaymentBonusEnabled) return 0;
  if (amount < config.earlyPaymentMinAmount) return 0;
  const bonusPoints = Math.floor(amount * (config.earlyPaymentBonusPercent / 100));
  return bonusPoints;
}

export async function earnPoints(memberId: number, memberName: string, amount: number, referenceId?: number, referenceType?: 'payment' | 'subscription' | 'pos' | 'admin'): Promise<number> {
  const config = await getLoyaltyConfig();
  const pointsEarned = calculatePointsEarned(amount, config);

  if (pointsEarned <= 0) return 0;

  const member = await db.members.get(memberId);
  if (!member) return 0;

  const newBalance = (member.fidelityPoints || 0) + pointsEarned;

  await db.pointsLedger.add({
    memberId,
    memberName,
    points: pointsEarned,
    type: 'earn',
    reason: `Paiement abonnement: ${amount} DA`,
    referenceId,
    referenceType,
    balanceAfter: newBalance,
    createdAt: new Date(),
  });

  await db.members.update(memberId, { fidelityPoints: newBalance });

  return pointsEarned;
}

export async function spendPoints(memberId: number, memberName: string, points: number, reason: string, referenceId?: number, referenceType?: 'payment' | 'subscription' | 'pos' | 'admin'): Promise<{ success: boolean; discount: number; error?: string }> {
  const config = await getLoyaltyConfig();

  if (!config.redemptionEnabled) {
    return { success: false, discount: 0, error: 'Redemption disabled' };
  }

  const member = await db.members.get(memberId);
  if (!member) {
    return { success: false, discount: 0, error: 'Member not found' };
  }

  if ((member.fidelityPoints || 0) < points) {
    return { success: false, discount: 0, error: 'Insufficient points' };
  }

  const discount = calculatePointsValue(points, config);
  const newBalance = (member.fidelityPoints || 0) - points;

  await db.pointsLedger.add({
    memberId,
    memberName,
    points: -points,
    type: 'spend',
    reason,
    referenceId,
    referenceType,
    balanceAfter: newBalance,
    createdAt: new Date(),
  });

  await db.members.update(memberId, { fidelityPoints: newBalance });

  return { success: true, discount };
}

export async function adjustPoints(memberId: number, memberName: string, points: number, reason: string): Promise<number> {
  const member = await db.members.get(memberId);
  if (!member) return 0;

  const newBalance = Math.max(0, (member.fidelityPoints || 0) + points);

  await db.pointsLedger.add({
    memberId,
    memberName,
    points,
    type: 'adjust',
    reason,
    balanceAfter: newBalance,
    createdAt: new Date(),
  });

  await db.members.update(memberId, { fidelityPoints: newBalance });

  return newBalance;
}

export async function getMemberPointsHistory(memberId: number) {
  return db.pointsLedger.where('memberId').equals(memberId).reverse().sortBy('createdAt');
}

export async function getMemberPointsBalance(memberId: number): Promise<number> {
  const member = await db.members.get(memberId);
  return member?.fidelityPoints || 0;
}
