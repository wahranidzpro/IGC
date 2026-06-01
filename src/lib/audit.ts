import { db, AuditLog, AuditAction } from '@/lib/db/dexie-db';
import { logger } from '@/lib/logger';

const SUSPICIOUS_ACTIONS: AuditAction[] = ['member_delete', 'member_restore', 'early_unlock', 'manual_override', 'payment_refund', 'admin_recovery'];

interface AuditEntry {
  action: AuditAction;
  memberId?: number;
  memberName?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

const failedAudits: Array<{ entry: AuditEntry; performedBy: string; error: unknown }> = [];

export async function logAudit(
  entry: AuditEntry,
  performedBy: string,
  performedByRole: string
): Promise<void> {
  try {
    const auditEntry: Omit<AuditLog, 'id'> = {
      action: entry.action,
      memberId: entry.memberId,
      memberName: entry.memberName,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      performedBy,
      performedByRole,
      reason: entry.reason,
      isSuspicious: SUSPICIOUS_ACTIONS.includes(entry.action),
      createdAt: new Date(),
    };
    await db.auditLogs.add(auditEntry);
  } catch (err) {
    failedAudits.push({ entry, performedBy, error: err });
    logger.warn(`Audit log failed for action "${entry.action}" by ${performedBy}:`, err);
    if (failedAudits.length > 100) {
      logger.error(`Accumulated ${failedAudits.length} failed audits — possible data loss`);
    }
  }
}

export function getFailedAudits() {
  return [...failedAudits];
}

export function detectSuspicious(log: AuditLog): string | null {
  if (log.isSuspicious) {
    switch (log.action) {
      case 'member_delete':
        return 'SUPPRESSION DE MEMBRE';
      case 'member_restore':
        return 'RESTAURATION DE MEMBRE SUPPRIME';
      case 'early_unlock':
        return 'DEBLOCAGE ANTICIPE';
      case 'manual_override':
        return 'MODIFICATION MANUELLE';
      case 'payment_refund':
        return 'REMBOURSEMENT EFFECTUE';
      case 'admin_recovery':
        return 'RECUPERATION ADMIN';
      default:
        return 'ACTION SUSPECTE';
    }
  }
  return null;
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  member_create: 'CREATION MEMBRE',
  member_edit: 'MODIFICATION MEMBRE',
  member_delete: 'SUPPRESSION MEMBRE',
  member_restore: 'RESTAURATION MEMBRE',
  member_block: 'BLOCAGE MEMBRE',
  member_unblock: 'DEBLOCAGE MEMBRE',
  member_recharge: 'RECHARGE MEMBRE',
  payment_create: 'PAIEMENT ENREGISTRE',
  payment_refund: 'REMBOURSEMENT',
  pos_transaction: 'TRANSACTION POS',
  subscription_change: 'CHANGEMENT ABONNEMENT',
  early_unlock: 'DEBLOCAGE ANTICIPE',
  manual_override: 'MODIFICATION MANUELLE',
  settings_change: 'MODIFICATION PARAMETRES',
  admin_recovery: 'RECUPERATION ADMIN',
  product_create: 'CREATION PRODUIT',
  product_edit: 'MODIFICATION PRODUIT',
  product_delete: 'SUPPRESSION PRODUIT',
  program_create: 'CREATION PROGRAMME',
  program_edit: 'MODIFICATION PROGRAMME',
  program_delete: 'SUPPRESSION PROGRAMME',
  plan_create: 'CREATION PLAN',
  plan_edit: 'MODIFICATION PLAN',
  plan_delete: 'SUPPRESSION PLAN',
  event_create: 'CREATION EVENEMENT',
  event_edit: 'MODIFICATION EVENEMENT',
  event_delete: 'SUPPRESSION EVENEMENT',
  event_register: 'INSCRIPTION EVENEMENT',
  event_cancel: 'ANNULATION EVENEMENT',
};
