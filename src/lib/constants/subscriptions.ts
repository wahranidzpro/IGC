// Duration mapping: subscription plan keys → days
export const DURATION_DAYS: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 365,
}

export const STALE_SESSION_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
export const PROCESS_INTERVAL_MS = 2000 // 2 seconds
