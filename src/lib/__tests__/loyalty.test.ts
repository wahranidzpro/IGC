import { describe, it, expect } from 'vitest'

interface LoyaltyConfig {
  earnRateDzd: number
  earnRatePoints: number
  redemptionEnabled: boolean
  redemptionRatePoints: number
  redemptionRateDzd: number
  redemptionMaxPercent: number
  posRedemptionEnabled: boolean
  subscriptionRedemptionEnabled: boolean
  earlyPaymentBonusEnabled: boolean
  earlyPaymentMinAmount: number
  earlyPaymentBonusPercent: number
  earlyPaymentMinMonths: number
}

function calculatePointsValue(points: number, config: LoyaltyConfig): number {
  if (!config.redemptionEnabled) return 0
  const value = Math.floor(points / config.redemptionRatePoints) * config.redemptionRateDzd
  return value
}

function calculateEarlyPaymentBonus(
  amount: number,
  monthsPaid: number,
  config: LoyaltyConfig
): { bonusAmount: number; bonusPoints: number } {
  if (!config.earlyPaymentBonusEnabled) return { bonusAmount: 0, bonusPoints: 0 }
  if (amount < config.earlyPaymentMinAmount) return { bonusAmount: 0, bonusPoints: 0 }
  if (monthsPaid < config.earlyPaymentMinMonths) return { bonusAmount: 0, bonusPoints: 0 }
  const bonusAmount = Math.round(amount * config.earlyPaymentBonusPercent / 100)
  const bonusPoints = Math.floor(amount / config.earnRateDzd) * config.earnRatePoints
  return { bonusAmount, bonusPoints }
}

const defaultConfig: LoyaltyConfig = {
  earnRateDzd: 100, earnRatePoints: 1, redemptionEnabled: true,
  redemptionRatePoints: 100, redemptionRateDzd: 10, redemptionMaxPercent: 50,
  posRedemptionEnabled: true, subscriptionRedemptionEnabled: true,
  earlyPaymentBonusEnabled: true, earlyPaymentMinAmount: 5000,
  earlyPaymentBonusPercent: 10, earlyPaymentMinMonths: 3,
}

describe('calculatePointsValue', () => {
  it('100 points = 10 DA', () => {
    expect(calculatePointsValue(100, defaultConfig)).toBe(10)
  })
  it('250 points = 20 DA (floor)', () => {
    expect(calculatePointsValue(250, defaultConfig)).toBe(20)
  })
  it('0 points = 0 DA', () => {
    expect(calculatePointsValue(0, defaultConfig)).toBe(0)
  })
  it('retourne 0 si redemption désactivé', () => {
    expect(calculatePointsValue(500, { ...defaultConfig, redemptionEnabled: false })).toBe(0)
  })
})

describe('calculateEarlyPaymentBonus', () => {
  it('8000 DA sur 3 mois = 800 DA bonus + 80 points', () => {
    const result = calculateEarlyPaymentBonus(8000, 3, defaultConfig)
    expect(result.bonusAmount).toBe(800)
    expect(result.bonusPoints).toBe(80)
  })
  it('montant < min → pas de bonus', () => {
    const result = calculateEarlyPaymentBonus(3000, 3, defaultConfig)
    expect(result.bonusAmount).toBe(0)
    expect(result.bonusPoints).toBe(0)
  })
  it('mois < min → pas de bonus', () => {
    const result = calculateEarlyPaymentBonus(8000, 1, { ...defaultConfig, earlyPaymentMinMonths: 3 })
    expect(result.bonusAmount).toBe(0)
    expect(result.bonusPoints).toBe(0)
  })
  it('désactivé → pas de bonus', () => {
    const result = calculateEarlyPaymentBonus(8000, 3, { ...defaultConfig, earlyPaymentBonusEnabled: false })
    expect(result.bonusAmount).toBe(0)
    expect(result.bonusPoints).toBe(0)
  })
})
